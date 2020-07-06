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
let uploadVideoController = require('../controllers/VideoControllerUpload');


async function downloadVideo(url, videoTitle){
    let videoId = url.substr(url.indexOf('v=') + 2);
    console.log({ videoTitle});


    return new Promise((resolve, reject) => {
          let jsonPath = path.join(__dirname, '../videos/');
          console.log({ jsonPath });
          console.log({ __dirname });
          const video = youtubedl(url, ['--format=18']);

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
          let filePath = path.join(__dirname, '../videos/', fileName);
          console.log({ fileName });
          console.log({ filePath });

          video.pipe(fs.createWriteStream(filePath));
          video.on('complete', function complete(info) {
            'use strict'
            console.log('filename: ' + info._filename + ' already downloaded.')
          })
          let name = '';
          video.on('end', function () {
            console.log('Finished downloading!');
            resolve('Video Downloaded successfully');
          })

          video.on('error', function error(err) {
            console.log('error 2:', err);
            reject(err);
          })

      })

  }
  




router.get('/downloadVideo', function(req, res) {
  let {videoUrl, title} = req.query;
  console.log(req.query);

    downloadVideo(videoUrl, title)
      .then(()=>{
        res.status(200).send('Video downloaded successfully');
      })
      .catch((e)=>{
        res.status(400).send('Failed to download the video');
        console.log(e);
      })
});

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
            let mergedList = uploadVideoController.merge(videoInsight, audioInsight);
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
            //---
            videoController.addVideoDataToDb(jsonBody)
              .then(result => {
                console.log({ success: result });
                uploadVideoController.fetchAudioInsight(audioId, youtubeId)
                      .then((audioResult)=>{
                        uploadVideoController.fetchAndFilterPythiaCaption(youtubeId)
                          .then(()=>{
                            console.log(result);
                            let data = {
                              state: 'Processed',
                              youtubeId,
                            }
                            videoModel.updateVideoAudio_videoState(data)
                            .then(()=>{
                              console.log('Video is processed and state updated in video_audio table');
                              res.status(200).send('Video successfully processed');
                            })
                          })
                      })
                  })
              .catch((e)=>{
                console.log(e);
              })
            //------
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

router.get('/videoIndexedState', function(req,res){
  let youtubeId = req.query.videoId;
    videoModel.fetchVideoAudioTable({youtubeId})
      .then((result)=>{
        if(result.length == 0){
          res.status(404).send('Video not found');
        }else{
          let videoState = result[0].video_state;
          res.send({videoState});
          console.log({result});
        }
       
        
      }).catch(error => {
        res.status(400).send(error);
        console.log(error);
      })
});


router.get('/uploadVideo', function (req, res) {
  console.log({ param: req.query });
  let url = req.query.video;
  let  videoTitle = req.query.title;

  if(!url || !videoTitle){
    res.status(400).send('Missing request parameter');
  }
  let videoId = url.substr(url.indexOf('v=') + 2);

    // let jsonPath = path.join(__dirname, '../videos/');
    // console.log({ jsonPath });
    // console.log({ __dirname });
    const video = youtubedl(url, ['--format=18']);

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
    let filePath = path.join(__dirname, '../videos/', fileName);
    console.log({ fileName });
    console.log({ filePath });

    video.pipe(fs.createWriteStream(filePath));
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
                title: videoTitle,
                videoState: 'Processing'
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
                                      uploadVideoController.fetchAudioInsight(audioId, videoId)
                                            .then((audioResult)=>{
                                              uploadVideoController.fetchAndFilterPythiaCaption(videoId)
                                                .then(()=>{
                                                  console.log(result);
                                                  let data = {
                                                    state: 'Processed',
                                                    youtubeId: videoId,
                                                  }
                                                  videoModel.updateVideoAudio_videoState(data)
                                                  .then(()=>{
                                                    console.log('Video is processed and state updated in video_audio table')
                                                  })
                                                })
                                            })
                                        })
                                    .catch((e)=>{
                                      console.log(e);
                                    })
                                }
                              })
                              .catch((error) => {
                                    clearInterval(timeId);
                                    let data = {
                                      state: 'Failed',
                                      youtubeId: videoId,
                                    }
                                    videoModel.updateVideoAudio_videoState(data)
                                      .then(()=>{
                                        console.log('video state updated in video_audio table')
                                      })
                                    console.log(error);
                                  })
                              }, 10000);
                      //------------------------------------

                      res.status(200).send('SUCCESS: Video uploaded to Video Indexer');
                      console.log('SUCCESS: Video uploaded to Video Indexer');
                    })
                })
            })
            .catch(uploadVideoError => {
              let data = {
                state: 'Failed',
                youtubeId: videoId,
              }
              videoModel.updateVideoAudio_videoState(data)
                .then(()=>{
                  console.log('video state updated in video_audio table')
                })

               console.log(uploadVideoError) ;
            })
        })
        .catch(error => {
          res.status(400).send('FAILED: Video not uploaded to Video Indexer ');
          console.log(error);
        });
    })

    video.on('error', function error(err) {
      console.log('error 2:', err);
      res.status(400).send(err);
    })

});


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
  // let callbackUrl = `http://18.221.192.73:5001/vi/videoState?youtubeId=${youtubeId}`;
  let callbackUrl = '';
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
    console.log('Video Indexer error: ', e);
    throw e;
  }

  return res.data;
}



module.exports = router;


