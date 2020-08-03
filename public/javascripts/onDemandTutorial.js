let player;
let youtubeId = '';
let videotime = 0;
let timeupdater = null;
let sceneIdToListPositionMap = new Map();
let sceneToBlockMap = new Map();
let userId = "d8fcfd52-b0b3-4969-bf03-1dc54b681b5d";
let volunteerId;
let prevSceneNum = -1;
let timeAtWhichLastPaused = -1;
let previouslyHighlightedContainerId = '#doesnotexist';
let enableAi = false;
let autoPauseAtEachScene = true;
let timeElapsedOnPage = 0;
let isTimerPaused = false;
let allSceneArr = [];
let allBlockArr = [];
let audioArr = [];
let allDialogArraySTartTimes = [];
let allDialogArrayEndTimes = [];

let allSentenceStartTimes = [];
let allSentenceEndTimes = [];
let isSceneExtended = []; // Required to check if a scene has to be auto-paused to play the extended audio
let allSentenceAudioType = [];
let allSentenceSceneNum = [];
let scene_audio_extend_set = new Set();
let sentenceAudioMap = {};
let allSentenceInlineStartTimeArr = [];
let allSentenceInlineDurArr = [];
let allSentenceInlineArr = [];

let currAudio = null;
let currAudioTime;
let wasCurrAudioPaused = false;
let STATE = 0;
let YT_STATE = 0;
let STATE_TIME = -1;
let STATE_CHANGE = 0;
let YT_FLAG = false;
let YT_FLAG_Dial = false;
let YT_FLAG_EXT = false;
let first_extend_flag = true;
let desc_flag = false;
let audio_flag = false;

let noOfQuestionsAsked = 0;
let playQuestionAudio = new Audio('../audio/tutorial_question.mp3');
// let audio_clip = document.getElementById("myAudio");

$(document).ready(function() {
    $('#btn-video-breakpoint-toggle').prop("checked", true);
    volunteerId = getUrlVars()["u"];
    // userId = getUrlVars()["u"];
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
    WebSocketTest();
    console.log(userId);
    // let targetUrl = '/fetchVideoData' + '?videoid=' + youtubeId;
    let targetUrl = `/fetchVideoData?videoid=${youtubeId}&userId=${userId}`
    $.get(targetUrl, function (response) {
        let vidJson = response;
        let vidTitle = vidJson.title;
        let vidLength = vidJson.duration;
        let blocksJsonArr = vidJson.info;
        
        overrideData = vidJson.overrideData || [];
        overrideData = overrideData.map( (over) => {
            let { deletedScene='[]', ...rest } = over
            return {
                deletedScene: JSON.parse(deletedScene),
                ...rest,
            }           
        })
        
        populateAllSceneArrAndAllBlockArr(blocksJsonArr);
            sceneIdToListPositionMap = populateSceneIdToListPosition(blocksJsonArr);
            console.log(sceneIdToListPositionMap);

        $('#txtVidtitle').html(vidTitle);
     
        //setting the data attribute for list-container\
        let listContainer = document.querySelector('.list-container');
        if(overrideData.length > 0){
            listContainer.dataset.sceneDetails = JSON.stringify(overrideData);
        }else{
            let sceneArr = [];
            for(let i=0; i<blocksJsonArr.length; i++) {
                let currBlock = blocksJsonArr[i];
                let childSceneArr = currBlock.child_scenes;
                sceneArr.push.apply(sceneArr, childSceneArr);
            }
            listContainer.dataset.sceneDetails = JSON.stringify(sceneArr);
        }
        let sceneDetails = JSON.parse(listContainer.dataset.sceneDetails);
        sceneIdToListPositionMap = populateSceneIdToListPositionMap(sceneDetails);
        //initializeDescriptionsUI();
        if(response.qnaList){
            renderQnaList(response.qnaList);
        }
    });

    let target_url = '/getDialogTimeStamps' + '?videoId=' + youtubeId;
        $.get(target_url, function (response) {
            // KeyFramesArr = response;
            // debugger;
            console.log('Dialog timestamps'+response[0]);
            for(val of response)
            {
                allDialogArraySTartTimes.push(val['start_time']);
                allDialogArrayEndTimes.push(val['end_time']);
            // debugger;    
        }});
        console.log('Times',allDialogArraySTartTimes);

        let target_url_sentence = '/getSentences' + '?videoId=' + youtubeId + '&userId=' + userId;
        $.get(target_url_sentence, function (response) {
            // KeyFramesArr = response;
            // debugger;
            console.log('sentence start times'+response[0]);
            allSentenceArr = response;
            for(val of response)
            {
                allSentenceStartTimes.push(val['audio_start_time']);
                // allSentenceEndTimes.push(val['audio_end_time']);
                allSentenceAudioType.push(val['audio_type']);
                allSentenceSceneNum.push(val['scene_num']);
                
                // let sceneId = val['scene_id'];
                let sceneNum = val['scene_num'];
                let randomNum = Math.random();
                // let descType = val['has_ai'] ? 'ai' : 'non_ai';
                let descType = 'ai';
                // let sentNumArr = val['sentence_id'].split('_');
                // let sentNum = sentNumArr[sentNumArr.length - 1];
                let audioType = val['audio_type'];
                let path = val['audio_path'].split('/');
                let path_ext = path[path.length - 1];
                let src = `../audio/${youtubeId}/${descType}/${userId}/${sceneNum}/new/${path_ext}` + '?random='+randomNum;
                // let src = path ;
                console.log(typeof(src));
                let audioFile = new Audio(src);
                // audioArr.push(audioFile);
             
                if(!scene_audio_extend_set.has(val['scene_num']) && val['audio_type'] == 'extended')
                    {scene_audio_extend_set.add(val['scene_num']);
                    //create audio object
                    sentenceAudioMap[val['scene_num']] = [audioFile];
                }

                else if(val['audio_type'] == 'extended'){
                    // create audio object
                    sentenceAudioMap[val['scene_num']].push(audioFile);
                }
                else if(val['audio_type'] == 'inline'){
                    
                    allSentenceInlineStartTimeArr.push(val['audio_start_time']);
                    allSentenceInlineDurArr.push(val['audio_length']);
                    allSentenceInlineArr.push(audioFile);
                }

                    // debugger;    
        }
            let j = 0, num=0;
            let presentScene = allSentenceArr[0]['scene_num'];
            let flag = true;
            for(val of allSentenceArr){

                if (val['scene_num'] != presentScene){
                    if(flag)
                    isSceneExtended.push(false);
                    flag = true;    
                }

                if(flag && val['audio_type'] == 'extended')
                {   isSceneExtended.push(true);    
                    flag = false    
                }
                }
                audio_flag = true;
    });
        console.log('Times',allDialogArraySTartTimes);

}

function initializeDescriptionsUI() {
    let outputHtml = '';
    let listContainer = document.querySelector('.list-container');
    sceneDetails = JSON.parse(listContainer.dataset.sceneDetails);

    for(let i=0; i<sceneDetails.length; i++) {
        outputHtml += renderScenes(sceneDetails[i], i+1);
    }
   
    $('#ul-scene-list').html(outputHtml);
    $("textarea").each(function(){
        auto_grow(this);
    });
}


function renderScenes(currScene, scene_num) {
    // console.log({currScene})
    let sceneId = currScene.sc_id;
    let sceneNum = currScene.sc_num;
    let scStartTime = currScene.start_time;
    let scFinishTime = currScene.finish_time;
    let sceneOcr = enableAi ? $.trim(currScene.original_ocr) : '';
    let sceneDesc = enableAi ? $.trim(currScene.original_description) : '';
    let scStartTimePretty = millisToMinutesAndSeconds(scStartTime);
    let scFinishTimePretty = millisToMinutesAndSeconds(scFinishTime);
    let mergeMessage = 'Please merge the scene before generating questions for the next scene';
    let doneSceneBtn = `<input type="button" id="doneSceneBtn" style="display:block; margin:10px 0px 0px 0px;" value="Done with scene"/>`;
    let getQuestionBtn = `<input style="display:block;" type="button" id="get_question:${sceneId}" value="Autogenerate Questions"/><label for="get_question:${sceneId}"> Generates question on the above description</label>`;
    let qaContainer = `<div id="qna_container:${sceneId}"></div>`;
    let createMoreQues = `<input type="button" id="create_question:${sceneId}" style="margin:10px 0px 0px 0px;" value="Create More Question"/>`;
    let mergeScene = `<input type="button" id="merge_scene:${sceneId}" style="margin:10px 0px 0px 0px;" value="Merge with next scene"/>`;
    let newQuestion = `${getQuestionBtn}<hr />${qaContainer}<hr />${createMoreQues}<hr />${doneSceneBtn} <hr />  ${mergeScene} ${mergeMessage}</div>`;  
            

    let  outputHtml = `<li class="newscene-list"><div class="scene-container" id="sc_cont:${currScene.sc_id}">`
                    + `<table style="width: 100%">`
                    + '<tr><td><b>Scene ' + scene_num + `</b></td><td id=${'time:'+currScene.sc_id}>` + scStartTimePretty + ' to ' + scFinishTimePretty + ' minutes <button type = "submit" name = "learn" value = "myimage" onclick="resetVideoTo('+scStartTime+')" style="float: right;"> <img src="/images/replay.png" style="height: 15px;" /> <span style="height: 100%; width: 100%;">Replay Scene</span></button></td></tr>'
                    + '<tr><td>Description</td><td><div class="scene-description-container">'
                    + '<textarea onkeyup="auto_grow(this)" class="txt-scene-description" id="s_d_'+ sceneId + '">' + sceneDesc + '</textarea></div></td></tr>'
                    + '<tr><td>Text On-Screen</td><td>' 
                    + '<div class="scene-ocr-container">'
                    + '<textarea onkeyup="auto_grow(this)" class="txt-scene-ocr" id="s_o_'+ sceneId + '">' + sceneOcr + '</textarea></div></td></tr></table>'
                    + `<hr/>` 
                    + newQuestion;
            
    return outputHtml;
}



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
        let listContainer = document.querySelector('.list-container');
        sceneDetails = JSON.parse(listContainer.dataset.sceneDetails);

        let result = confirm("Do you want to merge current scene with the next?");
        if (result) {
            //Logic to delete the item
            console.log('inside merge scene');
            let index = e.target.id.indexOf(':')+1;
            let curSceneId = e.target.id.substring(index);
            console.log({curSceneId});
            let curSceneDescElement = document.getElementById('s_d_'+ curSceneId);
            console.log({curSceneDescElement});
            
            //next Sibling
            let nextSibling = document.getElementById(e.target.id).parentElement.parentElement.nextSibling;
            let nextSiblingSceneId = nextSibling.children[0].id;
            let indexNextSib = nextSiblingSceneId.indexOf(':')+1;
            nextSiblingSceneId = nextSiblingSceneId.substring(indexNextSib);
            let nextSceneData = sceneDetails.filter( el => el.sc_id === nextSiblingSceneId )[0]
            let currSceneData = sceneDetails.filter( el => el.sc_id === curSceneId )[0]
         
            if(!currSceneData.deletedScene){
                let deletedSceneArr = [];
                deletedSceneArr.push(nextSiblingSceneId);
                currSceneData.deletedScene = deletedSceneArr;
            }else{
                if(nextSceneData.deletedScene){
                    currSceneData.deletedScene.push(...nextSceneData.deletedScene);
                }
               
                currSceneData.deletedScene.push(nextSiblingSceneId);
            }

            console.log({ nextSceneData,  currSceneData})

            let newStartTime = currSceneData.start_time;
            let newEndTime = nextSceneData.finish_time;
            currSceneData.finish_time = newEndTime;

            document.getElementById(`time:${curSceneId}`).innerHTML = `${millisToMinutesAndSeconds(newStartTime)} to ${millisToMinutesAndSeconds(newEndTime)} minutes`
            // console.log({allSceneArr});
            console.log({nextSiblingSceneId});
            let nextSceneDescElement = document.getElementById('s_d_'+ nextSiblingSceneId);
            console.log({nextSceneDescElement});
    
            curSceneDescElement.value += '\n' + nextSceneDescElement.value;
            // document.getElementById(curSceneDescElement+'.'+'txt-scene-description').autogrow();
            nextSibling.remove();
            //delete next scene
            let jsonBody = {
                "sceneId" : nextSiblingSceneId
            };
           
            console.log(e.target.id);
            console.log({"Inside merge:" : sceneDetails});
            listContainer.dataset.sceneDetails = JSON.stringify(sceneDetails);
            updateAll();
            fetchVideoInfo(youtubeId);
            // let currentTime = player.getCurrentTime();
            // player.seekTo(currentTime);
        }

    }
});


function millisToMinutesAndSeconds(secs) {
    var minutes = Math.floor(secs / 60);
    var seconds = ((secs % 60) / 1).toFixed(1);
    return minutes + ":" + seconds;
}  

function scrollToPosition(position) {
     position--;
    $('#ul-scene-list').animate({
        scrollTop: $('#ul-scene-list>.newscene-list:eq(' + position + ')').position().top -
        $('#ul-scene-list>.newscene-list:eq(0)').position().top 
    }, 'slow');
    let newSceneList = document.querySelectorAll('.newscene-list');
    
    newSceneList.forEach(sceneItem => {
        sceneItem.firstChild.classList.remove('highlight');
    })

    newSceneList[position].firstChild.classList.add('highlight');

    // if(position > 0) {
    //     newSceneList[position-1].firstChild.classList.remove('highlight');
    // }
    console.log({position});
    console.log({previouslyHighlightedContainerId});
    previouslyHighlightedContainerId = '#ul-scene-list>.newscene-list:eq(' + position + ')' + ' .scene-container';
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

async function onPlayerReady(event) {
    pauseVideo();
    player.setVolume(75);
    $('#total_time').text(formatTime(player.getDuration()));
    updateTime();
}

async function updateTime() {
    while(true){
        if(desc_flag){
    var oldTime = videotime;
     if(player && player.getCurrentTime) {
        videotime = player.getCurrentTime();
        // console.log("No state change");
    }
    // if(Math.floor(videotime/30) <= noOfQuestionsAsked)
    //     STATE = 0;

    if(Math.floor(videotime/30) > noOfQuestionsAsked){
        if(player.getPlayerState() == YT.PlayerState.PLAYING){
            pauseVideo();
        await checkQuestion();
        }
    }

    else if(prevSceneNum >= 0 && videotime - oldTime > 0.3) {
        console.log("Forward");
        STATE = 0;
        await updateProgress(videotime); // S1 Different func
    }

    else if(oldTime - videotime > 0.3) {
        console.log("Rewind");
        STATE = 0;
        await updateProgress(videotime); //  S1 Different func
    }
    
    else if(YT_FLAG)
            YT_FLAG = false;
    else if(videotime !== oldTime) {
        console.log("Playing: oldtime: "+oldTime+" videotime: "+videotime+" State time: "+ STATE_TIME); // S2 Different func
        if(STATE==0){
            // currAudio.play();
            await onProgress(videotime);
        }
        else if(STATE == 1)
            {
                if(YT_FLAG_EXT)
                {YT_FLAG_EXT=false; continue;}

                pauseVideo();
                YT.currentTime = STATE_TIME;
                YT_FLAG = true;
                console.log("Extended fault");
                if(currAudio && currAudio!==null)
                    currAudio.pause();
                // currAudio.play();
                    console.log("Current Audio is paused: 0"+STATE_TIME);
                STATE = 2;
            }
        else if(STATE == 2)
        {
            pauseVideo();
            YT.currentTime = STATE_TIME;
            YT_FLAG = true;
            videotime = player.getCurrentTime();
            if(currAudio && currAudio!==null)
                currAudio.play();
                STATE = 1;
        }
    }
    else {
        // console.log("Paused");  // modify currAudio.onended func

    if(STATE == 0 && currAudio && currAudio!==null && isPlaying(currAudio))
        currAudio.pause();
}
    $('#elapsed_time').text(formatTime(player.getCurrentTime()));
    console.log("Time event");
    // msleep(100);
}  
    await new Promise(r => setTimeout(r, 100));    
}
    
}

// when the time changes, this will be called.

async function updateProgress(currentTime){
    currentTime = currentTime.toFixed(3);
    let currScene = getSceneFromTime(currentTime, allSceneArr);
    
    let sceneNum = currScene.sc_num;
    
    prevSceneNum = sceneNum;
    
    if (currAudio !== null && isPlaying(currAudio))
        currAudio.pause(); 
        currAudio = null;
        player.setVolume(75);
}

async function onProgress(currentTime) {
    // debugger;
    currentTime = currentTime.toFixed(3);
    let currScene = getSceneFromTime(currentTime);
    let sceneId = currScene.sc_id;
    console.log(allSceneArr);
    let sceneNum = currScene.sc_num;
    let sceneEndTime = currScene.finish_time;
    
    if(prevSceneNum == -1 && first_extend_flag)
    {first_extend_flag = false;}

    else if((prevSceneNum != -1 && sceneNum != prevSceneNum)) {   
        if(scene_audio_extend_set.has(prevSceneNum)) {
            STATE = 1;
            pauseVideo();
            let totalAudios = sentenceAudioMap[prevSceneNum];
            let flag = true;
            let i=0;
            YT_FLAG = true;
                if(flag && currAudio==null)
                {currAudio = sentenceAudioMap[prevSceneNum][0];
                    console.log("Will play now!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                player.setVolume(15);
                currAudio.play();
                currAudio.onended = function() {
                            console.log('player state is: ' + player.getPlayerState());
                    if(player.getPlayerState() == YT.PlayerState.PAUSED) {
                        console.log('I was called');
                        STATE = 0;
                        STATE_TIME = -1;
                        currAudio = null;
                        player.setVolume(75);
                        playVideo();
                    }}
    
            prevSceneNum = sceneNum;

            
            // YT_FLAG_EXT = true;
            STATE = 1;
            STATE_CHANGE = 1;
            console.log("STATE: EXTENDED");
            
            STATE_TIME = player.getCurrentTime();
            // debugger;
            // prevSceneNum = sceneNum-1;
        } 
            prevSceneNum = sceneNum;
        }
        prevSceneNum = sceneNum;
    }

    else if(prevSceneNum == -1)
        prevSceneNum = sceneNum;
    
    else if(currAudio !== null && !isPlaying(currAudio))
        currAudio.play();
        // logic for inline
    else{ 

        let res = isInlineAudio(currentTime);
        let index = res[1];
        if(res[0] && currAudio == null && index >= 0)
    {
        currAudio = allSentenceInlineArr[index];
        let diff = res[2];
        currAudio.currentTime = diff;
        player.setVolume(15);
        currAudio.play();
        currAudio.onended = function(){
            currAudio = null;
            console.log('Test1: ', index);
            player.setVolume(75);
        }
    }
    }
    // else{
    //     // YT_FLAG_Dial = false;
    //     if(currAudio!==null && !isPlaying(currAudio) && !YT_FLAG_Dial)
    //     currAudio.play();
    // }
}

function onPlayerStateChange(event) {
    let playerState = event.data;
    switch(playerState) {
        case YT.PlayerState.PLAYING:
        audio_clip.pause();
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
            if(scene_audio_extend_set.has(sceneNum)) {
                // STATE = 1;
                // pauseVideo();
                // let totalAudios = sentenceAudioMap[prevSceneNum];
                let flag = true;
                // let i=0;
                // YT_FLAG = true;
                    if(flag && currAudio==null)
                    {currAudio = sentenceAudioMap[sceneNum][0];
                        console.log("Will play now!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                    player.setVolume(15);
                    currAudio.play();
                    currAudio.onended = function() {
                                console.log('player state is: ' + player.getPlayerState());
                    }}}
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
    console.log("This is the file");
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
            var question = currentElement.children[0].children[1].value;
            var answer = currentElement.children[0].children[3].value;
            console.log({question, answer})

            qnaData[sceneId] = qnaData[sceneId] || [];
            if(currentElement.dataset.jsonData) {
                const tempData = JSON.parse(currentElement.dataset.jsonData); //saving coming json data  for the exisiting qnA
                qnaData[sceneId].push({question, answer, answerId: tempData.answerId, questionId: tempData.questionId });
            } else {
                qnaData[sceneId].push({videoId:youtubeId, question, answer })//pushing only questio and answer value to the exisiting qnA.
            }
        }
    }
    return qnaData;
}

async function updateAll(shoudShowAlert) {
    let postJson = fetchJsonBodyForAllTextFields(userId);
    const qnaData = getNewQnAData();    
    postJson.qnaData = qnaData;
    postJson.videoId = youtubeId;
    console.log({'HERE': postJson});
    try{
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
    }catch(e){

        console.log(e);
        response.send(e);
    }
   
}

//added start time, end time and has Ai for saving in descrption table
function fetchJsonBodyForAllTextFields(userId) {
    let listContainer = document.querySelector('.list-container');
    sceneDetails = JSON.parse(listContainer.dataset.sceneDetails);

    let parentJsonBody = {};
    let sceneArrJson = [];

    console.log({'INSIDE fetchJsonBodyForAllTextFields ' : sceneDetails});
    let currScene ;
    for(let i=0; i < sceneDetails.length; i++) {
        currScene = sceneDetails[i];
        let currSceneId = currScene.sc_id;
        let currSceneDescTextId = '#s_d_' + currSceneId;
        let currSceneOcrTextId = '#s_o_' + currSceneId;
        let sceneJsonObj = {};
        sceneJsonObj.scene_id = currSceneId;
        let csTestbox = $(currSceneDescTextId)
        if(csTestbox && csTestbox.val()){
            sceneJsonObj.modified_description = csTestbox.val().trim();
            sceneJsonObj.modified_ocr = $(currSceneOcrTextId).val().trim();
            sceneJsonObj.start_time = currScene.start_time;
            sceneJsonObj.end_time = currScene.finish_time;
            sceneJsonObj.has_ai = enableAi;
            sceneJsonObj.deletedScene = currScene.deletedScene;
            sceneArrJson.push(sceneJsonObj);
        }
    }

    parentJsonBody.user_id = userId;
    parentJsonBody.scene_arr = sceneArrJson;
    parentJsonBody.time_taken = timeElapsedOnPage;

    console.log({parentJsonBody});
    return parentJsonBody;
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


function populateSceneIdToListPositionMap(sceneDetailsArr) {
    let listPositionIndex = 0;
    let sceneListPositionMap = new Map();

    for(let i=0; i<sceneDetailsArr.length; i++) {
        let currSceneId = sceneDetailsArr[i].sc_id;
        sceneListPositionMap.set(currSceneId, ++listPositionIndex);//sceneToBlockMap
    }
    return sceneListPositionMap;
}

function populateSceneIdToListPosition(blocksJsonArr) {
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
    desc_flag = true;
    return sceneListPositionMap;
}


function getSceneFromTime(currentTime) {
    let listContainer = document.querySelector('.list-container');
    console.log('This: '+listContainer.dataset);
    sceneDetails = JSON.parse(listContainer.dataset.sceneDetails);
    
    let startTimesArr = [];
    for(let i=0; i< sceneDetails.length; i++) {
        let startTime = parseFloat(sceneDetails[i].start_time);
        startTimesArr.push(startTime);
    }
    let sceneIndex = getIndexOfInputArrForTargetVal(currentTime, startTimesArr);
    return sceneDetails[sceneIndex];
}

function getSceneFromTime2(currentTime, sceneArr) {
    let startTimesArr = [];
    for(let i=0; i<sceneArr.length; i++) {
        let startTime = parseFloat(sceneArr[i].start_time);
        startTimesArr.push(startTime);
    }
    let sceneIndex = getIndexOfInputArrForTargetVal(currentTime, startTimesArr);
    return sceneArr[sceneIndex];
}
// Convert to Binary search
function getDialogFromTime(currentTime) {
    
    let index=allDialogArraySTartTimes.length-1;
    for(let i=0; i< allDialogArraySTartTimes.length; i++) {
        if(Number(currentTime) < allDialogArraySTartTimes[i])
        {   index = i-1;
            console.log("**************************************       "+i);
            break;}
    }
        // console.log("Dialog times: i: "+i+" currentTime: "+currentTime);
        console.log("cTime: "+typeof(currentTime)+" typeof Dialog: "+typeof(allDialogArraySTartTimes[4]) +"  i: "+index);
        if(Number(currentTime) < allDialogArrayEndTimes[index])
            {   console.log("##########################################################");
                return true;}
        else
            return false;
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

function isInlineAudio(target) {
    let inputArr = allSentenceInlineStartTimeArr;
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
    console.log('inside inline: ',target,' and ',allSentenceInlineStartTimeArr[index] + allSentenceInlineDurArr[index]);
    if(index < 0 || target > allSentenceInlineStartTimeArr[index] + allSentenceInlineDurArr[index])
        return [false,index, 0];
    else // may return the difference of current time and inline start time
        return [true, index, target - allSentenceInlineStartTimeArr[index]];
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

function populateAllSceneArrAndAllBlockArr(blocksJsonArr) {
    for(let i=0; i<blocksJsonArr.length; i++) {
        let currBlock = blocksJsonArr[i];
        allBlockArr.push(currBlock);
        let childSceneArr = currBlock.child_scenes;
        allSceneArr.push.apply(allSceneArr, childSceneArr);
    }
}

function isPlaying(audioElement) {
    if(audioElement!=null)  
        return !audioElement.paused; 
}

function seekBackward(){
    let isStatePlaying = false;
    if(player.getPlayerState() == YT.PlayerState.PLAYING)   
        isStatePlaying = true;

    pauseVideo();
    let currentTime = player.getCurrentTime();
    
    if(currentTime > 5)
        player.seekTo(currentTime - 5);
    else
        player.seekTo(0);
    
    if(isStatePlaying)
        playVideo();
}

function seekForward(){
    let isStatePlaying = false;
    if(player.getPlayerState() == YT.PlayerState.PLAYING)   
        isStatePlaying = true;

    pauseVideo();
    let currentTime = player.getCurrentTime();
    // console.log(player.getDuration());
    if(currentTime < player.getDuration() - 5)
        player.seekTo(currentTime + 5);
    else
        player.seekTo(player.getDuration());
    
    if(isStatePlaying)
        playVideo();
}