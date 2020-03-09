const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const db = require('../db/database');
const fse = require('fs-extra');
const { getAudioDurationInSeconds } = require('get-audio-duration')

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
            voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
            audioConfig: {audioEncoding: 'MP3'},
        };
        const [response] = await client.synthesizeSpeech(request);
        const writeFile = util.promisify(fse.outputFile);
        await writeFile(fileNamePath, response.audioContent, 'binary');
        console.log(`Audio content written to file: ${fileNamePath}`);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function generateMp3ForAllSentencesInDb() {
    try{
        let sentenceListArr = await db.any('SELECT * FROM descriptions_sentence order by sentence_id');

        for(let i=0; i<sentenceListArr.length; i++) {

            let currSentence = sentenceListArr[i];
            let currDescriptionId = currSentence.desc_id;
            let currVideoId = currSentence.video_id;
            let currSceneId = currSentence.scene_id;
            let currScene_start_time = currSentence.start_time;
            let currScene_end_time = currSentence.end_time;
            let volunteerId = currSentence.volunteer_id;
            let hasAi = currSentence.has_ai;
            let descriptionText = currSentence.description;
            let ocrText = currSentence.ocr;
            let sceneNum = currSentence.scene_num;
            ocrText = (hasAi && ocrText && ocrText.trim().length>0) ? "\nText on screen is : " + ocrText : "";
            let finalText = descriptionText + ocrText;
            let descType = hasAi ? 'ai' : 'non_ai';
            let sent = currSentence.sentence;
            let str = currSentence.sentence_id;
            let newstr = str.split('_');
            let sentNum = newstr[newstr.length - 1]; 
            let fileNamePath = `public/audio/${currVideoId}/${descType}/${volunteerId}/${sceneNum}/${sentNum}/.mp3`;
            let relativePath = fileNamePath.replace('public', '..');

            await generateMp3ForTextInFileystem(fileNamePath, sent);
            let duration = await getAudioDurationInSeconds(fileNamePath);
            console.log(duration);
            await updateSentencesDescriptionTable(duration, currVideoId, volunteerId, hasAi, sceneNum, relativePath, str);
        }
        return true;

    } catch(error){
        console.log(error);
        return false;
    }
}


async function generateSentencesForAllDescriptionsInDb() {
    try {
        let descriptionListArr = await db.any('SELECT * FROM descriptions order by id');
        for(let i=0; i<descriptionListArr.length; i++) {
            let currDescription = descriptionListArr[i];
            let currDescriptionId = currDescription.desc_id;
            let currVideoId = currDescription.video_id;
            let currSceneId = currDescription.scene_id;
            let currScene_start_time = currDescription.start_time;
            let currScene_end_time = currDescription.end_time;
            let volunteerId = currDescription.volunteer_id;
            let hasAi = currDescription.has_ai;
            let descriptionText = currDescription.description;
            let ocrText = currDescription.ocr;
            let sceneNum = currDescription.scene_num;
            ocrText = (hasAi && ocrText && ocrText.trim().length>0) ? "\nText on screen is : " + ocrText : "";
            let finalText = descriptionText + ocrText;
            let descType = hasAi ? 'ai' : 'non_ai';
            // let fileNamePath = `public/audio/${currVideoId}/${descType}/${volunteerId}/${sceneNum}.mp3`;
            // let relativePath = fileNamePath.replace('public', '..');
            sentences = finalText.replace(/([.?!])\s*(?=[A-Za-z])/g, "$1|").split("|")
            let sentence_id_key = 0;

            for(s of sentences)
            {
                let sentence_id = currDescriptionId + '_' + sentence_id_key;
                await insertDescriptionSentencesTable(currDescriptionId,currVideoId,currSceneId,
                                                        currScene_start_time,currScene_end_time,volunteerId,hasAi,descriptionText,ocrText,
                                                        sceneNum,finalText,sentence_id,s);
                sentence_id_key += 1;
            }
            // await generateMp3ForTextInFileystem(fileNamePath, finalText);
            // let duration = await getAudioDurationInSeconds(fileNamePath);
            // console.log(duration);
            // await updateDescriptionTable(duration, currVideoId, volunteerId, hasAi, sceneNum, relativePath);
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function insertDescriptionSentencesTable(currDescriptionId,currVideoId,currSceneId,
    currScene_start_time,currScene_end_time,volunteerId,hasAi,descriptionText,ocrText,
    sceneNum,finalText,sentence_id,s){
        try {
            await db.query(`INSERT INTO descriptions_sentence(desc_id,video_id,scene_id,
                start_time,end_time,volunteer_id,has_ai,description,ocr,
                scene_num,sentence_id,sentence) VALUES('${currDescriptionId}','${currVideoId}','${currSceneId}',
                    ${currScene_start_time},${currScene_end_time},'${volunteerId}',${hasAi},'${descriptionText}','${ocrText}',
                    ${sceneNum},'${sentence_id}','${s}');`);

            return true;
        } catch(e) {
            console.log(e);
            return false;
        }
    }




async function updateSentencesDescriptionTable(duration, currVideoId, volunteerId, hasAi, sceneNum, relativePath, sentence_id) {
    try {
        await db.query(`UPDATE descriptions_sentence SET audio_length = ${duration}, audiopath = '${relativePath}' where video_id = '${currVideoId}' and volunteer_id = '${volunteerId}' and has_ai=${hasAi} and scene_num=${sceneNum} and sentence_id='${sentence_id}'`);
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
}

async function generateTimestampsforSentencesInDb(){
    
    let sentences = await db.query(`SELECT * FROM descriptions_sentence ORDER BY sentence_id`);
    let size = 0;
    let sentence_duration = [];
    let scene_start_time = [];
    let sentence_video_id = [];
    let sentence_video_end_times = [];
    let sentence_id = [];
    let sentence_scene = [];

    while(size<sentences.length){
        let currSentence = sentences[size];
        sentence_id.push(currSentence.sentence_id); 
        sentence_duration.push( currSentence.audio_length);
        scene_start_time.push(currSentence.start_time);
        sentence_video_id.push(currSentence.video_id);
        sentence_video_end_times.push(currSentence.end_time);
        sentence_scene.push(currSentence.scene_num);
        size++;
    }
// Select unique video ids from video_dialogs_timestamps and create an object (set) from it
    let dialog_video_res  = await db.query(`SELECT DISTINCT video_id FROM video_dialogs_timestamps`);
    let dialog_video_arr = [];
    size = 0;
    for(size =0; size<dialog_video_res.length; size++)
        dialog_video_arr.push(dialog_video_res[size].video_id);
    
    let dialog_video_set = new Set(dialog_video_arr);
    let dialog_timestamps = await db.query(`SELECT * FROM video_dialogs_timestamps ORDER BY video_id, start_time`);
    let dialog_start_time = dialog_timestamps.start_time;
    let dialog_end_time = dialog_timestamps.end_time;
    let dialog_video_id = dialog_timestamps.video_id;
    // let flag = true;
    // let index = dialog_start_time.length - 1;
    let i = sentences.length - 1;
    console.log('Debug: '+dialog_video_arr);
    // let prevVideo = sentence_video_id[sentence_video_id.length - 1];
    
    while(!dialog_video_set.has(sentence_video_id[i]))
        i--;
    

    while(i>=0){
        let currVideo = sentence_video_id[i];
        if(!dialog_video_set.has(currVideo))
        { i--; continue;}
        // Include prevScene as well to change the scene
        let currVideo_dialog = await db.query(`SELECT * FROM video_dialogs_timestamps WHERE video_id = '${currVideo}' ORDER BY start_time`);
        let currDialogStartTimes = [];
        let currDialogEndTimes = [];

        for(let size=0; size < currVideo_dialog.length; size++)
        {
            currDialogStartTimes.push(currVideo_dialog[size]['start_time']);
            currDialogEndTimes.push(currVideo_dialog[size]['end_time']);   
        }

        let index = currDialogStartTimes.length - 1;
        let video_end_time = sentence_video_end_times[i];
        let time_gap = video_end_time - currDialogEndTimes[index];
        let time_start = video_end_time - sentence_duration[i]; // (to check sentence is within the same scene)
        let time_end = video_end_time;

        while(index > 0){
        if(currVideo != sentence_video_id[i])
            break;
        let end_time_sceneNum = await fetchSceneNum(time_end, currVideo, sentence_id[i]);
        let start_time_sceneNum = await fetchSceneNum(time_start, currVideo, sentence_id[i]);
            // if time gap is between two different scenes, break the time gap into two parts for each scene
        if(start_time_sceneNum != end_time_sceneNum)
            {
                let presentSceneNum = sentence_scene[i];
                
                while(presentSceneNum == sentence_scene[i] && currVideo == sentence_video_id[i]){
                    let sceneStartTime = scene_start_time[i];
                    await updateSentenceStartTime(sentence_id[i], sceneStartTime, 'extended');
                    i--;
            }

            index--;
            time_gap = currDialogStartTimes[index+1] - currDialogEndTimes[index];
            time_start = currDialogStartTimes[index+1] - sentence_duration[i]; // (to check sentence is within the same scene)
            time_end = currDialogStartTimes[index+1];
            continue;
        }
    
        if(time_gap <= sentence_duration[i])
        {
            index--;
            time_gap = currDialogStartTimes[index+1] - currDialogEndTimes[index];
            time_start = currDialogStartTimes[index+1] - sentence_duration[i]; // (to check sentence is within the same scene)
            time_end = currDialogStartTimes[index+1];
            continue;
        }

        while(start_time_sceneNum == end_time_sceneNum  && time_gap > sentence_duration[i]){
            await updateSentenceStartTime(sentence_id[i], time_start, 'inline');
            time_gap -= (sentence_duration[i] + 0.1);
            time_start -= (sentence_duration[i] + 0.1);
            time_end -= (sentence_duration[i] + 0.1);
            
            start_time_sceneNum = await fetchSceneNum(time_start, currVideo, sentence_id[i]);
            end_time_sceneNum = await fetchSceneNum(time_end, currVideo, sentence_id[i]);
            i--;
        }
    
    
    }

            // if time gap is between two different scenes, break the time gap into two parts for each scene
        if(index==0 && currVideo == sentence_video_id[i])
            {
                let presentSceneNum = sentence_scene[i];
                
                while(i>= 0 && presentSceneNum == sentence_scene[i]){
                    let sceneStartTime = scene_start_time[i];
                    await updateSentenceStartTime(sentence_id[i], sceneStartTime, 'extended');
                    i--;
            }
        }

}
}

async function fetchSceneNum(timestamp, videoId, sentence_id){
    
    console.log('Scene timestamps: '+timestamp+'  and '+videoId+' and '+sentence_id);
    let newstr = sentence_id.split('_');
    let volunteerId = newstr[0];

    let sceneStartTimesArr = await db.query(`SELECT start_time FROM descriptions_sentence WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);
    let sceneNumArr = await db.query(`SELECT scene_num FROM descriptions_sentence WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);
    console.log('Scene timestamps: '+sceneStartTimesArr+'  and '+sceneNumArr);
    if(timestamp <= 0)
        return -1;
    
    for(let i=0; i<sceneNumArr.length; i++){
        if(sceneStartTimesArr[i]['start_time'] > timestamp)
            return sceneNumArr[i-1]['scene_num'];
    }

    return sceneNumArr[sceneNumArr.length - 1]['scene_num'];
}

async function updateSentenceStartTime(sentence_id, audioStartTime, audioType){
    console.log('Updating sentence timestamp of ' + sentence_id+' : '+audioStartTime+' type: '+audioType);
    try {
        await db.query(`UPDATE descriptions_sentence SET audio_start_time = ${audioStartTime}, audio_type = '${audioType}' where sentence_id = '${sentence_id}'`);
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }   

}

module.exports = {
    generateMp3ForText: generateMp3ForText,
    generateMp3ForAllSentencesInDb: generateMp3ForAllSentencesInDb,
    generateTimestampsforSentencesInDb: generateTimestampsforSentencesInDb,
    // generateMp3ForAllDescriptionsInDb: generateMp3ForAllDescriptionsInDb,
    generateSentencesForAllDescriptionsInDb: generateSentencesForAllDescriptionsInDb
}