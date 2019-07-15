const db = require('../db/database');
const Video = require('../model/video');
const Block = require('../model/block');
const Scene = require('../model/scene');

async function addVideoDataToDb(inputJson) {
    try {
        let video = Video.parseVideoFromIndexerJson(inputJson);
        video.id = await Video.insertIntoVideoTable(video);
        let blockJsonArr = video.insights_json.blocks;
        let blockArr = Block.parseBlockArr(blockJsonArr, video.id);
        blockArr = modifyLastElementsOfBlockArray(blockArr);
        await Block.insertIntoBlockTable(blockArr);
        let sceneJsonArr = video.insights_json.scenes;
        let sceneArr = Scene.parseSceneArr(sceneJsonArr);
        console.log(sceneArr);
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
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
