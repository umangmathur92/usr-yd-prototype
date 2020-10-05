const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const db = require('../db/database');
const fse = require('fs-extra');
const { getAudioDurationInSeconds } = require('get-audio-duration')
const rimraf = require("rimraf");


async function generateAudioDescriptionsForOCRInDbWithInfo(vid_id, vol_id, res) {
        
    await generateMp3ForOCR(vid_id, vol_id);
    await generateTimestampsForOCR(vid_id, vol_id);
}

async function generateMp3ForOCR(vid_id, vol_id){
    
    try{
        let OCRListArr = await db.any(`SELECT * FROM descriptions_ocr WHERE video_id = '${vid_id}' AND volunteer_id = '${vol_id}' order by timestamp`);
        
        rimraf.sync(`public/audio/${vid_id}/ai/${vol_id}/ocr`);

        for(let i=0; i<OCRListArr.length; i++) {

            let currOCR = OCRListArr[i];
            let ocrId = currOCR.ocr_id;
            let ocrText = currOCR.text;
            let fileNamePath = `public/audio/${vid_id}/ai/ocr/${ocrId}.mp3`;

            let relativePath = fileNamePath.replace('public', '..');

            await generateMp3ForTextInFileystem(fileNamePath, ocrText);
            let duration = await getAudioDurationInSeconds(fileNamePath);
            console.log(duration);
            // update duration in OCR table
            await updateOCRTable(duration, vid_id, vol_id, ocrId, relativePath);
        }
        return true;

    } catch(error){
        console.log(error);
        return false;
    }

}

async function updateOCRTable(duration, vid_id, vol_id, ocrId, relativePath){

    try {
        await db.query(`UPDATE descriptions_ocr SET audio_duration = ${duration}, audio_path = '${relativePath}' where video_id = '${vid_id}' and ocr_id='${ocrId}'`);
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }

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

for(let i=0; i<descriptionListArr.length; i++) {
    let currDescription = descriptionListArr[i];
    times = {};
    times["start_time"] = currDescription.start_time;
    times["end_time"] = currDescription.end_time;
    times["video_dialogs"] = [];

    scenes[currDescription.scene_num] = times;    
}

let video_dialogs = await db.any(`SELECT * FROM video_dialogs WHERE video_id = '${vid_id}' order by start_time`);

for(let i=0; i<video_dialogs.length; i++) {
    let currDialog = video_dialogs[i];

    let cd_startTime = currDialog.start_time;
    let cd_endTime = currDialog.end_time;
    let begin = await fetchSceneNum(cd_startTime, vid_id, vol_id);
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

/** Fetch scene details (scene num, start time, end time) from a given timestamp, videoId */
async function fetchSceneDetails(timestamp, videoId, sentence_id){
    
    console.log('Scene timestamps: '+timestamp+'  and '+videoId+' and '+sentence_id);
    let newstr = sentence_id.split('_');
    let volunteerId = newstr[0];

    let sceneStartTimesArr = await db.query(`SELECT start_time FROM descriptions WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);
    let sceneNumArr = await db.query(`SELECT scene_num, start_time, end_time FROM descriptions WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);
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
    let sceneInfo = {
        'sceneNum' : sceneNumArr[index]['scene_num'],
        'startTime' : sceneNumArr[index]['start_time'],
        'endTime' : sceneNumArr[index]['end_time']
    };
    
    return sceneInfo;
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

async function fetchSceneEndtime(timestamp, videoId, sentence_id){
    
    console.log('Scene timestamps: '+timestamp+'  and '+videoId+' and '+sentence_id);
    let newstr = sentence_id.split('_');
    let volunteerId = newstr[0];

    let sceneStartTimesArr = await db.query(`SELECT start_time FROM descriptions WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);
    let sceneNumArr = await db.query(`SELECT end_time FROM descriptions WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);
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
    return sceneNumArr[index]['end_time'];
}

async function generateTimestampsForOCR(vid_id, vol_id){

    // Call fn for generating time gaps
    //await generateTimeGaps(vid_id, vol_id);
    
    let time_gaps_info = await db.any(`SELECT * FROM video_dialogs WHERE video_id = '${vid_id}' order by start_time`);
    
    // let time_gaps_info = await db.query(`SELECT * FROM video_time_gaps WHERE video_id = '${vid_id}' and volunteer_id = '${vol_id}'`);

    let time_gaps_start_time = [];
    let time_gaps_end_time = [];
    let time_gaps_scene_num = [];
    let time_gaps_is_overlap = [];

    for(let item = 0; item < time_gaps_info.length; item++)
    {
        time_gaps_data = time_gaps_info[item];
        time_gaps_start_time.push(time_gaps_data.start_time);
        time_gaps_end_time.push(time_gaps_data.end_time);
        // time_gaps_scene_num.push(time_gaps_data.scene_num);
        // time_gaps_is_overlap.push(time_gaps_data.is_overlap);
    }

    let video_start_time = await fetchVideoStartTime(vid_id, vol_id);
    let video_end_time = await fetchVideoEndTime(vid_id, vol_id);
    // let video_start_time = Math.max(...video_end_times);

    let ocr_info = await db.query(`SELECT * FROM descriptions_ocr WHERE video_id = '${vid_id}' and volunteer_id = '${vol_id}'`);

    let ocr_id = [];
    let ocr_text = [];
    let ocr_timestamp = [];
    let ocr_time_duration = [];

    for(let item = 0; item < ocr_info.length; item++)
    {
        ocr_data = ocr_info[item];
        ocr_id.push(ocr_data.ocr_id);
        ocr_text.push(ocr_data.text);
        ocr_timestamp.push(ocr_data.timestamp);
        ocr_time_duration.push(ocr_data.audio_duration);
    }

    let iter_idx = 0;
    let flag = true;
    let time_start = 0;
    let time_end = 0;
    let time_gap = 0;
    let inline_times = [];

    for(let i = 0; i < ocr_info.length; i++){
        // time_gaps_start_time.sort();
        // time_gaps_end_time.sort();

        let sceneEndTime = await fetchSceneEndtime(ocr_timestamp[i], vid_id, vol_id);
        resObj = await fetchNearestDialogInfo(ocr_timestamp[i], ocr_time_duration[i], time_gaps_start_time, time_gaps_end_time, video_end_time, sceneEndTime);

        if (resObj['isInline']){
            
            let startTime = resObj['start_time'];
            let endTime = resObj['start_time'] + ocr_time_duration[i];

            // time_gaps_start_time.push(startTime);
            // time_gaps_end_time.push(endTime);

            // Insert in db as inline at ocr_timestamp[i] as start time
                await updateOCRTableAudioType(vid_id, ocr_id[i], startTime, 'inline');
            // Insert in db (new table) as video_dialog
            let obj = {'start_time' : startTime,
                        'end_time' : endTime}
            inline_times.push(obj);

        }
        else{
            // Insert in db as extended at time_end
                await updateOCRTableAudioType(vid_id, ocr_id[i], resObj['start_time'], 'extended');
            // Insert in db (new table) as scene_end_time (corner case: if we've to play OCR and description together as extended)

        }
        flag = false;
    }

    insertIntoVideoDialogsAndOCR(vid_id, vol_id, inline_times);

}

async function updateOCRTableAudioType(vid_id, ocrId, startTime, audioType){

    try {
        await db.query(`UPDATE descriptions_ocr SET audio_start_time = ${startTime}, audio_type = '${audioType}' where video_id = '${vid_id}' and ocr_id='${ocrId}'`);
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
}

async function insertIntoVideoDialogsAndOCR(vid_id, vol_id, inline_times){

    let video_dialogs = await db.any(`SELECT * FROM video_dialogs WHERE video_id = '${vid_id}' order by start_time`);
    
    await db.any(`DELETE FROM video_dialogs_ocr where video_id = '${vid_id}'`);

    for(let i=0; i<video_dialogs.length; i++) {
        let currDialog = video_dialogs[i];

        let cd_startTime = currDialog.start_time;
        let cd_endTime = currDialog.end_time;

        await db.query(`INSERT INTO video_dialogs_ocr(video_id, start_time, end_time) VALUES('${vid_id}', ${cd_startTime}, ${cd_endTime})`);
    }

    for(let i=0; i<inline_times.length; i++) {
        let curr = inline_times[i];

        let it_startTime = curr.start_time;
        let it_endTime = curr.end_time;

        await db.query(`INSERT INTO video_dialogs_ocr(video_id, start_time, end_time) VALUES('${vid_id}', ${it_startTime}, ${it_endTime})`);
    }
}
        /** Add new dialog times in array as well and sort them */
async function fetchNearestDialogInfo(timestamp, duration, startTimesArr, endTimesArr, videoEndTime, sceneEndTime){ 

    let i =0, l=startTimesArr.length;
    let result = {}

    while(i < l && timestamp > startTimesArr[i]){
        i++;
    }
    let startTime1 = i==0 ? 0 : startTimesArr[i-1];
    let endTime1 = i==0 ? 0 : endTimesArr[i-1];

    let startTime2 = i==l ? videoEndTime : startTimesArr[i];
    let endTime2 = i==l ? videoEndTime : endTimesArr[i];

    if(timestamp > endTime1){
        if (duration < (startTime2 - timestamp))
        {
            result['isInline'] = true;
            result['start_time'] = timestamp;
            return result;
        }
        else{
            result['isInline'] = false;
            result['start_time'] = timestamp;
            return result;
        }
    }
    else{
        if (sceneEndTime > endTime1 && duration < (Math.min(startTime2, sceneEndTime) - endTime1))
        {
            result['isInline'] = true;
            result['start_time'] = endTime1; // or scene_end time
            return result;
        }
        else{
            result['isInline'] = false;
            result['start_time'] = Math.min(endTime1,sceneEndTime); // or scene_end time
            return result;
        }
    }
    
}

async function fetchVideoStartTime(vid_id, vol_id){
    let videoStartTimesArr = await db.query(`SELECT start_time FROM descriptions WHERE video_id = '${vid_id}' and volunteer_id = '${vol_id}' ORDER BY scene_num`);
    return videoStartTimesArr[0].start_time;
    // let videoStartTimes = [];
    // for(let i=0; i<videoStartTimesArr.length; i++){
    //     let startTime = videoStartTimesArr[i].start_time;
    //     videoStartTimes.push(startTime);
    // }

}

async function fetchVideoEndTime(vid_id, vol_id){
    let videoEndTimesArr = await db.query(`SELECT end_time FROM descriptions WHERE video_id = '${vid_id}' and volunteer_id = '${vol_id}' ORDER BY scene_num DESC`);
    return videoEndTimesArr[0].end_time;
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
    /** To merge the extended audio clips into descriptions_new_sentence table */
async function mergeOCRExtendedAudio(vid_id, vol_id){
    
     let OCRListArr = await db.any(`SELECT * FROM descriptions_ocr WHERE video_id = '${vid_id}' AND volunteer_id = '${vol_id}' order by timestamp`);

    for(let i=0; i<OCRListArr.length; i++) {

        let currOCR = OCRListArr[i];
        let ocrId = currOCR.ocr_id;
        let ocrText = currOCR.text;
        let ocrAudioType = currOCR.audio_type;
        let ocrAudioStartTime = currOCR.audio_start_time;
        let ocrAudioDur = currOCR.audio_duration;
        let ocrAudioPath = currOCR.audio_path;
    
        let sceneObj = await fetchSceneDetails(ocrAudioStartTime, vid_id, vol_id);

                await db.query(`INSERT INTO descriptions_new_sentence (sentence_id, video_id, volunteer_id, scene_num, start_time, end_time, description, sentence, audio_type, audio_start_time, audio_length, audio_path) 
                    VALUES ('${ocrId}', '${vid_id}', '${vol_id}', ${sceneObj.sceneNum}, ${sceneObj.startTime}, ${sceneObj.endTime}, '${ocrText}', '${ocrText}', '${ocrAudioType}', ${ocrAudioStartTime}, ${ocrAudioDur}, '${ocrAudioPath}');`)
    }
}

module.exports = {
    generateAudioDescriptionsForOCRInDbWithInfo: generateAudioDescriptionsForOCRInDbWithInfo,
    mergeOCRExtendedAudio: mergeOCRExtendedAudio   
}