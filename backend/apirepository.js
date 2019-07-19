const fetch = require('node-fetch');

const imageAnalysisSubscriptionKey = '9a17df10db4542a6863bf2621e198916';
const MS_COGNITIVE_SERVICES_BASE_URL = 'https://westus.api.cognitive.microsoft.com/vision/v2.0/';

async function getImageAnalysis(imageUrl) {
    try {
        const imgAnalysisUrl = MS_COGNITIVE_SERVICES_BASE_URL + 'analyze?visualFeatures=Adult,Brands,Categories,Color,Description,Faces,ImageType,Objects,Tags&details=Celebrities,Landmarks&language=en';
        const body = { url: imageUrl };
        return await fetch(imgAnalysisUrl, {
            method: 'post',
            body:    JSON.stringify(body),
            headers: { 'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key' : imageAnalysisSubscriptionKey },
        })
        .then(res => res.json());
    } catch(e) {
        throw e;
    }
}

module.exports = {
    getImageAnalysis: getImageAnalysis
}