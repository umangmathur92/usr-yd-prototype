const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const db = require('../db/database');
const fse = require('fs-extra');

async function generateMp3ForText(inputText) {
    try {
        const client = new textToSpeech.TextToSpeechClient();
        const request = {
            input: {text: inputText},
            voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
            audioConfig: {audioEncoding: 'MP3'},
        };
        const [response] = await client.synthesizeSpeech(request);
        const writeFile = util.promisify(fs.writeFile);
        await writeFile('public/audio/output.mp3', response.audioContent, 'binary');
        console.log('Audio content written to file: output.mp3');
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function generateMp3ForTextInFileystem(currVideoId, hasAi, volunteerId, sceneNum, inputText) {
    try {
        const client = new textToSpeech.TextToSpeechClient();
        const request = {
            input: {text: inputText},
            voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
            audioConfig: {audioEncoding: 'MP3'},
        };
        const [response] = await client.synthesizeSpeech(request);
        const writeFile = util.promisify(fse.outputFile);
        let descType = hasAi ? 'ai' : 'non_ai';
        let fileNamePath = `public/audio/${currVideoId}/${descType}/${volunteerId}/${sceneNum}.mp3`;
        await writeFile(fileNamePath, response.audioContent, 'binary');
        console.log(`Audio content written to file: ${fileNamePath}`);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function generateMp3ForAllDescriptionsInDb() {
    try {
        let descriptionListArr = await db.any('SELECT * FROM descriptions order by id');
        for(let i=0; i<descriptionListArr.length; i++) {
            let currDescription = descriptionListArr[i];
            let currDescriptionId = currDescription.desc_id;
            let currVideoId = currDescription.video_id;
            let currUserId = currDescription.volunteer_id;
            let hasAi = currDescription.has_ai;
            let descriptionText = currDescription.description;
            let ocrText = currDescription.ocr;
            let sceneNum = currDescription.scene_num;
            ocrText = (hasAi && ocrText.trim().length>0) ? "\nText on screen for this scene is as follows: " + ocrText : "";
            let finalText = descriptionText + ocrText;
            await generateMp3ForTextInFileystem(currVideoId, hasAi, currUserId, sceneNum, finalText);
            
            
        }
        // const client = new textToSpeech.TextToSpeechClient();
        // const request = {
        //     input: {text: inputText},
        //     voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
        //     audioConfig: {audioEncoding: 'MP3'},
        // };
        // const [response] = await client.synthesizeSpeech(request);
        // const writeFile = util.promisify(fs.writeFile);
        // await writeFile('public/audio/output.mp3', response.audioContent, 'binary');
        // console.log('Audio content written to file: output.mp3');
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = {
    generateMp3ForText: generateMp3ForText,
    generateMp3ForAllDescriptionsInDb: generateMp3ForAllDescriptionsInDb
}