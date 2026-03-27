const express = require('express');
const router = express.Router();
const axios = require('axios');
const pythiaCaptionController = require('../controllers/PythiaCaptionGenerationController');



router.get('/generateCaption', function (req, res) {
    let videoId = req.query.videoId;
    if (videoId) {
        let queryResult = pythiaCaptionController.generatePythiaCaption(videoId);
        queryResult
        .then(result => {
            res.status(200).send('Pythia captions successfully updated');
            console.log(result);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
    }else{
        res.status(400).send('Missing request parameter');
    }
});

module.exports = router;