
const fs = require('fs');
const Utils = require('../backend/utils');
const axios = require('axios');
const scene = require('../model/scene');

class MergeSceneController{


    execute(videoId){
        let queryResult =  scene.getSceneData(videoId);
        queryResult
        .then(data => {
            console.log({data});
            let videoInsight = [];
            for(let i=0; i<data.length; i++){
                data[i].merged =  [];
                videoInsight.push(data[i]);
            }
            console.log({videoInsight});
            
            let oceanFile = 'audio_ocean8.json';
            let audioInsight = this.parseAudioFile(oceanFile);
            console.log({audioInsight});


            let mergedList = this.merge(videoInsight, audioInsight);

            let result = scene.addMergeSceneTable(mergedList)
            result
                .then(data => {
                    // res.send("Data added successfully in merge_scene table");
                    console.log({success: data});
                })
                .catch((err) => {
                    console.log(err);
                });
            
        })
        .catch((err) => {
            console.log(err);
        });
    }


    /*
    execute(video_id){
        let oceanFile = 'audio_ocean8.json';
        let audioInsight = this.parseAudioFile(oceanFile);
        console.log({audioInsight});

        let url = '/merge/sceneData?videoId=' + video_id;

        axios.get(url)
            .then(function (data) {
                console.log(data);
        
                
                let videoInsight = [];
                for(let i=0; i<data.length; i++){
                    data[i].merged =  [];
                    videoInsight.push(data[i]);
                }
                console.log({videoInsight});
                let mergedList = merge(videoInsight, audioInsight);
                
                axios.post('/merge/scene', mergedList)
                  .then(function (response) {
                    console.log(response);
                  })
                  .catch(function (error) {
                    console.log(error);
                  });
            })
            .catch(function (error) {
                console.log(error);
            })
    }

*/

    merge(videoInsight, audioInsight){
        let videoIndex = 0;
        let mergedList = [];
        mergedList.push(videoInsight[videoIndex++]);
        let i = 0;
        while(i < audioInsight.length && videoIndex < videoInsight.length){
            let size = mergedList.length;
            let s1 = mergedList[size-1].start_time;
            let e1 = mergedList[size-1].end_time;

            let s2 = audioInsight[i].start;
            let e2 = audioInsight[i].end;

            if((s2 >= s1 && s2 <= e1) && (e2 >= s1 && e2 <= e1)) {
                i++;
                continue;
            }
            
            if(Math.min(s2, e2) >= e1) {
                mergedList.push(videoInsight[videoIndex++]);
                continue;
            }
            
            //merge condition
            if(s2 >= s1 && e2 > e1) {
                let sceneObj = mergedList[mergedList.length-1];
                let next = videoInsight[videoIndex++]; 
                let min = Math.min(s1,  next.start_time);
                let max = Math.max(e1, next.end_time);
                sceneObj.start_time = min;
                sceneObj.end_time = max;
                // let arr = sceneObj.merged;
                // arr.push(next.scene_id);
                sceneObj.merged.push(next.scene_id);
                mergedList.splice(mergedList.length-1);
                mergedList.push(sceneObj);
            }else if(s2 >= e1) {
                mergedList.push(videoInsight[videoIndex++]);
            }
    
            i++;
        }

        for(let j = videoIndex; j<videoInsight.length; j++) {
            mergedList.push(videoInsight[j]);
        }

        for(let k=0; k< mergedList.length; k++){
        let scene_id = mergedList[k].scene_id;
        let merged = mergedList[k].merged;
        let start_time = mergedList[k].start_time;
        let end_time = mergedList[k].end_time;
        console.log(scene_id ,'-' ,start_time, '-', end_time, ',', JSON.stringify(merged));
        }
        
        console.log({mergedList});
        return mergedList;
    }



    parseAudioFile(file){
    let rawdata = fs.readFileSync(file);
    let obj = JSON.parse(rawdata);
    let sentence = obj.result.sentence;
    let arr =[];
    for(let i=0; i< sentence.length; i++){
        // let instance = scenes[i].instances[0];
        let start = sentence[i].startTime;
        let end = sentence[i].endTime;
        let data = {
            start,
            end
        }
        arr.push(data);
    }
    
    return arr;
    }

}


let file = 'insight.json';
let oceanFile = 'audio_ocean8.json';
let controller = new MergeSceneController();
controller.execute('OkBaZLq7gnU');