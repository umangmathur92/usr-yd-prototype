
const db = require('./db/database');
const fs = require('fs');
const csv = require('csv-parser');
const fetch = require('node-fetch');
const data = require('./MIvault.json');




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
//   video_id for Ocean8 shoplifting scene
  // const video_id = 'OkBaZLq7gnU'; 
//   video_id for MI vault scene
  const video_id = '2wwC9c3iYK4'; 
//   video_id for notebook scene
  // const video_id = '7QZNpS0uos4';
// video_id for Mi rogue nation
  // const video_id = 'elpUGB9Ap1Y';
  
  let addDialog = new us3_addDialog();
  let flag = false;
  let dialog_start_time;
  let dialog_end_time;
  let new_dialog_end_time;
  // for( let val of data.result.sentence)

  let start_times = []  // Array for all start times
  let end_times = []  // Array for all end times

  for(let i=0;i<data.result.sentence.length;i++){

    if(i==0)
      start_times.push(data.result.sentence[i].startTime);
    else if(data.result.sentence[i].startTime - data.result.sentence[i-1].endTime >= 1)
      start_times.push(data.result.sentence[i].startTime);

      if(i==data.result.sentence.length-1)
      end_times.push(data.result.sentence[i].endTime);
    else if(data.result.sentence[i+1].startTime - data.result.sentence[i].endTime >= 1)
    end_times.push(data.result.sentence[i].endTime);

    }



    console.log("The length of start time sand end times are: "+ start_times.length +"  and "+ end_times.length);

    for(let i=0; i<start_times.length;i++){
      console.log("start time: " + start_times[i] + "and end time: "+ end_times[i]);
    }

    for(let i=0; i< start_times.length;i++)
    {
      addDialog.insertIntoDb(video_id,start_times[i],end_times[i]);
    }

//     for(let i=0;i<data.result.sentence.length;i++)
//   {    
//       console.log(data.result.sentence[i].endTime);
      
//       if(i!= data.result.sentence.length -1 && data.result.sentence[i+1].startTime - data.result.sentence[i].endTime < 1){
//             dialog_start_time = data.result.sentence[i].endTime;
//             flag = true;
//           }


      
//       if(flag){
          
//       }
//       dialog_start_time = val.startTime;
//       dialog_end_time = val.endTime;
//       addDialog.insertIntoDb(video_id,dialog_start_time,dialog_end_time);
//     //   break;
// }
// let jsonFile;
// fetch('./descriptionData.json').then(response => {
//     jsonFile = response.json();
//   })

