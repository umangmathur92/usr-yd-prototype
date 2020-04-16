const fs = require('fs');
const Utils = require('../backend/utils');
const db = require('../db/database');
var ffmpeg = require('ffmpeg');
let videoModel = require('../model/video.js');
const youtubedl = require('youtube-dl');

const axios = require('axios');
var ffmpeg = require('ffmpeg');
const scene = require('../model/scene');
const videoDialogue = require('../model/videoDialogue');
const uploadVideoRoute = require('../routes/uploadVideo');
var path = require('path');


class UploadVideoController{
    
    static async getAudioInsightAndMerge(audioId, videoId){
        // let data = { 'NDAUMF20200408105803': 'OkBaZLq7gnU'};
        // data = { audioId: 'NZTJTD20200408120207', youtubeId: '7QZNpS0uos4' }
        // data = { audioId: 'POFZRY20200408120928', youtubeId: 'elpUGB9Ap1Y' }
        //{ audioId: 'EFUPVK20200408121751', youtubeId: '2wwC9c3iYK4' }

        return  this.fetchAudioInsight(audioId, videoId)
                    .then((result)=>{
                        console.log(result);
                    })
            .catch(e => {
                console.log(e);
            })
    }


    static async fetchAudioInsight(audioId, videoId){
        return new Promise((resolve, reject) => {
            let url = 'http://18.221.192.73:8081/v1/audioclips/getspeechtotextresult?orderid=' + audioId;
            axios.get(url)
            .then((response) => {
                console.log(response.data);
                let status = response.data.status
                if(status !== 'success'){
                  reject(`Audio not processed for audioId=${audioId}, videoId= ${videoId}`);
                }
                //VIDEO
                let videoInsight = [];
                scene.getSceneData(videoId)
                  .then((data) => {
                        console.log(data);
                        for (let i = 0; i < data.length; i++) {
                        data[i].merged = [];
                        videoInsight.push(data[i]);
                        }
                        console.log({ videoInsight });
        
                        //AUDIO
                        let sentence = response.data.result.sentence;
                        let audioInsight =[];
                        for(let i=0; i< sentence.length; i++){
                            let start = sentence[i].startTime;
                            let end = sentence[i].endTime;
                            let desc  = sentence[i].sentence;
                            desc = desc.replace(/'/g, '');
                            if(!desc.toLowerCase().includes('noise')){
                            let data = {
                                start,
                                end,
                                sentence: desc
                            }
                            audioInsight.push(data);
                            }
                        }
                        console.log({audioInsight});
                
                        //MERGE
                        let mergedList = this.merge(videoInsight, audioInsight);
                        scene.addMergeSceneTable(mergedList)
                            .then(data => {
                                console.log({ success: data });
                                videoDialogue.insertDataIntoVideoDialogue(audioInsight, videoId, audioId)
                                    .then(res=>{
                                        console.log(res);
                                        resolve();
                                    })
                            }).catch((error) => {
                                console.log(error);
                                reject(error);
                            })
                            
                })
            
            })
            .catch((error) => {
                console.log(error);
                reject(error);
            })
      });
    
    }

    

    static merge(videoInsight, audioInsight){
        let videoIndex = 0;
        let mergedList = [];
        mergedList.push(videoInsight[videoIndex++]);
        let i = 0;
        while(i < audioInsight.length && videoIndex < videoInsight.length){
            let size = mergedList.length;
            let s1 = mergedList[size-1].start_time;
            let e1 = mergedList[size-1].end_time;
            let description = mergedList[size-1].original_description;
            let ocr = mergedList[size-1].original_ocr;
      
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
                sceneObj.original_description = description + next.original_description;
                sceneObj.original_ocr = ocr + next.original_ocr;

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
            // console.log(scene_id ,'-' ,start_time, '-', end_time, ',', JSON.stringify(merged));
        }
        
        // console.log({mergedList});
        return mergedList;
      }
      

    

      static parseJson(file){
        let rawdata = fs.readFileSync(file);
        let videoJsonObj = JSON.parse(rawdata);
        let scenes = videoJsonObj.videos[0].insights.scenes;
        let arr = [];
        for(let i=0; i< scenes.length; i++){
            let instance = scenes[i].instances[0];
            let start = Utils.parseSecondsFromString(instance.start);
            let end = Utils.parseSecondsFromString(instance.end);
            let data = {
                start,
                end
            }
            arr.push(data);
            // console.log(start,'->', end);
        }
        console.log('video:', arr);

        return arr;
    }

    static parseAudioFile(file){
        console.log("here");
        let rawdata = fs.readFileSync(file);
        let obj = JSON.parse(rawdata);
        let sentence = obj.result.sentence;
        let arr =[];
        for(let i=0; i< sentence.length; i++){
            // let instance = scenes[i].instances[0];
            let start = sentence[i].startTime;
            let end = sentence[i].endTime;
            // let end = Utils.parseSecondsFromString(instance.end);
            // console.log(start,'->', end);
            // console.log(start , ','  , end);
            let data = {
                start,
                end
            }
            arr.push(data);
        }

        console.log(arr);
        return arr;
    }


    static convertVideoToAudio(path, fileName){
        let audioFile = path + '/' + fileName+'.mp3';
        let videoFile = path + '/' + fileName + '.mp4'
        console.log({path});
        console.log({audioFile});
        console.log({videoFile});

        try {
            var process = new ffmpeg(videoFile);
            process.then(function (video) {
                console.log({video});
                video.fnExtractSoundToMP3(audioFile, function (error, file) {
                    if (!error)
                        console.log('Audio file: ' + file);
                });
            }, function (err) {
                console.log('Error: ' + err);
            });
        } catch (e) {
            console.log('err->', e);
        }
      }


      static async insertIntoVideoDialogue1(){
        let audioId = 'OMHPXC20200411053439';
        let videoId = 'vBkBS4O3yvY';

        try{

            let url = 'http://18.221.192.73:8081/v1/audioclips/getspeechtotextresult?orderid=' + audioId;
            let response = await axios.get(url);
    
              //AUDIO
              let sentence = response.data.result.sentence;
              let audioInsight =[];
              for(let i=0; i< sentence.length; i++){
                  let start = sentence[i].startTime;
                  let end = sentence[i].endTime;
                  let desc  = sentence[i].sentence;
                  desc = desc.replace(/'/g, '');
    
                  let data = {
                      start,
                      end,
                      sentence: desc
                  }
                  audioInsight.push(data);
              }
              console.log({audioInsight});

              await videoDialogue.insertDataIntoVideoDialogue(audioInsight, videoId, audioId)
              
            console.log('inserted');
        }catch (e){
            console.log(e);
        }
       

     

    }


    async copyFromMergeToDescription(user, videoId){
        // let videoId = 'vBkBS4O3yvY';
        // let user = 'd32f61aa-7f67-11ea-bc55-0242ac130003';

        console.log({videoId});
        try {
            let data =  await db.query('select * from merge_scene where video_id = $1 order by start_time', [videoId]);
            // console.log(data);
            console.log('here');
            let sql = '';
            for(let i=0; i<data.length; i++){
                let {video_id, scene_id,scene_num ,start_time,end_time, original_description, original_ocr, merged} = data[i];
                let descriptionId = user + '_' + video_id + '_ai_' +  scene_num;
                original_description =  original_description.replace(/'/g, '');
                original_ocr =  original_ocr.replace(/'/g, '');
                console.log({scene_id});
                console.log({descriptionId});
                sql+= `INSERT INTO descriptions(desc_id, video_id, has_ai, volunteer_id, scene_id, scene_num, 
                                                start_time, end_time, description, ocr, audioconflict_merge) 
                                VALUES('${descriptionId}', '${video_id}', true,'${user}', '${scene_id}',
                                        ${scene_num}, ${start_time}, ${end_time}, '${original_description}', 
                                        '${original_ocr}', '${merged}') ;`
                                        // console.log({sql});
            }
            console.log({sql});
            sql = 'Start transaction;' + sql + 'commit;';

            return await db.query(sql);
            // console.log('success');
            // return;


        } catch(e) {
            console.log({'error': e});
            return e;
           
        }
    }


    static async downloadVideo(url, videoTitle){
        let videoId = url.substr(url.indexOf('v=') + 2);
        console.log({ videoTitle});

        if (url) {
            let jsonPath = path.join(__dirname, '../videos/');
            console.log({ jsonPath });
            console.log({ __dirname });
            const video = youtubedl(url, ['--format=18']);

            // Will be called when the download starts.
            video.on('info', function (info) {
            console.log('Download started')
            console.log('filename: ' + info._filename)
            console.log('size: ' + info.size)
            })

            let date_ob = new Date();
            let year = date_ob.getFullYear();
            let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
            let date = ("0" + date_ob.getDate()).slice(-2);
            let currentDateTime = year + "-" + month + "-" + date + "_" + Math.floor(Date.now() / 1000);

            let rootName = videoId + '_' + currentDateTime;
            let fileName = videoId + '_' + currentDateTime + '.mp4';
            let filePath = path.join(__dirname, '../videos/', fileName);
            console.log({ fileName });
            console.log({ filePath });

            video.pipe(fs.createWriteStream(filePath));
            video.on('complete', function complete(info) {
            'use strict'
            console.log('filename: ' + info._filename + ' already downloaded.')
            })
            let name = '';
            video.on('end', function () {
            console.log('Finished downloading!');

            })
        }
    }

}

module.exports = UploadVideoController;

// let file = 'insight.json';
// let oceanFile = 'audio_ocean8.json';
// let controller = new UploadVideoController();
// controller.copyFromMergeToDescription('d32f61aa-7f67-11ea-bc55-0242ac130003','vBkBS4O3yvY');
// controller.copyFromMergeToDescription('d32f61aa-7f67-11ea-bc55-0242ac130003','4d1OmRA6yyI');
//  controller.copyFromMergeToDescription('d32f61aa-7f67-11ea-bc55-0242ac130003', 'll8cTIg2rwM' );
// controller.copyFromMergeToDescription('d32f61aa-7f67-11ea-bc55-0242ac130003', '6ZLCmVlQBLo' );


// // controller.parseJson(file);
// // controller.parseAudioFile(oceanFile);
// // controller.merge(file,oceanFile);
// // controller.convertVideoToAudio(__dirname, 'GXWpEjEFWkM_2020-03-31_1585712768');
// // controller.getAudioInsightAndMerge();
// // controller.insertIntoVideoDialogue1();

// UploadVideoController.getAudioInsightAndMerge(  'OMHPXC20200411053439', 'vBkBS4O3yvY')
// controller.downloadVideo('https://www.youtube.com/watch?v=OkBaZLq7gnU', 'OkBaZLq7gnU');

