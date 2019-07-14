const db = require('../db/database');
const Video = require('../model/video');
const Block = require('../model/block');

async function clearDb() {
    try {
        const delVideo = await db.none('TRUNCATE TABLE video restart IDENTITY CASCADE');
        return true;        
    } catch(e) {
        console.log(e.message);
        return false;
    }
}

async function addVideoDataToDb(inputJson) {
    try {
        let video = Video.parseVideoFromIndexerJson(inputJson);
        video.id = await insertIntoVideoTable(video);
        let blocksJsonArr = video.insights_json.blocks;
        let blockArr = Block.parseBlockArr(blocksJsonArr, video.id);
        await insertIntoBlockTable(blockArr);
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
}

async function insertIntoVideoTable(newVid) {
    try {
        let videoEntry = await db.one('INSERT INTO video (youtube_id, indexer_video_id, title, duration, summarised_insights_json, insights_json) VALUES ( $1, $2, $3, $4, $5, $6 ) RETURNING id', [newVid.youtube_id, newVid.indexer_video_id, newVid.title, newVid.duration, newVid.summarised_insights_json, newVid.insights_json]);
        return videoEntry.id;
    } catch(e) {
        throw e;
    }
}

async function insertIntoBlockTable(blockArr) {
    try {
        //let blockArr = Block.parseBlockArr(blocksJsonArr, vidId);
        //return blockArr;
        //let videoEntry = await db.one('INSERT INTO block (video_id, block_num, start_time, end_time, original_description) VALUES ( $1, $2, $3, $4, $5 ) RETURNING id', [newVid.youtube_id, newVid.indexer_video_id, newVid.title, newVid.duration, newVid.summarised_insights_json, newVid.insights_json]);
        
        let blocksEntry = await db.tx(t => {
            var queries = blockArr.map(block => {
                return t.none('INSERT INTO block(video_id, block_num, start_time, end_time, original_description) VALUES(${video_id}, ${block_num}, ${start_time}, ${end_time}, ${original_description})', block);
            });
            return t.batch(queries);
        });
        return true;

    } catch(e) {
        throw e;
    }
}

module.exports = {
    addVideoDataToDb: addVideoDataToDb,
    clearDb: clearDb
}
