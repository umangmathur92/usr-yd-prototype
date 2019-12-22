//contains all the routes related to question answer

var express = require('express');
var router = express.Router();
const rooms = { };
const sessionUserStudy = require('../model/sessionUserStudy3');


router.get('/prepsession', function(req, res, next) {
  console.log(req.query);
  res.render('us3_prepsession', { roomName: req.params.name}); 
});

router.get('/session3', function(req, res, next) {
  console.log(req.query);
  res.render('us3_session3', { roomName: req.params.name}); 
});


router.get('/', function(req, res, next) {
  console.log(req.query);
  if(req.query.name){
    res.render('chatRoom', { roomName: req.params.name});
  }else{
    res.render('chatRoomList', { rooms: rooms });
  }  
});

router.post('/addQuesAns', function(req, res, next) {
  let queryResult = sessionUserStudy.addQuestionAnswer(req.body);
  queryResult.then(result => {
    res.send('session Q&A inserted successfully');  
  }).catch((err) => {
    res.send(err);
    console.log(err)
  });
});

router.get('/fetchQuestions', function(req, res, next) {
  console.log('req.query', req.query)
    // let data = {
    //   'userId' : req.query.userId,
    //   'videoId': req.query.videoId
    // }
    sessionUserStudy.getQuestionAnswerByUserId(req.query).then( qnaList =>{
      res.send(qnaList);
      console.log(qnaList);
    }).catch((err) => {
      res.send(err);
      console.log(err)
    });  
});



module.exports = router;
