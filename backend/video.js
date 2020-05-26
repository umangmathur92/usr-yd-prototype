const db = require('../db/database');
const Utils = require('../backend/utils');
const Video = require('../model/video');
const Block = require('../model/block');
const Scene = require('../model/scene');
const Shot = require('../model/shot');
const Keyframe = require('../model/keyframe');
const Ocr = require('../model/ocr');
const KeyframeObject = require('../model/keyframeobject');
const KeyframeTag = require('../model/keyframetag');
const Environment = require('../model/environment');
const ApiRepository = require('../backend/apirepository');
const PredefVid1 = require('./predef/_1DDhUnyvwY');
const PredefVid2 = require('./predef/EQoJS8Pkmj0');
const PredefVid3 = require('./predef/cNj3aOTYdQQ');
const PredefVid4 = require('./predef/nqXz8hhAYGo');
const pgp = require('pg-promise')({
    capSQL: true // capitalize all generated SQL
});

async function updateBlockAndScene(inputJson) {
    try {
        let sceneJsonArr = inputJson.scene_arr;
        let blockJsonArr = inputJson.block_arr;
        const sceneModColumnSet = new pgp.helpers.ColumnSet(['scene_id', 'original_description', 'original_ocr'], {table: 'scene'});
        const sceneUpdatequery = pgp.helpers.update(sceneJsonArr, sceneModColumnSet) + ` WHERE t.scene_id = v.scene_id`;
        const blockModColumnSet = new pgp.helpers.ColumnSet(['block_id', 'original_description'], {table: 'block'});
        const blockUpdateQuery = pgp.helpers.update(blockJsonArr, blockModColumnSet) + ` WHERE t.block_id = v.block_id`;
        await db.any(sceneUpdatequery);
        await db.any(blockUpdateQuery);
        return true;
    } catch(e) {
        console.log(e);
        throw e;
    }
}

async function updateMultipleScenesAndBlocksForUser(inputJson) {
    try {
        let userId = inputJson.user_id;
        let sceneJsonArr = inputJson.scene_arr;
        let blockJsonArr = inputJson.block_arr;
        const sceneModColumnSet = new pgp.helpers.ColumnSet(['scene_id', 'modified_description', 'modified_ocr'], {table: 'scene_modification'});
        const sceneUpdatequery = pgp.helpers.update(sceneJsonArr, sceneModColumnSet) + ` WHERE t.scene_id = v.scene_id AND t.user_id = '${userId}'`;
        const blockModColumnSet = new pgp.helpers.ColumnSet(['block_id', 'modified_description'], {table: 'block_modification'});
        const blockUpdateQuery = pgp.helpers.update(blockJsonArr, blockModColumnSet) + ` WHERE t.block_id = v.block_id AND t.user_id = '${userId}'`;
        await db.any(sceneUpdatequery);
        await db.any(blockUpdateQuery);
        return true;
    } catch(e) {
        console.log(e);
        throw e;
    }
}

async function fetchAllVideos() {
    return await db.any('SELECT id, youtube_id, title, duration FROM video');
}

async function fetchScene(videoId) {
    return await db.query('SELECT * FROM scene where video_id=$1 order by scene_num', [videoId]);
}

async function fetchKeyFrames(sceneId,videoTime) {
    console.log("Ent: testking");
    return await db.any("SELECT thumbnail_url from keyframe where start_time < "+ videoTime +"  and shot_id IN (SELECT shot_id FROM shot where scene_id = '" + sceneId +"')" );
    // return await db.any("SELECT shot_id FROM shot where scene_id = 'nqXz8hhAYGo_3_5' ");
}

async function fetchDialogTimeStamps(videoId) {
    console.log("Ent: testking");
    return await db.any(`SELECT start_time, end_time FROM video_dialogs_timestamps WHERE video_id = '${videoId}' ORDER BY start_time`);
    // return await db.any("SELECT shot_id FROM shot where scene_id = 'nqXz8hhAYGo_3_5' ");
}

async function fetchVideoData(videoId, userId) {

    try {
        let vidQueryResult = await db.one('SELECT youtube_id, indexer_video_id, title, duration FROM video WHERE youtube_id = $1', [videoId]);

        let queryResult = await db.query(`select scene_id as sc_id, scene_num as sc_num, start_time, end_time, 
                                        original_ocr, pythia_caption_bleu as original_description from scene where video_id= $1 ORDER BY scene_num`, [videoId]);
        queryResult.forEach(scene => {
                scene.deletedScene = [];
                scene.note = '';
            });

        let mergeSceneResult = await db.query('SELECT scene_id as sc_id, merged FROM merge_scene WHERE video_id = $1 order by scene_num', [videoId]);
        
        let modifiedData = await db.query(`select scene_id as sc_id, scene_num as sc_num,
                                        start_time, end_time, ocr as original_ocr,
                                        description as original_description, merged_scene as "deletedScene", note
                                        from descriptions where volunteer_id = $1 and
                                        has_ai=true and 
                                        video_id= $2 ORDER BY scene_num` 
                                        , [userId , videoId])
        // console.log('over data', JSON.stringify(modifiedData));
        vidQueryResult.originalData = queryResult;
        vidQueryResult.modifiedData = modifiedData;
        vidQueryResult.mergeSceneRecommendation = mergeSceneResult;
        console.log({vidQueryResult});
        // console.log('vidQueryResult ===>>', JSON.stringify(vidQueryResult));
        return vidQueryResult;
    } catch(e) {
        throw e;
    }
}

async function fetchSentences(videoId, userId) {
    console.log("Now: testking");
    return await db.any(`SELECT * FROM descriptions_new_sentence WHERE video_id = '${videoId}' AND volunteer_id = '${userId}' ORDER BY scene_num, sentence_id`);
    // return await db.any("SELECT shot_id FROM shot where scene_id = 'nqXz8hhAYGo_3_5' ");
}


async function fetchVideoDataFromDb(videoId, userId) {
    try {
        let vidQueryResult = await db.one('SELECT youtube_id, indexer_video_id, title, duration FROM video WHERE youtube_id = $1', [videoId]);
        let queryResult = await db.one(`SELECT jsonb_pretty(jsonb_agg(js_object))
         custom_nested_json_data FROM (select jsonb_build_object( 'block_id', block_id,
          'block_num', block_num, 'start_time', start_time, 'finish_time', end_time, 
         'baseline_des', original_description, 'child_scenes',
          jsonb_agg(scene) ) js_object FROM ( select b.*, jsonb_build_object( 'sc_id', s.scene_id, 'sc_num',
           s.scene_num, 'start_time', s.start_time, 'finish_time', s.end_time, 'original_description', s.pythia_caption,
            'original_ocr', s.original_ocr ) scene FROM block b JOIN scene s ON
             s.block_id = b.block_id AND b.video_id = $1 ORDER BY scene_num ) s 
             GROUP BY start_time, end_time, block_id, original_description, block_num,
              video_id ORDER BY block_num ASC ) s`, [videoId]);
              
        let overrideData = await db.query(`select scene_id as sc_id, scene_num as sc_num,
        start_time, end_time as finish_time, ocr as original_ocr,
        description as original_description, merged_scene as "deletedScene"
        from descriptions where volunteer_id = $1 and
                                has_ai=true and 
                                video_id= $2 ORDER BY scene_num` 
                                , [userId , videoId])

        
        
        // console.log('over data', JSON.stringify(overrideData))

        // console.log({modifiedDesc})
        vidQueryResult.info = JSON.parse(queryResult.custom_nested_json_data);
        vidQueryResult.overrideData = overrideData;
        // console.log('vidQueryResult ===>>', JSON.stringify(vidQueryResult));
        for(key in vidQueryResult.info) {
            // console.log({key})
        }
        return vidQueryResult;
    } catch(e) {
        throw e;
    }
}

async function updateBlockDescription(inputJson) {
    try {
        let uuid = inputJson.userId;
        let block_id = inputJson.blockId;
        let modifiedDescription = inputJson.modifiedDescription;
        let updateQueryResponse = await db.one("UPDATE block_modification SET modified_description = $1 WHERE block_id = $2 AND user_id = $3 RETURNING id", [modifiedDescription, block_id, uuid], a => + a.id);
        return true;
    } catch(e) {
        throw e;
    }
}

async function updateSceneDescription(inputJson) {
    try {
        let uuid = inputJson.userId;
        let scene_id = inputJson.sceneId;
        let modifiedDescription = inputJson.modifiedDescription;
        let updateQueryResponse = await db.one("UPDATE scene_modification SET modified_description = $1 WHERE scene_id = $2 AND user_id = $3 RETURNING id", [modifiedDescription, scene_id, uuid], a => + a.id);
        return true;
    } catch(e) {
        throw e;
    }
}

async function updateSceneOcr(inputJson) {
    try {
        let uuid = inputJson.userId;
        let scene_id = inputJson.sceneId;
        let modifiedOcr = inputJson.modifiedOcr;
        let updateQueryResponse = await db.one("UPDATE scene_modification SET modified_ocr = $1 WHERE scene_id = $2 AND user_id = $3 RETURNING id", [modifiedOcr, scene_id, uuid], a => + a.id);
        return true;
    } catch(e) {
        throw e;
    }
}

async function replicateSceneDataInModifiedSceneTable(userId, videoId) {
    try {
        //let truncateModSceTableQuery = db.any('TRUNCATE TABLE scene_modification restart IDENTITY CASCADE');
        let sceneVidParam = videoId + '%';
        let sceneArr = await db.any("SELECT * FROM scene", [sceneVidParam]);
        for(let i=0; i<sceneArr.length; i++) {
            let scene = sceneArr[i];
            let scene_id = scene.scene_id;
            let user_id = userId;
            let scene_modification_id = scene_id + '_' + user_id;
            let modified_start_time = scene.start_time;
            let modified_end_time = scene.end_time;
            let modified_description = scene.original_description;
            let modified_ocr = scene.original_ocr;
            await db.one('INSERT INTO scene_modification(scene_modification_id, scene_id, user_id, modified_start_time, modified_end_time, modified_description, modified_ocr) VALUES ( $1, $2, $3, $4, $5, $6, $7 ) RETURNING id', [scene_modification_id, scene_id, user_id, modified_start_time, modified_end_time, modified_description, modified_ocr]);
        }
        // let truncateModBlockTableQuery = db.any('TRUNCATE TABLE block_modification restart IDENTITY CASCADE');
        let blockVidParam = videoId + '%';
        let blockArr = await db.any("SELECT * FROM block", [blockVidParam]);
        for(let i=0; i<blockArr.length; i++) {
            let block = blockArr[i];
            let block_id = block.block_id;
            let user_id = userId;
            let block_modification_id = block_id + '_' + user_id;
            let modified_description = block.original_description;
            await db.one('INSERT INTO block_modification(block_modification_id, block_id, user_id, modified_description) VALUES ( $1, $2, $3, $4 ) RETURNING id', [block_modification_id, block_id, user_id, modified_description]);
        }
        return true;
    } catch(e) {
        throw e;
    }
}


function filterOCR(ocrArr, duration, confidenceScore, topLimit){
    for (const ocrObj of ocrArr) {
        let diff = ocrObj.end_time - ocrObj.start_time;
        if(diff >= duration && ocrObj.confidence >= confidenceScore && ocrObj.top >= topLimit){
            
        }else{
            ocrObj.text = '';
        }
    }
    return ocrArr;
}

//Parse and insert all JSON data from the videoindexer into the database
async function addVideoDataToDb(inputJson) {
    // console.log({addVideoDataToDb: inputJson});
    try {
        // //Parse and insert Video
        let video = Video.parseVideoFromIndexerJson(inputJson);
        console.log({VIDEO: video});
        await Video.insertIntoVideoTable(video);
        //Parse and insert Blocks
        let blockJsonArr = video.insights_json.blocks;
        // let blockJsonArr = [];
        //commented by vaishali to have the default behavior for the blocks

        //the blockJsonArr is hardcoded for user study 2
        // if(video.youtube_id == '_1DDhUnyvwY') {
        //     blockJsonArr = PredefVid1.predefBlockArrJson;
        // } else if (video.youtube_id == 'EQoJS8Pkmj0') {
        //     blockJsonArr = PredefVid2.predefBlockArrJson;
        // } else if(video.youtube_id == 'cNj3aOTYdQQ') {
        //     blockJsonArr = PredefVid3.predefBlockArrJson;
        // } else if(video.youtube_id == 'nqXz8hhAYGo') {
        //     blockJsonArr = PredefVid4.predefBlockArrJson;
        // }

       let blockArr = Block.parseBlockArr(blockJsonArr, video.youtube_id);
        console.log({blockArr});
        await Block.insertIntoBlockTable(blockArr);
        // let blockArr = Block.parseBlockArr(blockJsonArr, video.youtube_id);
        // blockArr = modifyLastElementsOfBlockArray(blockArr);
        // await Block.insertIntoBlockTable(blockArr);
        //Parse Scenes
        let sceneJsonArr = video.insights_json.scenes;
        let sceneArr = Scene.parseSceneArr(sceneJsonArr, video.youtube_id);
        //Generate blocks from scenes using logic - TODO: change this
        //let blockArr = generateBlocksFromScenes(sceneArr, video.youtube_id);
        //await Block.insertIntoBlockTable(blockArr);
        //insert Scenes
        sceneArr = setBlockIdForAllScenes(sceneArr, blockArr);
        await Scene.insertIntoSceneTable(sceneArr);
        //Parse and insert Shots
        let shotJsonArr = video.insights_json.shots;
        let shotArr = Shot.parseShotArr(shotJsonArr);
        shotArr = setSceneIdForAllShots(shotArr, sceneArr);
        await Shot.insertIntoShotTable(shotArr);
        //Parse and insert KeyFrames
        let allKeyframesArr = [];
        shotArr.forEach(shot => {
            let keyframeJsonArr = shot.keyframe_json_arr;
            let keyframeArr = Keyframe.parseKeyFrameArr(keyframeJsonArr, shot, video);//Keyframe array for that particular shot
            allKeyframesArr.push.apply(allKeyframesArr, keyframeArr);
        });
        await Keyframe.insertIntoKeyframeTable(allKeyframesArr);
        //Parse, Sort, Process and insert OCR data into the shot table
        let ocrJsonArr = video.insights_json.ocr;
        if(ocrJsonArr){
            let ocrArr = Ocr.parseOcrJsonArr(ocrJsonArr);
            ocrArr.sort((ocr1, ocr2) => (ocr1.start_time > ocr2.start_time) ? 1 : (ocr1.start_time == ocr2.start_time) ? ((ocr1.top > ocr2.top) ? 1 : (ocr1.top == ocr2.top) ? ((ocr1.left > ocr2.left) ? 1 : -1) : -1 ): -1);
            ocrArr = setShotIdForAllOcrDetections(ocrArr, shotArr);
            ocrArr = cleanUpOcrDataWithinEachShot(ocrArr);
        //---------
            filter_OCRArr = filterOCR(ocrArr, 1, 0.56, 50);
            let concatFilterOcrArr = concatOcrWithinSameShot(filter_OCRArr);
            await Ocr.updateShotTableWithFilteredOcr(concatFilterOcrArr);
        //-----
            let concatenatedOcrTextArr = concatOcrWithinSameShot(ocrArr);
            await Ocr.updateShotTableWithOcrData(concatenatedOcrTextArr);
            //Aggregate OCR data from the Shot table and insert it into the scene table
            for(let i=0; i<sceneArr.length; i++) {
                try {
                    let currScene = sceneArr[i];
                    let currSceneId = currScene.scene_id;
                    let shotsOcrJsonArr = await db.any('SELECT original_ocr, filtered_ocr FROM shot WHERE scene_id = $1 ORDER BY shot_num ASC', [currSceneId]);
                    let ocrArrForScene = [];
                    let filteredOCRArr = [];
                    for(let j=0; j<shotsOcrJsonArr.length; j++) {
                        ocrArrForScene.push(shotsOcrJsonArr[j].original_ocr);
                        if(shotsOcrJsonArr[j].filtered_ocr){
                            // console.log('FILTERSCENE:', shotsOcrJsonArr[j].filtered_ocr);
                            filteredOCRArr.push(shotsOcrJsonArr[j].filtered_ocr.trim());
                        }
                    }
                    ocrArrForScene = Utils.removeDuplicatesFromStringArr(ocrArrForScene);
                    filteredOCRArr = Utils.removeDuplicatesFromStringArr(filteredOCRArr);
                    
                    let finalSceneOcr = '';
                    for (let j=0; j<ocrArrForScene.length; j++) {
                        if(ocrArrForScene[j] != '' || ocrArrForScene[j] != undefined || ocrArrForScene[j] != ' ' || ocrArrForScene[j] != '\n') {
                            finalSceneOcr = finalSceneOcr + '\n' + ocrArrForScene[j];
                        }
                    }
                    finalSceneOcr = finalSceneOcr.trim();

                    let finalFilteredSceneOcr = '';
                    for (let j=0; j<filteredOCRArr.length; j++) {
                        if(filteredOCRArr[j] != '' || filteredOCRArr[j] != undefined || filteredOCRArr[j] != ' ' || filteredOCRArr[j] != '\n') {
                            finalFilteredSceneOcr = finalFilteredSceneOcr + '\n' + filteredOCRArr[j];
                        }
                    }
                    finalFilteredSceneOcr = finalFilteredSceneOcr.trim();

                    // await db.one("UPDATE scene SET original_ocr = $1 WHERE scene_id = $2 RETURNING id", [finalSceneOcr, currSceneId], a => + a.id);
                    await db.one("UPDATE scene SET original_ocr = $1, filtered_ocr = $2  WHERE scene_id = $3 RETURNING id", [finalSceneOcr, finalFilteredSceneOcr, currSceneId], a => + a.id);

                }catch(e) {
                    console.log(e);
                }
            }
        }
 
        //await Scene.aggregateShotOcrIntoSceneOcr(video);
        
        //Fetch captions for all keyframes and update the keyframes table
        let imgAnalysisResult = await fetchImageAnalysisForAllKeyFrames(allKeyframesArr);
        allKeyframesArr = imgAnalysisResult.allKeyframesArr;
        await Keyframe.updateCaptionDataForKeyframes(allKeyframesArr);
        //Assign an original_description to each shot by using caption data from keyframes within it
        shotArr = assignDescriptionToEachShot(shotArr, allKeyframesArr);
        await Shot.updateDescriptionDataForAllShots(shotArr);
        //Assign an original_description to each scene by using description data from shots within it
        sceneArr = assignDescriptionToEachScene(sceneArr, shotArr);
        await Scene.updateDescriptionDataForAllScenes(sceneArr);
        //Insert objects detected in each frame into the keyframe_object table
        let keyframeObjectArr = imgAnalysisResult.keyframeObjectArr;
        await KeyframeObject.insertIntoKeyframeObjectTable(keyframeObjectArr);
        //Insert tags detected in each frame into the keyframe_tag table 
        let keyframeTagArr = imgAnalysisResult.keyframeTagArr;
        await  KeyframeTag.insertIntoKeyframeTagTable(keyframeTagArr);
        //Fetch environment for all keyframes and update the keyframes table
        let kfEnvironmentArr = await fetchEnvironmentForAllKeyFrames(allKeyframesArr);
        await Environment.insertIntoKeyframeEnvironmentTable(kfEnvironmentArr);
        for(let i=0; i<blockArr.length; i++) {
            let currBlock = blockArr[i];
            let currBlockId = currBlock.block_id;
            let envDataForBlock = await db.any('SELECT distinct ke.environment_id, (COUNT(ke.environment_id)*AVG(ke.probability)) as score, env.category_name FROM environment env, keyframe_environment ke, keyframe k, shot sh, scene sc, block b, video v WHERE ke.environment_id = env.environment_id AND ke.keyframe_id = k.keyframe_id AND k.shot_id=sh.shot_id AND sh.scene_id = sc.scene_id AND sc.block_id = b.block_id AND b.block_id = $1 GROUP BY ke.environment_id, env.category_name ORDER BY score DESC', [currBlockId]);
            console.log({envDataForBlock});
            if(envDataForBlock.length > 0){
                currBlock.setOriginalDescription('The environment is either ' + envDataForBlock[0].category_name + ' or ' + envDataForBlock[1].category_name);
            }
            console.log(currBlock);
        }
        Block.updateBlockTableDescription(blockArr);
        return true;
    } catch(e) {
        console.log(e);
        return e;
    }
}


//Temporary block generation logic - TODO: completely change this
function generateBlocksFromScenes(sceneArr, youtubeId) {
    let blockArr = [];
    let tempCumulativeTime = 0;
    let tempStartIndex = 0;
    let tempEndIndex = 0;
    let blockCount = 0;
    for(let i=0; i<sceneArr.length; i++) {
        let currScene = sceneArr[i];
        let currSceneStartTime = currScene.start_time;
        let currSceneEndTime = currScene.end_time;
        let currSceneDuration = currSceneEndTime - currSceneStartTime;
        if(tempCumulativeTime + currSceneDuration > 45 || i==sceneArr.length-1) {
            tempEndIndex = i;
            let newBlockNum = blockCount;
            let newBlockId = youtubeId + '_' + newBlockNum;
            let newBlockStartTime = sceneArr[tempStartIndex].start_time;
            let newBlockEndTime = sceneArr[tempEndIndex].end_time;
            let newBlockDescription = 'Placeholder description for block ' + newBlockNum + ' ('+newBlockId+')\nEnvironment: indoor/outdoor, Environment name, \nNumber of people/faces, Objects with high frequency';
            let newBlock = new Block(newBlockId, youtubeId, newBlockNum, newBlockStartTime, newBlockEndTime, newBlockDescription);
            blockArr.push(newBlock);
            blockCount++;
            tempStartIndex = i+1;
            tempCumulativeTime = 0;
        } else {
            tempCumulativeTime = tempCumulativeTime + currSceneDuration;
        }
    }
    return blockArr;
}

function assignDescriptionToEachScene(sceneArr, shotArr) {
    let shotIndex = 0;
    for(const scene of sceneArr) {
        let descArrForScene = [];
        //this works because the shots are correctly ordered
        while(shotIndex < shotArr.length && scene.scene_id == shotArr[shotIndex].scene_id) {
            descArrForScene.push(shotArr[shotIndex].original_description);
            shotIndex = shotIndex + 1;
        }
        descArrForScene = Utils.removeDuplicatesFromStringArr(descArrForScene);
        scene.original_description = combineShotDescArrToConstructSceneDescription(descArrForScene);
    }
    return sceneArr;
}

function assignDescriptionToEachShot(shotArr, allKeyframesArr) {
    let keyframeArrIndex = 0;
    for(const shot of shotArr) {
        let captionsArrForShot = [];
        //this works because the keyframes are correctly ordered
        while(keyframeArrIndex < allKeyframesArr.length && shot.shot_id == allKeyframesArr[keyframeArrIndex].shot_id) {
            captionsArrForShot.push(allKeyframesArr[keyframeArrIndex].caption);
            keyframeArrIndex = keyframeArrIndex + 1;
        }
        captionsArrForShot = Utils.removeDuplicatesFromStringArr(captionsArrForShot);
        shot.original_description = combineCaptionsArrToConstructShotDescription(captionsArrForShot);
    }
    return shotArr;
}

function combineShotDescArrToConstructSceneDescription(descArrForScene) {
    let outputDescription = '';
    descArrForScene.forEach(desc => {
        outputDescription = outputDescription + desc + '\n';
    });
    return outputDescription.trim();
}

function combineCaptionsArrToConstructShotDescription(captionsArrForShot) {
    let outputDescription = '';
    captionsArrForShot.forEach(caption => {
        outputDescription = outputDescription + caption + '\n';
    });
    return outputDescription.trim();
}

async function fetchEnvironmentForAllKeyFrames(allKeyframesArr) {
    let allEnvArr = [];
    for(const keyFrameImg of allKeyframesArr) {
        let imgUrl = keyFrameImg.thumbnail_url;
        let keyframeId = keyFrameImg.keyframe_id;
        let environmentJson = await ApiRepository.getSceneClassification(imgUrl, keyframeId);
        let envPredictionsJsonArr = environmentJson.predictions;
        let kfEnvPredictionsArr = Environment.parseEnvJsonArr(envPredictionsJsonArr, keyframeId);
        allEnvArr.push.apply(allEnvArr, kfEnvPredictionsArr);
        console.log('Environment API: called for frame ' + keyframeId);
    }
    return allEnvArr;
}

//Call the Microsoft Image analysis API for all Keyframes in the video
async function fetchImageAnalysisForAllKeyFrames(allKeyframesArr) {
    let keyframeObjectArr = [];
    let keyframeTagArr = [];
    for(const keyFrameImg of allKeyframesArr) {
        let imgUrl = keyFrameImg.thumbnail_url;
        console.log({imgUrl});
        let imgAnalysisJson = await ApiRepository.getImageAnalysis(imgUrl);
        console.log({imgAnalysisJson});

        let captionText = '';
        let confidenceScore = 0;
        if(imgAnalysisJson.description.captions.length>0) {
            captionText = imgAnalysisJson.description.captions[0].text;
            confidenceScore = imgAnalysisJson.description.captions[0].confidence;
        }
        keyFrameImg.caption = captionText;
        keyFrameImg.caption_confidence = confidenceScore;
        //Tags detected in each image added to an array
        let tagsJsonArr = imgAnalysisJson.tags;
        let kfTagsArr = KeyframeTag.parseKeyframeTagArr(tagsJsonArr, keyFrameImg.keyframe_id);
        keyframeTagArr.push.apply(keyframeTagArr, kfTagsArr);
        //Objects detected in each image added to an array
        let objJsonArr = imgAnalysisJson.objects;
        let kfObjsArr = KeyframeObject.parseKeyframeObjectArr(objJsonArr, keyFrameImg.keyframe_id);
        keyframeObjectArr.push.apply(keyframeObjectArr, kfObjsArr);
        console.log('Image Analysis API Response (caption only): ' + captionText+'('+confidenceScore+')');
        //API throttling. The API can be used only once in 3 seconds(free tier subscription)
        await Utils.sleep(3000);
    }
    return {'allKeyframesArr' : allKeyframesArr, 'keyframeObjectArr' : keyframeObjectArr, 'keyframeTagArr' : keyframeTagArr};
}

//Combine all OCRs ocurring within the same shot
function concatOcrWithinSameShot(ocrArr) {
    let outputArr = [];
    let customOcrObj = new Object();
    customOcrObj.shot_id = '-';
    customOcrObj.text = '';
    let lastShotNum = -1;
    for(let i=0; i<ocrArr.length; i++) {
        let currOcrObj = ocrArr[i];
        if(currOcrObj.shot_num > lastShotNum) {
            if(lastShotNum > -1) {
                outputArr.push(customOcrObj);
            }
            customOcrObj = new Object();
            customOcrObj.shot_id = currOcrObj.shot_id;
            customOcrObj.text = '';        
            lastShotNum = currOcrObj.shot_num;
        }
        customOcrObj.text = customOcrObj.text + currOcrObj.text + ' ';
    }
    customOcrObj.text = customOcrObj.text.trim();
    outputArr.push(customOcrObj);
    return outputArr;
}

//Custom logic that eliminates duplicates by combining data from diffrent OCR detection objects
function cleanUpOcrDataWithinEachShot(ocrArr) {
    let ocrMap = new Map();
    for(let i=0; i<ocrArr.length; i++) {
        let currOcrObj = ocrArr[i];
        //currOcrObjKey is generated by appending certain important attribute values to form a unique string - useful for finding OCR detections with similar data
        let currOcrObjKey = currOcrObj.shot_id + '_' + currOcrObj.text + '_' + currOcrObj.left + '_' + currOcrObj.top + '_' + currOcrObj.width + '_' + currOcrObj.height;
        if(ocrMap.has(currOcrObjKey)) {
            let mOcrObj = ocrMap.get(currOcrObjKey);
            //Combine OCR shots properties if time difference between similar OCR detections is less than 3 seconds (the text, position on screen and size are already same)
            if(currOcrObj.start_time - mOcrObj.end_time < 3) {
                mOcrObj.end_time = currOcrObj.end_time;
            } else {
                currOcrObjKey = currOcrObjKey + '_' + i;
                ocrMap.set(currOcrObjKey, currOcrObj)
            }
        } else {
            ocrMap.set(currOcrObjKey, currOcrObj);
        }
    }
    let outputArr = [];
    let ocrMapKeys = ocrMap.keys(); 
    for(const mapKey of ocrMapKeys) {
        let ocrObj = ocrMap.get(mapKey);
        outputArr.push(ocrObj);
    }
    return outputArr;
}

//Assign attributes indicating the parent Block to each Scene
function setBlockIdForAllScenes(sceneArr, blockArr) {
    let blockStartTimeArr = extractStartTimeArrFromObjectArr(blockArr);
    for (const scene of sceneArr) {
        let blockIndex = getIndexOfInputArrForTargetVal(scene.start_time, blockStartTimeArr);
        let parentBlock = blockArr[blockIndex];
        scene.block_id = parentBlock.block_id;
        scene.scene_id = parentBlock.block_id + '_' + scene.scene_num;
    }
    return sceneArr;
}

//Assign attributes indicating the parent Scene to each shot
function setSceneIdForAllShots(shotArr, sceneArr) {
    let sceneStartTimeArr = extractStartTimeArrFromObjectArr(sceneArr);
    for (const shot of shotArr) {
        let sceneIndex = getIndexOfInputArrForTargetVal(shot.start_time, sceneStartTimeArr);
        let parentScene = sceneArr[sceneIndex];
        shot.scene_id = parentScene.scene_id;
        shot.shot_id = parentScene.scene_id + '_' + shot.shot_num;
    }
    return shotArr;
}

//Assign attributes indicating the parent Shot to each OCR object
function setShotIdForAllOcrDetections(ocrArr, shotArr) {
    let shotStartTimeArr = extractStartTimeArrFromObjectArr(shotArr);
    for (const ocrObj of ocrArr) {
        let shotIndex = getIndexOfInputArrForTargetVal(ocrObj.start_time, shotStartTimeArr);
        let parentShot = shotArr[shotIndex];
        ocrObj.shot_id = parentShot.shot_id;
        ocrObj.shot_num = parentShot.shot_num;
    }
    return ocrArr;
}

//Method to extract start_time from arrays containing objects of the following type: Block, Scene, Shot
function extractStartTimeArrFromObjectArr(genericObjectArr) {
    let outputArr = [];
    genericObjectArr.forEach(obj => {
        outputArr.push(obj.start_time);
    });
    return outputArr;
}

//Returns index of array item whose value is equal-to or lesser-than(also nearest-in-value) the target (binary search algorithm)
function getIndexOfInputArrForTargetVal(target, inputArr) {
    let start = 0;
    let end = inputArr.length - 1;
    let index = -1;
    while(start <= end) {
        let mid = Math.floor((start + end)/2);
        if(inputArr[mid] == target) {
            index = mid;
            break;
        } else if(inputArr[mid] < target) {
            index = mid;
            start = mid + 1;
        } else {
            end = mid - 1;
        }
    }
    return index;
}

//Combines 2 blocks at the end of the array if they have the same block_num
function modifyLastElementsOfBlockArray(blockArr) {
    let numBlocks = blockArr.length;
    if(numBlocks>1 && blockArr[numBlocks-1].block_num == blockArr[numBlocks-2].block_num) {
        blockArr[numBlocks-2].end_time = blockArr[numBlocks-1].end_time;//Set end-time of 2nd-last block equal to end-time of the last block 
        blockArr.pop();//Remove the last block from the array
    }
    return blockArr;
}

//Truncates all tables related to the Video Table - Does not affect the 'environments' table
async function clearDb() {
    console.log('DB Operation: Truncate all tables');
    try {
        await db.any('TRUNCATE TABLE video restart IDENTITY CASCADE');
        return true;
    } catch(e) {
        console.log(e.message);
        return false;
    }
}

module.exports = {
    addVideoDataToDb: addVideoDataToDb,
    clearDb: clearDb,
    fetchDialogTimeStamps: fetchDialogTimeStamps,
    fetchSentences: fetchSentences,
    fetchVideoDataFromDb: fetchVideoDataFromDb,
    fetchAllVideos: fetchAllVideos,
    fetchKeyFrames: fetchKeyFrames,
    updateBlockDescription: updateBlockDescription,
    updateSceneDescription: updateSceneDescription,
    updateSceneOcr: updateSceneOcr,
    replicateSceneDataInModifiedSceneTable: replicateSceneDataInModifiedSceneTable,
    updateMultipleScenesAndBlocksForUser: updateMultipleScenesAndBlocksForUser,
    updateBlockAndScene: updateBlockAndScene,
    fetchVideoData: fetchVideoData,
    fetchScene: fetchScene
}
