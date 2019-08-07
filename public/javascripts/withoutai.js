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
let newTimerUpdater = null;
let timeElapsedOnPage = 0;
let isTimerPaused = false;

$(document).ready(function() {
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
    $('.txt-scene-description').keyup(function() {
        auto_grow(this);
    });
    $('#btnAddScene').click(function() {
        addSceneListItemToUi();
    });
    $('.sceneTimeEntry').timeEntry({
        spinnerImage: '../images/spinnerUpDown.png', 
        spinnerBigImage: '../images/spinnerUpDownBig.png',
        spinnerSize: [15, 16, 0], 
        spinnerBigSize: [30, 32, 0],
        unlimitedHours: true, 
        showSeconds: true, 
        spinnerIncDecOnly: true, 
        useMouseWheel: true
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
    $('#btnSubmit').click(async function() {
        let sceneDataJson = fetchDataFromAllFields();
        $.post( '/saveNonAiDescription', sceneDataJson, function(response) {
            if(response.success) {
                alert('Submitted Successfully\nYou will be redirected to the Video List Page');
                window.history.back();
            } else {
                alert('Update Failed: ' + response.success);
            }
        });
    });
});

function fetchDataFromAllFields() {
    let listItems = $("#ul-scene-list li");
    let numItems = listItems.length;
    let parentJsonObj = {};
    parentJsonObj.user_id = userId;
    let sceneArr = [];
    for(let i=0; i<numItems; i++) {
        let sceneJsonObj = {};
        sceneJsonObj.scene_id = 'sc_'+i;
        sceneJsonObj.scene_num = i;
        let sceneTimeElementId = '#sc_time_'+i;
        sceneJsonObj.scene_time = $(sceneTimeElementId).val();
        let sceneDescElementId = '#sc_desc_'+i;
        sceneJsonObj.scene_desc = $(sceneDescElementId).val();
        sceneArr.push(sceneJsonObj);
    }
    parentJsonObj.scenes = sceneArr;
    return parentJsonObj;
}

function incrementSeconds() {
    if(!isTimerPaused) {
        timeElapsedOnPage += 1;
        $('#txt-timeElaspsed').html(formatTimeForTimer(timeElapsedOnPage));
    }
}

function addSceneListItemToUi() {
    let sceneHtml = `<li>
    <div class="scene-container row">
    <div class="time-scene-container">
    <span style="font-size:9px;">Scene Start Time</span><br>
    <input type="text" id="sc_time_${$('#ul-scene-list li').length}" class="sceneTimeEntry start-time-container" size="10" value="00:00:00"> <span>Scene&nbsp;</span><span class="scene-num" id="sc_${$('#ul-scene-list li').length}">${$('#ul-scene-list li').length}</span>
    <p style="font-size:10px;">(hh:mm:ss)</p>
    </div>
    <div class="col scene-desc-container">
    <textarea id="sc_desc_${$('#ul-scene-list li').length}" class="txt-scene-description" onkeyup="auto_grow(this)"></textarea>
    </div>
    <div class="delete-button-container">
    <img class="btn-delete" src="/images/trash.png" style="width: 100%;" onclick="onDeleteButtonClicked(this)" > 
    </div>
    </div>
    </li>`;
    $('#ul-scene-list').append(sceneHtml);
    $('.sceneTimeEntry').timeEntry({
        spinnerImage: '../images/spinnerUpDown.png', 
        spinnerBigImage: '../images/spinnerUpDownBig.png',
        spinnerSize: [15, 16, 0], 
        spinnerBigSize: [30, 32, 0],
        unlimitedHours: true, 
        showSeconds: true, 
        spinnerIncDecOnly: true, 
        useMouseWheel: true
    });
}

function onDeleteButtonClicked(element) {
    $(element).parent().parent().parent().remove();
    let listItems = $("#ul-scene-list li");
    for (let i=0; i<listItems.length; i++) {
        let currLi = listItems[i];
        $(currLi).find('.scene-container').find('.time-scene-container').find('.scene-num').text(i+'');
        $(currLi).find('.scene-container').find('.time-scene-container').find('.scene-num').attr('id', 'sc_'+i);
        $(currLi).find('.scene-container').find('.time-scene-container').find('.start-time-container').attr('id', 'sc_time_'+i);
        $(currLi).find('.scene-container').find('.scene-desc-container').find('.txt-scene-description').attr('id', 'sc_desc_'+i);
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
        //populateAllSceneArrAndAllBlockArr(blocksJsonArr);
        //sceneIdToListPositionMap = populateSceneIdToListPositionMap(blocksJsonArr);
        //initializeDescriptionsUI(blocksJsonArr);
        //setInterval(updateAll, 1000*60*2);
    });
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
            showinfo: 1,
            wmode: 'opaque',
            autohide: 0
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
        //onProgress(videotime);
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
        let listPosition = sceneIdToListPositionMap.get(sceneId);
        scrollToPosition(listPosition);
    }
    prevSceneNum = sceneNum;
    if(timeAtWhichLastPaused > currentTime) {
        timeAtWhichLastPaused = currentTime;
    }
    if(sceneEndTime - currentTime < 0.1 && currentTime - timeAtWhichLastPaused > 0.5) {
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
        console.log('i was called: playing state');
        $("#btn-play-pause").html('<img src = "/images/pause.png" style="height: 25px; width: 25px;">');
        break;
        case YT.PlayerState.PAUSED:
        $("#btn-play-pause").html('<img src = "/images/play.png" style="height: 25px; width: 25px;">');
        timeAtWhichLastPaused = player.getCurrentTime();
        console.log(timeAtWhichLastPaused);
        console.log('i was called: paused state');
        break;
        case YT.PlayerState.UNSTARTED:
        case YT.PlayerState.ENDED:
        case YT.PlayerState.CUED:
        timeAtWhichLastPaused = player.getCurrentTime();
        $("#btn-play-pause").html('<img src = "/images/play.png" style="height: 25px; width: 25px;">');
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
    await $.post('/updateMultipleScenesAndBlocksForUser', postJson, function (response) {
        var currentdate = new Date(); 
        var datetime = "Last Sync: " + currentdate.getDate() + "/"
        + (currentdate.getMonth()+1)  + "/" 
        + currentdate.getFullYear() + " @ "  
        + currentdate.getHours() + ":"  
        + currentdate.getMinutes() + ":" 
        + currentdate.getSeconds();
        if(response.success) {
            $('#txtSyncTime').html(datetime);
        }
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

function formatTime(time) {
    console.log(time);
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