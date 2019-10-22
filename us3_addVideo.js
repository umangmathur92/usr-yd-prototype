const db = require('./db/database');

class us3_addVideo {


    parseJson(){

        let json = { 
            "/srv/share/abhshkdz/data/youdescribe/2019_10_12_trailer_frames/ForrestGumpSelectFrames/frame2300.jpg":{ 
               "startTime":0,
               "endTime": 3,
               "description":"a man standing in a dark room looking at the camera"
            },
            "/srv/share/abhshkdz/data/youdescribe/2019_10_12_trailer_frames/ForrestGumpSelectFrames/frame1911.jpg":{ 			
                    "startTime":3,
               "endTime": 4,
               "description": "a man and a woman are in a room",
            }
           
         };
         let videoId = 'foIgSccwX94';
         let blockId = 'foIgSccwX94_3';
         let sceneId = blockId +'_';
         let sceneNum = 0;
         
         for(let i=45; i<46 ; i++){
            let scene_id = sceneId+i
                
            let queryResult =   this.addQuestionAnswer( scene_id, blockId, i, 0, 0, '') ;
            queryResult
              .then(result => {
                console.log(result);
              })
              .catch((err) => {
                console.log({err});
              });
         }

        //  for (let key in json) {
        //         if (json.hasOwnProperty(key)) {
        //            console.log(  sceneId+sceneNum+': ' + blockId +":  "+ json[key].startTime + '-' + json[key].endTime + 'sec, ' +json[key].description);
        //            sceneNum++;
        //         }
             
        //         let scene_id = sceneId+sceneNum
                
                
        //         let queryResult =   this.addQuestionAnswer( scene_id, blockId, sceneNum, json[key].startTime, json[key].endTime, json[key].description) ;
        //         queryResult
        //           .then(result => {
        //             console.log(result);
        //           })
        //           .catch((err) => {
        //             console.log({err});
        //           });
        //     }
    }
    
    addQuestionAnswer(scene_id, block_id, scene_num, start_time, end_time, original_description, callback) {
        console.log({scene_id});
        console.log('inside question:');
        const sql = `INSERT INTO scene(scene_id, block_id, scene_num, start_time, end_time, original_description) 
                    VALUES('${scene_id}','${block_id}', ${scene_num}, ${start_time}, ${end_time}, '${original_description}');`;
        console.log({sql});
        return db.query(sql, callback);
    }



  }
  
  let addVideo = new us3_addVideo();
  addVideo.parseJson(); // Will output 'Hello, my name is Martin, I have ID: id_1'