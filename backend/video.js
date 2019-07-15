const db = require('../db/database');
const Video = require('../model/video');
const Block = require('../model/block');
const Scene = require('../model/scene');
const Shot = require('../model/shot');

async function addVideoDataToDb(inputJson) {
    try {
        //Parse and Insert Video
        let video = Video.parseVideoFromIndexerJson(inputJson);
        await Video.insertIntoVideoTable(video);
        //Parse and Insert Blocks
        let blockJsonArr = video.insights_json.blocks;
        let blockArr = Block.parseBlockArr(blockJsonArr, video.youtube_id);
        blockArr = modifyLastElementsOfBlockArray(blockArr);
        await Block.insertIntoBlockTable(blockArr);
        //Parse and Insert Scenes
        let sceneJsonArr = video.insights_json.scenes;
        let sceneArr = Scene.parseSceneArr(sceneJsonArr);
        sceneArr = await setBlockIdForAllScenes(sceneArr, blockArr);
        await Scene.insertIntoSceneTable(sceneArr);
        //Parse and Insert Shots
        let shotJsonArr = video.insights_json.shots;
        let shotArr = Shot.parseShotArr(shotJsonArr);
        console.log(shotArr.length);
        shotArr = await setSceneIdForAllShots(shotArr, sceneArr);
        console.log(shotArr.length);
        await Shot.insertIntoShotTable(shotArr);
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
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

//Combines 2 blocks at the end of the array if they have the same block_num
function modifyLastElementsOfBlockArray(blockArr) {
    let numBlocks = blockArr.length;
    if(numBlocks>1 && blockArr[numBlocks-1].block_num == blockArr[numBlocks-2].block_num) {
        blockArr[numBlocks-2].end_time = blockArr[numBlocks-1].end_time;//Set end-time of 2nd-last block equal to end-time of the last block 
        blockArr.pop();//Remove the last block from the array
    }
    return blockArr;
}

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
