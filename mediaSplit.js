// { sql:
//     'START TRANSACTION; UPDATE descriptions SET description = \'a pair of skis sitting in the snow blue and white picture of an image of two skiers skiing downhill on their backsides.\' WHERE volunteer_id = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = \'Q9Xp77AENXI\' AND description_id = \'undefined\';  UPDATE descriptions SET description = \'a sign that is on the side of street and parked car are just some examples for road users to be aware off their surroundings at all times\', ocr = \'call about a dog who was hit by car. asked their mom to contact us for help... joined me on this rescue mission....\' WHERE volunteer_id = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = \'Q9Xp77AENXI\' AND description_id = \'undefined\';  UPDATE descriptions SET description = \'women cut a bunch of shoes and look at cars on the side-ofthe road like they\'re parked next 
//  to each other rather than in front or behind them as you drive by. there are also pictures showing people sitting around wooden fences, watching birds and looking out over streets filled with cars that have been plowed onto their sides.\', ocr = \'élaced around the dog to secure him. was i hve never seen one collapse before!\' WHERE volunteer_id = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = \'Q9Xp77AENXI\' AND description_id = \'undefined\';  UPDATE descriptions SET description = \'blurry photo of a close up car window with sky background and dog sitting in the drivers seat of an oncoming driver\'s side door.\' WHERE volunteer_id = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = 
//  \'Q9Xp77AENXI\' AND description_id = \'undefined\';  UPDATE descriptions SET description = \'a woman with her dog in the car and two dogs that are also inside. people taking pictures of cars, planes and snowy streets around them all over the world on social media sites such as youtube or facebook!\' WHERE volunteer_id = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = \'Q9Xp77AENXI\' AND description_id = \'undefined\';  UPDATE descriptions SET description = \'a black and white cat sleeping on top of the blanket or someone that is lying down with their face covered by stuffed animals are just some examples. close ups also show people sitting in cars, parking meters and people riding buses among other things as well...\', ocr = \'please be a hero and donate $5 so we can save more animals.\' WHERE volunteer_id = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = \'Q9Xp77AENXI\' AND description_id = \'undefined\';  UPDATE descriptions SET description = \'a woman sitting on the bus with her dog and people standing next to each other in front of their windows are just some examples from around the world that have captured our attention so far this year alone we\'ve seen more than one million photos taken all over 
//  the globe last month!\', ocr = \'we rushed to the emergency hospital where they gave him medicine to reduce swelling in his brain.\' WHERE volunteer_id = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = \'Q9Xp77AENXI\' AND description_id = \'undefined\';  UPDATE descriptions SET description = \'black and white dog playing with a toothbrush. woman on bed with book laying in front of the mirror standing next to it all...\', ocr = \'spent a couple of weeks at the emergency hospitaliing. weeks in an intensive care unit (inpatient and outpatient) spent xwveeks being treated for acute myocarditis, which can be life-threatening if you have heart disease or stroke...\' WHERE volunteer_id = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = \'Q9Xp77AENXI\' AND description_id = \'undefined\';  UPDATE descriptions SET description = \'dog is standing in front of a bed black and white dogs are lying on top the beds. close ups of people with their pets can be seen all over the world including australia, new york city and mexico...\', ocr = \'it was so amazing to see him wag his tailfor the first timellion.\' WHERE volunteer_id = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = \'Q9Xp77AENXI\' AND description_id = \'undefined\';  UPDATE descriptions SET description = \'a black and white cat sitting on top of the table is looking out from behind another person\'s window. there are also close up pictures showing people with their dogs, cats in beds and women standing next to each other\', ocr = \'rescues like this are possible only thanks to your donations! x andLjoin our,teamn today.\' WHERE volunteer_id = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = \'Q9Xp77AENXI\' AND description_id = \'undefined\';  UPDATE descriptions SET 
//  description = \'dog running with a tennis ball in its mouth black and white photo of dogs playing frisbee on the ground people standing next to each other blurry image of someone riding their motorcycle woman petting her pet dog at fenced-in fence women walking down sidewalk looking for something to do.\', ocr = \'donate if you\' WHERE volunteer_id = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = \'Q9Xp77AENXI\' AND description_id = \'undefined\';  UPDATE descriptions SET description = \'a close up of people holding 
//  buckets and signs on the wall is featured in this collection from cnn photoshoot 2015 gallery.\', ocr = \'hope for paws spay neuter donate:nte.- thank you!\' WHERE volunteer_id 
//  = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = \'Q9Xp77AENXI\' AND description_id = \'undefined\';  UPDATE descriptions SET description = \'a close up of the sign that says "nothing" is on the side of an open door.\' WHERE volunteer_id = \'d8fcfd52-b0b3-4969-bf03-1dc54b681b5d\' AND video_id = \'Q9Xp77AENXI\' AND description_id = \'undefined\'; COMMIT;' }

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
    console.log("DIalog start time: " + cd_startTime + " DIalog end time: "+cd_endTime, " start scene: "+begin+" end scene: "+end);

    if(begin == end){
        let vdObj = {};
        vdObj["start_time"] = cd_startTime;
        vdObj["end_time"] = cd_endTime;

        scenes[begin]["video_dialogs"].push(vdObj);
        console.log(vdObj);
    }
    else{
        let i = begin;
        
        while(i <= end){
            let begin_time = 0, end_time = 0;
            let vdObj = {};

            if(!(scenes.hasOwnProperty(i)))
            {console.log("debug");i++; continue;}
            
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
            console.log(vdObj);
            i++;
        }
    }
}

console.log(scenes);

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
                await db.query(`INSERT INTO video_time_gaps(video_id, scene_num,
                            start_time, end_time, is_diff_scene) VALUES ('${vid_id}', ${scene_num}, ${time_start}, ${time_end}, ${is_overlap})`);
            i++;
        }
    }



}

   /** Fetch scene num from a given timestamp, videoId */
   async function fetchSceneNum(timestamp, videoId, volunteerId){
    
    // console.log('Scene timestamps: '+timestamp+'  and '+videoId+' and '+vol_id);
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

generateTimeGaps("test_video2", "test_user");

// generateTimeGapsOnlyMusic(vid_id, vol_id);
// testDB(vid_id, vol_id);