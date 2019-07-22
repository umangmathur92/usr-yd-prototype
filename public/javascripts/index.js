var player;

$(document).ready(function() {
    $("#btnScroll").click(function() {
        let childNum = $('#txtRowNum').val();
        scrollToPosition(childNum);
    });
    let youtubeId = 'gfg43ner8';
    fetchVideoInfo(youtubeId);
});

function fetchVideoInfo(youtubeId) {
    let targetUrl = '/fetchVideoData' + '?videoid=' + youtubeId;
    $.get(targetUrl, function (response) {
        let blocksJsonArr = JSON.parse(response);
        initializeDescriptionsUI(blocksJsonArr);
    });
}

function initializeDescriptionsUI(blocksJsonArr) {
    let outputHtml = '';
    for(let i=0; i<blocksJsonArr.length; i++) {
        let currBlock = blocksJsonArr[i];
        let blockId = currBlock.block_id;
        let blockNum = currBlock.block_num;
        let startTime = currBlock.start_time;
        let finishTime = currBlock.finish_time;
        let baselineDesc = currBlock.baseline_des;
        let childSceneArr = currBlock.child_scenes;
        outputHtml = outputHtml + '<li class="li-block-header">Block ' + blockNum + '(' + 'x' + ' to ' +  'y' + ' secs) </li>';
        for(let j=0; j<childSceneArr.length; j++) {
            let currScene = childSceneArr[j];
            let sceneId = currScene.sc_id;
            let sceneNum = currScene.sc_num;
            let scStartTime = currScene.start_time;
            let scFinishTime = currScene.finish_time;
            let sceneOcr = currScene.original_ocr;
            let sceneDesc = currScene.original_description;
            outputHtml = outputHtml
            + '<li><div class="scene-container"><table style="width: 100%"><tr><td>Scene ' 
            + sceneNum 
            + '</td><td>' 
            + scStartTime + ' to ' + scFinishTime 
            + 'secs</td></tr><tr><td>Description</td><td><div class="scene-description-container">'
            + '<button class="btn-update-scene-description">Update Description</button>'
            + '<textarea class="txt-scene-description">' + sceneDesc + '</textarea></div></td></tr>'
            + '<tr><td>OCR Detected</td><td><div class="scene-ocr-container">'
            + '<button class="btn-update-scene-ocr">Update OCR</button>'
            + '<textarea class="txt-scene-ocr">' + sceneOcr + '</textarea></div></td></tr></table>'
            + '<div style="text-align: center; margin-bottom: -20px; margin-top: 10px;">';
            if(j!=childSceneArr.length-1) {
                outputHtml = outputHtml + '<button class="btn-merge">Merge With Next</button>'
            }
            outputHtml = outputHtml
            + '</div>'
            + '</div></li>';
        }
        outputHtml = outputHtml
        + '<li class="li-block-footer"><div class="block-footer-container"><table style="width: 100%">'
        + '<tr>Block ' + blockNum + ' Baseline Description</tr><tr><td><div class="block-description-container">'
        + '<button class="btn-update-block-description">Update Description</button>'
        + '<textarea class="txt-block-description">' + baselineDesc + '</textarea>'
        + '</div></td></tr></table></div>'
        + '</li>';
    }
    $('#ul-scene-list').html(outputHtml);
}

function scrollToPosition(position) {
    $('#ul-scene-list').animate({
        scrollTop: $('#ul-scene-list li:nth-child(' + position + ')').position().top - $('#ul-scene-list li:first').position().top
    }, 'slow');
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '270',
        width: '480',
        videoId: 'M7lc1UVf-VE',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        },
        playerVars: { 'autoplay': 1, 'controls': 1,'autohide':1,'wmode':'opaque','origin':'http://localhost:3000' }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();
}

var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(stopVideo, 6000);
        done = true;
    }
}
function stopVideo() {
    player.stopVideo();
}
