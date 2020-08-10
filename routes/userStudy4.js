/**
 * description: consists of all routes related to userstudy4 (summer 2020, on-demand)
 * Basic route: localhost:5001/userStudy4
 */

var express = require('express');
var router = express.Router();
const userStudy = require('../model/userStudy');
const userStudy4 = require('../model/userStudy4');
const questionUserStudy4 = require('../model/questionUserStudy4');
const db = require('../db/database');
const uuidv1 = require('uuid/v1');
const fs = require('fs');
var path = require('path');
const youtubedl = require('youtube-dl');
let location1= 'Trial';
const axios = require('axios');
const FormData = require('form-data');
const fetch = require('node-fetch');
var request = require('request');
let accountId = '5a8c6ddf-900f-48b4-8a3a-0cd5cf48cb4b';
let apiKey = 'dbbd2d92a19749759576466ed9cd61fa'; 


router.get('/', function (req, res) {
    res.render('userStudy4/homeUserStudy4', { title:  'User Study (On-Demand)' });
  });
  
  //list of video for a user
router.get('/video', function (req, res) {
    res.render('userStudy4/videoUserStudy4', { title: 'User Study Video' });
});

router.get('/tutorialVideo', function (req, res){
    let userId = 'on-demand-tutorial'
    let queryResult = db.query(`SELECT u.user_id, u.video_id, v.title, u.volunteer_id, u.ai_support, u.on_demand_support, usr.name FROM us_user_video u JOIN video v ON u.video_id = v.youtube_id JOIN us_user usr ON usr.uuid = u.user_id WHERE u.user_id = $1 ORDER by u.id`,[userId]);
    queryResult
    .then(result => {
      res.send(result);
    })
    .catch((err) => {
      res.send(err);
    });

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
      let queryResult = db.query(`SELECT u.user_id, u.video_id, v.title, u.volunteer_id, u.ai_support, u.on_demand_support, usr.name FROM us_user_video u JOIN video v ON u.video_id = v.youtube_id JOIN us_user usr ON usr.uuid = u.user_id WHERE u.user_id = $1 ORDER by u.id`,[userId]);
      queryResult
      .then(result => {
        res.send(result);
      })
      .catch((err) => {
        res.send(err);
      });
    }else{
      let queryResult = userStudy4.getAllUsers();
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

router.get('/getAllQuestions', function (req, res) {
  let userId = req.query.userId;
  console.log({userId});
  let queryResult = questionUserStudy4.getQuestionByUserId(userId);
  console.log({queryResult});
  queryResult
    .then(result => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
});


router.post('/addQuestion', function(req, res, next) {
  let questionId = uuidv1();
  req.body["questionId"] = questionId;
  console.log(req.body);
  let queryResult = questionUserStudy4.addQuestion(req.body);
  queryResult.then(result => {
    console.log(result);
    res.send({questionId, result : 'Question inserted successfully'});  
  }).catch((err) => {
    res.send(err);
    console.log(err)
  });
});

router.post('/addCaption', function(req, res, next) {
  let queryResult = questionUserStudy4.addCaption(req.body);
  queryResult.then(result => {
    res.send('Caption inserted successfully');  
  }).catch((err) => {
    res.send(err);
    console.log(err)
  });
});

router.post('/addAnswer', function(req, res, next) {
  let queryResult = questionUserStudy4.addAnswer(req.body);
  queryResult.then(result => {
    res.send('Answer inserted successfully');  
  }).catch((err) => {
    res.send(err);
    console.log(err)
  });
});

router.delete('/deleteQuestion', function(req, res, next) {
  let queryResult = questionUserStudy4.deleteAllQuestionsByUserId(req.body.userId);
  queryResult.then(result => {
    res.status(200).send('Question deleted successfully');  
  }).catch((err) => {
    res.status(400).send(err);
    console.log(err)
  });
});

module.exports = router;


