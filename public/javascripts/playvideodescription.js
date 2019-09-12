let timeupdater = null;
let sceneMap = new Map();
let startTimesArr = [];
let audioArr = [];
let videotime = 0;
let prevSceneNum = -1;
let currAudio = null;
let pauseTime = 10000;
let currAudioElapsedTime = 0;

$(document).ready(function() {
    userId = getUrlVars()["u"];
    enableAi = (getUrlVars()["ml"] == 'yes') ? true : false;
    let href = location.href;
    const lastPathSegment = new URL(href).pathname.split('/').pop();
    youtubeId = lastPathSegment;
    fetchDescriptionData(youtubeId, userId, enableAi);
    $("#btn-play-pause").click(function() {
        //onPlayPauseButtonClick();
    });
});

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '270',
        width: '480',
        videoId: youtubeId,
        playerVars: {
            autoplay: 0,
            playsinline: 1,
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
    timeupdater = setInterval(updateTime, 500);
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
    if(currentTime > pauseTime) {
        player.pauseVideo();
        pauseTime = 10000;
    } else {  
        currentTime = currentTime.toFixed(3);
        let currScene = getSceneFromTime(currentTime, startTimesArr);
        let sceneNum = currScene.scene_num;
        let sceneEndTime = currScene.end_time;
        let sceneStartTime = currScene.start_time;
        let totalSceneTime = currScene.total_time;
        let audioLen = currScene.audio_length;
        if(prevSceneNum != sceneNum) {
            currAudio = currScene.audio;
            if((player.getCurrentTime() - currScene.start_time) < currScene.audio_length) {
                currAudio.currentTime = player.getCurrentTime() - currScene.start_time;
                currAudio.play();    
                if(currScene.total_time < currScene.audio_length) {
                    pauseTime = currScene.end_time;
                    currAudio.onended = function() {
                        if(player.getPlayerState() == YT.PlayerState.PAUSED) {
                            player.playVideo();
                        }
                    };
                }
            }
        }
        prevSceneNum = sceneNum;
    }
}

function resumeVideoifInPausedState() {
    if (player.getPlayerState() == YT.PlayerState.PAUSED) {
        playVideo();
    }
}

function getSceneFromTime(currentTime, startTimesArr) {
    let sceneIndex = getIndexOfInputArrForTargetVal(currentTime, startTimesArr);
    return sceneMap.get(sceneIndex);
}

function fetchDescriptionData(videoId, volunteerId, aiType) {
    let targetUrl = `/getDescriptionData?videoId=${videoId}&volunteerId=${volunteerId}&aiType=${aiType}`;
    $.get(targetUrl, function (response) {
        let descriptionArr = response;
        let outputHtml = '<table border="1"><th>scene_start</th><th>scene_end</th><th>scene_total</th><th>audio_len</th><th>description</th>'
        for(let i=0; i<descriptionArr.length; i++) {
            let currDesc = descriptionArr[i];
            let sceneNum = currDesc.scene_num;
            let audioPath = currDesc.audiopath;
            currDesc.audio = new Audio(audioPath);
            let sceneStart = currDesc.start_time;
            startTimesArr.push(sceneStart);
            sceneMap.set(sceneNum, currDesc);
            outputHtml = outputHtml + '<tr>';
            outputHtml = outputHtml + '<td>' + currDesc.start_time +'</td>' + '<td>' + currDesc.end_time +'</td>' + '<td>' + currDesc.total_time +'</td>' + '<td>' + currDesc.audio_length +'</td>' + '<td>' + currDesc.description +'</td>' + '<td>' + currDesc.ocr + '</td>';
            outputHtml = outputHtml + '</tr>';
        }
        outputHtml = outputHtml + '</table>'
        $('.col-7').append(outputHtml);
    });
}


function onPlayerStateChange(event) {
    // -1 – unstarted
    // 0 – ended
    // 1 – playing
    // 2 – paused
    // 3 – buffering
    // 5 – video cued
    let playerState = event.data;
    switch(playerState) {
        case YT.PlayerState.PLAYING:
        console.log('i was called: playing state')
        $("#btn-play-pause").html('<img src = "/images/pause.png" style="height: 25px; width: 25px;">');
        let scene = getSceneFromTime(videotime, startTimesArr);
        currAudio = scene.audio;
        if((player.getCurrentTime() - scene.start_time) < scene.audio_length) {
            currAudio.currentTime = player.getCurrentTime() - scene.start_time;
            currAudio.play();    
        }
        break;
        case YT.PlayerState.PAUSED:
        $("#btn-play-pause").html('<img src = "/images/play.png" style="height: 25px; width: 25px;">');
        console.log('i was called: paused state')
        if(currAudio) {
            currAudio.pause();
        }
        break;
        case YT.PlayerState.UNSTARTED:
        case YT.PlayerState.ENDED:
        case YT.PlayerState.CUED:
        $("#btn-play-pause").html('<img src = "/images/play.png" style="height: 25px; width: 25px;">');
        console.log('i was called: cued state')
        break;
    }
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

function isPlaying(audioElement) { 
    if(!audioElement) {
        return false;
    }
    return !audioElement.paused; 
}
