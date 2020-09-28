const db = require('./db/database');

class us3_addDialog {

    insertIntoDb(scene_id,start_time,end_time){
  
      let sqlQuery = this.createInsertStatement(scene_id,start_time,end_time)
      this.addDialogTimestamps(sqlQuery);
    }
  
    createInsertStatement(video_id,start_time, end_time){
      return `INSERT INTO video_dialogs_timestamps(video_id, start_time, end_time) VALUES('${video_id}',${start_time}, ${end_time});`
    }
    
    addDialogTimestamps(sql, callback) {
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






async function runScript(){
    let videoId = 'Q9Xp77AENXI';
    let sql = `SELECT * FROM keyframe_revised WHERE video_id = '${videoId}';`;
    sql = `START TRANSACTION;` + sql + `COMMIT;`;
    let callback = '';
    let keyframeArr = await db.query(sql);
    console.log(keyframeArr);

    for(let i = 0; i<keyframeArr.length; i++){
        let timestamp = keyframeArr[i].timestamp;
        let keyframeId = keyframeArr[i].keyframe_id;
        let sceneId = await fetchSceneNum(timestamp,videoId);
        let sql = `UPDATE keyframe_revised SET scene_id = ${scene_id} WHERE keyframe_id=${keyframeId};`;
        sql = `START TRANSACTION;` + sql + `COMMIT;`;
        console.log({sql});
        await db.query(sql, callback);
    }
}
/** Fetch scene num from a given timestamp, videoId */
    async function fetchSceneNum(timestamp, videoId, sentence_id='d8fcfd52-b0b3-4969-bf03-1dc54b681b5d_Q9Xp77AENXI_ai_0_0'){
    
        console.log('Scene timestamps: '+timestamp+'  and '+videoId+' and '+sentence_id);
        let newstr = sentence_id.split('_');
        let volunteerId = newstr[0];
    
        let sceneStartTimesArr = await db.query(`SELECT start_time FROM descriptions_sentence WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);
        let sceneNumArr = await db.query(`SELECT scene_id FROM descriptions_sentence WHERE video_id = '${videoId}' AND volunteer_id = '${volunteerId}' ORDER BY scene_num`);
        // console.log('Scene timestamps: '+sceneStartTimesArr+'  and '+sceneNumArr);
        if(timestamp < 0)
            return -1;
        
        let start = 0;
        let end = sceneNumArr.length - 1;
        let index = -1;
        while(start <= end) {
            let mid = Math.floor((start + end)/2);
            if(sceneStartTimesArr[mid]['start_time'] == timestamp) {
                index = mid;
                break;
            } else if(sceneStartTimesArr[mid]['start_time'] < timestamp) {
                index = mid;
                start = mid + 1;
            } else {
                end = mid - 1;
            }
        }
        // return index;
        return sceneNumArr[index]['scene_id'];
    }

    runScript();