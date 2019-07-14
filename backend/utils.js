function parseSecondsFromString(durationString) {
    let splitStr = durationString.split(':');
    let seconds = ((+splitStr[0]* 3600) + (+splitStr[1] * 60) + (+splitStr[2])).toFixed(3); 
    return seconds;
}

function getThumbUrlFromId(vidIndexerVideoId, thumbnailId, vidIndexerAcctId) {
    return 'https://api.videoindexer.ai/trial/Accounts/'+ vidIndexerAcctId +'/Videos/' + vidIndexerVideoId + '/Thumbnails/' + thumbnailId + '?format=Jpeg';
}

module.exports = {
    parseSecondsFromString: parseSecondsFromString,
    getThumbUrlFromId: getThumbUrlFromId
}