const express = require('express');
const router = express.Router();
const axios = require('axios');
const pythiaCaptionController = require('../controllers/PythiaCaptionGenerationController');



router.get('/generateCaption', function (req, res) {
    // console.log({ param: req.query.userId });
    let videoId = req.query.videoId;
    if (videoId) {
        let queryResult = pythiaCaptionController.generatePythiaCaption(videoId);
        queryResult
        .then(result => {
            res.send('Pythia captions successfully updated');
            console.log(result);
        })
        .catch((err) => {
            res.send(err);
        });
    }else{
        res.send('No video id received');
    }
});

module.exports = router;