let player;
let youtubeId = '';
let videotime = 0;
let timeupdater = null;
let allSceneArr = [];
let sceneIdToListPositionMap = new Map();
let sceneToBlockMap = new Map();
let userId = '90812bd9-ac4f-4637-9b52-02b821d61995';
let prevSceneNum = -1;
let timeAtWhichLastPaused = -1;
let previouslyHighlightedContainerId = '#doesnotexist';

$(document).ready(function() {
    let href = location.href;
    const lastPathSegment = new URL(href).pathname.split('/').pop();
    youtubeId = lastPathSegment;
    fetchVideoInfo(youtubeId);
    $("#btnScroll").click(function() {
        resetVidModifiedTableData();
    });
});

function fetchVideoInfo(youtubeId) {
    let targetUrl = '/fetchVideoData' + '?videoid=' + youtubeId;
    $.get(targetUrl, function (response) {
        console.log(response);
        let vidJson = response;
        let vidTitle = vidJson.title;
        let vidLength = vidJson.duration;
        let blocksJsonArr = vidJson.info;
        $('#txtVidtitle').html(vidTitle);
        allSceneArr = populateAllSceneArr(blocksJsonArr);
        sceneIdToListPositionMap = populateSceneIdToListPositionMap(blocksJsonArr);
        initializeDescriptionsUI(blocksJsonArr);
    });
}

function initializeDescriptionsUI(blocksJsonArr) {
    let outputHtml = '';
    for(let i=0; i<blocksJsonArr.length; i++) {
        let currBlock = blocksJsonArr[i];
        let blockId = currBlock.block_id;
        let blockNum = currBlock.block_num;
        let blStartTime = currBlock.start_time;
        let blFinishTime = currBlock.finish_time;
        let baselineDesc = $.trim(currBlock.baseline_des);
        let childSceneArr = currBlock.child_scenes;
        outputHtml = outputHtml + '<li class="li-block-header"><b>Block ' + blockNum + ' </b>(' + blStartTime + ' to ' +  blFinishTime + ' secs) </li>';
        for(let j=0; j<childSceneArr.length; j++) {
            let currScene = childSceneArr[j];
            let sceneId = currScene.sc_id;
            let sceneNum = currScene.sc_num;
            let scStartTime = currScene.start_time;
            let scFinishTime = currScene.finish_time;
            let sceneOcr = $.trim(currScene.original_ocr);
            let sceneDesc = $.trim(currScene.original_description);
            outputHtml = outputHtml
            + '<li><div class="scene-container" id="'+ 'sc_cont_' + sceneId + '"><table style="width: 100%">'
            + '<tr><td><b>Scene ' + sceneNum + '</b></td><td>' + scStartTime + ' to ' + scFinishTime + 'secs</td></tr>'
            + '<tr><td>Description</td><td><div class="scene-description-container">'
            + '<button class="btn-update-scene-description" data-sceneid="'+ sceneId +'">Update Description</button>'
            + '<textarea class="txt-scene-description" id="s_d_'+ sceneId + '">' + sceneDesc + '</textarea></div></td></tr>'
            + '<tr><td>OCR Detected</td><td><div class="scene-ocr-container">'
            + '<button class="btn-update-scene-ocr" data-sceneid="'+ sceneId +'">Update OCR</button>'
            + '<textarea class="txt-scene-ocr" id="s_o_'+ sceneId + '">' + sceneOcr + '</textarea></div></td></tr></table>'
            + '<div style="text-align: center; margin-bottom: -20px; margin-top: 10px;">';
            if(j!=childSceneArr.length-1) {
                outputHtml = outputHtml + '<button class="btn-merge">Merge With Next</button>'
            }
            outputHtml = outputHtml
            + '</div>'
            + '</div></li>';
        }
        outputHtml = outputHtml
        + '<li class="li-block-footer"><div class="block-footer-container" id="'+ 'bl_cont_' + blockId +'"><table style="width: 100%">'
        + '<tr>Block ' + blockNum + ' Baseline Description</tr><tr><td><div class="block-description-container">'
        + '<button class="btn-update-block-description">Update Description</button>'
        + '<textarea class="txt-block-description">' + baselineDesc + '</textarea>'
        + '</div></td></tr></table></div>'
        + '</li>';
    }
    $('#ul-scene-list').html(outputHtml);
    $('.btn-update-scene-description').click(function() {
        let sceneId = this.dataset.sceneid;
        let sceneDescTxtId = '#s_d_' + sceneId;
        let modifiedDescription = $(sceneDescTxtId).val();
        sendUpdateDescriptionPostReq(sceneId, modifiedDescription);
    });
    $('.btn-update-scene-ocr').click(function() {
        let sceneId = this.dataset.sceneid;
        let sceneOcrTxtId = '#s_o_' + sceneId;
        let modifiedOcr = $(sceneOcrTxtId).val();
        sendUpdateOcrPostReq(sceneId, modifiedOcr);
    });
}

function sendUpdateDescriptionPostReq(sceneId, modifiedDescription) {
    const body = {
        userId: userId,
        sceneId: sceneId,
        modifiedDescription: modifiedDescription,
    };
    $.post( '/updateSceneDescription', body, function(response) {
        window.alert(JSON.stringify(response));
    });
}

function sendUpdateOcrPostReq(sceneId, modifiedOcr) {
    const body = {
        userId: userId,
        sceneId: sceneId,
        modifiedOcr: modifiedOcr,
    };
    $.post( '/updateSceneOCR', body, function(response) {
        window.alert(JSON.stringify(response));
    });
}

function scrollToPosition(position) {
    $('#ul-scene-list').animate({
        scrollTop: $('#ul-scene-list li:nth-child(' + position + ')').position().top - $('#ul-scene-list li:first').position().top
    }, 'slow');
    $(previouslyHighlightedContainerId).removeClass('highlight');
    $('#ul-scene-list li:nth-child(' + position + ')' + ' .scene-container').addClass('highlight');
    previouslyHighlightedContainerId = '#ul-scene-list li:nth-child(' + position + ')' + ' .scene-container';
}

function resetVidModifiedTableData() {
    let url = '/reset/' + youtubeId + '/' + userId;
    $.get(url, function(response) {
        window.alert(JSON.stringify(response));
    });
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '270',
        width: '480',
        videoId: youtubeId,
        playerVars: {
            autoplay: 1,
            enablejsapi: 1,
            cc_load_policy: 1,
            controls: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            wmode: 'opaque'
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    timeupdater = setInterval(updateTime, 1000);
}

function updateTime() {
    var oldTime = videotime;
    if(player && player.getCurrentTime) {
        videotime = player.getCurrentTime();
    }
    if(videotime !== oldTime) {
        onProgress(videotime);
    }
}

// when the time changes, this will be called.
function onProgress(currentTime) {
    currentTime = currentTime.toFixed(3);
    console.log(currentTime);
    let currScene = getSceneFromTime(currentTime, allSceneArr);
    let sceneId = currScene.sc_id;
    let sceneNum = currScene.sc_num;
    let sceneEndTime = currScene.finish_time;
    if(prevSceneNum != sceneNum) {
        let listPosition = sceneIdToListPositionMap.get(sceneId);
        scrollToPosition(listPosition);
    }
    prevSceneNum = sceneNum;
    if(sceneEndTime - currentTime < 1 && currentTime - timeAtWhichLastPaused > 1 && sceneToBlockMap.has(sceneId)) {
        pauseVideo();
        timeAtWhichLastPaused = currentTime;
        let blockId = sceneToBlockMap.get(sceneId);
        let blockElementId = '#bl_cont_' + blockId;
        $(previouslyHighlightedContainerId).removeClass('highlight');
        $(blockElementId).addClass('highlight');
        previouslyHighlightedContainerId = blockElementId;
    }
}

function onPlayerStateChange(event) {
    let playerState = event.data;
    switch(playerState) {
        case YT.PlayerState.PLAYING:
                console.log('i was called: playing state')
        break;
        case YT.PlayerState.PAUSED:
        timeAtWhichLastPaused = player.getCurrentTime();
        console.log(timeAtWhichLastPaused);
        console.log('i was called: paused state')
        break;
        case YT.PlayerState.UNSTARTED:
        case YT.PlayerState.ENDED:
        case YT.PlayerState.CUED:
        timeAtWhichLastPaused = player.getCurrentTime();
        console.log('i was called: cued state')
        break;
    }
}

function playVideo() {
    player.playVideo();
}

function pauseVideo() {
    player.pauseVideo();
}

function stopVideo() {
    player.stopVideo();
}

function populateSceneIdToListPositionMap(blocksJsonArr) {
    let listPositionIndex = 0;
    let sceneListPositionMap = new Map();
    for(let i=0; i<blocksJsonArr.length; i++) {
        listPositionIndex++;
        let currBlock = blocksJsonArr[i];
        let currBlockId = currBlock.block_id;
        let childSceneArr = currBlock.child_scenes;
        for(let j=0; j<childSceneArr.length; j++) {
            listPositionIndex++;
            let currSceneId = childSceneArr[j].sc_id;
            sceneListPositionMap.set(currSceneId, listPositionIndex);//sceneToBlockMap
            if(j == childSceneArr.length-1) {
                sceneToBlockMap.set(currSceneId, currBlockId);
            }
        }
        listPositionIndex++;
    }
    return sceneListPositionMap;
}

function populateAllSceneArr(blocksJsonArr) {
    let allSceneArr = [];
    for(let i=0; i<blocksJsonArr.length; i++) {
        let currBlock = blocksJsonArr[i];
        let childSceneArr = currBlock.child_scenes;
        allSceneArr.push.apply(allSceneArr, childSceneArr);
    }
    return allSceneArr;
}

function getSceneFromTime(currentTime, sceneArr) {
    let startTimesArr = [];
    for(let i=0; i<sceneArr.length; i++) {
        let startTime = parseFloat(sceneArr[i].start_time);
        startTimesArr.push(startTime);
    }
    let sceneIndex = getIndexOfInputArrForTargetVal(currentTime, startTimesArr);
    return sceneArr[sceneIndex];
}

//Returns index of array item whose value is equal-to or lesser-than(also nearest-in-value) the target (binary search algorithm)
function getIndexOfInputArrForTargetVal(target, inputArr) {
    let start = 0;
    let end = inputArr.length - 1;
    let index = -1;
    while(start <= end) {
        let mid = Math.floor((start + end)/2);
        if(inputArr[mid] == target) {
            index = mid;
            break;
        } else if(inputArr[mid] < target) {
            index = mid;
            start = mid + 1;
        } else {
            end = mid - 1;
        }
    }
    return index;
}