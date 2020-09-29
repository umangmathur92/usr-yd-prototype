// Aditya

var image = [];
var image_url = "";
var prev_history = {};
var generated_caption = "";
var job_id = [];
var image_question_mapping = [];
// var question_id = 1;
var question_user = "";
var currentUploadedImageDiv = ""; // set the current uploaded image div
var justClearedHistory = true;
var scrollHeightOnClearHistory = 60;
var audio_clip = document.getElementById("myAudio");
var KeyFramesArr;
let count = 0;
let all_pred_captions = "";
let all_answers = "";
let response_set = new Set();
let response_map = {};
let audio_path = "1";
var isChatbotOn = false;
var isChatbotInProcess = false;
var isQuestionInProcess = false;
var chatbotTimeStamp = -1;
let question_id = "";
let keyframeMap = {};
let filterBadCaptions = ["<unk>","can't tell"]; 
let keyframeCount = 1;
let time1 = 0;
let time2 = 0;
let time3 = 0;

$("#question").keypress(function(e) {
    var key = e.which;
    if (key == 13) // the enter key code
    {
        count = totalFrames;
        for(let i=0;i<totalFrames;i++)
              submitQuestion(i);
      $("#question").val('');
    }
});



// Below function is to show the preview of file being uploaded

var ws_id = []
var totalFrames = 0;
var map = {};

async function fetchKeyFrames(numOfKeyFrames=1) {

    pauseVideo();
    currScene = getSceneFromTime(videotime, allSceneArr);

    let scene_id = currScene.sc_id;
    let startTime = currScene.start_time;
    console.log("video time for keyframes: ", videotime, " and scene_id is: ", scene_id);
    chatbotTimeStamp = videotime;
    keyframeCount = numOfKeyFrames;
    var path;
    try {
            let targetUrl = '/getKeyFrames' + '?videoId=' + youtubeId + '&videoTime=' + videotime + '&sceneStartTime=' + startTime + '&numOfKeyframes=' + numOfKeyFrames;
            var TotalFrames = 0;
            $.get(targetUrl, function (response) {
                KeyFramesArr = response;
                console.log("visdial fetch key frames api response is: ",KeyFramesArr[0]+"  and the type is: "+typeof(KeyFramesArr[0]));
                console.log(KeyFramesArr);
                totalFrames = KeyFramesArr.length;
                count = totalFrames;
                path = KeyFramesArr[0].keyframe_url;
                for(let i=0; i< KeyFramesArr.length; i++)
                    console.log("The url is: "+ KeyFramesArr[i].keyframe_url);           
                // debugger;    
            })
            .done(function(){
            map = {};
            ws_id = [];
            keyframeMap = {};
            for(let i=0;i<totalFrames;i++)
            {
                ws_id[i] = uuidv4();
                sendWSid(ws_id[i]);
                path = KeyFramesArr[i].keyframe_url;
                sendImage(path,ws_id[i]);
                keyframeMap[ws_id[i]] = path;
                map[ws_id[i]] = i;
                response_map[i] = "";
            }
            // let docVal = document.getElementById('cd1').innerHTML;
            // let docVal = "Time stamp for chatbot initialization: ";
            // let currentTime = new Date();
            // docVal += currentTime.toLocaleTimeString();
            // document.getElementById('cd1').innerHTML = docVal;
            // time1 = currentTime.getTime();

            });
            return true;
    } 
      catch (error) {
      console.log(error);
      return false;
  }
}

function sendWSid(ws_id) {  
    ws.send(ws_id.toString());  
  }

function sendWS(){ 
  sendImage(path,wsID); 
  console.log("The path received is: ",path); 
}

function startChatbot(){

  if(videotime - 0.2 < chatbotTimeStamp && chatbotTimeStamp < videotime + 0.2 && isChatbotOn){
    isQuestionInProcess = true;
    askQuestion();
    // for(let i=0;i<totalFrames;i++)
    //     submitQuestion(i); 
    // $("#question").val('');
  }
  else if(!isChatbotInProcess){
    isChatbotInProcess = true;
    isChatbotOn = false;
    doubleBeep();
    fetchKeyFrames();
  }
}

function sendImage(path,ws_id,frameNo){

  fetch(path).then(function(response) {
      
      return response.blob();
      
    }).then(function(myBlob) {
      console.log("Checking the type of blob: "+typeof(myBlob));
      objectURL = URL.createObjectURL(myBlob);
      console.log("The url is: "+objectURL);
    

      var reader = new FileReader();
      reader.readAsDataURL(myBlob);
      reader.onload = function () {
      // Since it contains the Data URI, we should remove the prefix and keep only Base64 string
      var b64 = reader.result.split(',')[1];
      myBlob.lastModifiedDate = new Date();
      myBlob.name = 'imge';
      
      class newFile {
          constructor(filesName){
              this.files = filesName;
              }
          }
      
      imageFile = new newFile([myBlob]);
      readURL(imageFile,ws_id,frameNo);                 
      }});
  }

let blob1;


var ws;
var ws_id;

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function WebSocketTest() {
  console.log('Generate uuid: '+uuidv4());
      if ("WebSocket" in window) {
            ws = new WebSocket("wss://dev-api.youdescribe.org/chat/");
            // ws = new WebSocket("ws://13.59.47.124:8001/chat/"); //to test from local
            ws.onopen = function() {
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
            prev_history[map[socket_id]] = data["history"];
            let keyframeNo = map[socket_id];

            if("pred_caption" in data){
                var pred_caption = data.pred_caption;
                console.log("The pred caption is: "+ pred_caption);
                // prev_history[map[socket_id]].push(pred_caption);
                // prev_history[map[socket_id]] = pred_caption;
                count--;
                var url_api = "http://api.voicerss.org/?key=ff91e773474146079653fbb513f71d76&hl=en-us&src=";
                let url_tts = "http://18.221.192.73:5001/texttospeech";
                // debugger;
                if(all_pred_captions.length == 0)
                    {all_pred_captions = pred_caption;
                      response_map[keyframeNo] = pred_caption;
                    }

                else if(pred_caption != all_pred_captions && !response_set.has(pred_caption))
                { 
                  all_pred_captions += ( ". " + pred_caption);
                  response_set.add(pred_caption);
                  response_map[keyframeNo] = pred_caption;
                }
                console.log(all_pred_captions);
                  /** Saving the caption in db */
                  let dbData2 = {  userId: volunteerId,
                                caption: pred_caption,
                                youtube_timestamp: chatbotTimeStamp.toFixed(3),
                                key_frame : keyframeMap[socket_id]
                  };
        
                $.post('/userStudy4/addCaption', dbData2, function (res) {
                    console.log('Caption Added');
                });

                var url_final = url_api.concat(all_pred_captions);
                
                if(!count){
                    // let docVal = document.getElementById('cd2').innerHTML;
                    // let docVal = "Time stamp for chatbot response: ";
                    // let currentTime = new Date();
                    // docVal += currentTime.toLocaleTimeString();
                    // document.getElementById('cd2').innerHTML = docVal;

                    //   time2 = currentTime.getTime();
                    //   // docVal = document.getElementById('cd3').innerHTML;
                    //   docVal = "Time taken for chatbot response: ";
                    //    docVal += (time2 - time1)/1000;
                    //    document.getElementById('cd3').innerHTML = docVal + " s";
                      /** API call to transformers summarization tool */
                      // $.get('http://13.59.47.124:5000/' + all_pred_captions, function (res) {
                      //   console.log('Transformers output: ',res);
                      // all_pred_captions = res["result"];
                      console.log(response_map);
                      let final_pred_captions = "";
                      for(let i=0; i<Object.keys(response_map).length; i++){
                        final_pred_captions += response_map[i];
                        final_pred_captions += ". ";
                      }
                      console.log("Final Pred Captions: ",final_pred_captions);
                      /** Text to speech conversion */
                    let textData = {  "inputText": final_pred_captions,
                      "filePath": "output_" + userId + "_" + audio_path + ".mp3"
                    };

                    let isBadCaption = filterBadCaptions.some(el => final_pred_captions.includes(el));
                    // let isBadCaption = new RegExp(filterBadCaptions.join('|')).test(final_pred_captions);
                    // let isBadCaption = final_pred_captions.includes("<unk>") || final_pred_captions.includes("can't tell");
                    
                    if(isBadCaption){
                        if(keyframeCount < 3){
                          fetchKeyFrames(keyframeCount+1);
                        }
                    }
                    else if(isChatbotInProcess){

                    
                    $.post('/texttospeech', textData, function (res) {
                      let date = new Date();
                      console.log('TTS completed: '+ date.getTime());
                      audio_clip.src = "/audio/output_" + userId + "_" + audio_path + ".mp3";
                      audio_clip.onended = function() {
                        audio_clip.src = null;
                        if (audio_path == "1")
                          audio_path = "0";
                        else
                          audio_path = "1";
                        console.log("On demand Audio ended");
                        startChatbot();
                        // alert("The audio has ended");
                    }
                      // audio_clip.src = null;
                      isChatbotOn = true;
                      isChatbotInProcess = false;
                      // let currentTime = new Date;
                      // time3 = currentTime.getTime();
                      // let docVal = document.getElementById('cd4').innerHTML;
                      // let docVal = "Time taken for Text-to-speech: ";
                      //  docVal += (time3 - time2)/1000;
                      //  document.getElementById('cd4').innerHTML = docVal + " s";

                    });

                  }
                    
                    console.log("Final: ",all_pred_captions);
                    all_pred_captions = "";
                    response_set.clear();
                    // Object.keys(response_map).forEach(function(key) { delete response_map[key]; }); //Comment: Deep Clean
                    response_map = {};
                  // }); Comment: Ending braces for transformers API
                    // audio_clip.src = "../audio/output_" + userId + ".mp3";
                    // fetch(url_final)
                    // .then(function(response)
                    // {   
                    //   audio_clip.src = response['url'];
                    //   console.log("Final: ",response);
                    //   all_pred_captions = "";
                    //   response_set.clear();
                    // })
                }
                  
          }

          else if("answer" in data)
          {
              var answer = data.answer;
              console.log("The answer is: "+ answer);
              console.log("The var is: "+ all_answers);
              count --;

            var url_api = "http://api.voicerss.org/?key=ff91e773474146079653fbb513f71d76&hl=en-us&src=";
            let url_tts = "http://18.221.192.73:5001/texttospeech";
            if(all_answers.length == 0)
              all_answers = answer;

            else if(answer != all_answers && !response_set.has(pred_caption))
            {
              all_answers += ( ". " + answer);
              response_set.add(answer);
            }
              /** Saving the answer in db */
            let dbData = {  userId: volunteerId,
                          answer: all_answers,
                          question_id: question_id,
                          youtube_timestamp: chatbotTimeStamp.toFixed(3),
                          key_frame : keyframeMap[socket_id]
                      };

            $.post('/userStudy4/addAnswer', dbData, function (res) {
              console.log('Answer Added');
            });
            var url_final = url_api.concat(all_answers);
            if(!count)
            {
                    // let docVal = "Time stamp for answer/response: ";
                    // let currentTime = new Date();
                    // docVal += currentTime.toLocaleTimeString();
                    // document.getElementById('qd2').innerHTML = docVal;

                      // time2 = currentTime.getTime();
                      // docVal = document.getElementById('cd3').innerHTML;
                      // docVal = "Time taken for answer/response: ";
                      // docVal += (time2 - time1)/1000;
                      // document.getElementById('qd3').innerHTML = docVal + " s";


                /** API call to transformers summarization tool */


                /** Text to speech conversion */
              let textData2 = {  "inputText": all_answers,
                                "filePath": "output_" + userId + "_" + audio_path + ".mp3"
                         };
              if (isQuestionInProcess)
              {              
                $.post('/texttospeech', textData2, function (res) {
                  let date = new Date();
                  console.log('TTS completed: '+ date.getTime());
                  let randomNum = Math.random();
                  audio_clip.src = "../audio/output_" + userId + "_" + audio_path + ".mp3" + '?random='+randomNum;
                        audio_clip.onended = function() {
                          audio_clip.src = null;
                          if (audio_path == "1")
                            audio_path = "0";
                          else
                            audio_path = "1";
                          console.log("On demand Audio ended")
                          // alert("The audio has ended");
                      }
                      isQuestionInProcess = false;
                      // let currentTime = new Date;
                      // time3 = currentTime.getTime();
                      // let docVal = document.getElementById('cd4').innerHTML;
                      // let docVal = "Time taken for Text-to-speech: ";
                      //  docVal += (time3 - time2)/1000;
                      //  document.getElementById('qd4').innerHTML = docVal + " s";
                });
              }
              console.log("Final: "+ all_answers);
              all_answers = "";
              response_set.clear();
              // audio_clip.src = "../audio/output_" + userId + ".mp3";

              // fetch(url_final)
              // .then(function(response){
              //     audio_clip.src = response['url'];
              //     all_answers = "";
              //     response_set.clear();
                  
              //   })
            }
           
          }
      };  
   }


function readURL(input, ws_id, frameNo) {
  console.log('readURL entered!!');

  var i = frameNo;

    if (input.files && input.files[0]) {
        var reader = new FileReader();
        var formData = new FormData();
        formData.append('file', input.files[0]);
        var URL1 = "https://dev-api.youdescribe.org/upload/";
        // var URL1 = "https://cors-anywhere.herokuapp.com/http://13.59.47.124:8001/upload/"; //(to test from local)
        formData.append('socketid', ws_id);
        console.log('DSocket id in pOST is: '+ws_id);
        $.ajax({
                type: 'POST',
                url: URL1,
                data: formData,
                processData: false,
                contentType: false,
                crossDomain:true,
            })
            .done(function(response) {
                image[i] = response['file_path'];
                image_url[i] = response['img_url'];
                job_id[i] = response['job_id'];
                console.log("readurl res is:",response);
            });
    }
}

// Press enter key when click the send button
$(".sendQuestionButton").click(function() {
$("#question").focus();
var e = jQuery.Event("keydown");
e.keyCode = 50;
$("#question").trigger(e);
submitQuestion();
});

function submitQuestion(frameNo) {
  console.log("Submitting question");
  let i = frameNo;
  var question = $("#question").val();
  if (question == "")
    question = question_user;

if (question.length >= 3) {

      var formData = new FormData();
      formData.append('img_path', image[i]);
      formData.append('history', prev_history[i]);
      formData.append('csrfmiddlewaretoken', '{{ csrf_token }}');
      formData.append('socketid', ws_id[i]);
      formData.append('question', question);
      formData.append('job_id', job_id[i]);
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
              justClearedHistory = false; // Now user can click clear history
          });
  }
}

async function checkQuestion(){
  
audio_clip.src = "/audio/tutorial_question.mp3";
  audio_clip.onended = function() {
          // currAudio = null;
      }
}