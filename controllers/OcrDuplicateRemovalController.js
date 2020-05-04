const videoModel = require('../model/video');
const OcrModel = require('../model/ocr');
const fs = require('fs');
const Utils = require('../backend/utils');
const db = require('../db/database');



class OcrDuplicateRemovalController{


    async removeDuplicate(file, videoId, duration, confidenceScore, topLimit){
        try{
             let rawdata = fs.readFileSync(file);
            let inputJson = JSON.parse(rawdata);
            let insights_json = inputJson.videos[0].insights;
            console.log({insights_json});

            let ocrJsonArr = insights_json.ocr;
            let shotArr = await db.query('select * from shot where scene_id like $1 order by start_time;', [videoId]);
            // console.log({shotArr});
            // await this.insertIntoTest_ShotTable(shotArr);
            let ocrArr = OcrModel.parseOcrJsonArr(ocrJsonArr);
            ocrArr.sort((ocr1, ocr2) => (ocr1.start_time > ocr2.start_time) ? 1 : (ocr1.start_time == ocr2.start_time) ? ((ocr1.top > ocr2.top) ? 1 : (ocr1.top == ocr2.top) ? ((ocr1.left > ocr2.left) ? 1 : -1) : -1 ): -1);
          
            ocrArr = this.setShotIdForAllOcrDetections(ocrArr, shotArr);
            // console.log({ocrArr});
            ocrArr = this.cleanUpOcrDataWithinEachShot(ocrArr);
            for(let i of ocrArr){
    
                let diff = i.end_time - i.start_time;
                let obj = {
                    start_time: i.start_time,
                    end_time: i.end_time,
                    diff
                }
                // console.log({obj});
                // console.log(i.confidence, 'text: ', i.text, ' top: ',i.top, 'left: ', i.left, ' diff:', diff);
            }
            // console.log({ocrArr});
            let filteredOcrArr = this.filer(ocrArr, duration, confidenceScore, topLimit);
            let concatenatedFilteredOCRArr = this.concatOcrWithinSameShot(filteredOcrArr);
            
            let concatenatedOcrTextArr = this.concatOcrWithinSameShot(ocrArr);

            let res = await OcrModel.updateShotTableWithFilteredOcr(concatenatedFilteredOCRArr);
            // console.log({concatenatedFilteredOCRArr});
            // let res = await this.updateTestShotTable(concatenatedOcrTextArr);
            console.log('Success: Data updated', res);
            
            //SCENE
            let sceneArr = await db.any('SELECT * FROM scene WHERE video_id like $1 ORDER BY start_time', [videoId]);
            console.log({sceneArr});
            for(let i=0; i<sceneArr.length; i++) {
                let currScene = sceneArr[i];
                let currSceneId = currScene.scene_id;
                let shotsOcrJsonArr = await db.any('SELECT original_ocr, filtered_ocr FROM shot WHERE scene_id = $1 ORDER BY shot_num ASC', [currSceneId]);
                let ocrArrForScene = [];
                let filteredOCRArr = [];
                for(let j=0; j<shotsOcrJsonArr.length; j++) {
                    console.log('FILTERSCENE:', shotsOcrJsonArr[j]);
                    ocrArrForScene.push(shotsOcrJsonArr[j].original_ocr.trim());
                    if(shotsOcrJsonArr[j].filtered_ocr){
                        console.log('FILTERSCENE:', shotsOcrJsonArr[j].filtered_ocr);
                        filteredOCRArr.push(shotsOcrJsonArr[j].filtered_ocr.trim());
                    }
                }
                // console.log({OLD: ocrArrForScene});
                console.log({filteredOCRArr});
                ocrArrForScene = Utils.removeDuplicatesFromStringArr(ocrArrForScene);
                filteredOCRArr = Utils.removeDuplicatesFromStringArr(filteredOCRArr);
                console.log({afterDUplicateRemoval:filteredOCRArr});
                
                let finalSceneOcr = '';
                for (let j=0; j<ocrArrForScene.length; j++) {
                    if(ocrArrForScene[j] != '' || ocrArrForScene[j] != undefined || ocrArrForScene[j] != ' ' || ocrArrForScene[j] != '\n') {
                        finalSceneOcr = finalSceneOcr + '\n' + ocrArrForScene[j];
                    }
                }
                finalSceneOcr = finalSceneOcr.trim();


                let finalFilteredSceneOcr = '';
                for (let j=0; j<filteredOCRArr.length; j++) {
                    if(filteredOCRArr[j] != '' || filteredOCRArr[j] != undefined || filteredOCRArr[j] != ' ' || filteredOCRArr[j] != '\n') {
                        finalFilteredSceneOcr = finalFilteredSceneOcr + '\n' + filteredOCRArr[j];
                    }
                }
                finalFilteredSceneOcr = finalFilteredSceneOcr.trim();

                // let sceneRes =  await db.query('Insert into test_scene (scene_id, scene_num, ocr, video_id) VALUES ($1, $2, $3, $4)', [currSceneId, currScene.scene_num,finalSceneOcr, currScene.video_id]);
                //    let sceneRes = await db.one("UPDATE test_scene SET ocr = $1 WHERE scene_id = $2 RETURNING id", [finalSceneOcr, currSceneId], a => + a.id);
               
                // let sceneRes = await db.one("UPDATE scene SET ocr = $1, filtered_ocr = $2 WHERE scene_id = $3 RETURNING id", [finalSceneOcr, finalFilteredSceneOcr, currSceneId], a => + a.id);
                 let sceneRes = await db.one("UPDATE scene SET filtered_ocr = $1 WHERE scene_id = $2 RETURNING id", [finalFilteredSceneOcr, currSceneId], a => + a.id);
               
                   console.log('Success: Data updated', sceneRes);
            }




        }catch(e){
            console.log(e);
        }
      

    }

    
    filer(ocrArr, duration, confidenceScore, topLimit){
        for (const ocrObj of ocrArr) {
            let diff = ocrObj.end_time - ocrObj.start_time;
            if(diff >= duration && ocrObj.confidence >= confidenceScore && ocrObj.top >= topLimit){
                
            }else{
                ocrObj.text = '';
            }
        }

        return ocrArr;

    }


    async updateTestShotTable(concatenatedOcrTextArr) {
        console.log('DB Operation: Updating Test Shot table with OCR data');
        try {
            return await db.tx(t => {
                var queries = concatenatedOcrTextArr.map(ocrObj => {
                    return t.one('UPDATE test_shot SET original_ocr = ${text} WHERE shot_id = ${shot_id} RETURNING id', ocrObj, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }

    async insertIntoTest_ShotTable(shotArr) {
        console.log('DB Operation: Inserting Shots in test_shot');
        try {
            return await db.tx(t => {
                var queries = shotArr.map(shot => {
                    return t.one('INSERT INTO test_shot(shot_id, scene_id, shot_num, start_time, end_time, original_ocr, original_description) VALUES(${shot_id}, ${scene_id}, ${shot_num}, ${start_time}, ${end_time}, ${original_ocr}, ${original_description}) RETURNING id', shot, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }


    concatOcrWithinSameShot(ocrArr) {
        let outputArr = [];
        let customOcrObj = new Object();
        customOcrObj.shot_id = '-';
        customOcrObj.text = '';
        let lastShotNum = -1;
        for(let i=0; i<ocrArr.length; i++) {
            let currOcrObj = ocrArr[i];
            if(currOcrObj.shot_num > lastShotNum) {
                if(lastShotNum > -1) {
                    outputArr.push(customOcrObj);
                }
                customOcrObj = new Object();
                customOcrObj.shot_id = currOcrObj.shot_id;
                customOcrObj.text = '';        
                lastShotNum = currOcrObj.shot_num;
            }
            customOcrObj.text = customOcrObj.text + currOcrObj.text + ' ';
        }
        customOcrObj.text = customOcrObj.text.trim();
        outputArr.push(customOcrObj);
        return outputArr;
    }
    
    //main logic for tweaking the duration of OCR
     setShotIdForAllOcrDetections(ocrArr, shotArr) {
        let shotStartTimeArr = this.extractStartTimeArrFromObjectArr(shotArr);
        for (const ocrObj of ocrArr) {
            let shotIndex = this.getIndexOfInputArrForTargetVal(ocrObj.start_time, shotStartTimeArr);
            let parentShot = shotArr[shotIndex];
            ocrObj.shot_id = parentShot.shot_id;
            ocrObj.shot_num = parentShot.shot_num;
            ocrObj.shot_start_time = parentShot.start_time;
            ocrObj.shot_end_time = parentShot.end_time;
            ocrObj.diff = ocrObj.end_time - ocrObj.start_time;
        }

        return ocrArr;
    }
    

    cleanUpOcrDataWithinEachShot(ocrArr) {
        let ocrMap = new Map();
        for(let i=0; i<ocrArr.length; i++) {
            let currOcrObj = ocrArr[i];
            //currOcrObjKey is generated by appending certain important attribute values to form a unique string - useful for finding OCR detections with similar data
            let currOcrObjKey = currOcrObj.shot_id + '_' + currOcrObj.text + '_' + currOcrObj.left + '_' + currOcrObj.top + '_' + currOcrObj.width + '_' + currOcrObj.height;
           
            
            if(ocrMap.has(currOcrObjKey)) {
                let mOcrObj = ocrMap.get(currOcrObjKey);
                //Combine OCR shots properties if time difference between similar OCR detections is less than 3 seconds (the text, position on screen and size are already same)
                // let Cur_Diff = currOcrObj.end_time - currOcrObj.start_time ;
                // let M_Diff = mOcrObj.end_time - mOcrObj.start_time ;
                // let diff = currOcrObj.end_time - mOcrObj.start_time;

                if(currOcrObj.start_time - mOcrObj.end_time < 3) {
                    mOcrObj.end_time = currOcrObj.end_time;
                } else {
                    currOcrObjKey = currOcrObjKey + '_' + i;
                    ocrMap.set(currOcrObjKey, currOcrObj)
                }
            } else {
                ocrMap.set(currOcrObjKey, currOcrObj);
            }
        }
        let outputArr = [];
        let ocrMapKeys = ocrMap.keys(); 
        for(const mapKey of ocrMapKeys) {
            let ocrObj = ocrMap.get(mapKey);
            outputArr.push(ocrObj);
        }
        return outputArr;
    }


    // parseVideoFromIndexerJson(inputJson) {
    //     // console.log({parseVideoFromIndexerJson : requestBody});
    //     // console.log({inputJson});
    //     let id = -1;
    //     let youtube_id = inputJson.youtubeId;
    //     let indexer_video_id = inputJson.id;
    //     let title = inputJson.name;
    //     let duration = Utils.parseSecondsFromString(inputJson.summarizedInsights.duration.time);
    //     let summarised_insights_json = inputJson.summarizedInsights;
    //     let insights_json = inputJson.videos[0].insights;
    //     return insights_json;
    //     // return new Video(id, youtube_id, indexer_video_id, title, duration, summarised_insights_json, insights_json);
    // }


     extractStartTimeArrFromObjectArr(genericObjectArr) {
        let outputArr = [];
        genericObjectArr.forEach(obj => {
            outputArr.push(obj.start_time);
        });
        return outputArr;
    }
    
    //Returns index of array item whose value is equal-to or lesser-than(also nearest-in-value) the target (binary search algorithm)
      getIndexOfInputArrForTargetVal(target, inputArr) {
        let start = 0;
        let end = inputArr.length - 1;
        let index = -1;
        while(start <= end) {
            let mid = Math.floor((start + end)/2);
            if(inputArr[mid] == target) {
                index = mid;
                break;
            } else if(inputArr[mid] < target) {
                index = mid;
                start = mid + 1;
            } else {
                end = mid - 1;
            }
        }
        return index;
    }

}




let controller = new OcrDuplicateRemovalController();
// let file = './heinz.json';
// let videoId = '64ad005466%';

// HOPE FOR PAWS
// file = './hopeForPaws.json';
// videoId = 'll8cTIg2rwM%';

// BAWDY
// file = './bawdy.json';
// videoId =  '6ZLCmVlQBLo%';

//ocean8
// file = './oceans8.json';
// videoId = 'OkBaZLq7gnU%';

//Fried Potato Ball
file = './potatoBall.json';
videoId= 'nqXz8hhAYGo%'


// CRISPY Cabbage
// file = './crispyCabbage.json';
// videoId= 'cNj3aOTYdQQ%'

//MISSION IMPOSSIBLE ROUGE
// file = './MissionImpossibleRouge.json';
// videoId = 'elpUGB9Ap1Y%';


let duration = 1;
let confidenceScore = 0.56 ;
let topLimit = 100;
console.log({videoId, duration, confidenceScore, topLimit});
controller.removeDuplicate(file, videoId, duration, confidenceScore, topLimit);
