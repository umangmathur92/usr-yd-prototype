let audioArr = [];

$(document).ready(function() {
    userId = getUrlVars()["u"];
    enableAi = (getUrlVars()["ai"] == 'yes') ? true : false;
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

function fetchDescriptionData(videoId, volunteerId, aiType) {
    let targetUrl = `/getDescriptionData?videoId=${videoId}&volunteerId=${volunteerId}&aiType=${aiType}`;
    $.get(targetUrl, function (response) {
        let descriptionArr = response;
        for(let i=0; i<descriptionArr.length; i++) {
            let currDesc = descriptionArr[i];
            let audioPath = '../'+ currDesc.audioPath;
            let audioFile = new Audio(audioPath);
            let duration = audioFile.duration;
            console.log(duration);
            audioArr.push(audioFile);
            let sceneStart = currDesc.start_time;
        }
    });
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
