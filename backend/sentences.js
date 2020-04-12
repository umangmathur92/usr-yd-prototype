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
        let sentenceListArr = await db.any('SELECT * FROM descriptions_sentence order by scene_num, sentence_id');

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

async function generateMp3ForSentencesInDbWithInfo(vid_id, vol_id) {

    try{
        let sentenceListArr = await db.any(`SELECT * FROM descriptions_sentence WHERE video_id = '${vid_id}' AND volunteer_id = '${vol_id}' order by scene_num, sentence_id`);

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

async function generateSentencesForDescriptionsInDbWithInfo(vid_id, vol_id) {
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
    
    let sentences = await db.query(`SELECT * FROM descriptions_sentence ORDER BY scene_num, sentence_id`);
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

async function generateTimestampsforSentencesInDbWithInfo(dbVideoId, dbVolId){
    
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
// Select unique video ids from video_dialogs_timestamps and create an object (set) from it
    let dialog_video_res  = await db.query(`SELECT DISTINCT video_id FROM video_dialogs`);
    let dialog_video_arr = [];
    size = 0;
    for(size =0; size<dialog_video_res.length; size++)
        dialog_video_arr.push(dialog_video_res[size].video_id);
    
    let dialog_video_set = new Set(dialog_video_arr);
    let dialog_timestamps = await db.query(`SELECT * FROM video_dialogs ORDER BY video_id, start_time`);
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
        let currVideo_dialog = await db.query(`SELECT * FROM video_dialogs WHERE video_id = '${currVideo}' ORDER BY start_time`);
        let currDialogStartTimes = [];
        let currDialogEndTimes = [];

        for(let size=0; size < currVideo_dialog.length; size++)
        {
            currDialogStartTimes.push(currVideo_dialog[size]['start_time']);
            currDialogEndTimes.push(currVideo_dialog[size]['end_time']);   
        }

        let index = currDialogStartTimes.length - 1;
        let video_end_time = sentence_video_end_times[i];
        let time_gap = video_end_time - Math.max(currDialogEndTimes[index],scene_start_time[i]);
        let time_start = video_end_time - sentence_duration[i]; // (to check sentence is within the same scene)
        let time_end = video_end_time;
        let currSceneNum = sentence_scene[i];

        while(index >= -1){
        if(currVideo != sentence_video_id[i])
            break;
        let end_time_sceneNum = await fetchSceneNum(time_end, currVideo, sentence_id[i]);
        let start_time_sceneNum = await fetchSceneNum(time_start, currVideo, sentence_id[i]);

            // if time gap is between two different scenes, break the time gap into two parts for each scene
        if(start_time_sceneNum != end_time_sceneNum || time_gap == 0 || end_time_sceneNum != currSceneNum)
            {
                let presentSceneNum = sentence_scene[i];
                
                while(presentSceneNum == sentence_scene[i] && currVideo == sentence_video_id[i]){
                    let sceneStartTime = scene_start_time[i];
                    await updateSentenceStartTime(sentence_id[i], sceneStartTime, 'extended');
                    i--;
            }

            // index--;
            // time_gap = currDialogStartTimes[index+1] - Math.max(currDialogEndTimes[index],scene_start_time[i]);
            // time_start = currDialogStartTimes[index+1] - sentence_duration[i]; // (to check sentence is within the same scene)
            // time_end = currDialogStartTimes[index+1];
            // continue;
        }
    
        if(time_gap <= sentence_duration[i] && currSceneNum == sentence_scene[i])
        {
            curr_dialog_start_time = currDialogStartTimes[index];
            present_scene_num  = await fetchSceneNum(curr_dialog_start_time, currVideo, sentence_id[i]);
            if(present_scene_num < currSceneNum)
                {time_gap = 0; continue;}

            index--;
            
            let currDial_endTime = (index >= 0 ? currDialogEndTimes[index] : scene_start_time[i]); // deals with 1st scene edge case

            time_gap = currDialogStartTimes[index+1] - Math.max(currDial_endTime,scene_start_time[i]);
            time_start = currDialogStartTimes[index+1] - sentence_duration[i] - 0.1; // (to check sentence is within the same scene)
            time_end = currDialogStartTimes[index+1] - 0.1;
            /***************  Major bug in listen by code *******************/
            if (time_gap == 0)
                time_gap = 0.01;
            /***************  *************************** *******************/
            continue;
        }

        while(start_time_sceneNum == end_time_sceneNum  && time_gap > sentence_duration[i] && currVideo == sentence_video_id[i] && currSceneNum == sentence_scene[i]){
            await updateSentenceStartTime(sentence_id[i], time_start, 'inline');
            time_gap -= (sentence_duration[i] + 0.1);
            time_end = time_start - 0.1;
            // time_start -= (sentence_duration[i] + 0.1);
            
            end_time_sceneNum = await fetchSceneNum(time_end, currVideo, sentence_id[i]);
            i--;
            if(i<0){index = -2; continue;}
            
            time_start = time_end -  sentence_duration[i];
            start_time_sceneNum = await fetchSceneNum(time_start, currVideo, sentence_id[i]);
        }
        
        if(currSceneNum != sentence_scene[i] && currVideo == sentence_video_id[i]){
            currSceneNum = sentence_scene[i];
                // handles 6 edge cases
            while(true){

                    // no dialogs left
                    if(index==-1)
                    {
                        time_gap = currDialogStartTimes[0];
                        time_end = currDialogStartTimes[0] - 0.1;
                        time_start = time_end - sentence_duration[i];
                        break;
                    }else if(index < -1)
                        break;
                    

                let dialog_start_time_sceneNum = await fetchSceneNum(currDialogStartTimes[index], currVideo, sentence_id[i]);
                let dialog_end_time_sceneNum = await fetchSceneNum(currDialogEndTimes[index], currVideo, sentence_id[i]);
                
                    // if dialog's starting time jumps to previous scene
                if(dialog_start_time_sceneNum < sentence_scene[i]){

                        //  if dialog's ending time also jumps to previous scene
                    if(dialog_end_time_sceneNum < sentence_scene[i])
                        {
                            time_gap = scene_start_time[i+1] - scene_start_time[i];
                            time_end = scene_start_time[i+1] - 0.1;
                            time_start = time_end - sentence_duration[i]//scene_start_time[i+1];
                            break;
                        }
                    
                        //  if dialog's ending time is in current scene
                    if(dialog_end_time_sceneNum == sentence_scene[i])
                    {
                        time_gap = scene_start_time[i+1] - currDialogEndTimes[index];
                        time_end = scene_start_time[i+1] - 0.1;
                        time_start = time_end - sentence_duration[i];
                        break;
                    }

                        //  if dialog's ending time is in next scene
                    if(dialog_end_time_sceneNum > sentence_scene[i])
                    {
                        time_gap = 0;
                        time_end = scene_start_time[i+1] - 0.1;
                        time_start = time_end - sentence_duration[i];
                        break;
                    }  
                }

                if(dialog_start_time_sceneNum == sentence_scene[i]){
                        // Both dialog timestamps in the same scene
                    if(dialog_end_time_sceneNum == sentence_scene[i]){
                        time_gap = scene_start_time[i+1] - currDialogEndTimes[index];
                        time_end = scene_start_time[i+1] - 0.1;
                        time_start = time_end - sentence_duration[i];
                        break;
                    }
                        // dialog end time is next scene (?)
                    else{
                        //time_gap = currDialogStartTimes[index] - Math.max(currDialogEndTimes[index-1],scene_start_time[i]);
                        time_gap = 0.01;
                        time_end = currDialogStartTimes[index];
                        time_start = time_end - sentence_duration[i];
                        break;
                    }
                }
            


                index--;
            }

            // let time_gap = video_end_time - Math.max(currDialogEndTimes[index],scene_start_time[i]);
            // let time_start = video_end_time - sentence_duration[i]; // (to check sentence is within the same scene)
            // let time_end = video_end_time;
            
            continue;
        }
        else if(start_time_sceneNum != end_time_sceneNum){
            continue;
        }
        if (index < 0)
            break;
        curr_dialog_start_time = currDialogStartTimes[index];
        present_scene_num  = await fetchSceneNum(curr_dialog_start_time, currVideo, sentence_id[i]);

        if(present_scene_num < currSceneNum)
            {time_gap = 0; continue;}

        index--;
        
        time_gap = currDialogStartTimes[index+1] - Math.max(currDialogEndTimes[index],scene_start_time[i]);
        time_end = currDialogStartTimes[index];
        time_start = time_end - sentence_duration[i];

            // time_gap = video_end_time - Math.max(currDialogEndTimes[index],scene_start_time[i]);
            // time_start = video_end_time - sentence_duration[i]; // (to check sentence is within the same scene)
            // time_end = video_end_time;

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
    // console.log('Scene timestamps: '+sceneStartTimesArr+'  and '+sceneNumArr);
    if(timestamp < 0)
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

async function mergeSentenceAudios(video_id, vol_id){
    let sentenceListArr = await db.any(`SELECT * FROM descriptions_sentence WHERE video_id = '${video_id}' AND volunteer_id = '${vol_id}' ORDER BY scene_num, sentence_id`);
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

        i++;

        while(currSceneNum == sentence_scene[i] && currAudioType == sentence_audio_type[i] && i < l){

            if(currAudioType == 'inline' && (oldAudioStartTime + oldAudioDur + 0.11) < sentence_audio_start_time[i] )
                break;
            
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
}

async function updateNewSentence(sentence_id_first, sentence_id_last, currSceneNum, currSceneStartTime, currSceneEndTime, currSceneDesc, currAudioType, audioStartTime, totalAudioDur, currAudioPath, sentence, path_val){
    
    let newstr = sentence_id_last.split('_');
    let sentence_id = sentence_id_first + '_' + newstr[newstr.length - 1];
    let vol_id = newstr[0];
    let video_id = newstr[1];
    let str = currAudioPath.split('/');
    let audio_path = '';
    let file_path = 'public/';

    for(let i=0; i<str.length-2; i++)
        audio_path += (str[i] + '/');
    for(let i=1; i<str.length-2; i++)
        file_path += (str[i] + '/');

    audio_path = audio_path + 'new/' + currAudioType + '.mp3';
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

    // await db.query(`SELECT scene_num FROM descriptions_sentence WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);

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

// async function 

module.exports = {
    generateMp3ForText: generateMp3ForText,
    generateMp3ForAllSentencesInDb: generateMp3ForAllSentencesInDb,
    generateMp3ForSentencesInDbWithInfo: generateMp3ForSentencesInDbWithInfo,
    generateTimestampsforSentencesInDb: generateTimestampsforSentencesInDb,
    generateTimestampsforSentencesInDbWithInfo: generateTimestampsforSentencesInDbWithInfo,
    // generateMp3ForAllDescriptionsInDb: generateMp3ForAllDescriptionsInDb,
    generateSentencesForAllDescriptionsInDb: generateSentencesForAllDescriptionsInDb,
    generateSentencesForDescriptionsInDbWithInfo: generateSentencesForDescriptionsInDbWithInfo,
    mergeSentenceAudios: mergeSentenceAudios
}