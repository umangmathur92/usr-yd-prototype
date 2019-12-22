const socket = io('http://localhost:5001');

let url = location.search.substring(1);
const roomName = new URLSearchParams(url).get('name');
const name = new URLSearchParams(url).get('user');
const userType = new URLSearchParams(url).get('type');
const videoId =  new URLSearchParams(url).get('videoId');
const participantId = new  URLSearchParams(url).get('participantId');
console.log({url});
console.log({roomName});
console.log({userName: name});
const ANSWER = 'answer';
const QUESTION = 'question';
const INFO = 'info';
const PAUSEINFO = 'pause';
let videoTime = 0; //synch time according to youtube player
let questions = {};
let questionTimestamp;

let messageForm = document.getElementById('send-container');
let messageInput = document.getElementById('message-input');
let messageContainer = document.getElementById('message-container');
let recordButton = document.getElementById('record-button');
let heading = document.getElementById('heading');
let submitButton = document.getElementById('submit-button');
let totalQuestions = 0;
let prepSessionQuestionsList = [];
let prepSessionTimeList= [];
let timeListCount = 0;


if(userType === 'admin'){
    recordButton.style.display = "none";
    submitButton.style.display = "none";
}else{
    let url = '/room/fetchQuestions' + '?userId=' + name + '&videoId=' + videoId + '&sessionType=' + 'PREPSESSION'; 
    let qNaList = [];
    $.get(url, function (rows) {
        console.log('RESULT ', rows);
        for(let i=0; i<rows.length; i++){
            console.log(rows[i]);
            prepSessionTimeList.push(rows[i].time);
            prepSessionQuestionsList.push(rows[i]);
        }
    });
    prepSessionTimeList.sort();
    console.log({prepSessionQuestionsList});
    console.log({prepSessionTimeList});

}

function updateTime() {
    if(player && player.getCurrentTime) {
        videoTime = player.getCurrentTime();
    }
    console.log('update time:', videoTime);
    if(timeListCount < prepSessionQuestionsList.length && videoTime >= prepSessionTimeList[timeListCount]) {
        player.pauseVideo();
        let time = prepSessionTimeList[timeListCount];
        console.log({prepSessionTime : time});
        let qnA = prepSessionQuestionsList.filter(i => i.time == prepSessionTimeList[timeListCount]);
        console.log({qnA} );
        appendPrepSessionQuestions(qnA[0]);
        socket.emit('send-chat-message', roomName, qnA[0].question, qnA[0].questionId, name, QUESTION);
        timeListCount++;
    }
}

function appendPrepSessionQuestions(data){
   totalQuestions++;
    let messageElement = document.createElement('div');
    let answerElement = `<label class="qnALabel">Answer:</label> 
                        <textarea class='qnATextArea' id=answer:${data.questionId}></textarea>`;
    
    messageElement.innerHTML = `<div class="qNaContainer" id= qna:${data.questionId} style="border:0px">
                                    <label class="qnALabel">Question ${totalQuestions} : </label> 
                                    <textarea class='qnATextArea' id=question:${data.questionId}>${data.question}</textarea>
                                    ${answerElement}
                                    ${userType == 'participant' ? `Rating: <input type="number" name="rating" id=rating:${data.questionId} min="1" max="5"></input>` : ''}
                                    ${userType == 'admin' ? `<button id="sendButton:${data.questionId}" class="btn btn-success" >Send</button>` : '' }
                                </div>`;
   messageContainer.append(messageElement);
}

//Video
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

firstScriptTag.append(`<p> hello </p>`);

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: videoId,
    events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
    }
    });
}

function onPlayerReady(event) {
    event.target.playVideo(); 
    console.log('here');
    setInterval(updateTime, 100);  
}




if(name){
    appendMessage('You joined');
    socket.emit('new-user', roomName, name);
}

function beep() {
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
}

socket.on('chat-message', data=>{
   console.log(data);
   if(userType === 'admin'){
       beep();
   }
   if(data.type == QUESTION){
        appendQnA(data);
   }else if(userType === 'admin' && data.type === INFO){
        appendMessage(data.userId + ' : '+ data.message);
   }else if(data.type == ANSWER){
       let message =  data.name + ' said ' + data.message;
       speak(message);
       updateAnswer(data);
       speak(' Please rate the response');
   }else if(userType === 'admin' && data.type === PAUSEINFO){
       console.log({data});
       appendMessage(data.userId + ' : '+ data.message.text);
       player.seekTo(data.message.duration);
       player.pauseVideo();
   }
})

socket.on('user-connected', name=>{
    appendMessage(`${name} joined`);
})     

socket.on('user-disconnected', name=>{
    appendMessage(`${name} disconnected`);
});       

submitButton.addEventListener('click', (e)=>{
    console.log({event: e.target.id});
    speak('Thank you for completing the session');
    e.stopPropagation();
})

messageContainer.addEventListener('click', (e)=>{
    console.log({event: e.target.id});
    if(e.target.id.includes('sendButton:')){
        console.log('inside send button');
        let index = e.target.id.indexOf(':')+1;
        let textDescArea = e.target.id.substring(index);
        console.log({textDescArea});
        let answerElement = document.getElementById(`answer:${textDescArea}`);
        console.log('ansElement: ', answerElement.value);
        socket.emit('send-chat-message', roomName, answerElement.value, textDescArea, name, ANSWER);
        let data = {
            'id' :  textDescArea,
            'answer' : answerElement.value,
        };
        $.ajax({
            url: '/room/updateAnswer',
            type: 'PUT',
            data,
            success: function(result) {
                console.log('PUT RESULT ', res);
            }
        });
        
    }else if(e.target.id.includes('submitQuestionButton:')){
        console.log('inside submitQuestionButton button');
        let index = e.target.id.indexOf(':')+1;
        let textDescArea = e.target.id.substring(index);
        console.log({textDescArea});
        let questionElement = document.getElementById(`question:${textDescArea}`);
        console.log('questionElement: ', questionElement.value);
        document.getElementById(e.target.id).disabled = true;
        socket.emit('send-chat-message', roomName, questionElement.value, textDescArea, name, QUESTION);
        
        let postJson = {
            'user' : name ,
            videoId,
            'questionId' : textDescArea,
            'answerId' : textDescArea,
            'question' : questionElement.value,
            'answer' : '',
            'sessionType' : 'SESSION1',
            'timeStamp' : questionTimestamp,
            'questionType' : '',
        }

        console.log({postJson});
        $.post('/room/addQuesAns', postJson, function (res) {
            console.log('RESULT ', res);
        });
    }if(e.target.id.includes('rating:')){
        console.log('inside rating button');
        let index = e.target.id.indexOf(':')+1;
        let id = e.target.id.substring(index);
        console.log({id});
        let ratingElement = document.getElementById(`rating:${id}`);
        // socket.emit('send-chat-message', roomName, ratingElement.value, id, name, ANSWER);
        let data = {
            id,
            'rating' : ratingElement.value,
        };
        $.ajax({
            url: '/room/updateRating',
            type: 'PUT',
            data,
            success: function(result) {
                console.log('PUT RESULT ', res);
            }
        });
        
    }
    e.stopPropagation();
})

function appendQnA(data){
    totalQuestions++;
    let messageElement = document.createElement('div');
    let answerElement = '';
    if(userType === 'admin'){
         answerElement = ` <label class="qnALabel">Answer:</label> 
                           <textarea class='qnATextArea' id=answer:${data.questionId}></textarea>`;
    }else{
        answerElement = `<label class="qnALabel">Answer:</label> 
                        <textarea readonly class='qnATextArea' id=answer:${data.questionId}></textarea>
                        <button id="submitQuestionButton:${data.questionId}" class="btn btn-success"> Submit Question </button>`;
    }
    messageElement.innerHTML = `<div class="qNaContainer" id= qna:${data.questionId} style="border:0px">
                                    <label class="qnALabel">Question ${totalQuestions} : </label> 
                                    <textarea class='qnATextArea' id=question:${data.questionId}>${data.message || ''}</textarea>
                                    ${answerElement}
                                    ${userType == 'participant' ? `Rating: <input type="number" name="rating" id=rating:${data.questionId} min="1" max="5"></input>` : ''}
                                    ${userType == 'admin' ? `<button id="sendButton:${data.questionId}" class="btn btn-success" >Send</button>` : '' }
                                </div>`;
   messageContainer.append(messageElement);
}

function appendMessage(message){
    let messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.append(messageElement);
}

function updateAnswer(data){
    console.log('inside updateAnswer:', data);
    let answerId = 'answer:' + data.questionId;
    document.getElementById(answerId).innerText = data.message;
}

// let supportMsg = document.getElementById('msg');
//Speech Recognition
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;

const recognition = new window.SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;

recordButton.addEventListener('click', (e) => {
    e.preventDefault();
   // player.pauseVideo();
   console.log('Record button clicked..Recording....');
   player.pauseVideo();
   recognition.start();
   e.stopPropagation();
});

recognition.onresult = (event) => {
    const speechToText = event.results[0][0].transcript;
    if(speechToText.length > 0){
        let questionId = create_UUID();
        let data = {    name: roomName,
                        message: speechToText ,
                        questionId, 
                        QUESTION
                    };

        appendQnA(data);
        // socket.emit('send-chat-message', roomName, speechToText, questionId, name, QUESTION);
        console.log({speechToText});
        // console.log('Confidence: ' + event.results[0][0].confidence);
    }else{
        console.log({speechToText});
    }
}

let button = document.getElementById('speak');

function speak(text) {
    // Create a new instance of SpeechSynthesisUtterance.
    var msg = new SpeechSynthesisUtterance();
    msg.text = text;
    msg.volume = 1;
    msg.rate = 1;
    msg.pitch = 1;
    msg.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == 'Alex' })[0];
    window.speechSynthesis.speak(msg);
    console.log('speech synthesis called:', text );
}

var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        
    // setTimeout(stopVideo, 6000);
    done = true;
    }else if(event.data == YT.PlayerState.PAUSED){
        questionTimestamp = event.target.getCurrentTime();
        console.log({'data': event.target.getCurrentTime()});
        let currentTime = formatTime(event.target.getCurrentTime());
        let duration = player.getDuration() * (event.target.getCurrentTime()/ 100);
        // console.log({'totalDuration': player.getDuration,'actualDuration' :event.target.getCurrentTime(), 'formattedDuration':  duration});
        let message = {
            text: `Paused the video at ${currentTime} minutes`,
            duration: event.target.getCurrentTime(),
        }
        socket.emit('send-chat-message', roomName, message, '', name ,PAUSEINFO);
    }
}



function formatTime(time) {
    // console.log(time);
    var minutes = Math.floor(time / 60);
    var seconds = time - minutes * 60;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    var s = parseFloat(seconds).toFixed(0);
    return minutes + ":" + s;
}

function stopVideo() {
    player.stopVideo();
}

function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

