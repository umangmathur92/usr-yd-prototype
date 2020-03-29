var express = require('express');
var router = express.Router();
const scene = require('../model/scene');
const fs = require('fs');


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
        res.send("Data added successfully in merge_scene table");
        console.log({data});
      })
      .catch((err) => {
        console.log('Post scene Data Error: ', err);
        res.send(err);
      });
  });



module.exports = router;