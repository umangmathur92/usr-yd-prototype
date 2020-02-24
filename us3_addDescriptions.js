
const db = require('./db/database');
const fs = require('fs');
const csv = require('csv-parser');
const fetch = require('node-fetch');
const data = require('./MIrogue.json');




class us3_addDialog {

  insertIntoDb(scene_id,start_time,end_time){

    let sqlQuery = this.createInsertStatement(scene_id,start_time,end_time)
    this.addDialogTimestamps(sqlQuery);
  }

  createInsertStatement(video_id,start_time, end_time){
    return `INSERT INTO video_dialogs(video_id, start_time, end_time) VALUES('${video_id}',${start_time}, ${end_time});`
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
//   video_id for Ocean8 shoplifting scene
//   const video_id = 'OkBaZLq7gnU'; 
//   video_id for MI vault scene
  // const video_id = '2wwC9c3iYK4'; 
  // const video_id = '7QZNpS0uos4';
// video_id for Mi rogue nation
  const video_id = 'elpUGB9Ap1Y';
  
  let addDialog = new us3_addDialog();

  
  for( let val of data.result.sentence)
 {     console.log(val.endTime);
    let dialog_start_time = val.startTime;
    let dialog_end_time = val.endTime;
      addDialog.insertIntoDb(video_id,dialog_start_time,dialog_end_time);
    //   break;
}
// let jsonFile;
// fetch('./descriptionData.json').then(response => {
//     jsonFile = response.json();
//   })

