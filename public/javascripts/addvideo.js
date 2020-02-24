const fs = require('fs');
const youtubedl = require('youtube-dl');
let accountId = '5a8c6ddf-900f-48b4-8a3a-0cd5cf48cb4b';
let location1= 'Trial';
let apiKey = 'dbbd2d92a19749759576466ed9cd61fa'; 


$(document).ready(function() {
    // $("#btnSubmit").click(function (e) {
    //     console.log("Submit", e, document.getElementById('myFile').value);
    //     let videoId = document.getElementById('youtubeId').value;
    //     getVideoInsight(videoId);
    //     // submitVideoData();
    // });
    $("#btnClearDb").click(function () {
        clearAllBackendData();
    });

    $("#btnInsight").click(function () {
        let videoId = document.getElementById('youtubeId').value;
        getVideoInsight(videoId);
    });
    $("#btnUpload").click(function (e) {
        e.preventDefault();
        console.log("submit called");
    });
    $("#btnToken").click(function (e) {
        console.log("token called");
        // accountAccessToken();
        downloadVideoFromLink();
    });


});



function downloadVideoFromLink(){
    const video = youtubedl('http://www.youtube.com/watch?v=90AiXO1pAiA',
    // Optional arguments passed to youtube-dl.
    ['--format=18'],
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname })
    
    // Will be called when the download starts.
    video.on('info', function(info) {
    console.log('Download started')
    console.log('filename: ' + info._filename)
    console.log('size: ' + info.size)
    })
    
    video.pipe(fs.createWriteStream('myvideo.mp4'))
}


function accountAccessToken(){
    let url = `https://api.videoindexer.ai/Auth/trial/Accounts?generateAccessTokens=true&allowEdit=true`;
    console.log({url});
    $.ajax({
        headers: { 'Ocp-Apim-Subscription-Key': apiKey },
        url,
        dataType: 'json',
        type: 'GET',
        success: function (response) {
            let accessToken = response[0].accessToken;
            console.log('token->' + accessToken);
            uploadVideo(accessToken);
        },
        error: function (response, textStatus, errorThrown) {
            console.log(errorThrown);
        }
      });
}



function getVideoInsight(videoId){

    let url = `https://api.videoindexer.ai/${location1}/accounts/${accountId}/videos/${videoId}/Index/?language=en-US`;
    console.log({url});
    $.ajax({
        url,
        dataType: 'json',
        type: 'GET',
        success: function (response) {
            let insight = JSON.stringify(response);
            document.getElementById('inputJson').value = insight;
            console.log(insight);
        },
        error: function (response, textStatus, errorThrown) {
            console.log(errorThrown);
        }
      });
     
}



function uploadVideo(accessToken){
    let name = 'youdescribe-5a8c6d';
    let url = `https://api.videoindexer.ai/trial/Accounts/${accountId}/Videos?name=${name}&privacy=Public&indexingPreset=Default&streamingPreset=Default&sendSuccessEmail=False&accessToken=${accessToken}`;
    
    $.ajax({
        type: 'POST',
        // timeout: 1*60*60*1000,
        url,
        dataType: "json",
        async:true,
        crossDomain:true,
        success: function (response) {
            window.alert(JSON.stringify(response));
        },
        error: function (response, textStatus, errorThrown) {
            console.log(errorThrown);
            window.alert(JSON.stringify(response));
        }
      });
}



function submitVideoData() {
    let youtubeId = $('#youtubeId').val();
    let title = $('#title').val();
    let inputJson = $('#inputJson').val();
    let jsonBody = {
        "youtubeId": youtubeId,
        "title": title,
        "inputJson": inputJson
    };
    $.ajax({
        type: 'POST',
        timeout: 1*60*60*1000,
        url : "/addvideo",
        dataType: "json",
        async:true,
        crossDomain:true,
        data: jsonBody,
        success: function (response) {
            window.alert(JSON.stringify(response));
        },
        error: function (response, textStatus, errorThrown) {
            console.log(errorThrown);
            window.alert(JSON.stringify(response));
        }
      });
}

function clearAllBackendData() {
    $.get('/cleardatabase', function(response){
        window.alert(JSON.stringify(response));
    });
}
