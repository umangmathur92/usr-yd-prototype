//contains all the routes related to question answer

var express = require('express');
var router = express.Router();
const rooms = { };


router.get('/prepsession', function(req, res, next) {
  console.log(req.query);
  res.render('prepsession', { roomName: req.params.name}); 
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


module.exports = router;
