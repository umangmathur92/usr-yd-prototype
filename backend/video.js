const db = require('../db/database');
const Video = require('../model/video');
const Block = require('../model/block');
const Scene = require('../model/scene');
const Shot = require('../model/shot');
const Keyframe = require('../model/keyframe');
const Ocr = require('../model/ocr');

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
        sceneArr = await setBlockIdForAllScenes(sceneArr, blockArr);
        await Scene.insertIntoSceneTable(sceneArr);
        //Parse and insert Shots
        let shotJsonArr = video.insights_json.shots;
        let shotArr = Shot.parseShotArr(shotJsonArr);
        shotArr = await setSceneIdForAllShots(shotArr, sceneArr);
        await Shot.insertIntoShotTable(shotArr);
        //Parse and insert KeyFrames
        let allKeyframesArr = [];
        shotArr.forEach(shot => {
            let keyframeJsonArr = shot.keyframe_json_arr;
            let keyframeArr = Keyframe.parseKeyFrameArr(keyframeJsonArr, shot, video);//Keyframe array for that particular shot
            allKeyframesArr.push.apply(allKeyframesArr, keyframeArr);
        });
        await Keyframe.insertIntoKeyframeTable(allKeyframesArr);
        //Parse and insert OCR data into the shot table
        let ocrJsonArr = video.insights_json.ocr;
        let ocrArr = Ocr.parseOcrJsonArr(ocrJsonArr);
        ocrArr.sort((ocr1, ocr2) => (ocr1.start_time > ocr2.start_time) ? 1 : (ocr1.start_time == ocr2.start_time) ? ((ocr1.top > ocr2.top) ? 1 : (ocr1.top == ocr2.top) ? ((ocr1.left > ocr2.left) ? 1 : -1) : -1 ): -1);
        ocrArr = await setShotIdForAllOcrDetections(ocrArr, shotArr);
        ocrArr = cleanUpOcrDataWithinEachShot(ocrArr);
        let concatenatedOcrTextArr = concatOcrWithinSameShot(ocrArr);
        await Ocr.updateShotTableWithOcrData(concatenatedOcrTextArr);
        //Insert OCR data into the scene table
        await Scene.aggregateShotOcrIntoSceneOcr(video);
        //Fetch captions for all keyframes and update the keyframes table

        //Fetch environment for all keyframes and update the keyframes table

        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
}

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

function cleanUpOcrDataWithinEachShot(ocrArr) {
    let ocrMap = new Map();
    for(let i=0; i<ocrArr.length; i++) {
        let currOcrObj = ocrArr[i];
        let currOcrObjKey = currOcrObj.shot_id + '_' + currOcrObj.text + '_' + currOcrObj.left + '_' + currOcrObj.top + '_' + currOcrObj.width + '_' + currOcrObj.height;
        if(ocrMap.has(currOcrObjKey)) {
            let mOcrObj = ocrMap.get(currOcrObjKey);
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

async function setBlockIdForAllScenes(sceneArr, blockArr) {
    for (const scene of sceneArr) {
        let parentBlock = await getBlockForIndividualScene(scene, blockArr);
        scene.block_id = parentBlock.block_id;
        scene.scene_id = parentBlock.block_id + '_' + scene.scene_num;
    }
    return sceneArr;
}

async function setSceneIdForAllShots(shotArr, sceneArr) {
    for (const shot of shotArr) {
        let parentScene = await getSceneForIndividualShot(shot, sceneArr);
        shot.scene_id = parentScene.scene_id;
        shot.shot_id = parentScene.scene_id + '_' + shot.shot_num;
    }
    return shotArr;
}

async function setShotIdForAllOcrDetections(ocrArr, shotArr) {
    for (const ocrObj of ocrArr) {
        let parentShot = await getShotForIndividualOcrDetection(ocrObj, shotArr);
        ocrObj.shot_id = parentShot.shot_id;
        ocrObj.shot_num = parentShot.shot_num;
    }
    return ocrArr;
}

//Use binary search to get block corresponding to scene
async function getBlockForIndividualScene(scene, blockArr) {
    let start = 0;
    let end = blockArr.length - 1;
    let index = -1;
    while(start <= end) {
        let mid = Math.floor((start + end)/2);
        if(blockArr[mid].start_time == scene.start_time) {
            index = mid;
            break;
        } else if(blockArr[mid].start_time < scene.start_time) {
            index = mid;
            start = mid + 1;
        } else {
            end = mid - 1;
        }
    }
    return blockArr[index];
}

//Use binary search to get scene corresponding to shot
async function getSceneForIndividualShot(shot, sceneArr) {
    let start = 0;
    let end = sceneArr.length - 1;
    let index = -1;
    while(start <= end) {
        let mid = Math.floor((start + end)/2);
        if(sceneArr[mid].start_time == shot.start_time) {
            index = mid;
            break;
        } else if(sceneArr[mid].start_time < shot.start_time) {
            index = mid;
            start = mid + 1;
        } else {
            end = mid - 1;
        }
    }
    return sceneArr[index];
}

//Use binary search to get shot corresponding to OCR detection
async function getShotForIndividualOcrDetection(ocrObj, shotArr) {
    let start = 0;
    let end = shotArr.length - 1;
    let index = -1;
    while(start <= end) {
        let mid = Math.floor((start + end)/2);
        if(shotArr[mid].start_time == ocrObj.start_time) {
            index = mid;
            break;
        } else if(shotArr[mid].start_time < ocrObj.start_time) {
            index = mid;
            start = mid + 1;
        } else {
            end = mid - 1;
        }
    }
    return shotArr[index];
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
