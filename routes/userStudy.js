/**
 * author: vaishali
 * description: consists of all routes related to userstudy
 * Basic route: localhost:5001/userStudy
 */

var express = require('express');
var router = express.Router();
const userStudy = require('../model/userStudy');
const db = require('../db/database');
const fs = require('fs');
var path = require('path');
const youtubedl = require('youtube-dl');
let accountId = '5a8c6ddf-900f-48b4-8a3a-0cd5cf48cb4b';
let location1= 'Trial';
let apiKey = 'dbbd2d92a19749759576466ed9cd61fa'; 
const axios = require('axios');
let FormData = require('form-data');
const fetch = require('node-fetch');
var request = require('request');


router.get('/', function (req, res) {
    res.render('homeUserStudy', { title: 'User Study' });
  });
  
  //list of video for a user
router.get('/video', function (req, res) {
    res.render('videoUserStudy', { title: 'User Study Video' });
});

//list of video for visually impaired users
router.get('/videoHelper', function (req, res) {
    res.render('videoHelper', { title: 'User Study Video Helper' });
});


//list of visually impaired users
router.get('/helper/video', function (req, res) {
    // console.log({ param: req.query.userId });
    let userId = req.query.userId;
    if (userId) {
        let queryResult = userStudy.getHelperVideo(userId);
        queryResult
        .then(result => {
            res.send(result);
        })
        .catch((err) => {
            res.send(err);
        });
    }
});


router.get('/helperStatus', function (req, res) {
    let userId= req.query.userId;
    console.log({ userId});
    
    if (userId) {
      let queryResult = db.query(`SELECT * from us_helper_video where vi_user_id = '${userId}' and rating IS NOT NULL`);
      queryResult
        .then(result => {
          res.json(result);
        })
        .catch((err) => {
          res.send({err});
        });
    }
  });
  
  router.get('/getUserHelper', function (req, res) {
    let userId = req.query.userId;
    let queryResult = userStudy.getAllUser_VI(userId);
    queryResult
      .then(result => {
        res.send(result);
      })
      .catch((err) => {
        res.send(err);
      });
  });

  router.put('/updateStatus', function (req, res, next) {
    let task = userStudy.updateStatus_VIUser(req.body);
    task.then(result => {
      res.status(200).json({ 'message': 'Thank you for you participation' });
    })
      .catch((err) => {
        console.log(err)
        res.send({ success: false });
      });;
  });

  router.put('/updateSceneEndTime', function (req, res, next) {
    let task = userStudy.updateSceneEndTime(req.body);
    task.then(result => {
      res.status(200).json({succes : 'Scene end time updated successfully'});
    })
      .catch((err) => {
        console.log(err)
        res.send({ success: false });
      });;
  });
  
  router.put('/updateUserInfo', function (req, res, next) {
    let task = userStudy.updateVIUserInfo(req.body);
    task.then(result => {
      res.status(200).json({ 'success': 'true' });
    })
      .catch((err) => {
        console.log(err)
        res.send({ success: false });
      });;
  });
  
  

  //list of users
//list of users study 1
router.get('/users/', function (req, res) {
    console.log({param: req.query.userId});
    let userId = req.query.userId;
    if(userId){
      //let queryResult = userStudy.getVideoByUserId(userId);
      let queryResult = db.query(`SELECT u.user_id, u.video_id, v.title, u.ai_support, usr.name FROM us_user_video u JOIN video v ON u.video_id = v.youtube_id JOIN us_user usr ON usr.uuid = u.user_id WHERE u.user_id = $1 ORDER by u.id`,[userId]);
      queryResult
      .then(result => {
        res.send(result);
      })
      .catch((err) => {
        res.send(err);
      });
    }else{
      let queryResult = userStudy.getAllUsers();
      console.log({ queryResult });
      queryResult
      .then(result => {
        res.send(result);
      })
      .catch((err) => {
        res.send(err);
      });
    }
  });
  


router.delete('/deleteScene', function(req, res, next) {
  let queryResult = userStudy.deleteSceneById(req.body);
  queryResult.then(result => {
    // res.status(200).send('Scene deleted successfully', result);
    res.status(200).send({msg:'Scene deleted successfully'});
  }).catch((err) => {
    res.status(500).send(err);
    console.log(err)
  });
});
module.exports = router;


router.get('/uploadVideo', function (req, res) {
  console.log({param: req.query.video});
  let url = req.query.video;
  let videoId = url.substr(url.indexOf('v=')+2);

  if(url){
    let jsonPath = path.join(__dirname, '../videos/');
    console.log({jsonPath});
    const video = youtubedl(url,['--format=18'], jsonPath);
    
    // Will be called when the download starts.
    video.on('info', function(info) {
      console.log('Download started')
      console.log('filename: ' + info._filename)
      console.log('size: ' + info.size)
    })


    let fileName = videoId + '.mp4';
    video.pipe(fs.createWriteStream(fileName));
    video.on('complete', function complete(info) {
      'use strict'
      console.log('filename: ' + info._filename + ' already downloaded.')
    })
    
    video.on('end', function() {
      console.log('finished downloading!');
      accountAccessToken();
     
    })

    video.on('error', function error(err) {
      console.log('error 2:', err);
      accountAccessToken().then((response=>{
        console.log({'success': response });
      })).catch(err=>{
        console.log(err);
      });
    })
    
    res.send('Downloaded');
  }
});



// function uploadVideo1(accessToken, file){
//   console.log('inside upload video');
//   let name = 'youdescribe-5a8c6d';
//   let url = `https://api.videoindexer.ai/trial/Accounts/${accountId}/Videos?name=${name}&privacy=Public&indexingPreset=Default&streamingPreset=Default&sendSuccessEmail=False&accessToken=${accessToken}`;
//   file = `/Users/vaishalibisht/Desktop/SFSU/YouDescribe/usr-yd-prototype/videos/7QZNpS0uos4.mp4`;
//   var formdata = new FormData();
//   formdata.append(file);

//   $.ajax({
//       type: 'POST',
//       url,
//       data: formdata,
//       contentType: 'application/x-www-form-urlencoded',
//       success: function (response) {
//           window.alert(JSON.stringify(response));
//       },
//       error: function (response, textStatus, errorThrown) {
//           console.log(errorThrown);
//           window.alert(JSON.stringify(response));
//       }
//     });
// }

async function accountAccessToken() {
  console.log('inside Access token');
  let url = `https://api.videoindexer.ai/Auth/trial/Accounts?generateAccessTokens=true&allowEdit=true`;
  const config = {
      method: 'get',
      url,
      headers: { 'Ocp-Apim-Subscription-Key': apiKey }
  }
  try {
    res = await axios(config);
    let accessToken =  res.data[0].accessToken;
    console.log({accessToken});
    // uploadVideo('',accessToken);
    let name = 'Test';
    let url = `https://api.videoindexer.ai/trial/Accounts/${accountId}/Videos?name=${name}&privacy=Public&indexingPreset=Default&streamingPreset=Default&sendSuccessEmail=False&accessToken=${accessToken}`;
    file = `/Users/vaishalibisht/Desktop/SFSU/YouDescribe/usr-yd-prototype/videos/7QZNpS0uos4.mp4`;
    let formdata = new FormData();
    formdata.append('myFile', fs.createReadStream(file));



    request.post({
      url,
      formdata,
      headers: formdata.getHeaders(),
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
            return console.error('upload failed:', err);
        }
        console.log('Upload successful!  Server responded with:', body);
    });
  } catch (err) {
    console.log('Http error', err);
  }
  
}


async function uploadVideo(file, accessToken){
  console.log('inside upload video');
  let name = 'youdescribe-5a8c6d';
  let url = `https://api.videoindexer.ai/trial/Accounts/${accountId}/Videos?name=${name}&privacy=Public&indexingPreset=Default&streamingPreset=Default&sendSuccessEmail=False&accessToken=${accessToken}`;
  file = `/Users/vaishalibisht/Desktop/SFSU/YouDescribe/usr-yd-prototype/videos/7QZNpS0uos4.mp4`;
  var formdata = new FormData();
  formdata.append('myFile', fs.createReadStream(file));
    
  const config = {
        method: 'post',
        url,
        data: formdata,
        headers: {'Content-Type': 'multipart/form-data' }
    }
    try {
      res = await axios(config);
      console.log({res});
    } catch (err) {
      console.log('Upload error: ', err);
    }
}