const db = require('../db/database');
const Video = require('../model/video');
const Block = require('../model/block');

async function addVideoDataToDb(inputJson) {
    try {
        let video = Video.parseVideoFromIndexerJson(inputJson);
        video.id = await Video.insertIntoVideoTable(video);
        let blocksJsonArr = video.insights_json.blocks;
        let blockArr = Block.parseBlockArr(blocksJsonArr, video.id);
        await Block.insertIntoBlockTable(blockArr);
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
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
