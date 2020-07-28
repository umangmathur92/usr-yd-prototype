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
    recognition.start();
    // await new Promise(r => setTimeout(r, 4000));
    // recognition.stop();
}

function fetchAnswer(){
    recognition.stop();
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