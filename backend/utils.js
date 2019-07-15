const vidIndexerAcctId = '5a8c6ddf-900f-48b4-8a3a-0cd5cf48cb4b';

function parseSecondsFromString(durationString) {
    let splitStr = durationString.split(':');
    let seconds = ((+splitStr[0]* 3600) + (+splitStr[1] * 60) + (+splitStr[2])).toFixed(3); 
    return parseFloat(seconds);
}

function getThumbUrlFromId(thumbnailId, vidIndexerVideoId) {
    return 'https://api.videoindexer.ai/trial/Accounts/'+ vidIndexerAcctId +'/Videos/' + vidIndexerVideoId + '/Thumbnails/' + thumbnailId + '?format=Jpeg';
}

module.exports = {
    parseSecondsFromString: parseSecondsFromString,
    getThumbUrlFromId: getThumbUrlFromId
}