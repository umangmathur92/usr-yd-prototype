/**
 * created by: Vaishali
 * json parser for creating video data 
 * created specifically for User study 3, phase 1 to bypass the current videoIndexer
 */

const db = require('./db/database');
const fs = require('fs');
const csv = require('csv-parser');

class us3_addVideo {

  parseJsonUpdated(pythiaFile, sceneMappingFile, videoId, FilePathToExtractFramNum, frameNumForExtraction){
      
    let rawdata = fs.readFileSync(pythiaFile);
    let videoJsonObj = JSON.parse(rawdata);
    // console.log(videoJsonObj);

    let frameMap = this.createFrameMap(videoJsonObj, FilePathToExtractFramNum, frameNumForExtraction);
     console.log({frameMap});

    let block_id = videoId + '_1';
    let scene = block_id +'_';
    let insertStament = '';
   
    fs.createReadStream(sceneMappingFile)
      .pipe(csv())
      .on('data', (row) => {
        let scene_num = row.Scene;
        let scene_id = scene + scene_num;
        let start_time = parseFloat(row.TimestampStart).toFixed(2);
        let end_time = parseFloat(row.TimestampEnd).toFixed(2);
        let from = parseInt(row.FrameNumStart);
        let to = parseInt(row.FrameNumEnd);
        let original_description = this.searchFrameMap(from, to, frameMap);
        
        insertStament += this.createInsertStatement(scene_id, block_id, scene_num, start_time, end_time, original_description)+'\n';
         console.log('sceneNum:' + scene_num + ',  BlockId: ' + block_id + ' ,   sceneId: ' + scene_id +":  " + start_time + ', ' + end_time + ', '+ 'from:' + from + '-'+ to + original_description );
        // console.log({insertStament});
      })
      .on('end', () => {
        console.log('CSV file successfully processed');
         this.addQuestionAnswer(insertStament);
      });
  }

  createInsertStatement(scene_id, block_id, scene_num, start_time, end_time, original_description){
    return `INSERT INTO scene(scene_id, block_id, scene_num, start_time, end_time, original_description) VALUES('${scene_id}','${block_id}', ${scene_num}, ${start_time}, ${end_time}, '${original_description}');`
  }

  createFrameMap(json, file, frameNumForExtraction){
    // let file = '/srv/share/abhshkdz/data/youdescribe/2019_10_12_trailer_frames/LittleWomenSelectFrames/frame3023.jpg';
    let index = file.indexOf(frameNumForExtraction);
    let frameMap = new Map();
    // console.log({index});

    for (let key in json) {
      if (json.hasOwnProperty(key)) {
        let frameNum = key.substring(index+5);
        let index1 = frameNum.indexOf('.');
        frameNum = frameNum.substring(0, index1);
        frameMap.set(parseInt(frameNum, 10),  json[key]);
      }
   
    }
    //  console.log(frameMap);
    return frameMap;
  }

  searchFrameMap(from, to, frameMap){
    let description='' ;
    for(let i = from; i <= to; i++){
      if(frameMap.has(i)){
        description += frameMap.get(i) + '\n';
      }
    }
    
    return description;
  }
  
  addQuestionAnswer(sql, callback) {
        console.log({sql});
        sql = `START TRANSACTION;` + sql + `COMMIT;`;
        console.log({sql});
        let queryResult =  db.query(sql, callback);
        queryResult.then(result => {
          console.log(result);
        }).catch(e => {
          console.log(e);
        });
    }
  }
  
//FOREST GUMP
  // let pythiafile = './videoData_us3_phase1/gump_pythia_pruned_dict.json';
  // let sceneMappingFile = './videoData_us3_phase1/ForrestGumpFrames.csv';
  // let videoId = 'bLvqoHBptjg';
  // let FilePathToExtractFramNum = '/srv/share/abhshkdz/data/youdescribe/2019_10_12_trailer_frames/ForrestGumpSelectFrames/frame0067.jpg';
  // let frameNumForExtraction = 'frame0067.jpg';

  //LITTLE WOMEN
  let pythiafile = './videoData_us3_phase1/women_pythia_pruned_dict.json';
  let sceneMappingFile = './videoData_us3_phase1/LittleWomenFrames.csv';
  let videoId = 'foIgSccwX94';
  let FilePathToExtractFramNum = '/srv/share/abhshkdz/data/youdescribe/2019_10_12_trailer_frames/LittleWomenSelectFrames/frame3023.jpg';
  let frameNumForExtraction = 'frame3023.jpg';

  let addVideo = new us3_addVideo();
  addVideo.parseJsonUpdated(pythiafile, sceneMappingFile, videoId, FilePathToExtractFramNum, frameNumForExtraction);