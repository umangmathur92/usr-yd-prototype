var express = require('express');
var router = express.Router();
const video = require('../backend/video');
const userStudy = require('../model/userStudy');
const textToSpeech = require('../backend/texttospeech.js');
const userStudy2 = require('../model/userStudy2');
const questionAnswer = require('./question_answer');
const db = require('../db/database');
const quesAns = require('../model/questionAnswer');
const sceneModification = require('./sceneModification');

router.use('/us3/question', questionAnswer);
router.use('/sceneModification', sceneModification);
console.log({sceneModification: sceneModification.addModifiedScene})

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

router.get('/getKeyFrames', function(req, res, next) {
  //let query = video.fetchKeyFrames();

  let {sceneId, videoTime} = req.query;
  console.log("The vals are: "+sceneId+"  "+videoTime);
  let queryResult = video.fetchKeyFrames(sceneId, videoTime);
  queryResult.then(result => {
    console.log("The vals are: "+sceneId+"  "+videoTime);
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
  console.log('req.query', req.query)
  let {videoid, userId} = req.query;
  console.log('Video id and user id are: ' + videoid + "  "+userId);
  let queryResult = video.fetchVideoDataFromDb(videoid, userId);
  queryResult.then(result => {
    quesAns.getQuestionAnswerByUserId(userId).then( qnaList =>{
      console.log({ resdata: qnaList});
      result.qnaList = qnaList;
      res.send(result);
    });
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

function addModifiedScene (data, callback) {
  console.log('inside modified scene:', data);
  const { scene_id, user, block_id, scene_num,start_time, end_time,  description, ocr, videoId } = data;
  const sql = `
  INSERT INTO us3_description_modified(video_id, user_id, scene_id, block_id, scene_num, start_time, end_time, description, ocr) 
  VALUES('${videoId}', '${user}', '${scene_id}', '${block_id}', ${scene_num}, ${start_time}, ${end_time}, '${description}', '${ocr}')
  ON CONFLICT(scene_id, user_id, video_id) DO UPDATE SET description ='${description}'; `;
  console.log({sql});
  return db.query(sql, callback);
}

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
  console.log("video id =====>", req.body.videoId)
  console.log('Save AI:', inputJson);
  console.log('Save AI user:', inputJson.user_id);
  console.log('qna data', inputJson.qnaData);
  let {qnaData, user_id} = inputJson;

  // let queryResult = db.query(`INSERT INTO temp_table_ai(temp_column) VALUES($1)`,[inputJson]);
  // queryResult.then(result => {
  //   res.send({success: true});  
  // }).catch((err) => {
  //   res.send({success: false});
  // });

  //saving Q&A for user study phase 3
  let resArr = [];
  for (let key in qnaData) {
    if (qnaData.hasOwnProperty(key)) {
        console.log("KEY:", key);
        for(let i= 0; i< qnaData[key].length; i++){
          console.log("value" ," -> " , qnaData[key][i].question);

          resArr = [...resArr, quesAns.addQuestionAnswer({...qnaData[key][i], user: user_id, sceneId: key})]
        }
    }

  }

  for(let key in inputJson.scene_arr) {
    console.log({key})
    let currScene = inputJson.scene_arr[key];
    let {scene_id, modified_description, modified_ocr } = currScene;
    console.log({currScene})
    resArr = [...resArr, addModifiedScene({
      scene_id,
      user: user_id,
      scene_num: key,
      videoId: req.body.videoId,
      description: modified_description,
      ocr:  modified_ocr,
      block_id: 'ff',
      start_time:12,
      end_time:18,
    })];
  }

  Promise.all(resArr).then(() => {
    let queryResult = db.query(`INSERT INTO temp_table_ai(temp_column) VALUES($1)`,[inputJson]);
    console.log({inputJson})

    queryResult.then(result => {
      res.send({success: true});  
    }).catch((err) => {
      console.log(err)
      res.send({success: false});
    });
    // res.send({success: true});
  
  }).catch(() => {
    res.send({success: false});
  })

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
