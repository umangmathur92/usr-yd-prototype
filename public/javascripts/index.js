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
let autoPauseAtEachScene = true;
let timeElapsedOnPage = 0;
let isTimerPaused = false;

$(document).ready(function() {
    $('#btn-video-breakpoint-toggle').prop("checked", true);
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

/*
created by Vaishali 
renders Question answer on withAi page
*/
const renderQnaList = (qnaList) => {  
    qnaList.forEach(qa => {
        let { answerId, sceneId, questionId, question, answer } = qa;
        let currentContainer = `qna_container:${sceneId}`
        let cont = document.getElementById(currentContainer);
        const qaElement = getNewQnA(question, answer, questionId, answerId);
        qaElement.dataset.jsonData = JSON.stringify(qa);
        cont.appendChild(qaElement);
    });
}

function fetchVideoInfo(youtubeId) {
    console.log(userId);
    // let targetUrl = '/fetchVideoData' + '?videoid=' + youtubeId;
    let targetUrl = `/fetchVideoData?videoid=${youtubeId}&userId=${userId}`
    $.get(targetUrl, function (response) {
        let vidJson = response;
        let vidTitle = vidJson.title;
        let vidLength = vidJson.duration;
        let blocksJsonArr = vidJson.info;
        let overrideData = vidJson.overrideData || [];
        $('#txtVidtitle').html(vidTitle);
        populateAllSceneArrAndAllBlockArr(blocksJsonArr);
        sceneIdToListPositionMap = populateSceneIdToListPositionMap(blocksJsonArr);
        initializeDescriptionsUI(blocksJsonArr, overrideData);
        renderQnaList(response.qnaList)
        //setInterval(updateAll, 1000*60*2);
    });
}

/*
created by Vaishali 
create Question answer on click of button "addQuestion"
*/
function getNewQnA (ques, ans, quesId, ansId) {
    let qa = document.createElement('div');

    let del = `<button onclick="$(this).parent().parent().remove()" id="delBtn:${quesId}:${ansId}"> Delete </button>`
    qa.innerHTML = `<div>
                    <label class="qnALabel">Question:</label> 
                    <textarea class='qnATextArea' onkeyup="auto_grow(this)" >${ques || ''}</textarea>
                    <label class="qnALabel">Answer:</label> 
                    <textarea class='qnATextArea' onkeyup="auto_grow(this)">${ans || ''}</textarea>
                    ${del}
                   </div>`;
    return qa;
};

/*
created by Vaishali 
adding eventListener on add question btn click, get question click
*/
document.getElementById('ul-scene-list').addEventListener('click', (e) => {

    console.log('click event TARGET: ', e.target);
    // console.log('click event TARGET: ', e.target.id);

    if(e.target.id.includes('create_question:')) {
        let index = e.target.id.indexOf(':')+1;
        let textDescArea = e.target.id.substring(index);
        document.getElementById(`qna_container:${textDescArea}`).appendChild(getNewQnA()); 
    }else if (e.target.id.includes('get_question:')) {
        let index = e.target.id.indexOf(':')+1;
        let textDescArea = e.target.id.substring(index);
        let descId = 's_d_'+ textDescArea;        
        let desc = document.getElementById(descId).value;
        
        console.log('descId: ', descId, 'val: ', desc);

        let rows = desc.split("\n");

        for (var i = 0; i < rows.length; i++) {
            console.log('ROWS:', rows[i]);
        }

        let postJson = {
            "sentence" : rows
        };

        let questionArr = [];
        $.post('/us3/question/generate', postJson, function (res) {
                rows = res.result;
                for(let i=0; i< rows.length ; i++){
                    if(rows[i].response.status === 'success'){
                        console.log({QUESTION: rows[i].response.question});
                        questionArr.push(rows[i]);
                        let response = rows[i].response;
                        let qnAelement = getNewQnA(response.question, response.answer);
                        // e.target.nextSibling.nextSibling.appendChild(qnAelement); 

                        document.getElementById(`qna_container:${textDescArea}`).appendChild(qnAelement)
                 
                    }
                }
                console.log('RESULT ', res.result);
                console.log({questionArr});
        });
    }else if(e.target.id.includes('delBtn')){
        console.log('INSIDE DELETEEEE ', e.target);
        let [txt, questionId, answerId] = e.target.id.split(':')
        let jsonBody = {
            "questionId" : questionId,
            "answerId" : answerId
        };
        console.log('DELETEJSON ', jsonBody);
        $.ajax({
            type: 'DELETE',
            url : '/us3/question/deleteQuestion',
            dataType: "json",
            async:true,
            data: jsonBody,
            success: function (response) {
                console.log('SUCCESS:', response);
            },
            error: function (response, textStatus, errorThrown) {
                console.log(errorThrown);
            }
          });
    } else if(e.target.id === 'doneSceneBtn') {
        playVideo();
    } else if(e.target.id.includes('merge_scene')){
        console.log('inside merge scene');
        let index = e.target.id.indexOf(':')+1;
        let curSceneId = e.target.id.substring(index);
        console.log({curSceneId});
        let curSceneDescElement = document.getElementById('s_d_'+ curSceneId);
        console.log({curSceneDescElement});
        
        //next Sibling
        let nextSibling = document.getElementById(e.target.id).parentElement.parentElement.nextSibling;
        let nextSiblingSceneId = nextSibling.children[0].id;
        nextSiblingSceneId = nextSiblingSceneId.substring(8);
        console.log({nextSiblingSceneId});
        let nextSceneDescElement = document.getElementById('s_d_'+ nextSiblingSceneId);
        console.log({nextSceneDescElement});

        curSceneDescElement.value += '\n' + nextSceneDescElement.value;

        //delete next scene
        let jsonBody = {
            "sceneId" : nextSiblingSceneId
        };
        
        $.ajax({
            type: 'DELETE',
            url : '/userStudy/deleteScene',
            dataType: 'json',
            async:true,
            data: jsonBody,
            success: function (response) {
                window.alert('Scene merged successfully');
                nextSibling.remove();
            },
            error: function (response, textStatus, errorThrown) {
                console.log(errorThrown);
            }
          });


    }
});

function renderScenes(currScene) {
    let outputHtml = '';
            console.log({currScene})
            let sceneId = currScene.sc_id;
            let sceneNum = currScene.sc_num;
            let scStartTime = currScene.start_time;
            let scFinishTime = currScene.finish_time;
            let sceneOcr = enableAi ? $.trim(currScene.original_ocr) : '';
            let sceneDesc = enableAi ? $.trim(currScene.original_description) : '';
            let scStartTimePretty = millisToMinutesAndSeconds(scStartTime);
            let scFinishTimePretty = millisToMinutesAndSeconds(scFinishTime);
            let doneSceneBtn = `<input type="button" id="doneSceneBtn" style="display:block; margin:10px 0px 0px 0px;" value="Done With Scene"/>`;
            let getQuestionBtn = `<input style="display:block;" type="button" id="get_question:${sceneId}" value="Save Description"/>`;
            let qaContainer = `<div id="qna_container:${sceneId}"></div>`;
            let createMoreQues = `<input type="button" id="create_question:${sceneId}" style="margin:10px 0px 0px 0px;" value="Create More Question"/>`;
            let mergeScene = `<input type="button" id="merge_scene:${sceneId}" style="margin:10px 0px 0px 0px;" value="Merge with next scene"/>`;
            let newQuestion = `${getQuestionBtn}<hr />${qaContainer}<hr />${createMoreQues}<hr />${doneSceneBtn} <hr />${mergeScene} </div>`;  
            

            outputHtml = outputHtml
            + `<li><div class="scene-container" id="sc_cont_${currScene.sc_id}">`
            + `<table style="width: 100%">`
            + '<tr><td><b>Scene ' + sceneNum + '</b></td><td>' + scStartTimePretty + ' to ' + scFinishTimePretty + ' minutes<button type = "submit" name = "learn" value = "myimage" onclick="resetVideoTo('+scStartTime+')" style="float: right;"> <img src="/images/replay.png" style="height: 15px;" /> <span style="height: 100%; width: 100%;">Replay Scene</span></button></td></tr>'
            + '<tr><td>Description</td><td><div class="scene-description-container">'
            // + '<button class="btn-update-scene-description" data-sceneid="'+ sceneId +'" style="display: none;">Update Description</button>'
            + '<textarea onkeyup="auto_grow(this)" class="txt-scene-description" id="s_d_'+ sceneId + '">' + sceneDesc + '</textarea></div></td></tr>'
            // + '<tr><td>Text On-Screen</td><td>' 
             + '<div class="scene-ocr-container" style="display:none">'
            // // + '<button class="btn-update-scene-ocr" data-sceneid="'+ sceneId +'" style="visibility: hidden;">Update Text</button>'
             + '<textarea onkeyup="auto_grow(this)" class="txt-scene-ocr" id="s_o_'+ sceneId + '">' + sceneOcr + '</textarea></div></td></tr></table>'
             + `<hr/>` 
             + newQuestion
            // + '<tr><td>Question and Answer</td></td><div class="scene-ocr-container">'
            // + '<text area onkeyup="auto_grow(this)" class="txt-scene-ocr"> </textarea></div></td></tr></table>';
            // if(j!=childSceneArr.length-1) {
            //     outputHtml = outputHtml + '<button class="btn-merge">Merge With Next</button>'
            // }
            outputHtml = outputHtml
            + '</div>'
            + '</div></li>';
            return outputHtml;
}


function initializeDescriptionsUI(blocksJsonArr, overrideData) {
    let outputHtml = '<li class="li-block-header" style="visibility: hidden; height: 0px;"><b>Block 0 </b> </li>';
    if (overrideData.length > 0 ) {
        for(let i=0; i<overrideData.length; i++) {
            outputHtml += renderScenes(overrideData[i]);
        }

    } else {
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
                outputHtml +=  renderScenes(childSceneArr[j]);
            }
            // outputHtml = outputHtml
            // + '<li class="li-block-footer" style="visibility: hidden; height: 0px;"><div class="block-footer-container" id="'+ 'bl_cont_' + blockId +'"><table style="width: 100%">'
            // + '<tr>Block ' + blockNum + ' Baseline Description</tr><tr><td><div class="block-description-container">'
            // + '<button class="btn-update-block-description" data-blockid="'+ blockId +'">Update Description</button>'
            // + '<textarea onkeyup="auto_grow(this)" class="txt-block-description" id="b_d_'+ blockId + '">' + baselineDesc + '</textarea>'
            // + '</div></td></tr></table></div>'
            // + '</li>';
        }
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
    // console.log('I was called');
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
        let listPosition = sceneIdToListPositionMap.get(sceneId);
        scrollToPosition(listPosition);
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

/* 
created by Vaishali
iterating over all QnAcontainers, saving entire info for the ques and answers that already exists
in the DB, sending new qnAs
*/
const getNewQnAData = () =>{
    const qnaData = {}
    var allQAContainer = $('div[id^="qna_container:"]');

    for(let i=0; i< allQAContainer.length; i++) {
        const qaList = allQAContainer[i].children;
        for(let childIndex = 0; childIndex< qaList.length; childIndex++){
            console.log('id of parent', allQAContainer[i].id.substring(14));
            let sceneId = allQAContainer[i].id.substring(14)
            const currentElement = qaList[childIndex];
            // console.log('child', qaList[childIndex]);
            var question = currentElement.children[0].children[1].value;
            var answer = currentElement.children[0].children[3].value;
            console.log({question, answer})

            qnaData[sceneId] = qnaData[sceneId] || [];
            if(currentElement.dataset.jsonData) {
                const tempData = JSON.parse(currentElement.dataset.jsonData); //saving coming json data  for the exisiting qnA
                qnaData[sceneId].push({question, answer, answerId: tempData.answerId, questionId: tempData.questionId });
            } else {
                qnaData[sceneId].push({question, answer })//pushing only questio and answer value to the exisiting qnA.
            }
        }
    }
    return qnaData;
}

async function updateAll(shoudShowAlert) {
    let postJson = fetchJsonBodyForAllTextFields(allSceneArr, allBlockArr, userId);
    // await $.post('/updateMultipleScenesAndBlocksForUser', postJson, function (response) {
        // return;
    const qnaData = getNewQnAData();    
    postJson.qnaData = qnaData;
    postJson.videoId = youtubeId;
    console.log({postJson});
    await $.post('/saveAiDescription', postJson, function (response) {
        if(shoudShowAlert) {
            if(response.success) {
                alert('Submitted Successfully\nYou will be redirected to the Video List Page');
                window.history.back();
            } else {
                console.log(response);
                alert('Update Status: ' + response.success);
            }
        }
    });
}


async function updateMainTables() {
    let postJson = fetchJsonBodyForAllTextFields2(allSceneArr, allBlockArr);

    console.log({postJson})
    await $.post('/updateBlockAndScene', postJson, function (response) {
        if(response.success) {
            window.alert('Updated Successfully');
        } else {
            window.alert('Update Failed');
        }
    });
}

//added start time, end time and has Ai for saving in descrption table
function fetchJsonBodyForAllTextFields(allSceneArr, allBlockArr, userId) {
    let parentJsonBody = {};
    let sceneArrJson = [];
    let blockArrJson = [];
    console.log({'INSIDE fetchJsonBodyForAllTextFields ' : allSceneArr});
    for(let i=0; i<allSceneArr.length; i++) {
        let currScene = allSceneArr[i];
        let currSceneId = currScene.sc_id;
        let currSceneDescTextId = '#s_d_' + currSceneId;
        let currSceneOcrTextId = '#s_o_' + currSceneId;
        let sceneJsonObj = {};
        sceneJsonObj.scene_id = currSceneId;
        sceneJsonObj.modified_description = $(currSceneDescTextId).val().trim();
        sceneJsonObj.modified_ocr = $(currSceneOcrTextId).val().trim();
        sceneJsonObj.start_time = currScene.start_time;
        sceneJsonObj.end_time = currScene.finish_time;
        sceneJsonObj.has_ai = enableAi;

        sceneArrJson.push(sceneJsonObj);
    }
    // for(let i=0; i<allBlockArr.length; i++) {
    //     let currBlock = allBlockArr[i];
    //     let currBlockId = currBlock.block_id;
    //     let currBlockDescTextId = '#b_d_' + currBlockId;
    //     let blockJsonObj = {};
    //     blockJsonObj.block_id = currBlockId;
    //     blockJsonObj.modified_description = $(currBlockDescTextId).val().trim();
    //     blockArrJson.push(blockJsonObj);
    // }
    parentJsonBody.user_id = userId;
    parentJsonBody.scene_arr = sceneArrJson;
    parentJsonBody.block_arr = blockArrJson;
    parentJsonBody.time_taken = timeElapsedOnPage;

    console.log({sceneArrJson});
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
    // for(let i=0; i< jsonArr.length; i++) {
    //     sceneListPositionMap.set(jsonArr[i].sc_id, jsonArr[i].sc_num);
    // }
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
    // console.log(time);
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

