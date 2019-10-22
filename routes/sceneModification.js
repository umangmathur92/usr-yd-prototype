//contains all the routes related to scene answer

var express = require('express');
var router = express.Router();
const sceneModification = require('../model/sceneModification');


// localhost:5001/us3/question 
router.get('/', function (req, res) {
  let userId = req.query.userId;
  console.log({userId});
  let queryResult = sceneModification.getDescriptionByUserId(userId);
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
router.post('/', function(req, res, next) {
  console.log('hello');
  let queryResult = sceneModification.addModifiedScene(req.body);
  queryResult.then(result => {
    res.send('Scene inserted/updated successfully');  
  }).catch((err) => {
    res.send(err);
    console.log(err)
  });
});

module.exports = router;