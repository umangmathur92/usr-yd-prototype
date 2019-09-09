var express = require('express');
var router = express.Router();
const video = require('../backend/video');
const userStudy = require('../model/userStudy');
const textToSpeech = require('../backend/texttospeech.js');
const userStudy2 = require('../model/userStudy2');

const db = require('../db/database');

router.get('/', function(req, res, next) {
  //res.render('homeUserStudy', { title: 'Express' });
  //res.render('home', { title: 'Express' });
  res.render('homeUserStudy2', { title: 'User Study 2' });
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
  let isAiEnabled = req.query.ai === 'yes';
  if(isAiEnabled) {
    res.render('withai', { title: 'Express' });
  } else {
    res.render('withoutai', { title: 'Express' });
  }
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

//poorva
router.get('/userStudy2', function (req, res) {
  res.render('homeUserStudy2', { title: 'User Study 2' });
});

//list of video for a user
router.get('/userStudy/video', function (req, res) {
  res.render('videoUserStudy', { title: 'User Study Video' });
});

//list of video for visually impaired users
router.get('/userStudy/videoHelper', function (req, res) {
  res.render('videoHelper', { title: 'User Study Video Helper' });
});


//list of visually impaired users
router.get('/userStudy/helper/video', function (req, res) {
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

//list of users
//list of users study 1
router.get('/userStudy/users/', function (req, res) {
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

router.get('/userStudy/helperStatus', function (req, res) {
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

router.get('/userStudy/getUserHelper', function (req, res) {
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


router.put('/userStudy/updateStatus', function (req, res, next) {
  let task = userStudy.updateStatus_VIUser(req.body);
  task.then(result => {
    res.status(200).json({ 'message': 'Thank you for you participation' });
  })
    .catch((err) => {
      console.log(err)
      res.send({ success: false });
    });;
});

router.put('/userStudy/updateUserInfo', function (req, res, next) {
  let task = userStudy.updateVIUserInfo(req.body);
  task.then(result => {
    res.status(200).json({ 'success': 'true' });
  })
    .catch((err) => {
      console.log(err)
      res.send({ success: false });
    });;
});

//list of users study 2
router.get('/userStudy2/users/', function (req, res) {
 // let userId = req.query.userId;
 // if(userId){
    //let queryResult = userStudy2.getVideoByUserId(userId);
    let queryResult = db.query(`SELECT * from us_user_blind order by id`);
    queryResult
    .then(result => {
      res.send(result);
    })
    .catch((err) => {
      res.send(err);
    });
 // }
});

router.post('/saveNonAiDescription', function(req, res, next) {
  let inputJson = req.body;
  console.log(inputJson);
  let queryResult = db.query(`INSERT INTO temp_table(temp_column) VALUES($1)`,[inputJson]);
  queryResult.then(result => {
    res.send({success: true});  
  }).catch((err) => {
    res.send({success: false});
  });
});


router.post('/updatefeedback', function(req, res, next) {
  let rating = req.body.rating;
  let comment = req.body.comment;
  let vi_user_id = req.body.vi_user_id;
  let video_id = req.body.video_id;
  let volunteer_id = req.body.volunteer_id;
  let ai_support = req.body.ai_support;
  let video_unstd = req.body.video_understanding;
   console.log("Rating: " + rating + "\ncomment: " + comment + "\nvi_user_id: " + vi_user_id + "\nvideo_id: " + video_id + "\nvolunteer_id: " + volunteer_id + "\nai_support: " + ai_support)
   let queryResult = db.query(`UPDATE us_helper_video SET rating = ($1), comment = ($2) , video_understanding = ($3) WHERE video_id='${video_id}' AND volunteer_id='${volunteer_id}'  AND vi_user_id='${vi_user_id}' ANd ai_support = '${ai_support}'` , [rating, comment, video_unstd]);
  queryResult.then(result => {
    res.send({success: true});   
  }).catch((err) => {
    console.log(err)
    res.send({success: false});
  });
});




router.post('/saveAiDescription', function(req, res, next) {
  let inputJson = req.body;
  console.log(inputJson);
  let queryResult = db.query(`INSERT INTO temp_table_ai(temp_column) VALUES($1)`,[inputJson]);
  queryResult.then(result => {
    res.send({success: true});  
  }).catch((err) => {
    res.send({success: false});
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

router.get('/playVideoAudio/:youtubeId', function(req, res, next) {
  res.render('videoaudio');
});

router.get('/playvideodescription/:youtubeId', function(req, res, next) {
  res.render('playvideodescription');
});

router.get('/getDescriptionData', function(req, res, next) {
  let videoId= req.query.videoId;
  let volunteerId = req.query.volunteerId;
  let aiType = req.query.aiType;
  let queryResult = db.query(`select * from descriptions where video_id = '${videoId}' and volunteer_id = '${volunteerId}' and has_ai=${aiType} order by scene_num`);
  queryResult
    .then(result => {
      res.send(result);
    })
    .catch((err) => {
      res.send(err);
    });
});

module.exports = router;
