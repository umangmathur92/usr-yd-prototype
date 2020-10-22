const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const db = require('../db/database');
const fse = require('fs-extra');
const { getAudioDurationInSeconds } = require('get-audio-duration')
const rimraf = require("rimraf");

async function getMp3DurationForText(inputText) {
    try {
        const client = new textToSpeech.TextToSpeechClient();
        const request = {
            input: {text: inputText},
            voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
            audioConfig: {audioEncoding: 'MP3', "speakingRate": 1.5},
        };
        const [response] = await client.synthesizeSpeech(request);
        const writeFile = util.promisify(fs.writeFile);
        const fileNamePath = 'public/audio/output.mp3';
        await writeFile(fileNamePath, response.audioContent, 'binary');
        console.log('Audio content written to file: output.mp3');

        let duration = await getAudioDurationInSeconds(fileNamePath);

        return duration;
    } catch (error) {
        console.log(error);
        return -1;
    }
}

async function getUniqueMp3DurationForText(inputText) {
    try {
        const client = new textToSpeech.TextToSpeechClient();
        const request = {
            input: {text: inputText},
            voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
            audioConfig: {audioEncoding: 'MP3'},
        };
        const [response] = await client.synthesizeSpeech(request);
        const writeFile = util.promisify(fs.writeFile);
        const uuid = await create_UUID();
        const fileNamePath = `public/audio/unique/output_${uuid}.mp3`;
        await writeFile(fileNamePath, response.audioContent, 'binary');
        console.log('Audio content written to file: output.mp3');

        let duration = await getAudioDurationInSeconds(fileNamePath);

        return duration;
    } catch (error) {
        console.log(error);
        return -1;
    }
}

async function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}
    
    /** Generates mp3 file based on text. Audio is stored in output.mp3 */
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
            audioConfig: {audioEncoding: 'MP3', "speakingRate": 1.5},
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

async function generateAudioDescriptionsInDbWithInfo(vid_id, vol_id, merge=false, res) {
        
            /** Create sentences from the scene description */
        let res1 = await generateSentencesForDescriptionsInDbWithInfo(vid_id, vol_id);
            
            /** Calculate audio durations for the sentences */
        let res2 = await generateMp3ForSentencesInDbWithInfo(vid_id, vol_id, merge);

            /** Insert inline/extended audio descriptions in the video */
        let res3 = await generateTimestampsforSentencesInDbWithInfo(vid_id, vol_id);
        if(!merge){
        await getResponse(vid_id, vol_id, res);
        }
        else{
            /** Merge sentences and audio clips of the sentences based on conitnuity */
        let res4 = await mergeSentenceAudios(vid_id, vol_id);

        return res1 && res2 && res3 && res4;
        }
}


    /** Step 1: Creates separate sentences of given descriptions in the db for all videos & users */
async function generateSentencesForDescriptionsInDbWithInfo(vid_id, vol_id) {
    
    try{
    
        await db.any(`Delete from descriptions_sentence where video_id = '${vid_id}' and volunteer_id = '${vol_id}'`);
    
    } catch (error) {
        console.log(error);
        return false;
    }

    try {
        let descriptionListArr = await db.any(`SELECT * FROM descriptions WHERE video_id = '${vid_id}' AND volunteer_id = '${vol_id}'order by id`);
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
            ocrText = (hasAi && ocrText && ocrText.trim().length>0) ? "\nText on screen : " + ocrText : "";
            let lastChar = descriptionText[descriptionText.length - 1];
            if(descriptionText.length > 0 && lastChar != '.' && lastChar != '!' && lastChar != '?' && lastChar != '\n')
                descriptionText += '.';
            let finalText = descriptionText + ocrText;
            let descType = hasAi ? 'ai' : 'non_ai';
            if(finalText.length == 0)
                continue;
            sentences = finalText.replace(/([.?!\n])\s*(?=[A-Za-z])/g, "$1|").split("|")
            let sentence_id_key = 0;
            let ocr_flag = true;
            is_ocr = false;

            for(s of sentences)
            {
                if(ocr_flag && s.length > 18 && s.substring(0,17) == "Text on screen : "){
                    is_ocr = true;
                    ocr_flag = false;
                }
                let sentence_id = currDescriptionId + '_' + sentence_id_key;
                await insertDescriptionSentencesTable(currDescriptionId,currVideoId,currSceneId,
                                                        currScene_start_time,currScene_end_time,volunteerId,hasAi,descriptionText,ocrText,
                                                        sceneNum,finalText,sentence_id,s, is_ocr);
                sentence_id_key += 1;
            }
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function insertDescriptionSentencesTable(currDescriptionId,currVideoId,currSceneId,
    currScene_start_time,currScene_end_time,volunteerId,hasAi,descriptionText,ocrText,
    sceneNum,finalText,sentence_id,s, is_ocr){
        try {
            await db.query(`INSERT INTO descriptions_sentence(desc_id,video_id,scene_id,
                start_time,end_time,volunteer_id,has_ai,description,ocr,
                scene_num,sentence_id,sentence, is_ocr) VALUES('${currDescriptionId}','${currVideoId}','${currSceneId}',
                    ${currScene_start_time},${currScene_end_time},'${volunteerId}',${hasAi},'${descriptionText}','${ocrText}',
                    ${sceneNum},'${sentence_id}','${s}', ${is_ocr});`);

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

/** Step 2: Generates mp3 audio files for all the sentences  */
async function generateMp3ForSentencesInDbWithInfo(vid_id, vol_id, merge = false) {

    try{
        let sentenceListArr = await db.any(`SELECT * FROM descriptions_sentence WHERE video_id = '${vid_id}' AND volunteer_id = '${vol_id}' order by scene_num, sentence_id`);
        
        rimraf.sync(`public/audio/${vid_id}/ai/${vol_id}`);

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
            ocrText = (hasAi && ocrText && ocrText.trim().length>0) ? "\nText on screen : " + ocrText : "";
            let lastChar = descriptionText[descriptionText.length - 1];
            if(lastChar != null && lastChar != '.' && lastChar != '!' && lastChar != '?')
                descriptionText += '.';
            let finalText = descriptionText + ocrText;
            let descType = hasAi ? 'ai' : 'non_ai';
            let sent = currSentence.sentence;
            let str = currSentence.sentence_id;
            let newstr = str.split('_');
            let sentNum = newstr[newstr.length - 1]; 
            let fileNamePath = '';
            if(merge)
                fileNamePath = `public/audio/${currVideoId}/${descType}/${volunteerId}/${sceneNum}/${sentNum}.mp3`;
            else
                fileNamePath = `public/audio/${currVideoId}/${descType}/${volunteerId}/${sceneNum}/${sentNum}.mp3`;

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
    /** API for generating timestamps for audio descriptions for a scene */
async function generateTimestampsforScene(dbVideoId, dbVolId, sceneId, description){

        let sentences = description.replace(/([.?!\n])\s*(?=[A-Za-z])/g, "$1|").split("|");
        let sentence_duration = []

        for(let s of sentences){
            let dur = await getUniqueMp3DurationForText(s);
            sentence_duration.push(dur);
        }
    
        let sceneInfo = await db.query(`SELECT * FROM descriptions WHERE video_id='${dbVideoId}' and volunteer_id='${dbVolId}' and scene_id='${sceneId}'`);
        let size = 1;
        // let scene_duration = scene_end_time - scene_start_time;
        let scene_start_time = sceneInfo[0].start_time;
        let scene_end_time = sceneInfo[0].end_time;
        let scene_num = sceneInfo[0].scene_num;

        let dialog_timestamps = await db.query(`SELECT * FROM video_dialogs_ocr WHERE video_id = '${dbVideoId}' ORDER BY start_time`);
        let currDialogStartTimes = [];
        let currDialogEndTimes = [];
        let len = dialog_timestamps.length - 1;

        for(let size=0; size <= len; size++)
        {
            currDialogStartTimes.push(dialog_timestamps[size]['start_time']);
            currDialogEndTimes.push(dialog_timestamps[size]['end_time']);   
        }

        while(currDialogEndTimes[len] > scene_end_time){
            len--;
        }
        
        let s = sentences.length - 1;
        let flag = true;
        let time_gap = 0;
        if(len>=0)
            time_gap = scene_end_time - currDialogEndTimes[len];
        else
            time_gap = scene_end_time - scene_start_time;
        let time_end = scene_end_time - 0.1; 
        let time_start = time_end - sentence_duration[s];
        let res = [];

        while(len >= 0 && (flag || currDialogStartTimes[len] > scene_start_time) && s >= 0 && time_gap > -1){

                if( time_gap > sentence_duration[s]){
                    let obj = {};
                    obj['sentence'] = sentences[s];
                    obj['audio_duration'] = sentence_duration[s];
                    obj['start time'] = time_start.toFixed(3);
                    obj['end time'] = time_end.toFixed(3);
                    obj['audio_type'] = 'inline';
                    res.push(obj);
                    s--;
                    if(s<0)
                        break;

                    time_gap -= sentence_duration[s];
                    time_end = time_start - 0.1;
                    time_start = time_end - sentence_duration[s];
                    // flag = false;
                    continue;
                }
                len--;
                if(len < 0)
                    break;
                time_gap = currDialogStartTimes[len+1] - currDialogEndTimes[len];
                time_end =  currDialogStartTimes[len+1] - 0.1; 
                time_start = time_end - sentence_duration[s];
                flag = false;
        }

        while(s >= 0){
            let obj = {};
            obj['sentence'] = sentences[s];
            obj['audio_duration'] = sentence_duration[s];
            obj['start time'] = scene_start_time;
            obj['end time'] = 'N/A';
            obj['audio_type'] = 'extended';
            res.push(obj);
            s--;
        }

        return res;
}

    /** Step 3: Insert audio descriptions inline/extended in the video for a particular user and video*/
async function generateTimestampsforSentencesInDbWithInfo(dbVideoId, dbVolId){
    try{
        console.log("Video_id is: "+dbVideoId);
    let sentences = await db.query(`SELECT * FROM descriptions_sentence WHERE video_id='${dbVideoId}' and volunteer_id='${dbVolId}' ORDER BY scene_num, sentence_id`);
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

    // Call fn for generating time gaps
    await generateTimeGaps(dbVideoId,dbVolId);
    
    let time_gaps_info = await db.query(`SELECT * FROM video_time_gaps WHERE video_id = '${dbVideoId}' and volunteer_id = '${dbVolId}'`);

    let time_gaps_start_time = [];
    let time_gaps_end_time = [];
    let time_gaps_scene_num = [];
    let time_gaps_is_overlap = [];

    for(let item = 0; item < time_gaps_info.length; item++)
    {
        time_gaps_data = time_gaps_info[item];
        time_gaps_start_time.push(time_gaps_data.start_time);
        time_gaps_end_time.push(time_gaps_data.end_time);
        time_gaps_scene_num.push(time_gaps_data.scene_num);
        time_gaps_is_overlap.push(time_gaps_data.is_overlap);
    }
    let i = 0, j = 0, k=0;
    let currScene = sentence_scene[0];
        /** Fetch All OCR extended timestamps */
        let ocrExtendedTimestamps = await db.query(`SELECT audio_start_time FROM descriptions_ocr WHERE video_id='${dbVideoId}' AND audio_type='extended' ORDER BY audio_start_time`);
        let ocrExtendedTimestampsLen = ocrExtendedTimestamps.length;

    while(i < sentences.length && j < time_gaps_info.length){

                /** Extended */
        if(time_gaps_scene_num[j] > sentence_scene[i]){
                let presentSceneNum = sentence_scene[i];
                
                while(presentSceneNum == sentence_scene[i] ){
                    let sceneEndTime = sentence_video_end_times[i];

                    await updateSentenceStartTime(sentence_id[i], sceneEndTime, 'extended');
                    i++;
        }
    }

        currScene = sentence_scene[i];

        while( j < time_gaps_info.length && time_gaps_scene_num[j] < currScene)
            j++;
        
        let time_start = time_gaps_start_time[j]; // May have to add error '0.01'
        let time_end = time_gaps_end_time[j];
        
        if( j != 0 && time_gaps_is_overlap[j-1])
            time_start = scene_start_time[i];

        let time_gap = time_end - time_start;

        // let end_time_sceneNum = await fetchSceneNum(time_end, currVideo, sentence_id[i]);
        // let start_time_sceneNum = await fetchSceneNum(time_start, currVideo, sentence_id[i]);

        while(i < sentences.length  && time_gap > sentence_duration[i] && currScene == sentence_scene[i] && time_gaps_scene_num[j] == sentence_scene[i]){

            while(k < ocrExtendedTimestampsLen && time_start > ocrExtendedTimestamps[k]['audio_start_time']){
                k++;
            }
            let ocrCollisionEndTime = time_start + sentence_duration[i];
            let ocrCollisionCheckRes = await checkOcrAndInlineCollision(time_start, ocrCollisionEndTime, ocrExtendedTimestamps, k);

            // if( time_start < ocrExtendedTimestamps[k]['audio_start_time'] && ocrExtendedTimestamps[k]['audio_start_time'] < time_start + sentence_duration[i])
            if (ocrCollisionCheckRes['isCollision'])
            {
                // time_start = ocrExtendedTimestamp[k]['audio_start_time'] + 0.1;
                time_gap -= (ocrCollisionCheckRes['newTimestamp'] - time_start);
                time_start = ocrCollisionCheckRes['newTimestamp'];
                continue;
            }

            await updateSentenceStartTime(sentence_id[i], time_start, 'inline');
            time_gap -= (sentence_duration[i] + 0.1);
            i++;

            if(i >= sentences.length){break;}
            
            time_start += sentence_duration[i-1] + 0.1;
        }

        j++;

}

    while(i < sentences.length){
        let presentSceneNum = sentence_scene[i];
                
        let sceneEndTime = sentence_video_end_times[i];
        await updateSentenceStartTime(sentence_id[i], sceneEndTime, 'extended');
        i++;
}

} catch (error) {
        console.log(error);
        return false;
    }

}

async function checkOcrAndInlineCollision(startTime, endTime, ocrExtendedTimestampsArr, k){

    let isCollision = false;
    let newTimestamp = startTime;
    let len = ocrExtendedTimestampsArr.length;

    for(let i=k; i<len; i++){
        if( startTime < ocrExtendedTimestampsArr[i]['audio_start_time'] && ocrExtendedTimestampsArr[i]['audio_start_time'] < endTime){            
            
            isCollision = true;
            newTimestamp = ocrExtendedTimestampsArr[i]['audio_start_time'] + 0.1;
            break;
        }
    }

    return {'isCollision' : isCollision, 'newTimestamp' : newTimestamp};

}

async function generateTimeGaps(vid_id,vol_id){

    try{

        await db.any(`Delete from video_time_gaps where video_id = '${vid_id}' and volunteer_id = '${vol_id}'`);
    
    } catch (error) {
        console.log(error);
        return false;
    }


// try{

//     let res = await db.any(`Select * FROM video_time_gaps where video_id = '${vid_id}'`);
//     if(res.length > 0)
//         return true;

// } catch (error) {
//     console.log(error);
//     return false;
// }

let descriptionListArr = await db.any(`SELECT * FROM descriptions WHERE video_id = '${vid_id}' AND volunteer_id = '${vol_id}'order by scene_num`);

let scenes = {};
let newStartTimes = [];

for(let i=0; i<descriptionListArr.length; i++) {
    let currDescription = descriptionListArr[i];
    times = {};
    times["start_time"] = currDescription.start_time;
    times["end_time"] = currDescription.end_time;
    times["video_dialogs"] = [];
    newStartTimes.push(currDescription.start_time);
    scenes[currDescription.scene_num] = times;  
    // scenes.push(times);
}

// let descriptionOcrListArr = await db.any(`SELECT * FROM descriptions_ocr WHERE video_id = '${vid_id}' AND volunteer_id = '${vol_id}'order by timestamp`);
// Combine OCR extended audio_timestamps with scene details and fetch video time gaps from the new list
// newStartTimes.push(currOcrDescription.audio_start_time);


let video_dialogs = await db.any(`SELECT * FROM video_dialogs_ocr WHERE video_id = '${vid_id}' order by start_time`);

for(let i=0; i<video_dialogs.length; i++) {
    let currDialog = video_dialogs[i];

    let cd_startTime = currDialog.start_time;
    let cd_endTime = currDialog.end_time;
    let begin = await fetchSceneNum(cd_startTime, vid_id, vol_id + "_parse");
    let end = await fetchSceneNum(cd_endTime, vid_id, vol_id);

    if(begin == end){
        let vdObj = {};
        vdObj["start_time"] = cd_startTime;
        vdObj["end_time"] = cd_endTime;

        scenes[begin]["video_dialogs"].push(vdObj);
    }
    else{
        let i = begin;
        
        while(i <= end){
            let begin_time = 0, end_time = 0;
            let vdObj = {};

            if(!(scenes.hasOwnProperty(i)))
                {i++; continue;}
            
            if(i == begin)
                begin_time = cd_startTime;
            else

                begin_time = scenes[i]["start_time"];

            if(i == end)
                end_time = cd_endTime;
            else
                end_time = scenes[i]["end_time"];

            vdObj["start_time"] = begin_time;
            vdObj["end_time"] = end_time;    
            scenes[i]["video_dialogs"].push(vdObj);
            i++;
        }
    }
}

    for(scene of Object.keys(scenes)){

        let video_dialogs = scenes[scene]["video_dialogs"]
        let scene_num = scene;
        let scene_startTime = scenes[scene]["start_time"];
        let scene_endTime = scenes[scene]["end_time"];
        let is_overlap = false;
        let i = 0, len = video_dialogs.length;
        
        // if(len == 0){
        //     await db.query(`INSERT INTO video_time_gaps(video_id, scene_num,
        //                 start_time, end_time, is_diff_scene) VALUES ('${vid_id}', ${scene_num}, ${scene_startTime}, ${scene_endTime}, ${is_overlap})`);
        // }

        while(i <= len){
            let time_start = 0, time_end = 0;

            if(i == 0)
                time_start = scene_startTime;
            else
                time_start = video_dialogs[i-1]["end_time"];
            
            if(i == len)
                time_end = scene_endTime;
            else
                time_end = video_dialogs[i]["start_time"];

            if(time_start !== time_end)
                await db.query(`INSERT INTO video_time_gaps(video_id, volunteer_id, scene_num,
                            start_time, end_time, is_diff_scene) VALUES ('${vid_id}', '${vol_id}', ${scene_num}, ${time_start}, ${time_end}, ${is_overlap})`);
            i++;
        }
    }
}


    /** Fetch scene num from a given timestamp, videoId */
async function fetchSceneNum(timestamp, videoId, sentence_id){
    
    console.log('Scene timestamps: '+timestamp+'  and '+videoId+' and '+sentence_id);
    let newstr = sentence_id.split('_');
    let volunteerId = newstr[0];

    let sceneStartTimesArr = await db.query(`SELECT start_time FROM descriptions WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);
    let sceneNumArr = await db.query(`SELECT scene_num FROM descriptions WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);
    // console.log('Scene timestamps: '+sceneStartTimesArr+'  and '+sceneNumArr);
    if(timestamp < 0)
        return -1;
    
    // for(let i=0; i<sceneNumArr.length; i++){
    //     if(sceneStartTimesArr[i]['start_time'] > timestamp)
    //         return sceneNumArr[i-1]['scene_num'];
    // }

    // return sceneNumArr[sceneNumArr.length - 1]['scene_num'];
    
    let start = 0;
    let end = sceneNumArr.length - 1;
    let index = -1;
    while(start <= end) {
        let mid = Math.floor((start + end)/2);
        if(sceneStartTimesArr[mid]['start_time'] == timestamp) {
            index = mid;
            break;
        } else if(sceneStartTimesArr[mid]['start_time'] < timestamp) {
            index = mid;
            start = mid + 1;
        } else {
            end = mid - 1;
        }
    }
    // return index;
    return sceneNumArr[index]['scene_num'];
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
/** Step 4: Merge all continuous audio clips  */
async function mergeSentenceAudios(video_id, vol_id){

    try{

        await db.any(`Delete from descriptions_new_sentence where video_id = '${video_id}' and volunteer_id = '${vol_id}'`);
    
    } catch (error) {
        console.log(error);
        return false;
    }
    
    try{
    let sentenceListArr = await db.any(`SELECT * FROM descriptions_sentence WHERE video_id = '${video_id}' AND volunteer_id = '${vol_id}' ORDER BY scene_num, id`);
    let size = 0;
    let sentence = [];
    let sentence_id = [];
    let sentence_desc = [];
    let sentence_ocr = [];
    let sentence_duration = [];
    let scene_start_time = [];
    let scene_end_time = [];
    let sentence_video_id = [];
    let sentence_video_end_times = [];
    let sentence_scene = [];
    let sentence_audio_type = [];
    let sentence_audio_start_time = [];
    let sentence_audio_path = [];

    while(size<sentenceListArr.length){
        let currSentence = sentenceListArr[size];
        sentence.push(currSentence.sentence);
        sentence_id.push(currSentence.sentence_id); 
        sentence_desc.push(currSentence.description);
        sentence_ocr.push(currSentence.ocr);
        sentence_duration.push( currSentence.audio_length);
        scene_start_time.push(currSentence.start_time);
        scene_end_time.push(currSentence.end_time);
        sentence_video_id.push(currSentence.video_id);
        sentence_video_end_times.push(currSentence.end_time);
        sentence_scene.push(currSentence.scene_num);
        sentence_audio_type.push(currSentence.audio_type);
        sentence_audio_start_time.push(currSentence.audio_start_time);
        sentence_audio_path.push(currSentence.audiopath);
        size++;
    }

    let i = 0;
    let l = sentenceListArr.length;
    let path_val = 0;

    while(i < l){
        let new_sentence = sentence[i];
        let currSceneNum = sentence_scene[i];
        let currSceneStartTime = scene_start_time[i];
        let currSceneEndTime = scene_end_time[i];
        let currSceneDesc = sentence_desc[i] + sentence_ocr[i];

        let currAudioType = sentence_audio_type[i];
        let audioStartTime = sentence_audio_start_time[i];
        let oldAudioStartTime = audioStartTime;
        let oldAudioDur = sentence_duration[i];
        let totalAudioDur = oldAudioDur;
        let currAudioPath = sentence_audio_path[i];
        let sentence_id_first = sentence_id[i];
        let sentence_id_last = sentence_id[i];

        if(new_sentence.length>0 && new_sentence[new_sentence.length-1] == `\n`)
            new_sentence=new_sentence.replace('\n','.');

        i++;

        while(currSceneNum == sentence_scene[i] && currAudioType == sentence_audio_type[i] && i < l){

            if(currAudioType == 'inline' && (oldAudioStartTime + oldAudioDur + 0.11) < sentence_audio_start_time[i] )
                break;
            
            if(sentence[i].length>0 && sentence[i][sentence[i].length-1] == `\n`)
                    sentence[i]=sentence[i].replace('\n','.');

            new_sentence += (' ' + sentence[i]);
            oldAudioStartTime = sentence_audio_start_time[i];
            oldAudioDur = sentence_duration[i];
            totalAudioDur += oldAudioDur;
            sentence_id_last = sentence_id[i];

            i++;
        }
        await updateNewSentence(sentence_id_first, sentence_id_last,
             currSceneNum, currSceneStartTime, currSceneEndTime, currSceneDesc,
              currAudioType, audioStartTime, totalAudioDur, currAudioPath,  new_sentence, path_val);

        if(currSceneNum == sentence_scene[i] && currAudioType == sentence_audio_type[i] && i < l)
            path_val += 1;
        else
            path_val = 0;
            
    }

} catch (error) {
    console.log(error);
    return false;
}
}

async function getResponse(vid_id, vol_id, res){

        let sentenceListArr = await db.any(`SELECT * FROM descriptions_sentence WHERE video_id = '${vid_id}' AND volunteer_id = '${vol_id}' order by scene_num, sentence_id`);
        
        let result = {};

        let sceneMap = {};

        for(let i=0; i<sentenceListArr.length; i++) {

            let currSentence = sentenceListArr[i];
            let currSentenceId = currSentence.sentence_id;
            let currDescriptionId = currSentence.desc_id;
            let currVideoId = currSentence.video_id;
            let currSceneId = currSentence.scene_id;
            let currScene_start_time = currSentence.start_time;
            let currScene_end_time = currSentence.end_time;
            let volunteerId = currSentence.volunteer_id;
            let hasAi = currSentence.has_ai;
            let descriptionText = currSentence.description;
            let ocrText = currSentence.ocr;
            let is_ocr = currSentence.is_ocr;
            let sceneNum = currSentence.scene_num;
            let currAudioPath = currSentence.audiopath;
            let currAudioType = currSentence.audio_type;
            let currAudioStartTime = currSentence.audio_start_time;
            let currAudioLength = currSentence.audio_length;
            let currSent = currSentence.sentence;

            if(!(result.hasOwnProperty(currSceneId))){
                result[currSceneId] = {};
                result[currSceneId]["description"] = descriptionText; 
                result[currSceneId]["ocr"] = ocrText; 
                result[currSceneId]["sentences"] = [];
                result[currSceneId]["ocr sentences"] = [];
                result[currSceneId]["empty gaps"] = [];
                sceneMap[sceneNum] = currSceneId;
            }

            let sentenceObj = {};
            sentenceObj["sentence id"] = currSentenceId;
            sentenceObj["sentence"] = currSent;
            sentenceObj["audio type"] = currAudioType;
            sentenceObj["audio start time"] = currAudioStartTime;
            sentenceObj["audio duration"] = currAudioLength;
            sentenceObj["url"] = "http://18.221.192.73:5001" + currAudioPath.substring(2,currAudioPath.length);
            
            if(!is_ocr)
                result[currSceneId]["sentences"].push(sentenceObj);
            else
                result[currSceneId]["ocr sentences"].push(sentenceObj);
        }

          let time_gaps_info = await db.query(`SELECT * FROM video_time_gaps WHERE video_id = '${vid_id}' and volunteer_id = '${vol_id}' ORDER BY scene_num, start_time`);

    for(let item = 0; item < time_gaps_info.length; item++)
    {
        time_gaps_data = time_gaps_info[item];
        let time_gaps_start_time = time_gaps_data.start_time;
        let time_gaps_end_time = time_gaps_data.end_time;
        let time_gaps_scene_num = time_gaps_data.scene_num;
        let time_gaps_is_overlap = time_gaps_data.is_overlap;


        gapObj = {};
        gapObj["start time"] = time_gaps_start_time;
        gapObj["end time"] = time_gaps_end_time;
        let scene_id = sceneMap[time_gaps_scene_num];

        result[scene_id]["empty gaps"].push(gapObj);

    }
    result["dialog timestamps"] = [];
    let dialog_ts_info = await db.query(`SELECT * FROM video_dialogs WHERE video_id = '${vid_id}' ORDER BY start_time`);

    for(let item = 0; item < dialog_ts_info.length; item++)
    {
        dialog_ts_data = dialog_ts_info[item];
        let dialog_ts_start_time = dialog_ts_data.start_time;
        let dialog_ts_end_time = dialog_ts_data.end_time;

        dialogObj = {};
        dialogObj["start time"] = dialog_ts_start_time;
        dialogObj["end time"] = dialog_ts_end_time;

        result["dialog timestamps"].push(dialogObj);

    }

    res.send(result);

    
}

async function updateNewSentence(sentence_id_first, sentence_id_last, currSceneNum, currSceneStartTime, currSceneEndTime, currSceneDesc, currAudioType, audioStartTime, totalAudioDur, currAudioPath, sentence, path_val){
    
    let newstr = sentence_id_last.split('_');
    let sentence_id = sentence_id_first + '_' + newstr[newstr.length - 1];
    let vol_id = newstr[0];
    let video_id = newstr[1];
    let str = currAudioPath.split('/');
    let audio_path = '';
    let file_path = 'public/';

    for(let i=0; i<str.length-1; i++)
        audio_path += (str[i] + '/');
    for(let i=1; i<str.length-1; i++)
        file_path += (str[i] + '/');

    // audio_path = audio_path + 'new/' + currAudioType + '.mp3';
    if(path_val ==0)
        {file_path = file_path + 'new/' + currAudioType + '.mp3';
        audio_path = audio_path + 'new/' + currAudioType + '.mp3';}
    else
        {file_path = file_path + 'new/' + currAudioType + '_' + String(path_val) + '.mp3';
        audio_path = audio_path + 'new/' + currAudioType + '_' + String(path_val) + '.mp3';}

    console.log('******************************************************************************************************************');
    console.log('Audio path is: '+audio_path);
    console.log('File path is: '+file_path);

    // console.log('sentence_id_first', sentence_id_first);
    // console.log('sentence_id_last' + sentence_id_last);
    console.log('currSceneNum: ' + currSceneNum);
    // console.log('currSceneStartTime: ' + currSceneStartTime);
    // console.log('currSceneEndTime: ',currSceneEndTime);
    // console.log('currSceneDesc' + currSceneDesc);
    
    // console.log('currAudioType: ' + currAudioType);
    // console.log('audioStartTime: ' + audioStartTime);
    await generateMp3ForTextInFileystem(file_path, sentence);
    let duration = await getAudioDurationInSeconds(file_path);
    console.log('duration ' + duration);
    console.log('totalAudioDur: ' + totalAudioDur);
    console.log('sentence' + sentence);
    console.log('******************************************************************************************************************');

    try {
        await db.query(`INSERT INTO descriptions_new_sentence(video_id, volunteer_id, scene_num,
            start_time,end_time,description,sentence,audio_type,audio_start_time,audio_length,audio_path,
            sentence_id) VALUES('${video_id}','${vol_id}',${currSceneNum},
                ${currSceneStartTime},${currSceneEndTime},'${currSceneDesc}','${sentence}','${currAudioType}',${audioStartTime},${duration},'${audio_path}',
                '${sentence_id}');`);

        return true;
    } catch(e) {
        console.log(e);
        return false;
    }

}

module.exports = {
    generateMp3ForText: generateMp3ForText,
    generateAudioDescriptionsInDbWithInfo: generateAudioDescriptionsInDbWithInfo,
    generateTimestampsforScene: generateTimestampsforScene,
    generateTimestampsforSentencesInDbWithInfo: generateTimestampsforSentencesInDbWithInfo,
    mergeSentenceAudios: mergeSentenceAudios 
}