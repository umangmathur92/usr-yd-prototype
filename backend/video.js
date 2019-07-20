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

//Parse and insert all JSON data from the videoindexer into the database
async function addVideoDataToDb(inputJson) {
    try {
        //Parse and insert Video
        let video = Video.parseVideoFromIndexerJson(inputJson);
        await Video.insertIntoVideoTable(video);
        //Parse and insert Blocks
        let blockJsonArr = video.insights_json.blocks;
        let blockArr = Block.parseBlockArr(blockJsonArr, video.youtube_id);
        blockArr = modifyLastElementsOfBlockArray(blockArr);
        await Block.insertIntoBlockTable(blockArr);
        //Parse and insert Scenes
        let sceneJsonArr = video.insights_json.scenes;
        let sceneArr = Scene.parseSceneArr(sceneJsonArr);
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
        let ocrArr = Ocr.parseOcrJsonArr(ocrJsonArr);
        ocrArr.sort((ocr1, ocr2) => (ocr1.start_time > ocr2.start_time) ? 1 : (ocr1.start_time == ocr2.start_time) ? ((ocr1.top > ocr2.top) ? 1 : (ocr1.top == ocr2.top) ? ((ocr1.left > ocr2.left) ? 1 : -1) : -1 ): -1);
        ocrArr = setShotIdForAllOcrDetections(ocrArr, shotArr);
        ocrArr = cleanUpOcrDataWithinEachShot(ocrArr);
        let concatenatedOcrTextArr = concatOcrWithinSameShot(ocrArr);
        await Ocr.updateShotTableWithOcrData(concatenatedOcrTextArr);
        //Aggregate OCR data from the Shot table and insert it into the scene table
        await Scene.aggregateShotOcrIntoSceneOcr(video);
        //Fetch captions for all keyframes and update the keyframes table
        let imgAnalysisResult = await fetchImageAnalysisForAllKeyFrames(allKeyframesArr);
        allKeyframesArr = imgAnalysisResult.allKeyframesArr;
        await Keyframe.updateCaptionDataForKeyframes(allKeyframesArr);
        //Insert objects detected in each frame into the keyframe_object table
        let keyframeObjectArr = imgAnalysisResult.keyframeObjectArr;
        await KeyframeObject.insertIntoKeyframeObjectTable(keyframeObjectArr);
        //Insert tags detected in each frame into the keyframe_tag table 
        let keyframeTagArr = imgAnalysisResult.keyframeTagArr;
        await  KeyframeTag.insertIntoKeyframeTagTable(keyframeTagArr);
        //Fetch environment for all keyframes and update the keyframes table
        let kfEnvironmentArr = await fetchEnvironmentForAllKeyFrames(allKeyframesArr);
        await Environment.insertIntoKeyframeEnvironmentTable(kfEnvironmentArr);
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
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
        let imgAnalysisJson = await ApiRepository.getImageAnalysis(imgUrl);
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
    clearDb: clearDb
}
