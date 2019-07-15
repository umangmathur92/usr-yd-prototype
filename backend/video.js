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
        let insertedBlockIds = await Block.insertIntoBlockTable(blockArr);
        for(let i=0; i<blockArr.length; i++) {
            blockArr[i].id = insertedBlockIds[i];
        }
        let sceneJsonArr = video.insights_json.scenes;
        let sceneArr = Scene.parseSceneArr(sceneJsonArr);
        for (const scene of sceneArr) {
            let parentBlock = await getBlockForScene(scene, blockArr);
            scene.block_id = parentBlock.id;
        }
        
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
}

//Use binary search to get block corresponding to scene
async function getBlockForScene(scene, blockArr) {
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
