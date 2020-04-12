var express = require('express');
var router = express.Router();
const video = require('../backend/video');
const textToSpeech = require('../backend/texttospeech.js');
const userStudy2 = require('../model/userStudy2');
const questionAnswer = require('./question_answer');
const db = require('../db/database');
const quesAns = require('../model/questionAnswer');
const sceneModification = require('./sceneModification');
const userStudy = require('./userStudy');
const chatRoom = require('./chatRoom');
const mergeScene = require('./mergeScene');
const uploadVideoRoute  = require('./uploadVideo'); 
const sentences = require('../backend/sentences.js')


router.use('/userStudy',userStudy);
router.use('/us3/question', questionAnswer);
router.use('/sceneModification', sceneModification);
router.use('/room', chatRoom);
router.use('/merge', mergeScene);
router.use('/vi', uploadVideoRoute);


router.get('/getDialogTimeStampsFromDb', function(req, res, next) {
    //let query = video.fetchKeyFrames();
    console.log('Dialog TS:',req);
    let {videoId} = req.query;
    console.log("The vals are: "+videoId);
    let queryResult = video.fetchDialogTimeStampsFromDb(videoId);
    queryResult.then(result => {
      console.log("The vals are: "+videoId);
         res.send(result);
      });
  });


router.post('/texttospeech', function(req, res, next) {
  let inputJson = req.body;
  let inputText = inputJson.inputText;
  let task = textToSpeech.generateMp3ForText(inputText);
  task.then(result => {
    res.send({success: result});
  });
});


router.get('/generateMp3FromDescriptions', function(req, res, next) {
  let task = textToSpeech.generateMp3ForAllDescriptionsInDb();
  task.then(result => {
    res.send({success: result});
  });
});
          // texttospeech -> duration
router.post('/descriptionDuration', function(req, res, next) {  
  let inputJson = req.body;
  let inputText = inputJson.inputText;
  let task = textToSpeech.generateMp3DurationForText(inputText);
  task.then(result => {
    res.send({success: result.success, duration: result.duration});
  });
});

                  /*  For sentence generation starts*/
router.get('/generateSentencesFromDescriptions', function(req, res, next) {
  let task = sentences.generateSentencesForAllDescriptionsInDb();
  task.then(result => {
    res.send({success: result});
  });
});

router.get('/generateSentencesFromDescriptionsWithInfo', function(req, res, next) {
  let inputJson = req.query;
  console.log('input: ',inputJson);
  let {vid_id,vol_id} = inputJson;
  console.log('GET params: ',vid_id,' and: ',vol_id);
  let task = sentences.generateSentencesForDescriptionsInDbWithInfo(vid_id,vol_id);
  task.then(result => {
    res.send({success: result});
  });
});

router.get('/generateMp3ForAllSentences', function(req, res, next) {
  let task = sentences.generateMp3ForAllSentencesInDb();
  task.then(result => {
    res.send({success: result});
  });
});

router.get('/generateMp3ForSentencesWithInfo', function(req, res, next) {
  let inputJson = req.query;
  console.log('input: ',inputJson);
  let {vid_id,vol_id} = inputJson;
  console.log('GET params: ',vid_id,' and: ',vol_id);
  let task = sentences.generateMp3ForSentencesInDbWithInfo(vid_id,vol_id);
  task.then(result => {
    res.send({success: result});
  });
});

router.get('/generateTimestampsforSentences', function(req, res, next) {
  let task = sentences.generateTimestampsforSentencesInDb();
  task.then(result => {
    res.send({success: result});
  });
});

router.get('/generateTimestampsforSentencesInDbWithInfo', function(req, res, next) {
  let inputJson = req.query;
  console.log('input: ',inputJson);
  let {vid_id,vol_id} = inputJson;
  console.log('GET params: ',vid_id,' and: ',vol_id);
  let task = sentences.generateTimestampsforSentencesInDbWithInfo(vid_id,vol_id);
  task.then(result => {
    res.send({success: result});
  });
});

router.get('/mergeSentencesInDb', function(req, res, next) {
  let inputJson = req.query;
  console.log('input: ',inputJson);
  let {vid_id, vol_id} = inputJson;
  console.log('GET params: ',vid_id);
  let task = sentences.mergeSentenceAudios(vid_id, vol_id);
  task.then(result => {
    res.send({success: result});
  });
});

              /*  For sentence generation ends  */
