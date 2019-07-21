const fetch = require('node-fetch');
const fs = require('fs');

const vidIndexerAcctId = '5a8c6ddf-900f-48b4-8a3a-0cd5cf48cb4b';

function parseSecondsFromString(durationString) {
    let splitStr = durationString.split(':');
    let seconds = ((+splitStr[0]* 3600) + (+splitStr[1] * 60) + (+splitStr[2])).toFixed(3); 
    return parseFloat(seconds);
}

function getThumbUrlFromId(thumbnailId, vidIndexerVideoId) {
    return 'https://api.videoindexer.ai/trial/Accounts/'+ vidIndexerAcctId +'/Videos/' + vidIndexerVideoId + '/Thumbnails/' + thumbnailId + '?format=Jpeg';
}

async function sleep(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

function removeDuplicatesFromStringArr(inputArr) {
    var result = [];
    inputArr.forEach(function(item) {
        if(result.indexOf(item) < 0) {
            result.push(item);
        }
    });
    return result;
}

const downloadFile = (async (url, path) => {
    const res = await fetch(url);
    const fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", (err) => {
            reject(err);
        });
        fileStream.on("finish", function() {
            resolve();
        });
    });
});

module.exports = {
    parseSecondsFromString: parseSecondsFromString,
    getThumbUrlFromId: getThumbUrlFromId,
    sleep: sleep,
    downloadFile: downloadFile,
    removeDuplicatesFromStringArr: removeDuplicatesFromStringArr
}