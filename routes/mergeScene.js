var express = require('express');
var router = express.Router();
const scene = require('../model/scene');
const fs = require('fs');
let UploadVideoController = require('../controllers/UploadVideoController');

router.get('/mergeAudioVideo', function (req, res) {
  let videoId = req.query.videoId;
  let audioId = req.query.audioId;
  let queryResult =  UploadVideoController.fetchAudioInsight(audioId, videoId);
  queryResult
    .then(data => {
      res.send(data);
      // console.log({data});
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});


router.get('/sceneData', function (req, res) {
    let videoId = req.query.videoId;
    let queryResult =  scene.getSceneData(videoId);
    queryResult
      .then(data => {
        res.send(data);
        // console.log({data});
      })
      .catch((err) => {
        res.send(err);
      });
  });

  router.post('/scene', function (req, res) {
    let sceneArr = req.body.mergedList;
    
    console.log({sceneArr});
    let queryResult =  scene.addMergeSceneTable(sceneArr);
    queryResult
      .then(data => {
        console.log({data});
        res.status(200).send('Data added successfully in merge_scene table');

      })
      .catch((err) => {
        console.log('Post scene Data Error: ', err);
        res.status(400).send(err);
      });
  });


module.exports = router;