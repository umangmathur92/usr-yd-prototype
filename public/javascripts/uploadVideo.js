let accountId = '5a8c6ddf-900f-48b4-8a3a-0cd5cf48cb4b';
let apiKey = 'dbbd2d92a19749759576466ed9cd61fa'; 


$(document).ready(function() {

    // var formUpload = document.getElementById('uploadVideoForm')
    // formUpload.addEventListener('submit', testx);

    $("#videoInsightForm").submit(function (e) {
        e.preventDefault();
        let videoId = document.getElementById('videoId').value;
        getVideoInsight(videoId);

    });

    
    $("#uploadVideoForm").submit(function (e) {
        console.log("submit called");
        e.preventDefault();
        let data = new FormData(e.target);
        for(let entry of data.entries()){
            console.log(entry);  
        }

        
        let videoName = document.getElementById('videoName').value;

        console.log({data});  
        let tokenUrl = `https://api.videoindexer.ai/Auth/trial/Accounts?generateAccessTokens=true&allowEdit=true`;
        console.log({tokenUrl});
        $.ajax({
            headers: { 'Ocp-Apim-Subscription-Key': apiKey },
            url: tokenUrl,
            dataType: 'json',
            type: 'GET',
            success: function (response) {
                let accessToken = response[0].accessToken;
                console.log('token->' + accessToken);
                let url = `https://api.videoindexer.ai/trial/Accounts/${accountId}/Videos?name=${videoName}&privacy=Public&callbackUrl=http://18.221.192.73:5001/userStudy&indexingPreset=Default&streamingPreset=Default&sendSuccessEmail=False&accessToken=${accessToken}`;
                $.ajax({
                    type: 'POST',
                    enctype: 'multipart/form-data',
                    url,
                    data,
                    processData: false,
                    contentType: false,
                    cache: false,
                    success: function (response) {
                        console.log(response);
                        let id = response.id;
                        document.getElementById('videoId').value = id;
                    },
                    error: function (response, textStatus, errorThrown) {
                        console.log(JSON.stringify(response));
                    }
                });

            },
            error: function (response, textStatus, errorThrown) {
                console.log(errorThrown);
            }
          });

    });
});



function getVideoInsight(videoId){
    let location1= 'trial';
    let url = `https://api.videoindexer.ai/${location1}/accounts/${accountId}/videos/${videoId}/Index/?language=en-US`;
    console.log({url});
    $.ajax({
        url,
        dataType: 'json',
        type: 'GET',
        success: function (response) {
            let insight = JSON.stringify(response);
            document.getElementById('insight').value = insight;
            console.log(insight);
        },
        error: function (response, textStatus, errorThrown) {
            console.log(errorThrown);
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