//contains all the routes related to question answer

var express = require('express');
var router = express.Router();
const questionAnswer = require('../model/questionAnswer');
const axios = require('axios');
var FormData = require('form-data');
var fs = require('fs');

// localhost:5001/us3/question 
router.get('/', function (req, res) {
  let userId = req.query.userId;
  console.log({userId});
  let queryResult = questionAnswer.getQuestionAnswerByUserId(userId);
  console.log({queryResult});
  queryResult
    .then(result => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
});


//addQuestionAnswer with scene id and user id 
router.post('/addQuesAns', function(req, res, next) {
  let queryResult = questionAnswer.addQuestionAnswer(req.body);
  queryResult.then(result => {
    res.send('Q&A, user, sceneid, inserted successfully');  
  }).catch((err) => {
    res.send(err);
    console.log(err)
  });
});

router.post('/addQuestion', function(req, res, next) {
    let queryResult = questionAnswer.createQuestion(req.body);
    queryResult.then(result => {
      res.send('Question inserted successfully');  
    }).catch((err) => {
      res.send(err);
      console.log(err)
    });
  });


router.delete('/deleteQuestion', function(req, res, next) {
    let queryResult = questionAnswer.deleteQuestionById(req.body);
    queryResult.then(result => {
      res.send('Question deleted successfully');  
    }).catch((err) => {
      res.send(err);
      console.log(err)
    });
  });


router.post('/generate', async function(req, res) {
  // debugger;
  // console.log('reached', req.body.sentence);
  let rows = req.body.sentence;
  let result = [];
  let gotResponse = 0;  
  for(let i=0; i < rows.length; i++){
    axios.post('http://localhost:5000/generate', {sentence: rows[i]}).then((response) => {
      // console.log("success", response.data)
      gotResponse++;
      result.push({response: response.data})
      if(gotResponse === rows.length) {
        // console.log("========result ========")
        // console.log({result})
        res.send({result})
      }
    }).catch((err) =>{
      // console.log("Unsuccessful:" , rows[i]);
      gotResponse++;
      result.push({})
      if(gotResponse === rows.length) {
        // console.log("========result ========")
        // console.log({response: response.data})
        res.send({result})
      }
    // res.send(err);
    }) 
  }  
});

  
module.exports = router;
