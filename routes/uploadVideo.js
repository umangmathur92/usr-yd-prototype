/**
 * author: vaishali
 * description: consists of all routes related to integration of Video Indexer
 * Basic route: localhost:5001/userStudy
 */

var express = require('express');
var router = express.Router();
const userStudy = require('../model/userStudy');
const db = require('../db/database');
const fs = require('fs');
var path = require('path');
const youtubedl = require('youtube-dl');
const axios = require('axios');
const FormData = require('form-data');
const videoController = require('../backend/video');
let accountId = '5a8c6ddf-900f-48b4-8a3a-0cd5cf48cb4b';
let apiKey = 'dbbd2d92a19749759576466ed9cd61fa';
let location = 'trial';
var ffmpeg = require('ffmpeg');
let scene = require('../model/scene');
let videoModel = require('../model/video.js');
const request = require('request');
let videoDialogue = require('../model/videoDialogue');



router.get('/audioInsight', function(req, res, next) {
    console.log('req.query', req.query);
    let audioId = req.query.order; 
    let status = req.query.status;
    if(status === '-1'){
      res.status(400).send('Error: ListenByCode failed to process the audio file');
    }else{
      let url = 'http://18.221.192.73:8081/v1/audioclips/getspeechtotextresult?orderid=' + audioId;
      axios.get(url)
      .then((response) => {
        console.log(response.data);
        //AUDIO
        let sentence = response.data.result.sentence;
        let audioInsight =[];
        for(let i=0; i< sentence.length; i++){
            let start = sentence[i].startTime;
            let end = sentence[i].endTime;
            let data = {
                start,
                end
            }
            audioInsight.push(data);
        }
        console.log({audioInsight});
        
        //VIDEO
        let videoInsight = [];
        videoModel.getSceneByAudioId(audioId)
          .then((data) => {
            console.log(data);
            for (let i = 0; i < data.length; i++) {
              data[i].merged = [];
              videoInsight.push(data[i]);
            }
            console.log({ videoInsight });
        
            //MERGE
            let mergedList = merge(videoInsight, audioInsight);
            let result = scene.addMergeSceneTable(mergedList)
            result
              .then(data => {
                console.log({ success: data });
                res.status(200).send('Data merged successfully');
              })
              .catch((err) => {
                console.log(err);
                res.status(400).send(err);
              });

          }).catch((error) => {
            console.log(error);
            res.status(400).send(error);
          })

      })
      .catch((error) => {
        console.log(error);
        res.status(400).send(error);
      })
    }

});


router.get('/videoState', function (req, res) {
  console.log('INSIDe GET video State');
  let videoId = req.query.id;
  let state = req.query.state;
  console.log(req.query);

  if (state === 'Processed') {
    videoModel.getVideoAudioByVideoId(videoId)
      .then((data)=>{
        console.log({data});
        let youtubeId = data[0].youtube_id;
        audioId = data[0].audio_id;
        console.log({youtubeId, audioId });
        
        let url = `https://api.videoindexer.ai/${location}/accounts/${accountId}/videos/${videoId}/Index/?language=en-US`;
        console.log({ url });
        
        axios.get(url)
          .then((response) => {
            // console.log(response.data);
            let jsonBody = {
              youtubeId,
              'inputJson': response.data
            };
            videoController.addVideoDataToDb(jsonBody)
              .then(result => {
                res.send({ success: result });
              });
          })
          .catch((error) => {
            res.status(400).send(error);
            console.log(error);
          })
      }).catch((err)=>{
        res.send(err);
      })
  }else {
      res.status(400).send('Video is not processed by Video Indexer , id:', videoId);
      console.log('Video is not processed by Video Indexer , id:', videoId);
  }
});


router.get('/uploadVideo', function (req, res) {
  console.log({ param: req.query });
  let url = req.query.video;
  let videoId = url.substr(url.indexOf('v=') + 2);
  let  videoTitle = req.query.title;
  console.log({ videoTitle});


  if (url) {
    let jsonPath = path.join(__dirname, '../videos/');
    console.log({ jsonPath });
    console.log({ __dirname });
    const video = youtubedl(url, ['--format=18'], jsonPath);

    // Will be called when the download starts.
    video.on('info', function (info) {
      console.log('Download started')
      console.log('filename: ' + info._filename)
      console.log('size: ' + info.size)
    })

    let date_ob = new Date();
    let year = date_ob.getFullYear();
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let date = ("0" + date_ob.getDate()).slice(-2);
    let currentDateTime = year + "-" + month + "-" + date + "_" + Math.floor(Date.now() / 1000);

    let rootName = videoId + '_' + currentDateTime;
    let fileName = videoId + '_' + currentDateTime + '.mp4';
    let filePath = path.join(__dirname, '../', fileName);
    console.log({ fileName });
    console.log({ filePath });

    video.pipe(fs.createWriteStream(fileName));
    video.on('complete', function complete(info) {
      'use strict'
      console.log('filename: ' + info._filename + ' already downloaded.')
    })
    let name = '';
    video.on('end', function () {
      console.log('Finished downloading!');

      let tokenUrl = `https://api.videoindexer.ai/Auth/trial/Accounts?generateAccessTokens=true&allowEdit=true`;
      axios({
        method: 'get',
        url: tokenUrl,
        headers: { 'Ocp-Apim-Subscription-Key': apiKey },
      })
        .then(response => {
          let accessToken = response.data[0].accessToken;
          console.log('token->' + accessToken);
          uploadVideo(filePath, accessToken, videoId, videoTitle)
            .then((videoData) => {
              console.log({ videoData });
              let data = {
                youtubeId: videoId,
                video_id: videoData.id,
                title: videoTitle
              }
              console.log({ videoAudioData: data });

              videoModel.insertIntoVideoAudioTable(data)
                .then(() => {
                  convertVideoToAudio(videoId, filePath)
                    .then((audioData) => {
                      console.log({ audioData });
                      let audioId = audioData.audioId;
                      //----------------
                      let timeId = setInterval( ()=> {
                            let url = `https://api.videoindexer.ai/${location}/accounts/${accountId}/videos/${videoData.id}/Index/?language=en-US`;
                            console.log({ url });
                            
                            axios.get(url)
                              .then((response) => {
                                let videoState = response.data.state;
                                console.log('Video State: ', videoState);
                                if(videoState === 'Processed'){
                                  let jsonBody = {
                                    youtubeId: videoId,
                                    'inputJson': response.data
                                  };
                                  clearInterval(timeId);
                                  videoController.addVideoDataToDb(jsonBody)
                                    .then(result => {
                                      console.log({ success: result });
                                          fetchAudioInsight(audioId, videoId)
                                            .then((result)=>{
                                              console.log(result);
                                            })
                                        })
                                    .catch((e)=>{
                                      console.log(e);
                                    })
                                }
                              })
                              .catch((error) => {
                                    clearInterval(timeId);
                                    console.log(error);
                                  })
                              }, 10000);
                      //------------------------------------

                      res.status(200).send('SUCCESS: Video uploaded to Video Indexer');
                      console.log('SUCCESS: Video uploaded to Video Indexer');
                    })
                })
            })
        })
        .catch(error => {
          res.status(400).send('FAILED: Video not uploaded to Video Indexer ');
          console.log(error);
        });
    })

    video.on('error', function error(err) {
      console.log('error 2:', err);
      res.send(err);
    })

  } else {
    console.log('video url not provided');
    res.send('video url not provided');
  }

});



async function fetchAudioInsight(audioId, videoId){
    return new Promise((resolve, reject) => {
        let url = 'http://18.221.192.73:8081/v1/audioclips/getspeechtotextresult?orderid=' + audioId;
        axios.get(url)
        .then((response) => {
            console.log(response.data);
            let status = response.data.status
            if(status !== 'success'){
              reject(`Audio not processed for audioId=${audioId}, videoId= ${videoId}`);
            }
            //VIDEO
            let videoInsight = [];
            scene.getSceneData(videoId)
              .then((data) => {
                console.log(data);
                for (let i = 0; i < data.length; i++) {
                  data[i].merged = [];
                  videoInsight.push(data[i]);
                }
                console.log({ videoInsight });

            //AUDIO
            let sentence = response.data.result.sentence;
            let audioInsight =[];
            for(let i=0; i< sentence.length; i++){
                let start = sentence[i].startTime;
                let end = sentence[i].endTime;
                let desc  = sentence[i].sentence;
                desc = desc.replace(/'/g, '');
                if(!desc.toLowerCase().includes('noise')){
                  let data = {
                    start,
                    end,
                    sentence: desc
                  }
                  audioInsight.push(data);
                }
            }
            console.log({audioInsight});
          
            //MERGE
            let mergedList = merge(videoInsight, audioInsight);
            let result = scene.addMergeSceneTable(mergedList)
            result
              .then(data => {
                console.log({ success: data });
                videoDialogue.insertDataIntoVideoDialogue(audioInsight, videoId, audioId)
                  .then(res=>{
                    console.log(res);
                    resolve('Success: Scene Merged');
                  })
              })
            })
        .catch((error) => {
              console.log(error);
              reject(error);
            })
        });
    })

}

async function convertVideoToAudio(youtubeId, videoFilePath) {
  let index1 = videoFilePath.lastIndexOf('.mp4');
  let index2 = videoFilePath.lastIndexOf('/');
  let videoId = videoFilePath.substring(index1 + 1, index2);
  let rootPath = videoFilePath.substring(0, index2);

  let audioFile = rootPath + videoId + 'mp3';
  console.log({ rootPath });
  console.log({ audioFile });
  console.log({ videoFilePath });


  return  new Promise((resolve, reject) => {
    let process = new ffmpeg(videoFilePath);
    process.then((video) => {
      console.log('VIDEO:' ,video.metadata);
      video.fnExtractSoundToMP3(audioFile,
        function (error, file) {
          if (error) {
            console.log('Error converting video to audio file');
            reject(error);
          } else {
            console.log('video extraction succeeded:', file);
            ///----
            // let audioFile = '/Users/vaishalibisht/Desktop/SFSU/YouDescribe/usr-yd-prototype/GXWpEjEFWkM_2020-04-02_1585852150.mp3';
            let readStream = fs.createReadStream(audioFile);
            readStream.on('error', function (err) {
              console.log(err);
              reject(err);
            });

            const formData = {
              appkey: 'yAOzHAy9LQBJQGtshcIGJX368IbC4Enx',
              language: "en",
              file: readStream,
              callbackurl: '',
            };
            
            request.post({url:"https://www.listenbycode.com/api/v1/upload", formData}, function optionalCallback(err, response, body) {
              var jsonObj = JSON.parse(body);
              var audioId = jsonObj.result.orderId;
              console.log(body);
              let data  = {
                audioId,
                youtubeId
              }
              console.log(data);
              videoModel.updateAudioId_VideoAudio(data)
              .then((result)=>{
                console.log(result);
                resolve(data);
              })
              .catch((e)=>{
                console.log('Error while uploading audio file to SpeechTotextApi:', err);
                reject(err);
              })
            });

          }
        })
    })
      .catch((err) => {
        console.log('Convert mp4 to mp3 error:' + err);
        reject(err);
      });
  });
}



async function uploadVideo(file, accessToken, youtubeId, videoTitle) {
  console.log('inside upload video');
  console.log({ file });
  let name = youtubeId;
  let callbackUrl = `http://18.221.192.73:5001/vi/videoState?youtubeId=${youtubeId}`;
  let url = `https://api.videoindexer.ai/trial/Accounts/${accountId}/Videos?name=${videoTitle}&privacy=Public&callbackUrl=${callbackUrl}&indexingPreset=Default&streamingPreset=Default&sendSuccessEmail=False&accessToken=${accessToken}`;
  let formdata = new FormData();

  let rs = fs.createReadStream(file);
  rs.on('error', function (err) {
    console.log(err)
  });

  formdata.append('file', fs.createReadStream(file));
  console.log({ callbackUrl });
  const config = {
    method: 'post',
    url,
    data: formdata,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: formdata.getHeaders()
  }
 
  try{
    res = await axios(config);
    console.log(res.data);
  }catch(e){
    console.log(e);
    throw e;
  }

  return res.data;
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
      let description = mergedList[size-1].original_description;
      let ocr = mergedList[size-1].original_ocr;

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
          sceneObj.original_description = description + next.original_description;
          sceneObj.original_ocr = ocr + next.original_ocr;
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




module.exports = router;


