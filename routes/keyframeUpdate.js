/**
 * description: consists of the routes related to revised/new keyframes
 * Basic route: localhost:5001/keyframe
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
const keyframeRevise = require('../model/keyframeRevise');
let accountId = '5a8c6ddf-900f-48b4-8a3a-0cd5cf48cb4b';
let apiKey = 'dbbd2d92a19749759576466ed9cd61fa'; 


router.post('/addKeyframe', function (req, res) {
    console.log("Add keyframe body: ",req.body);
    let queryResult = keyframeRevise.addKeyframe(req.body);
    queryResult.then(result => {
        res.send('Keyframe inserted successfully');  
      }).catch((err) => {
        res.send(err);
        console.log(err)
      });
  });

router.post('/updateKeyframe', function(req, res, next) {
    let queryResult = keyframeRevise.updateKeyframe(req.body);
    queryResult.then(result => {
      res.send('Keyframe updated successfully');  
    }).catch((err) => {
      res.send(err);
      console.log(err)
    });
  });
  
  module.exports = router;