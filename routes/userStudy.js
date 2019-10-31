/**
 * author: vaishali
 * description: consists of all routes related to userstudy
 * Basic route: localhost:5001/userStudy
 */

var express = require('express');
var router = express.Router();
const userStudy = require('../model/userStudy');
const db = require('../db/database');


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
  
module.exports = router;