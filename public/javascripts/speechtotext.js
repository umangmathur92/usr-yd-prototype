let recordButton = document.getElementById('record-button');

window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
if ('SpeechRecognition' in window) {
    // supportMsg.innerHTML = 'Your browser <strong>supports</strong> speech recognition.'; // speech recognition API supported
    // alert("Speech supported");
} else {
    // supportMsg.classList.add('not-supported');
    alert("Speech not supported");
}

const recognition = new window.SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;

async function askQuestion(){
    console.log('Record button clicked..Recording....');
    player.pauseVideo();
    beep();
    recognition.start();
    // await new Promise(r => setTimeout(r, 4000));
    // recognition.stop();
}

function fetchAnswer(){
    console.log("Function to stop speech recognition");
    // recognition.stop();
}

recordButton.addEventListener('click', (e) => {
    e.preventDefault();
   // player.pauseVideo();
   console.log('Record button clicked..Recording....');
   player.pauseVideo();
   recognition.start();
   e.stopPropagation();
//    await new Promise(r => setTimeout(r, 4000));
//     recognition.stop();
});

recognition.onresult = (event) => {
    const speechToText = event.results[0][0].transcript;
    console.log('Recording stpped!');
    if(speechToText.length > 0){
        // let questionId = create_UUID();
        // let data = {    name: roomName,
        //                 message: speechToText ,
        //                 questionId, 
        //                 QUESTION
        //             };

        // appendQnA(data);
        // socket.emit('send-chat-message', roomName, speechToText, questionId, name, QUESTION);
        // beep();
        let data = {    userId: volunteerId,
                        question: speechToText
                    };
            
        $.post('/userStudy4/addQuestion', data, function (res) {
            console.log('Question Added');
        });
        noOfQuestionsAsked += 1;
        console.log({speechToText});
        count = totalFrames;
        $("#question").val(speechToText);
        // startChatbot();
                for(let i=0;i<totalFrames;i++)
                    submitQuestion(i); 
        $("#question").val('');
        // console.log('Confidence: ' + event.results[0][0].confidence);
    }else{
        console.log({speechToText});
    }
}
// let supportMsg = document.getElementById('supportMsg');
// //SPeech Synthesis
// if ('speechSynthesis' in window) {
// 	supportMsg.innerHTML = 'Your browser <strong>supports</strong> speech synthesis.';
// } else {
//     supportMsg.innerHTML = `Sorry your browser <strong>does not support</strong> speech synthesis.<br>
//                             Try this in <a href="https://www.google.co.uk/intl/en/chrome/browser/canary.html">Chrome Canary</a>.`;
// 	supportMsg.classList.add('not-supported');
// }

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

function beep() {
    let snd = new  Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
}

async function doubleBeep() {
    
    let snd = new  Audio("../audio/earcons/beep-09.wav");

    snd.play();
    // beep();
    // await new Promise(r => setTimeout(r, 100));
    // beep();
}

// var ques = ""

//     // STT starts here
// function startRecording(){
//     // alert("Recording began")

//     navigator.mediaDevices.getUserMedia({audio:true})
// 	.then(stream => {
//         console.log("Texxt is: ");
// 		rec = new MediaRecorder(stream);
// 		rec.ondataavailable = e => {
//             console.log("Texxt is: ");
// 			audioChunks.push(e.data);
// 			if (rec.state == "inactive"){
//         let blob = new Blob(audioChunks,{type:'audio/wav'});
//                 // Call Jianfei's API
                
//                     const url = "http://52.53.151.37:8080/v1/audioclips/speechtotext"
                    
//             const param = {
//                 method: "POST",
//                     body: {
//                         "audiofile": blob,
//                         "callbackurl": ""
//                 }    
//             }
//             let text= ""
//             console.log("Texxt is: ");

//             fetch(url,param)
//             .then(data => {console.log(data);})
//             .then(res => {console.log(res); text = res.data.sentence;})
//             .catch(error=>console.log(error))




//                 // question = STT(input)
//                 $("#question").val(text);

//                 for(let i=0;i<framesCount;i++)
//                     submitQuestion(i); 
//     }}});   
// }