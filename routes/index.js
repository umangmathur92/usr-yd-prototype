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


router.use('/userStudy',userStudy);
router.use('/us3/question', questionAnswer);
router.use('/sceneModification', sceneModification);
router.use('/room', chatRoom);
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
  let queryResult = video.fetchVideoDataFromDb(videoid, userId);
  let data= {'videoId': videoid, 
              'userId':  userId
            };

  queryResult.then(result => {
    quesAns.getQuestionAnswerByUserId(data).then( qnaList =>{
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

//poorva
router.get('/userStudy2', function (req, res) {
  res.render('homeUserStudy2', { title: 'User Study 2' });
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


function addModifiedScene (data, callback) {
  // console.log('inside modified scene:', data);
  let { has_ai, video_id, scene_id, user, block_id, scene_num, start_time, end_time,  description, ocr, deletedScene=[]} = data;
  let descriptionId = user + '_' + video_id + '_ai_' + scene_num;
  // console.log({INSIDEpSOT: data});
  // console.log({descriptionId});
  let mergedSceneArr = JSON.stringify(deletedScene);
  description = description.replace(/'/g, '');
  ocr = ocr.replace(/'/g, '');
  console.log('MERGED SCENE ARR:', mergedSceneArr);
  const sql = `
  START TRANSACTION;
  INSERT INTO descriptions(desc_id, video_id, has_ai, volunteer_id, scene_id, scene_num, start_time, end_time, description, ocr, merged_scene) 
  VALUES('${descriptionId}', '${video_id}', '${has_ai}','${user}', '${scene_id}', ${scene_num}, ${start_time}, ${end_time}, '${description}', '${ocr}', '${mergedSceneArr}') 
  ON CONFLICT(scene_id, volunteer_id) DO UPDATE SET description ='${description}' , merged_scene = '${mergedSceneArr}', end_time= ${end_time}, start_time=${start_time}, ocr='${ocr}' ;
  COMMIT;`;

  // console.log({sql});
  return db.query(sql, callback);
}


async function deleteMergedScenes(sceneArr, videoId, user_id) { 
   let sql = '';
   for(let i=0; i< sceneArr.length; i++){
     sql +=   `DELETE from descriptions where scene_id = '${sceneArr[i]}' and video_id='${videoId}' and volunteer_id='${user_id}';`;
   }
    console.log({'INSIDE DELETE': sql})
    return  db.query(sql, sceneArr); 
}

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


router.post('/saveNonAiDescription', function(req, res, next) {
  let inputJson = req.body;
  console.log({'INSIDE NON AI':inputJson});
  let {user_id} = inputJson;
  let resArr = [];
  for(let key in inputJson.scenes) {
   let currScene = inputJson.scenes[key];
   let {videoId, scene_id, modified_description, modified_ocr, start_time, end_time, has_ai, deletedScene=[]} = currScene;
   console.log({currScene});
   resArr = [...resArr, addModifiedScene({
    scene_id,
    user: user_id,
    scene_num: key,
    video_id: videoId,
    description: modified_description,
    ocr:  modified_ocr,
    start_time,
    end_time,
    has_ai,
    deletedScene
  })];
 }

 Promise.all(resArr).then(() => {
    let queryResult = db.query(`INSERT INTO temp_table(temp_column) VALUES($1)`,[inputJson]);
    console.log({inputJson})

    queryResult.then(result => {
      res.send({success: true});  
    }).catch((err) => {
      console.log(err)
      res.send({success: false});
    });
  }).catch((e) => {
    console.log(e);
    res.send({success: false});
  })

});



router.post('/saveAiDescription', function(req, res, next) {
  let inputJson = req.body;
  console.log('SAVE AI DESCRiption');
  // console.log('TEST Save AI:', inputJson);
  let {qnaData, user_id, videoId} = inputJson;
  //saving Q&A for user study phase 3
  let resArr = [];
  for (let key in qnaData) {
    if (qnaData.hasOwnProperty(key)) {
        // console.log("KEY:", key);
        for(let i= 0; i< qnaData[key].length; i++){
          // console.log("value" ," -> " , qnaData[key][i].question);
          resArr = [...resArr, quesAns.addQuestionAnswer({...qnaData[key][i], user: user_id, sceneId: key})]
        }
    }

  }

  let deletedSceneArr = [];
  for(let key in inputJson.scene_arr) {
   
      let currScene = inputJson.scene_arr[key];
      console.log({currScene});
      let {scene_id, modified_description, modified_ocr, start_time, end_time, has_ai, deletedScene} = currScene;
      if(deletedScene){
        deletedSceneArr = [...deletedSceneArr, ...deletedScene]; 
      }
      
      console.log({deletedSceneArr});
      resArr = [...resArr, addModifiedScene({
        scene_id,
        user: user_id,
        scene_num: key,
        video_id: req.body.videoId,
        description: modified_description,
        ocr:  modified_ocr,
        start_time,
        end_time,
        has_ai,
        deletedScene
      })];
  }
  
  console.log({deletedSceneArr});


  Promise.all(resArr)
  .then(() => {
      if(deletedSceneArr.length > 0){
        deleteMergedScenes(deletedSceneArr, videoId, user_id)
        .then((response)=>{
            let queryResult = db.query(`INSERT INTO temp_table_ai(temp_column) VALUES($1)`,[inputJson]);
            console.log({inputJson})
            queryResult.then(result => {
              res.send({success: true});  
            })
        })
      }else{
        res.send({success: true});  
      }
  })
  .catch((e) => {
    console.log(e);
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
