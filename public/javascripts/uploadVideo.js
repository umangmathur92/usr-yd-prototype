let accountId = '5a8c6ddf-900f-48b4-8a3a-0cd5cf48cb4b';
let apiKey = 'dbbd2d92a19749759576466ed9cd61fa'; 


$(document).ready(function() {

    $("#videoInsightForm").submit(function (e) {
        e.preventDefault();
        let videoId = document.getElementById('videoId').value;
        getVideoInsight(videoId);

    });

    $("#btnDownload").click(function (e) {
        e.preventDefault();
        console.log('download clicked');
        let url = document.getElementById('url').value;
        // http://www.youtube.com/watch?v=90AiXO1pAiA
        console.log({url});
        videoURL = '/userStudy/uploadVideo?video='+ url;
        
        $.ajax({
            type: 'GET',
            url : videoURL,
            success: function (response) {
                $('#alertDownload').html('<div class="alert alert-success"><a class="close" data-dismiss="alert">×</a><span>'+ '<strong>Success!</strong> File downloaded successfully' +'</span></div>');
                console.log(response);
            },
            error: function (response, textStatus, errorThrown) {
                $('#alertDownload').html('<div class="alert alert-danger"><a class="close" data-dismiss="alert">×</a><span>'+ '<strong>Error!</strong> An error occured while downloading the file' +'</span></div>')
                console.log(JSON.stringify(response));
            }
        });
    });



    $("#audioUploadForm").submit(function (e) {
        console.log("audio upload called");
        e.preventDefault();
        let data = new FormData(e.target);
        $.ajax({
            type: 'POST',
            enctype: 'multipart/form-data',
            url : 'http://52.53.151.37:8080/v1/audioclips/startspeechtotext',
            data,
            processData: false,
            contentType: false,
            cache: false,
            success: function (response) {
                window.alert(JSON.stringify(response));
                console.log(response);
            },
            error: function (response, textStatus, errorThrown) {
                window.alert(JSON.stringify(response));
                console.log(JSON.stringify(response));
            }
        });

    });

    $("#audioInsightForm").submit(function (e) {
        console.log("audio insight called");
        e.preventDefault();
        let orderid = document.getElementById('orderid').value;
        let url = 'http://52.53.151.37:8080/v1/audioclips/getspeechtotextresult?orderid=' + orderid; 

        $.get(url, function(response) {
            console.log(response);
            let audioInsight = document.getElementById('audioInsight');
            audioInsight.value = JSON.stringify(response);
        });

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
                let url = `https://api.videoindexer.ai/trial/Accounts/${accountId}/Videos?name=${videoName}&privacy=Public&indexingPreset=Default&streamingPreset=Default&sendSuccessEmail=False&accessToken=${accessToken}`;
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


    $("#btnMerge").click(function (e) {
        console.log('merge clicked');
        let youtubeId = document.getElementById('youtubeId').value;
        execute(youtubeId);
    
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


function execute(videoId){
    let oceanFile = 'audio_ocean8.json';
    let audioData = document.getElementById('audioInsight').value; 
    let audioInsight = this.parseAudioFile(audioData);
    console.log({audioInsight});

    let url = '/merge/sceneData?videoId=' + videoId;

    $.ajax({
        url,
        dataType: 'json',
        type: 'GET',
        success: function (response) {
            console.log({scene: response});
            let videoInsight = [];
            let data = response;
            for(let i=0; i< data.length; i++){
                data[i].merged =  [];
                videoInsight.push(data[i]);
            }
            // console.log({videoInsight});
            let mergedList = merge(videoInsight, audioInsight);
            console.log({arr: mergedList});
         
            $.ajax({
                url : '/merge/scene',
                type: 'POST',
                data : {mergedList},
                datatype: 'json',
                success: function (response) {
                    window.alert('Success: ', JSON.stringify(response));
                },
                error: function (response, textStatus, errorThrown) {
                    window.alert('Error: ', JSON.stringify(response));
                    console.log(JSON.stringify(response));
                }
            });
        },
        error: function (response, textStatus, errorThrown) {
            console.log(errorThrown);
        }
      });

    
}


function parseAudioFile(data){
    let obj = JSON.parse(data);
    let sentence = obj.result.sentence;
    let arr =[];
    for(let i=0; i< sentence.length; i++){
        // let instance = scenes[i].instances[0];
        let start = sentence[i].startTime;
        let end = sentence[i].endTime;
        let data = {
            start,
            end
        }
        arr.push(data);
    }
    
    return arr;
}

function merge(videoInsight, audioInsight){
    let videoIndex = 0;
    let mergedList = [];
    mergedList.push(videoInsight[videoIndex++]);
    let i = 0;
    while(i < audioInsight.length && videoIndex < videoInsight.length){
        let size = mergedList.length;
        let s1 = mergedList[size-1].start_time;
        let e1 = mergedList[size-1].end_time;

        let s2 = audioInsight[i].start;
        let e2 = audioInsight[i].end;

        if((s2 >= s1 && s2 <= e1) && (e2 >= s1 && e2 <= e1)) {
            i++;
            continue;
        }
        
        if(Math.min(s2, e2) >= e1) {
            mergedList.push(videoInsight[videoIndex++]);
            continue;
        }
        
        //merge condition
        if(s2 >= s1 && e2 > e1) {
            let sceneObj = mergedList[mergedList.length-1];
            let next = videoInsight[videoIndex++]; 
            let min = Math.min(s1,  next.start_time);
            let max = Math.max(e1, next.end_time);
            sceneObj.start_time = min;
            sceneObj.end_time = max;
            // let arr = sceneObj.merged;
            // arr.push(next.scene_id);
            sceneObj.merged.push(next.scene_id);
            mergedList.splice(mergedList.length-1);
            mergedList.push(sceneObj);
        }else if(s2 >= e1) {
            mergedList.push(videoInsight[videoIndex++]);
        }

        i++;
    }

    for(let j = videoIndex; j<videoInsight.length; j++) {
        mergedList.push(videoInsight[j]);
    }

    for(let k=0; k< mergedList.length; k++){
        let scene_id = mergedList[k].scene_id;
        let merged = mergedList[k].merged;
        let start_time = mergedList[k].start_time;
        let end_time = mergedList[k].end_time;
        // console.log(scene_id ,'-' ,start_time, '-', end_time, ',', JSON.stringify(merged));
    }
    
    // console.log({mergedList});
    return mergedList;
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
