const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const db = require('../db/database');
const fse = require('fs-extra');
const { getAudioDurationInSeconds } = require('get-audio-duration')
const FormData = require('form-data');
const request = require('request');
const http = require('http');

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

async function generateMp3ForTextInFileystem(fileNamePath, inputText) {
    try {
        const client = new textToSpeech.TextToSpeechClient();
        const request = {
            input: {text: inputText},
            voice: {languageCode: 'en-US', name: 'en-US-Wavenet-I', ssmlGender: 'NEUTRAL'},
            audioConfig: {audioEncoding: 'MP3'},
        };
        const [response] = await client.synthesizeSpeech(request);
        const writeFile = util.promisify(fse.outputFile);
        await writeFile(fileNamePath, response.audioContent, 'binary');
        let date = new Date();
        console.log(`Audio content written to file: ${fileNamePath}: `+date.getTime());
        await new Promise(r => setTimeout(r, 100));    
        console.log(`New time: `+date.getTime());
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
            let volunteerId = currDescription.volunteer_id;
            let hasAi = currDescription.has_ai;
            let descriptionText = currDescription.description;
            let ocrText = currDescription.ocr;
            let sceneNum = currDescription.scene_num;
            ocrText = (hasAi && ocrText && ocrText.trim().length>0) ? "\nText on screen : " + ocrText : "";
            let lastChar = descriptionText[descriptionText.length - 1];
            if(lastChar != '.' && lastChar != '!' && lastChar != '?')
                descriptionText += '.';
            let finalText = descriptionText + ocrText;
            let descType = hasAi ? 'ai' : 'non_ai';
            let fileNamePath = `public/audio/${currVideoId}/${descType}/${volunteerId}/${sceneNum}.mp3`;
            let relativePath = fileNamePath.replace('public', '..');
            await generateMp3ForTextInFileystem(fileNamePath, finalText);
            let duration = await getAudioDurationInSeconds(fileNamePath);
            console.log(duration);
            await updateDescriptionTable(duration, currVideoId, volunteerId, hasAi, sceneNum, relativePath);
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function updateDescriptionTable(duration, currVideoId, volunteerId, hasAi, sceneNum, relativePath) {
    try {
        await db.query(`UPDATE descriptions SET audio_length = ${duration}, audiopath = '${relativePath}' where video_id = '${currVideoId}' and volunteer_id = '${volunteerId}' and has_ai=${hasAi} and scene_num=${sceneNum}`);
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
}

async function getMp3ForDescription(inputText, res) {
    try {
        const client = new textToSpeech.TextToSpeechClient();
        const request = {
            input: {text: inputText},
            voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
            audioConfig: {audioEncoding: 'MP3'},
        };
        const [response] = await client.synthesizeSpeech(request);
        const writeFile = util.promisify(fs.writeFile);
        const fileNamePath = 'public/audio/output.mp3';
        await writeFile(fileNamePath, response.audioContent, 'binary');
        console.log('Audio content written to file: output.mp3');
        
        // let form = new FormData();

        let readStream = fs.createReadStream('./'+fileNamePath);
            readStream.on('error', function (err) {
              console.log("RS err is: ",err);
              reject(err);
            });

            res.set('content-type', 'audio/mp3');
            res.set('content-disposition', 'output.mp3');
            res.set('accept-ranges', 'bytes');

            readStream.on('data', function (chunk) {
                console.log("File opened");
                // reject(err)
                res.write(chunk);
              });

            readStream.on('end', () => {
                res.end();
              });

            console.log("RS err");
            const formData = {
              file: readStream,
              callbackurl: '',
            };        

        let duration = await getAudioDurationInSeconds(fileNamePath);

        // return {'success': true, 'duration': duration, 'file':response, 'form':formData};
    } catch (error) {
        console.log(error);
        return {'success': false, 'duration': 'None'};
    }
}

    // Added file in response
async function generateMp3DurationForText(inputText) {
    try {
        const client = new textToSpeech.TextToSpeechClient();
        const request = {
            input: {text: inputText},
            voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
            audioConfig: {audioEncoding: 'MP3'},
        };
        const [response] = await client.synthesizeSpeech(request);
        const writeFile = util.promisify(fs.writeFile);
        const fileNamePath = 'public/audio/output.mp3';
        await writeFile(fileNamePath, response.audioContent, 'binary');
        console.log('Audio content written to file: output.mp3');

        let readStream = fs.createReadStream('./'+fileNamePath);
            readStream.on('error', function (err) {
              console.log("RS err is: ",err);
            //   reject(err);
            });

            readStream.on('data', function (chunk) {
                console.log("File opened");
                // reject(err)
              });

            readStream.on('end', () => {
              });

            console.log("RS err");
            const formData = {
              file: readStream,
              callbackurl: '',
            };        

        let duration = await getAudioDurationInSeconds(fileNamePath);

        return {'success': true, 'duration': duration, 'file':response, 'form':formData};
    } catch (error) {
        console.log(error);
        return {'success': false, 'duration': 'None'};
    }
}

module.exports = {
    getMp3ForDescription: getMp3ForDescription,
    generateMp3ForText: generateMp3ForText,
    generateMp3ForTextInFileystem: generateMp3ForTextInFileystem,
    generateMp3ForAllDescriptionsInDb: generateMp3ForAllDescriptionsInDb,
    generateMp3DurationForText: generateMp3DurationForText
}