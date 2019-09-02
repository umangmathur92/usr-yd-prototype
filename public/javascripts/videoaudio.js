let player;
let youtubeId = '';
let videotime = 0;
let timeupdater = null;
let allSceneArr = [];
let allBlockArr = [];
let sceneIdToListPositionMap = new Map();
let sceneToBlockMap = new Map();
let userId;
let prevSceneNum = -1;
let timeAtWhichLastPaused = -1;
let previouslyHighlightedContainerId = '#doesnotexist';
let enableAi = false;
let autoPauseAtEachScene = false;
let timeElapsedOnPage = 0;
let isTimerPaused = false;
let audioArr = [];
let currAudio;

$(document).ready(function() {
    $('#btn-video-breakpoint-toggle').prop("checked", false);
    userId = getUrlVars()["u"];
    enableAi = (getUrlVars()["ai"] == 'yes') ? true : false;
    let href = location.href;
    const lastPathSegment = new URL(href).pathname.split('/').pop();
    youtubeId = lastPathSegment;
    fetchVideoInfo(youtubeId);
    $("#btnScroll").click(function() {
        resetVidModifiedTableData();
    });
    $('#btnSubmit').click(async function() {
        let shoudShowAlert = true;
        updateAll(shoudShowAlert);
    });
    $('#btnTemp').click(async function() {
        updateMainTables();
    });
    $('#btn-video-breakpoint-toggle').change(function() {
        if($(this).is(":checked")) {
            autoPauseAtEachScene = true;
        } else {
            autoPauseAtEachScene = false;
        }
    });
    $("#btn-play-pause").click(function() {
        onPlayPauseButtonClick();
    });
    $('#btn-timer').click(function () {
        isTimerPaused = !isTimerPaused;
        if(isTimerPaused) {
            $('#btn-timer').attr('src', '/images/play_white.png');
        } else {
            $('#btn-timer').attr('src', '/images/pause_white.png');
        }
    });
    setInterval(incrementSeconds, 1000);
});

function incrementSeconds() {
    if(!isTimerPaused) {
        timeElapsedOnPage += 1;
        $('#txt-timeElaspsed').html(formatTimeForTimer(timeElapsedOnPage));
    }
}

function fetchVideoInfo(youtubeId) {
    let targetUrl = '/fetchVideoData' + '?videoid=' + youtubeId;
    $.get(targetUrl, function (response) {
        let vidJson = response;
        let vidTitle = vidJson.title;
        let vidLength = vidJson.duration;
        let blocksJsonArr = vidJson.info;
        $('#txtVidtitle').html(vidTitle);
        populateAllSceneArrAndAllBlockArr(blocksJsonArr);
        sceneIdToListPositionMap = populateSceneIdToListPositionMap(blocksJsonArr);
        for (var [key, value] of sceneIdToListPositionMap) {
            let sceneId = key;
            let sceneNum = sceneId.split('_')[2];
            let randomNum = Math.random();
            let descType = enableAi ? 'ai' : 'non_ai';
            let src = `../audio/${youtubeId}/${descType}/${userId}/${sceneNum}.mp3` + '?random='+randomNum;
            let audioFile = new Audio(src);
            audioArr.push(audioFile);
        }
        initializeDescriptionsUI(blocksJsonArr);
        //setInterval(updateAll, 1000*60*2);
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
        let baselineDesc = enableAi ? $.trim(currBlock.baseline_des) : '';
        let childSceneArr = currBlock.child_scenes;
        outputHtml = outputHtml + '<li class="li-block-header" style="visibility: hidden; height: 0px;"><b>Block ' + blockNum + ' </b>(' + blStartTime + ' to ' +  blFinishTime + ' secs) </li>';
        for(let j=0; j<childSceneArr.length; j++) {
            let currScene = childSceneArr[j];
            let sceneId = currScene.sc_id;
            let sceneNum = currScene.sc_num;
            let scStartTime = currScene.start_time;
            let scFinishTime = currScene.finish_time;
            let sceneOcr = enableAi ? $.trim(currScene.original_ocr) : '';
            let sceneDesc = enableAi ? $.trim(currScene.original_description) : '';
            let scStartTimePretty = millisToMinutesAndSeconds(scStartTime);
            let scFinishTimePretty = millisToMinutesAndSeconds(scFinishTime);
            outputHtml = outputHtml
            + '<li style="height: 30px;"><div class="scene-container" id="'+ 'sc_cont_' + sceneId + '"><table style="width: 100%">'
            + '<tr><td><b>Scene ' + sceneNum + '</b></td><td>' + scStartTimePretty + ' to ' + scFinishTimePretty + ' minutes<button style="visibility: hidden; height: 0px;" type = "submit" name = "learn" value = "myimage" onclick="resetVideoTo('+scStartTime+')" style="float: right;"> <img src="/images/replay.png" style="height: 15px;" /> <span style="height: 100%; width: 100%;">Replay Scene</span></button></td></tr>'
            + '<tr style="visibility: hidden; height: 0px;"><td>Description</td><td><div class="scene-description-container">'
            + '<button class="btn-update-scene-description" data-sceneid="'+ sceneId +'" style="visibility: hidden;">Update Description</button>'
            + '<textarea onkeyup="auto_grow(this)" class="txt-scene-description" id="s_d_'+ sceneId + '">' + sceneDesc + '</textarea></div></td></tr>'
            + '<tr style="visibility: hidden; height: 0px;"><td>Text On-Screen</td><td><div class="scene-ocr-container">'
            + '<button class="btn-update-scene-ocr" data-sceneid="'+ sceneId +'" style="visibility: hidden;">Update Text</button>'
            + '<textarea onkeyup="auto_grow(this)" class="txt-scene-ocr" id="s_o_'+ sceneId + '">' + sceneOcr + '</textarea></div></td></tr></table>'
            + '<div style="text-align: center; margin-bottom: -20px; margin-top: 10px;">';
            // if(j!=childSceneArr.length-1) {
            //     outputHtml = outputHtml + '<button class="btn-merge">Merge With Next</button>'
            // }
            outputHtml = outputHtml
            + '</div>'
            + '</div></li>';
        }
        outputHtml = outputHtml
        + '<li class="li-block-footer" style="visibility: hidden; height: 0px;"><div class="block-footer-container" id="'+ 'bl_cont_' + blockId +'"><table style="width: 100%">'
        + '<tr>Block ' + blockNum + ' Baseline Description</tr><tr><td><div class="block-description-container">'
        + '<button class="btn-update-block-description" data-blockid="'+ blockId +'">Update Description</button>'
        + '<textarea onkeyup="auto_grow(this)" class="txt-block-description" id="b_d_'+ blockId + '">' + baselineDesc + '</textarea>'
        + '</div></td></tr></table></div>'
        + '</li>';
    }
    $('#ul-scene-list').html(outputHtml);
    $('.btn-update-scene-description').click(function() {
        let sceneId = this.dataset.sceneid;
        let sceneDescTxtId = '#s_d_' + sceneId;
        let modifiedDescription = $(sceneDescTxtId).val();
        sendUpdateSceneDescriptionPostReq(sceneId, modifiedDescription);
    });
    $('.btn-update-scene-ocr').click(function() {
        let sceneId = this.dataset.sceneid;
        let sceneOcrTxtId = '#s_o_' + sceneId;
        let modifiedOcr = $(sceneOcrTxtId).val();
        sendUpdateOcrPostReq(sceneId, modifiedOcr);
    });
    $('.btn-update-block-description').click(function() {
        let blockId = this.dataset.blockid;
        let blockDescTxtId ='#b_d_' + blockId;
        let modifiedDescription = $(blockDescTxtId).val();
        console.log(blockDescTxtId + ', ' +blockId, ', ' + modifiedDescription);
        sendUpdateBlockDescriptionPostReq(blockId, modifiedDescription);
    });
    $("textarea").each(function(){
        auto_grow(this);
    });
}

function millisToMinutesAndSeconds(secs) {
    var minutes = Math.floor(secs / 60);
    var seconds = ((secs % 60) / 1).toFixed(1);
    return minutes + ":" + seconds;
}  

function sendUpdateSceneDescriptionPostReq(sceneId, modifiedDescription) {
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

function sendUpdateBlockDescriptionPostReq(blockId, modifiedDescription) {
    const body = {
        userId: userId,
        blockId: blockId,
        modifiedDescription: modifiedDescription,
    };
    $.post( '/updateBlockDescription', body, function(response) {
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
    $('#total_time').text(formatTime(player.getDuration()));
    timeupdater = setInterval(updateTime, 100);
}

function updateTime() {
    var oldTime = videotime;
    if(player && player.getCurrentTime) {
        videotime = player.getCurrentTime();
    }
    if(videotime !== oldTime) {
        onProgress(videotime);
    }
    $('#elapsed_time').text(formatTime(player.getCurrentTime()));
}

// when the time changes, this will be called.
function onProgress(currentTime) {
    currentTime = currentTime.toFixed(3);
    let currScene = getSceneFromTime(currentTime, allSceneArr);
    let sceneId = currScene.sc_id;
    let sceneNum = currScene.sc_num;
    let sceneEndTime = currScene.finish_time;
    if(prevSceneNum != sceneNum) {
        //$('#yd-audio').detach();
        let listPosition = sceneIdToListPositionMap.get(sceneId);
        scrollToPosition(listPosition);
        // let randomNum = Math.random();
        // //enableAi
        // let descType = enableAi ? 'ai' : 'non_ai';
        // let src = `../audio/${youtubeId}/${descType}/${userId}/${sceneNum}.mp3` + '?random='+randomNum;
        // let audio = new Audio(src);
        // audio.play();
        currAudio = audioArr[sceneNum];
        const playPromise = currAudio.play();
        if (playPromise !== null){
            playPromise.catch(() => { currAudio.play(); })
        }
        //$('body').append('<audio controls id="yd-audio"><source src="'+src+'" type="audio/mpeg" id="#mp3-source"></audio>');
    }
    prevSceneNum = sceneNum;
    if(timeAtWhichLastPaused > currentTime) {
        timeAtWhichLastPaused = currentTime;
    }
    if(sceneEndTime - currentTime < 0.1 && currentTime - timeAtWhichLastPaused > 0.5 && autoPauseAtEachScene) {
        pauseVideo();
        timeAtWhichLastPaused = currentTime;
        //if(sceneToBlockMap.has(sceneId)) {//Check if it's the last scene of the current block
        // let blockId = sceneToBlockMap.get(sceneId);
        // let blockElementId = '#bl_cont_' + blockId;
    }
    let sceneElementId = '#sc_cont_' + sceneId;
    $(previouslyHighlightedContainerId).removeClass('highlight');
    $(sceneElementId).addClass('highlight');
    previouslyHighlightedContainerId = sceneElementId;
}

function onPlayerStateChange(event) {
    let playerState = event.data;
    switch(playerState) {
        case YT.PlayerState.PLAYING:
        console.log('i was called: playing state')
        $("#btn-play-pause").html('<img src = "/images/pause.png" style="height: 25px; width: 25px;">');
        break;
        case YT.PlayerState.PAUSED:
        $("#btn-play-pause").html('<img src = "/images/play.png" style="height: 25px; width: 25px;">');
        timeAtWhichLastPaused = player.getCurrentTime();
        console.log(timeAtWhichLastPaused);
        console.log('i was called: paused state')
        break;
        case YT.PlayerState.UNSTARTED:
        case YT.PlayerState.ENDED:
        case YT.PlayerState.CUED:
        $("#btn-play-pause").html('<img src = "/images/play.png" style="height: 25px; width: 25px;">');
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
async function updateAll(shoudShowAlert) {
    let postJson = fetchJsonBodyForAllTextFields(allSceneArr, allBlockArr, userId);
    // await $.post('/updateMultipleScenesAndBlocksForUser', postJson, function (response) {
    await $.post('/saveAiDescription', postJson, function (response) {
        if(shoudShowAlert) {
            if(response.success) {
                alert('Submitted Successfully\nYou will be redirected to the Video List Page');
                window.history.back();
            } else {
                alert('Update Failed: ' + response.success);
            }
        }
    });
}


async function updateMainTables() {
    let postJson = fetchJsonBodyForAllTextFields2(allSceneArr, allBlockArr);
    await $.post('/updateBlockAndScene', postJson, function (response) {
        if(response.success) {
            window.alert('Updated Successfully');
        } else {
            window.alert('Update Failed');
        }
    });
}


function fetchJsonBodyForAllTextFields(allSceneArr, allBlockArr, userId) {
    let parentJsonBody = {};
    let sceneArrJson = [];
    let blockArrJson = [];
    for(let i=0; i<allSceneArr.length; i++) {
        let currScene = allSceneArr[i];
        let currSceneId = currScene.sc_id;
        let currSceneDescTextId = '#s_d_' + currSceneId;
        let currSceneOcrTextId = '#s_o_' + currSceneId;
        let sceneJsonObj = {};
        sceneJsonObj.scene_id = currSceneId;
        sceneJsonObj.modified_description = $(currSceneDescTextId).val().trim();
        sceneJsonObj.modified_ocr = $(currSceneOcrTextId).val().trim();
        sceneArrJson.push(sceneJsonObj);
    }
    for(let i=0; i<allBlockArr.length; i++) {
        let currBlock = allBlockArr[i];
        let currBlockId = currBlock.block_id;
        let currBlockDescTextId = '#b_d_' + currBlockId;
        let blockJsonObj = {};
        blockJsonObj.block_id = currBlockId;
        blockJsonObj.modified_description = $(currBlockDescTextId).val().trim();
        blockArrJson.push(blockJsonObj);
    }
    parentJsonBody.user_id = userId;
    parentJsonBody.scene_arr = sceneArrJson;
    parentJsonBody.block_arr = blockArrJson;
    parentJsonBody.time_taken = timeElapsedOnPage;
    return parentJsonBody;
}

function fetchJsonBodyForAllTextFields2(allSceneArr, allBlockArr, userId) {
    let parentJsonBody = {};
    let sceneArrJson = [];
    let blockArrJson = [];
    for(let i=0; i<allSceneArr.length; i++) {
        let currScene = allSceneArr[i];
        let currSceneId = currScene.sc_id;
        let currSceneDescTextId = '#s_d_' + currSceneId;
        let currSceneOcrTextId = '#s_o_' + currSceneId;
        let sceneJsonObj = {};
        sceneJsonObj.scene_id = currSceneId;
        sceneJsonObj.original_description = $(currSceneDescTextId).val().trim();
        sceneJsonObj.original_ocr = $(currSceneOcrTextId).val().trim();
        sceneArrJson.push(sceneJsonObj);
    }
    for(let i=0; i<allBlockArr.length; i++) {
        let currBlock = allBlockArr[i];
        let currBlockId = currBlock.block_id;
        let currBlockDescTextId = '#b_d_' + currBlockId;
        let blockJsonObj = {};
        blockJsonObj.block_id = currBlockId;
        blockJsonObj.original_description = $(currBlockDescTextId).val().trim();
        blockArrJson.push(blockJsonObj);
    }
    parentJsonBody.scene_arr = sceneArrJson;
    parentJsonBody.block_arr = blockArrJson;
    return parentJsonBody;
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

function populateAllSceneArrAndAllBlockArr(blocksJsonArr) {
    for(let i=0; i<blocksJsonArr.length; i++) {
        let currBlock = blocksJsonArr[i];
        allBlockArr.push(currBlock);
        let childSceneArr = currBlock.child_scenes;
        allSceneArr.push.apply(allSceneArr, childSceneArr);
    }
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

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function auto_grow(element) {
    element.style.height = "5px";
    element.style.height = (element.scrollHeight)+"px";
}

function resetVideoTo(time) {
    let timeInSecs = parseFloat(time);
    player.seekTo(timeInSecs);
    player.playVideo();
}

function formatTime(time) {
    var minutes = Math.floor(time / 60);
    var seconds = time - minutes * 60;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    var s = parseFloat(seconds).toFixed(1);
    return minutes + ":" + s;
}

function formatTimeForTimer(time) {
    var minutes = Math.floor(time / 60);
    var seconds = time - minutes * 60;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    var s = parseFloat(seconds).toFixed(0);
    return minutes + ":" + s;
}

function onPlayPauseButtonClick() {
    let playerState = player.getPlayerState();
    switch (playerState) {
        case YT.PlayerState.PLAYING:
        pauseVideo();
        break;
        case YT.PlayerState.PAUSED:
        case YT.PlayerState.UNSTARTED:
        case YT.PlayerState.ENDED:
        case YT.PlayerState.CUED:
        playVideo();
        break;
    }
}

function isPlaying(audioElement) { 
    return !audioElement.paused; 
}