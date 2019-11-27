//contains all the routes related to question answer

var express = require('express');
var router = express.Router();
const rooms = { };

router.get('/', function(req, res, next) {
  console.log(req.query);
  if(req.query.name){
    res.render('chatRoom', { roomName: req.params.name});
  }else{
    res.render('chatRoomList', { rooms: rooms });
  }  
});

// router.post('/room', (req,res) => {
//   rooms[req.body.name] = {users: {}};
//   res.redirect(`/room=${req.query.room}`);
// })


module.exports = router;
