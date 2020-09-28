const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const db = require('../db/database');
const fse = require('fs-extra');
const { getAudioDurationInSeconds } = require('get-audio-duration')
const rimraf = require("rimraf");


async function generateAudioDescriptionsForOCRInDbWithInfo(vid_id, vol_id, res) {
        
    await generateMp3ForOCR(vid_id, vol_id);


}

async function generateMp3ForOCR(vid_id, vol_id){
    
    try{
        let OCRListArr = await db.any(`SELECT * FROM ocr_timestamps WHERE video_id = '${vid_id}' AND volunteer_id = '${vol_id}' order by timestamp`);
        
        rimraf.sync(`public/audio/${vid_id}/ai/${vol_id}/ocr`);

        for(let i=0; i<OCRListArr.length; i++) {

            let currOCR = OCRListArr[i];
            let ocrId = currOCR.id;
            let ocrText = currOCR.ocr_text;
            let fileNamePath = `public/audio/${currVideoId}/ai/${volunteerId}/ocr/${ocrId}.mp3`;

            let relativePath = fileNamePath.replace('public', '..');

            await generateMp3ForTextInFileystem(fileNamePath, ocrText);
            let duration = await getAudioDurationInSeconds(fileNamePath);
            console.log(duration);
            // update duration in OCR table
            // await updateOCRTable(duration, vid_id, vol_id, ocrId, relativePath);
        }
        return true;

    } catch(error){
        console.log(error);
        return false;
    }

}


async function generateTimestampsForOCR(vid_id, vol_id){

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
    
    
            let ocr_info = await db.query(`SELECT * FROM OCR_timestamps WHERE video_id = '${dbVideoId}' and volunteer_id = '${dbVolId}'`);
    
            let ocr_text = [];
            let ocr_timestamp = [];
            let ocr_time_duration = [];

            for(let item = 0; item < ocr_info.length; item++)
            {
                ocr_data = ocr_info[item];
                ocr_text.push(ocr_data.text);
                ocr_timestamp.push(ocr_data.timestamp);
                ocr_time_duration.push(ocr_data.duration);
            }
    
            let iter_idx = 0;
            let flag = false;
            let time_start = 0;
            let time_end = 0;
            let time_gap = 0;

            for(let i = 0; i < ocr_info.length; i++){
                
                while(iter_idx <time_gaps_start_time.length && time_gaps_start_time[iter_idx] < ocr_timestamp[i]){
                    idx_iter++;
                    flag = true;
                }

                if(flag){
                    time_start = time_gaps_end_time[idx_iter - 1];
                    time_end = iter_idx  == time_gaps_start_time.length ? scene_end_time : time_gaps_start_time[idx_iter];
                    time_gap = time_end - time_start;
                }

                if (time_gap >= ocr_time_duration[i]){
                    // Insert in db as inline at ocr_timestamp[i] as start time

                }
                else{
                    // Insert in db as extended at time_end

                }
    
    
    
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

