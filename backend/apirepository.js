const fetch = require('node-fetch');
const fs = require('fs');
const request = require('request');
var path = require('path');
const Utils = require('../backend/utils');
const FormData = require('form-data');


const imageAnalysisSubscriptionKey = '9a17df10db4542a6863bf2621e198916';
const MS_COGNITIVE_SERVICES_BASE_URL = 'https://westus.api.cognitive.microsoft.com/vision/v2.0/';
const IBM_MAX_SCENE_CLASSIFIER_URL = 'http://0.0.0.0:5000/model/predict';

async function getImageAnalysis(imageUrl) {
    try {
        const imgAnalysisUrl = MS_COGNITIVE_SERVICES_BASE_URL + 'analyze?visualFeatures=Adult,Brands,Categories,Color,Description,Faces,ImageType,Objects,Tags&details=Celebrities,Landmarks&language=en';
        const body = { url: imageUrl };
        return await fetch(imgAnalysisUrl, {
            method: 'post',
            body:    JSON.stringify(body),
            headers: { 'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key' : imageAnalysisSubscriptionKey },
        }).then(res => res.json());
    } catch(e) {
        throw e;
    }
}

async function getSceneClassification(imageUrl, frameId) {
    try {
        const imageSavePath = path.join(__dirname, '../' + frameId + '.png');
        await Utils.downloadFile(imageUrl, imageSavePath);
        const formData = new FormData();
        formData.append('image', fs.createReadStream(imageSavePath));
        return await fetch(IBM_MAX_SCENE_CLASSIFIER_URL, { 
            method: 'POST',
            body: formData
        }).then(res => {
            fs.unlinkSync(imageSavePath);
            return res.json()
        });
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getImageAnalysis: getImageAnalysis,
    getSceneClassification: getSceneClassification
}