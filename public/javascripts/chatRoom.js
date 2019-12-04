const socket = io('http://localhost:5001');

let url = location.search.substring(1);
const roomName = new URLSearchParams(url).get('name');
const name = new URLSearchParams(url).get('user');
const userType = new URLSearchParams(url).get('type');
console.log({url});
console.log({roomName});
console.log({userName: name});
const ANSWER = 'answer';
const QUESTION = 'question';
const INFO = 'info';

let questions = {};

let messageForm = document.getElementById('send-container');
let messageInput = document.getElementById('message-input');
let messageContainer = document.getElementById('message-container');
let recordButton = document.getElementById('record-button');
let heading = document.getElementById('heading');

if(userType === 'admin'){
    recordButton.style.display = "none";
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
    videoId: 'M7lc1UVf-VE',
    events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
    }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();
}

if(name){
    appendMessage('You joined');
    socket.emit('new-user', roomName, name);
}

socket.on('chat-message', data=>{
   console.log(data);
   if(data.type == QUESTION){
        // speak(data.message);
        appendQnA(data);
   }else if(userType === 'admin' && data.type == INFO){
        appendMessage(data.userId + ':'+ data.message);
   }else if(data.type == ANSWER){
       let message =  data.name + 'said ' + data.message;
       speak(message);
       updateAnswer(data);
   }
})

socket.on('user-connected', name=>{
    appendMessage(`${name} joined`);
})     

socket.on('user-disconnected', name=>{
    appendMessage(`${name} disconnected`);
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
    }
    e.stopPropagation();
})

function appendQnA(data){
    let messageElement = document.createElement('div');
    // messageElement.innerText = message;
    // <label class="qnALabel" ${ratingVisibility}>Rating(between 1 and 5):</label> 
    messageElement.innerHTML = `<div class="qNaContainer" id= qna:${data.questionId} style="border:0px">
                                    <label class="qnALabel">Question:</label> 
                                    <textarea class='qnATextArea' id=question:${data.questionId}>${data.message || ''}</textarea>
                                    <label class="qnALabel">Answer:</label> 
                                    <textarea class='qnATextArea' id=answer:${data.questionId}></textarea>
                                    ${userType == 'admin' ? `<button id="sendButton:${data.questionId}" class="btn btn-success" >Send</button>` : '' }
                                    ${userType == 'participant' ? `Rating: <input type="number" name="rating" 
                                        id=rating:${data.questionId} min="1" max="5"></input>` : ''}
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
// if ('SpeechRecognition' in window) {
//     supportMsg.innerHTML = 'Your browser <strong>supports</strong> speech recognition.'; // speech recognition API supported
// } else {
//     supportMsg.classList.add('not-supported');
// }

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
        socket.emit('send-chat-message', roomName, speechToText, questionId, name, QUESTION);
        console.log({speechToText});
        // console.log('Confidence: ' + event.results[0][0].confidence);
    }else{
        console.log({speechToText});
    }
}

//SPeech Synthesis
if ('speechSynthesis' in window) {
	supportMsg.innerHTML = 'Your browser <strong>supports</strong> speech synthesis.';
} else {
    supportMsg.innerHTML = `Sorry your browser <strong>does not support</strong> speech synthesis.<br>
                            Try this in <a href="https://www.google.co.uk/intl/en/chrome/browser/canary.html">Chrome Canary</a>.`;
	supportMsg.classList.add('not-supported');
}

let button = document.getElementById('speak');
// Get the text input element.
// let speechMsgInput = document.getElementById('speech-msg');
// Get the voice select element.
// let voiceSelect = document.getElementById('voice');
// // Get the attribute controls.
// let volumeInput = document.getElementById('volume');
// let rateInput = document.getElementById('rate');
// let pitchInput = document.getElementById('pitch');

// Chrome loads voices asynchronously.
window.speechSynthesis.onvoiceschanged = function(e) {
    loadVoices();
};

function speak(text) {
    // Create a new instance of SpeechSynthesisUtterance.
    var msg = new SpeechSynthesisUtterance();
    msg.text = text;
    msg.volume = parseFloat(1);
    msg.rate = parseFloat(1);
    msg.pitch = parseFloat(1);
    msg.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == 'Alex' })[0];
    // Queue this utterance.
    window.speechSynthesis.speak(msg);
    console.log('speech synthesis called:', text );
  }



var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
    // setTimeout(stopVideo, 6000);
    done = true;
    }else if(event.data == YT.PlayerState.PAUSED){
        console.log({'data': event.target.getCurrentTime()});
        let currentTime = event.target.getCurrentTime();
        let message = `Paused the video at ${currentTime} seconds`;
        socket.emit('send-chat-message', roomName, message, '', name ,INFO);
    }
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

