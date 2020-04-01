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

router.get('/videoState', function (req, res) {
  // console.log({ param: req.query.userId });
  let videoId = req.query.id;
  let state = req.query.state;
  let youtubeId = req.query.youtubeId;

  if (state === 'Processed') {
    let url = `https://api.videoindexer.ai/${location}/accounts/${accountId}/videos/${videoId}/Index/?language=en-US`;
    console.log({url});

    axios.get(url)
      .then( (response) => {
          // console.log(response.data);
          let jsonBody = {
              youtubeId,
              'inputJson': response.data
          };
          videoController.addVideoDataToDb(jsonBody)
          .then(result => {
            res.send({success: result});
          });
      })
      .catch((error) => {
        res.send(error);
        console.log(error);
      })
  }else{
    res.send('Video is not processed by Video Indexer , id:', videoId);
    console.log('Video is not processed by Video Indexer , id:', videoId);
  }
});


router.get('/uploadVideo', function (req, res) {
    console.log({param: req.query.video});
    let url = req.query.video;
    let videoId = url.substr(url.indexOf('v=')+2);
  
    if(url){
      let jsonPath = path.join(__dirname, '../videos/');
      console.log({jsonPath});
      console.log({__dirname});
      const video = youtubedl(url,['--format=18'], jsonPath);
      
      // Will be called when the download starts.
      video.on('info', function(info) {
        console.log('Download started')
        console.log('filename: ' + info._filename)
        console.log('size: ' + info.size)
      })
  
      let date_ob = new Date();
      let year = date_ob.getFullYear();
      let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
      let date = ("0" + date_ob.getDate()).slice(-2);
      let currentDateTime = year + "-" + month + "-" + date + "_" + Math.floor(Date.now()/1000);

      let fileName = videoId + '_' + currentDateTime + '.mp4';
      let filePath = path.join(__dirname, '../', fileName);
      console.log({fileName});
      console.log({filePath});
      
      video.pipe(fs.createWriteStream(fileName));
      video.on('complete', function complete(info) {
        'use strict'
        console.log('filename: ' + info._filename + ' already downloaded.')
      })
      
      video.on('end', function() {
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
  
            return uploadVideo(filePath, accessToken, videoId);
           
          }).then(response => {
            res.status(200).send('SUCCESS: Video uploaded to Video Indexer');
            console.log('SUCCESS of Video Upload POST->' + response);
          })
          .catch(error => {
            res.status(400).send('FAILED: Video not uploaded to Video Indexer   ')
            console.log(error);
          });
      })
  
      video.on('error', function error(err) {
        console.log('error 2:', err);
        res.send(err);
      })
    }else{
      console.log('video url not provided');
      res.send('video url not provided');
    }
  });



  async function uploadVideo(file, accessToken, youtubeId){
    console.log('inside upload video');
    console.log({file});
    let name = youtubeId;
    let callbackUrl = `http://18.221.192.73:5001/vi/videoState?youtubeId=${youtubeId}`;
    let url = `https://api.videoindexer.ai/trial/Accounts/${accountId}/Videos?name=${name}&privacy=Public&indexingPreset=Default&streamingPreset=Default&sendSuccessEmail=False&accessToken=${accessToken}&callbackUrl=${callbackUrl}`;
    let formdata = new FormData();
  
    let rs = fs.createReadStream(file);
    rs.on('error', function(err){ 
      console.log(err) 
    });
    
    formdata.append('file', fs.createReadStream(file));
   
    const config = {
          method: 'post',
          url,
          data: formdata,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          headers: formdata.getHeaders()
      }
    res = await axios(config);
    
    return res.data;
     
  }
  


  module.exports = router;
  
  
  