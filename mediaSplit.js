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

let descriptionListArr = await db.any(`SELECT * FROM descriptions WHERE video_id = '${vid_id}' AND volunteer_id = '${vol_id}'order by scene_num`);

let currSceneNum = 0;
let curr_startTime = 0;
let curr_endTime = 0;   

for(let i=0; i<descriptionListArr.length; i++) {
    let currDescription = descriptionListArr[i];
    currSceneNum = currDescription.scene_num;
    curr_startTime = currDescription.start_time;
    curr_endTime = currDescription.end_time;   
}

let video_dialogs = await db.any(`SELECT * FROM video_dialogs WHERE video_id = '${vid_id}' order by start_time`);

let currDialog_startTime = 0;
let currDialog_endTime = 0;

for(let i=0; i<video_dialogs.length; i++) {
    let currDialog = video_dialogs[i];
    currDialog_startTime = currDialog.start_time;
    // let curr_startTime = currDescription.start_time;
    currDialog_endTime = currDialog.end_time;   
}

let i = 0;

let time_start = 0.1;
let time_end = currDialog_startTime[i] - 0.1;
let time_diff = time_end - time_start;

while(i < video_dialogs.length-1){
    let begin = fetchSceneNum(time_start, vid_id, vol_id);
    let end = fetchSceneNum(time_end, vid_id, vol_id);
    let is_overlap = (begin == end);

    // await db.any(`SELECT * FROM video_dialogs WHERE video_id = '${vid_id}' order by start_time`);
    await db.query(`INSERT INTO video_time_gaps(video_id, scene_num,
        start_time, end_time, is_diff_scene) VALUES ('${vid_id}', ${begin}, ${time_start}, ${time_end}, ${is_overlap})`);
    i++;

    time_start = currDialog_endTime[i-1] + 0.1;
    time_end = currDialog_startTime[i] - 0.1;
    time_diff = time_end - time_start;
}
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
        if(sceneStartTimesArr[i]['start_time'] > timestamp)
            return sceneNumArr[i-1]['scene_num'];
    }

    return sceneNumArr[sceneNumArr.length - 1]['scene_num'];
}

