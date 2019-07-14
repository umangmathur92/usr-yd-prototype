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

async function addVideoDataToDb(requestBody) {
    try {
        let video = await insertIntoVideoTable(requestBody);
        let blocksJsonArr = video.insights_json.blocks;
        let blockArr = await insertIntoBlockTable(blocksJsonArr, video.id);
        console.log(blockArr);
        return true;
    } catch(e) {
        console.log(e + ' - ' + e.fileName);
        return false;
    }
}

async function insertIntoVideoTable(requestBody) {
    try {
        let newVid = Video.parseVideoFromIndexerJson(requestBody);
        let videoEntry = await db.one('INSERT INTO video (youtube_id, indexer_video_id, title, duration, summarised_insights_json, insights_json) VALUES ( $1, $2, $3, $4, $5, $6 ) RETURNING id', [newVid.youtube_id, newVid.indexer_video_id, newVid.title, newVid.duration, newVid.summarised_insights_json, newVid.insights_json]);
        newVid.id = videoEntry.id;
        return newVid;
    } catch(e) {
        throw e;
    }
}

async function insertIntoBlockTable(blocksJsonArr, vidId) {
    try {
        let blockArr = Block.parseBlockArr(blocksJsonArr, vidId);
        //console.log(blockArr);
        return blockArr;
    } catch(e) {
        throw e;
    }
}

consoleLog = function(msg) {//See https://stackoverflow.com/a/27074218/470749
    var e = new Error();
    if (!e.stack)
        try {
            // IE requires the Error to actually be thrown or else the 
            // Error's 'stack' property is undefined.
            throw e;
        } catch (e) {
            if (!e.stack) {
                //return 0; // IE < 10, likely
            }
        }
    var stack = e.stack.toString().split(/\r\n|\n/);
    if (msg === '') {
        msg = '""';
    }
    console.log(msg, '          [' + stack[1] + ']');        
}


// function parseBlockArr(blockJsonArr, vidId) {
//     let blocksArr = [];
//     for (let i = 0; i < blockJsonArr.length; i++) {
//         let newBlock = Block.parseBlockJson(blockJsonArr[i], vidId);
//         //console.log(newBlock);
//         blocksArr.push(newBlock);
//     }
//     console.log(blocksArr);
//     return blocksArr;
// }


module.exports = {
    addVideoDataToDb: addVideoDataToDb,
    clearDb: clearDb
}
