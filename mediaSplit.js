const http = require('http');
const fs = require('fs');
const rimraf = require("rimraf");

// const axios = require('axios');
// const FormData = require('form-data');
// const fetch = require("node-fetch");

// let form = new FormData();
// let file = '';

// fetch("./public/audio/MIrogue.mp3").then(
//     res => {
//         file = res.value;
//     }
// )
// form.append("file",file);
// axios.post('splitMp3', form, {
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     }
// })


const db = require('./db/database');

async function generateTimeGaps(vid_id, vol_id){
try{

    await db.any(`Delete from video_time_gaps where video_id = '${vid_id}'`);

} catch (error) {
    console.log(error);
    return false;
}

let descriptionListArr = await db.any(`SELECT * FROM descriptions WHERE video_id = '${vid_id}' AND volunteer_id = '${vol_id}'order by scene_num`);

let currSceneNum = [];
let curr_startTime = [];
let curr_endTime = [];   

for(let i=0; i<descriptionListArr.length; i++) {
    let currDescription = descriptionListArr[i];
    currSceneNum.push(currDescription.scene_num);
    curr_startTime.push(currDescription.start_time);
    curr_endTime.push(currDescription.end_time);   
    
}
console.log("curr Dialog start times : "+currSceneNum);

let video_dialogs = await db.any(`SELECT * FROM video_dialogs WHERE video_id = '${vid_id}' order by start_time`);

let currDialog_startTime = [];
let currDialog_endTime = [];

for(let i=0; i<video_dialogs.length; i++) {
    let currDialog = video_dialogs[i];
    currDialog_startTime.push(currDialog.start_time);
    // let curr_startTime = currDescription.start_time;
    currDialog_endTime.push(currDialog.end_time);   
}

let i = 0;

let time_start = 0;
let time_end = currDialog_startTime[i];
let time_diff = time_end - time_start;

while(i < video_dialogs.length){
    let begin = await fetchSceneNum(time_start, vid_id, vol_id);
    let end = await fetchSceneNum(time_end, vid_id, vol_id);
    let is_overlap = false;
    if(begin != end)
    is_overlap = true;

    // await db.any(`SELECT * FROM video_dialogs WHERE video_id = '${vid_id}' order by start_time`);
    await db.query(`INSERT INTO video_time_gaps(video_id, scene_num,
        start_time, end_time, is_diff_scene) VALUES ('${vid_id}', ${begin}, ${time_start}, ${time_end}, ${is_overlap})`);
    i++;

    time_start = currDialog_endTime[i-1];
    if(i < video_dialogs.length)
    {time_end = currDialog_startTime[i];
    time_diff = time_end - time_start;}
}

    let end_time = curr_endTime[curr_endTime.length - 1];
    time_end = end_time;
    
    let begin = await fetchSceneNum(time_start, vid_id, vol_id);
    let end = await fetchSceneNum(time_end, vid_id, vol_id);
    let is_overlap = false;
    if(begin != end)
    is_overlap = true;

    await db.query(`INSERT INTO video_time_gaps(video_id, scene_num,
        start_time, end_time, is_diff_scene) VALUES ('${vid_id}', ${begin}, ${time_start}, ${time_end}, ${is_overlap})`);

}

   /** Fetch scene num from a given timestamp, videoId */
   async function fetchSceneNum(timestamp, videoId, volunteerId){
    
    console.log('Scene timestamps: '+timestamp+'  and '+videoId+' and '+vol_id);
    // let newstr = sentence_id.split('_');
    // let volunteerId = newstr[0];

    let sceneStartTimesArr = await db.query(`SELECT start_time FROM descriptions WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);
    let sceneNumArr = await db.query(`SELECT scene_num FROM descriptions WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);
    // console.log('Scene timestamps: '+sceneStartTimesArr+'  and '+sceneNumArr);
    if(timestamp < 0)
        return -1;
    
    for(let i=0; i<sceneNumArr.length; i++){
        // console.log("start time: "+sceneStartTimesArr[i]['start_time']);
        if(sceneStartTimesArr[i]['start_time'] > timestamp)
            return sceneNumArr[i-1]['scene_num'];
    }

    return sceneNumArr[sceneNumArr.length - 1]['scene_num'];
}


async function generateTimeGapsOnlyMusic(vid_id, vol_id){
    try{
    
        await db.any(`Delete from video_time_gaps where video_id = '${vid_id}'`);
    
    } catch (error) {
        console.log(error);
        return false;
    }
    
    let descriptionListArr = await db.any(`SELECT * FROM descriptions WHERE video_id = '${vid_id}' AND volunteer_id = '${vol_id}'order by scene_num`);
    
    let currSceneNum = [];
    let curr_startTime = [];
    let curr_endTime = [];   
    
    for(let i=0; i<descriptionListArr.length; i++) {
        let currDescription = descriptionListArr[i];
        currSceneNum.push(currDescription.scene_num);
        curr_startTime.push(currDescription.start_time);
        curr_endTime.push(currDescription.end_time);   
        
    }

    for(let i=0; i<descriptionListArr.length; i++){

        let time_start = curr_startTime[i];
        let time_end = curr_endTime[i];
        let is_overlap = false;
        let begin = currSceneNum[i];

        await db.query(`INSERT INTO video_time_gaps(video_id, scene_num,
            start_time, end_time, is_diff_scene) VALUES ('${vid_id}', ${begin}, ${time_start}, ${time_end}, ${is_overlap})`);

        }
}

async function testDB(vid_id, vol_id){

//     fs.readFile(`./public/audio/${vid_id}/ai/${vol_id}/dummy/sample.js`, function(err, data) {
//         if(err)
//             console.log("Error");
//         else
//             console.log("Success");
//   });

    rimraf.sync(`./public/audio/${vid_id}/ai/${vol_id}/dummy`);
}

let vol_id = 'b38bc436-7b90-11ea-bc55-0242ac130003';
let vid_id = '4d1OmRA6yyI';

// generateTimeGaps(vid_id, vol_id);

// generateTimeGapsOnlyMusic(vid_id, vol_id);
testDB(vid_id, vol_id);