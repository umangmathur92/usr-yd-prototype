var express = require('express');
var router = express.Router();
const video = require('../backend/video');
const userStudy = require('../model/userStudy');

router.get('/', function(req, res, next) {
  res.render('home', { title: 'Express' });
});

router.get('/addvideo', function(req, res, next) {
  res.render('addvideo', { title: 'Add Video' });
});

router.post('/addvideo', function(req, res, next) {
  let requestBody = req.body;
  let queryResult = video.addVideoDataToDb(requestBody);
  queryResult.then(result => {
    res.send({success: result});
  });
});

router.get('/getAllVideos', function(req, res, next) {
  let query = video.fetchAllVideos();
  query.then(result => {
    res.send(result);  
  });
});

router.get('/playvideo/:youtubeId', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/fetchVideoData', function(req, res, next) {
  let videoId = req.query.videoid;
  let queryResult = video.fetchVideoDataFromDb(videoId);
  queryResult.then(result => {
    res.send(result);
  });
});

router.post('/updateSceneDescription', function(req, res, next) {
  let inputJson = req.body;
  let queryResult = video.updateSceneDescription(inputJson);
  queryResult.then(result => {
    res.send(result);
  });
});

router.post('/updateSceneOCR', function(req, res, next) {
  let inputJson = req.body;
  let queryResult = video.updateSceneOcr(inputJson);
  queryResult.then(result => {
    res.send(result);
  });
});

router.post('/updateBlockDescription', function(req, res, next) {
  let inputJson = req.body;
  let queryResult = video.updateBlockDescription(inputJson);
  queryResult.then(result => {
    res.send(result);
  });
});

router.get('/cleardatabase', function(req, res, next) {
  let queryResult = video.clearDb();
  queryResult.then(result => {
    res.send({success: result});  
  });
});


router.get('/reset/:youtubeId/:userId', function(req, res, next) {
  let queryResult = video.replicateSceneDataInModifiedSceneTable(req.params.userId, req.params.youtubeId);
  queryResult.then(result => {
    res.send({success: result});  
  });
});

router.post('/updateMultipleScenesAndBlocksForUser', function(req, res, next) {
  let inputJson = req.body;
  let queryResult = video.updateMultipleScenesAndBlocksForUser(inputJson);
  queryResult.then(result => {
    res.send({success: result});  
  });
});

router.post('/updateBlockAndScene', function(req, res, next) {
  let inputJson = req.body;
  let queryResult = video.updateBlockAndScene(inputJson);
  queryResult.then(result => {
    res.send({success: result});  
  });
})
//vaishali
router.get('/userStudy', function (req, res) {
  res.render('homeUserStudy', { title: 'User Study' });
});
//list of video for a user
router.get('/userStudy/video', function (req, res) {
  res.render('videoUserStudy', { title: 'User Study Video' });
});

//list of users
router.get('/userStudy/users/', function (req, res) {
  console.log({param: req.query.userId});
  let userId = req.query.userId;
  if(userId){
     let queryResult = userStudy.getVideoByUserId(userId);
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
