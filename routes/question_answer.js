//contains all the routes related to question answer

var express = require('express');
var router = express.Router();
const questionAnswer = require('../model/questionAnswer');

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


router.post('/addQuestion', function(req, res, next) {
    let queryResult = questionAnswer.createQuestion(req.body);
    queryResult.then(result => {
      res.send('Question inserted successfully');  
    }).catch((err) => {
      res.send(err);
      console.log(err)
    });
  });

  
module.exports = router;
