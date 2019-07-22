var express = require('express');
var router = express.Router();
const video = require('../backend/video');

router.get('/getAllVideos', function(req, res, next) {
  let query = video.fetchAllVideos();
  query.then(result => {
    res.send(result);  
  });
});

router.get('/', function(req, res, next) {
  res.render('home', { title: 'Express' });
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

router.get('/cleardatabase', function(req, res, next) {
  let queryResult = video.clearDb();
  queryResult.then(result => {
    res.send({success: result});  
  });
});

module.exports = router;
