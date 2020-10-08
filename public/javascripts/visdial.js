// Aditya

var image = '';
var image_url = "";
var prev_history = {};
var job_id = 520;
var audio_clip = document.getElementById("myAudio");
var KeyFramesArr;
let audio_path = "1";
var isChatbotOn = false;
var isChatbotInProcess = false;
var isQuestionInProcess = true;
var chatbotTimeStamp = -1;
let question_id = "";
let keyframeMap = {};
let pythiaCaption = '';
let imageKey = '';
let ws_id = uuidv4();

async function fetchImageCaption() {
    pauseVideo();
    console.log("video time for keyframes: ", videotime);
    // chatbotTimeStamp = videotime;
  let targetUrl = '/getKeyFrames' + '?videoId=' + youtubeId + '&videoTime=' + videotime;
  $.get(targetUrl, function (response) {
    console.log(response);
    let keyframeUrl = response[0].keyframe_url;
    let caption = response[0].pythia_caption;
    pythiaCaption = caption;
    let textData = {  "inputText": caption,
                      "filePath": "output_" + userId + "_" + audio_path + ".mp3"
                    };

                    $.post('/texttospeech', textData, function (res) {
                      console.log("TTS complete");
                      let randomNum = Math.random();
                      audio_clip.src = "../audio/output_" + userId + "_" + audio_path + ".mp3" + '?random='+randomNum;
                      audio_clip.onended = function() {
                        audio_clip.src = null;
                        audio_path == "0" ? "1" : "0";
                    }
                      isChatbotOn = true;
                      isChatbotInProcess = false;
                    });

                    let dbData2 = {  userId: volunteerId,
                      caption: caption,
                      youtube_timestamp: chatbotTimeStamp.toFixed(3),
                      key_frame : keyframeUrl
                      };
        
                    $.post('/userStudy4/addCaption', dbData2, function (res) {
                        console.log('Caption Added');
                    });

                });

}

async function fetchKeyFrames(speech = '') {

    pauseVideo();
    if (chatbotTimeStamp == videotime){
        submitQuestion(speech);
        return;
    }

    chatbotTimeStamp = videotime;
    var path;
    try {
            let targetUrl = '/getKeyFrames' + '?videoId=' + youtubeId + '&videoTime=' + videotime;
            $.get(targetUrl, function (response) {
              // debugger;
                KeyFramesArr = response;
                console.log("visdial fetch key frames api response is: ",KeyFramesArr[0]+"  and the type is: "+typeof(KeyFramesArr[0]));
                console.log(KeyFramesArr);
              pythiaCaption = KeyFramesArr[0].pythia_caption;
              imageKey = youtubeId + '_frame_' + KeyFramesArr[0].keyframe_num;
              console.log({imageKey});
              path = KeyFramesArr[0].keyframe_url;
              prev_history = {'caption' : [pythiaCaption]};
              prev_history = JSON.stringify(prev_history);
              submitQuestion(speech);
              keyframeMap[ws_id] = path;
          });
            return true;
    } 
      catch (error) {
      console.log(error);
      return false;
  }
}

function startChatbot(){

  if(videotime - 0.2 < chatbotTimeStamp && chatbotTimeStamp < videotime + 0.2 && isChatbotOn){
    isQuestionInProcess = true;
    askQuestion();
    }
  else if(!isChatbotInProcess){
    isChatbotInProcess = true;
    isChatbotOn = false;
    doubleBeep();
    fetchKeyFrames();
  }
}

function WebSocketTest() {
      if ("WebSocket" in window) {
            ws = new WebSocket("wss://dev-api.youdescribe.org/chat/");
            // ws = new WebSocket("ws://13.59.47.124:8001/chat/"); //to test from local
            ws.onopen = function() {
              ws.send(ws_id);
              console.log("Websocket opened");
         };
         console.log("Websocket open next");
   }

   ws.onmessage = function(evt){
            console.log("Message is received...");
            console.log(JSON.parse(evt.data));
            var data = JSON.parse(evt.data);
            data = JSON.parse(data['result']);
            var socket_id = data.socketid;
            prev_history = data["history"];


          if("answer" in data)
          {
              var answer = data.answer;
              console.log("The answer is: "+ answer);

            var url_api = "http://api.voicerss.org/?key=ff91e773474146079653fbb513f71d76&hl=en-us&src=";

            
              /** Saving the answer in db */
            let dbData = {  userId: volunteerId,
                          answer: answer,
                          question_id: question_id,
                          youtube_timestamp: chatbotTimeStamp.toFixed(3),
                          key_frame : keyframeMap[socket_id]
                      };

            $.post('/userStudy4/addAnswer', dbData, function (res) {
              console.log('Answer Added');
            });
              // debugger;
                /** Text to speech conversion */
              let textData2 = {  "inputText": answer,
                                "filePath": "output_" + userId + "_" + audio_path + ".mp3"
                         };
              if (true || isQuestionInProcess)
              {              
                $.post('/texttospeech', textData2, function (res) {
                  let randomNum = Math.random();
                  audio_clip.src = "../audio/output_" + userId + "_" + audio_path + ".mp3" + '?random='+randomNum;
                        audio_clip.onended = function() {
                          audio_clip.src = null;
                          audio_path == "0" ? "1" : "0";
                          console.log("On demand Audio ended")
                          // alert("The audio has ended");
                      }
                      // isQuestionInProcess = false;
                });
              }
           
          }
      };  
   }

function submitQuestion(question) {
  console.log("Submitting question");

if (question.length >= 3) {

      var formData = new FormData();
      formData.append('img_path', image);
      formData.append('history', prev_history);
      formData.append('csrfmiddlewaretoken', '{{ csrf_token }}');
      formData.append('socketid', ws_id);
      formData.append('question', question);
      formData.append('job_id', job_id);
      formData.append('image_key', imageKey);
      var URL = "https://dev-api.youdescribe.org/";
      // var URL = "https://cors-anywhere.herokuapp.com/http://13.59.47.124:8001/"; // to test from local

      $.ajax({
              type: 'POST',
              url: URL,
              data: formData,
              processData: false,
              contentType: false,
          })
          .done(function(response) {
              console.log(response);
          });
  }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function checkQuestion(){
  
audio_clip.src = "/audio/tutorial_question.mp3";
  audio_clip.onended = function() {
          // currAudio = null;
      }
}