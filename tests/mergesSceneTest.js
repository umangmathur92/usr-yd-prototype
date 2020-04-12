const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const db = require('../db/database');
const fse = require('fs-extra');
const { getAudioDurationInSeconds } = require('get-audio-duration');

// Create dummy data for testing
async function test(video_id){


let currVideo_dialog = await db.query(`SELECT * FROM video_dialogs WHERE video_id = '${video_id}' ORDER BY start_time`);
        let currDialogStartTimes = [];
        let currDialogEndTimes = [];

        for(let size=0; size < currVideo_dialog.length; size++)
        {
            currDialogStartTimes.push(currVideo_dialog[size]['start_time']);
            currDialogEndTimes.push(currVideo_dialog[size]['end_time']);   
        }

let currMergeSceneInfo = await db.query(`SELECT * FROM merge_scene WHERE video_id = '${video_id}' ORDER BY scene_num`);

        let merge_sceneNum = [];
        let mergeSceneStartTimes = [];
        let mergeSceneEndTimes = [];
        let mergedScenes = [];

        for(let i=0; i < currMergeSceneInfo.length; i++){
            merge_sceneNum.push(currMergeSceneInfo[i]['scene_num']);
            mergeSceneStartTimes.push(currMergeSceneInfo[i]['start_time']);
            mergeSceneEndTimes.push(currMergeSceneInfo[i]['end_time']);
            mergedScenes.push(currMergeSceneInfo[i]['merged']);
        }

let currSceneInfo = await db.query(`SELECT * FROM scene WHERE video_id = '${video_id}' ORDER BY scene_num`);

        let org_sceneNum = [];
        let org_sceneId = [];
        let orgSceneStartTimes = [];
        let orgSceneEndTimes = [];
        // let orgScenes = [];

        for(let i=0; i < currSceneInfo.length; i++){
            org_sceneNum.push(currSceneInfo[i]['scene_num']);
            orgSceneStartTimes.push(currSceneInfo[i]['start_time']);
            orgSceneEndTimes.push(currSceneInfo[i]['end_time']);
            // mergedScenes.push(currSceneInfo[i]['merged']);
            org_sceneId.push(currSceneInfo[i]['scene_id']);
            // console.log("Pass Test");
        }

        let i = 0, l = merge_sceneNum.length;
        let j = 0, len = org_sceneNum.length;
        while( i < l){
            
            if(mergeSceneStartTimes[i] != orgSceneStartTimes[j])
            {console.log("Fail");return "Fail - Incorrect scene starting times";}
            
            if(mergeSceneEndTimes[i] != orgSceneEndTimes[j]){
                let k = j;
                while(j < len && mergeSceneEndTimes[i] != orgSceneEndTimes[j])
                    j++;
                
                if(j==len)
                {console.log("Fail");return "Fail - Incorrect scene Ending times";}
                
                let res = await verifyMerge(org_sceneId, i, k, j, mergedScenes);
                if(!res)
                    {console.log("Fail"); return "Fail - Incorrect scene merge";}
            }

            let res = await verifyIntersection(mergeSceneStartTimes[i], currDialogStartTimes, currDialogEndTimes);
            if(!res)
                {console.log("Fail"); return "Fail - Dialogs overlap with scene's start time";}

            res = await verifyIntersection(mergeSceneEndTimes[i], currDialogStartTimes, currDialogEndTimes);
            if(!res)
                {console.log("Fail"); return "Fail - Dialogs overlap with scene's end time";}

            i++;
            j++;
        }
        // console.log("Pass");
        return "Pass";
    }

    async function verifyMerge(org_sceneId, i, k, j, mergedScenes){
        k++;
        let newMergedScenes = '{';
        while(k<=j)
        {newMergedScenes += (org_sceneId[k] + ','); k++;}
        newMergedScenes = newMergedScenes.substring(0,newMergedScenes.length-1)
        newMergedScenes += '}';

        // console.log("MS: ",mergedScenes[i]);
        // console.log("OS: ",newMergedScenes);

        return mergedScenes[i] === newMergedScenes;
    }


    async function verifyIntersection(time, currDialogStartTimes, currDialogEndTimes){
            console.log(time);
            for(let i=0; i<currDialogStartTimes; i++){
                if(time >= currDialogStartTimes[i] && time <= currDialogEndTimes[i])
                    return false;
            }

            return true;
    }

async function runTest(video_id){
    
    let res = await test(video_id);
    console.log(`Test Result for (${video_id}): `+res);

}

async function runAllTests(){
        // await runTest("2wwC9c3iYK4");
        // await runTest("OkBaZLq7gnU");
        // await runTest("7QZNpS0uos4");
        // await runTest("elpUGB9Ap1Y");
        // await runTest("4d1OmRA6yyI");
        // await runTest("6ZLCmVlQBLo");
        // await runTest("ll8cTIg2rwM");
        // await runTest("vBkBS4O3yvY");
        await runTest("test_video");
}

async function insertDummyData(){
    
    // await db.query(`INSERT INTO video (youtube_id, title, duration, summarised_insights_json, insights_json) VALUES('test_video', 'test_title', ${0}, 'test', 'test' )`);
    // await db.query(`INSERT INTO block (video_id, block_id, block_num, start_time, end_time) VALUES('test_video', 'test_block', ${0}, ${0}, ${40})`);

    await db.query(`INSERT INTO scene (video_id, block_id, scene_num, scene_id, start_time, end_time) VALUES('test_video', 'test_block', ${0}, ${0}, ${0}, ${10})`);
    await db.query(`INSERT INTO scene (video_id, block_id, scene_num, scene_id, start_time, end_time) VALUES('test_video', 'test_block', ${1}, ${1}, ${10}, ${20})`);
    await db.query(`INSERT INTO scene (video_id, block_id, scene_num, scene_id, start_time, end_time) VALUES('test_video', 'test_block', ${2}, ${2}, ${20}, ${30})`);
    await db.query(`INSERT INTO scene (video_id, block_id, scene_num, scene_id, start_time, end_time) VALUES('test_video', 'test_block', ${3}, ${3}, ${30}, ${40})`);

    // // await db.query(`INSERT INTO scene VALUES video_id = 'test_video' scene_num = ${1} scene_id = ${1} start_time = ${10} end_time = ${20}`);
    // // await db.query(`INSERT INTO scene VALUES video_id = 'test_video' scene_num = ${2} scene_id = ${2} start_time = ${20} end_time = ${30}`);
    // // await db.query(`INSERT INTO scene VALUES video_id = 'test_video' scene_num = ${3} scene_id = ${3} start_time = ${30} end_time = ${40}`);

    await db.query(`INSERT INTO merge_scene(video_id, block_id, scene_id, scene_num, start_time, end_time, merged) VALUES ('test_video', 'test_block', ${0}, ${0}, ${0}, ${20}, '{1}')`); 
    await db.query(`INSERT INTO merge_scene(video_id, block_id, scene_id, scene_num, start_time, end_time, merged) VALUES ('test_video', 'test_block', ${2}, ${2}, ${20}, ${30}, '')`);
    await db.query(`INSERT INTO merge_scene(video_id, block_id, scene_id, scene_num, start_time, end_time, merged) VALUES ('test_video', 'test_block', ${3}, ${3}, ${30}, ${40}, '')`);

    // // await db.query(`INSERT INTO merge_scene VALUES video_id = 'test_video' scene_num = ${0} start_time = ${0} end_time = ${20} merged = ${'{1}'}`);   
    // // await db.query(`INSERT INTO merge_scene VALUES video_id = 'test_video' scene_num = ${2} start_time = ${20} end_time = ${30} merged = ${''}`);   
    // // await db.query(`INSERT INTO merge_scene VALUES video_id = 'test_video' scene_num = ${3} start_time = ${30} end_time = ${40} merged = ${''}`);   
    // // await db.query(`INSERT INTO merge_scene VALUES video_id = 'test_video' scene_num = ${0} start_time = ${0} end_time = ${10} merged = ${''}`);   

    await db.query(`INSERT INTO video_dialogs(video_id, start_time, end_time) VALUES ('test_video', ${5}, ${12})`);   

}

async function updateDummyData(){
    
    // await db.query(`UPDATE scene SET scene_num = ${0} scene_id = ${0} start_time = ${0} end_time = ${10} WHERE video_id = 'test_video' AND scene_num = ${0}`);
    // await db.query(`UPDATE scene SET scene_num = ${1} scene_id = ${1} start_time = ${10} end_time = ${20} WHERE video_id = 'test_video' AND scene_num = ${1}`);
    // await db.query(`UPDATE scene SET scene_num = ${2} scene_id = ${2} start_time = ${20} end_time = ${30} WHERE video_id = 'test_video' AND scene_num = ${2}`);
    // await db.query(`UPDATE scene SET scene_num = ${3} scene_id = ${3} start_time = ${30} end_time = ${40} WHERE video_id = 'test_video' AND scene_num = ${3}`);


    await db.query(`UPDATE merge_scene SET scene_num = ${0}, start_time = ${0}, end_time = ${20}, merged = '{1}' WHERE video_id = 'test_video' AND scene_num = ${0}`);   
    await db.query(`UPDATE merge_scene SET scene_num = ${2}, start_time = ${20}, end_time = ${30}, merged = '{}' WHERE video_id = 'test_video' AND scene_num = ${2}`);   
    await db.query(`UPDATE merge_scene SET scene_num = ${3}, start_time = ${30}, end_time = ${40}, merged = '{}' WHERE video_id = 'test_video' AND scene_num = ${3}`);   
    // await db.query(`UPDATE merge_scene SET scene_num = ${0} start_time = ${0} end_time = ${10} merged = {''} WHERE video_id = 'test_video' AND scene_num = ${0}`);   

    // await db.query(`UPDATE video_dialogs SET start_time = ${12}, end_time = ${15} WHERE video_id = 'test_video'`);   

}

runAllTests();
// updateDummyData();