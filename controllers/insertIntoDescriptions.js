const axios = require('axios');
const db = require('../db/database');
const Utils = require('../backend/utils');


class insertIntoDescriptions{

    async run(fromUserId, toUserId, videoId){
     
        try {   
            let sceneData = await db.any(`SELECT * FROM descriptions WHERE video_id = $1 AND volunteer_id = $2 ORDER BY scene_num`, [videoId, fromUserId]);
            console.log({sceneData});

            let sql = '';
            for(let i=0; i<sceneData.length; i++){
                let data = sceneData[i];
                let { has_ai, video_id, scene_id, scene_num, start_time, end_time,  description, ocr, note, merged_scene} = data;
                let descriptionId = toUserId + '_' + video_id + '_ai_' + scene_num;
                console.log({descriptionId});
                sql += ` INSERT INTO descriptions(desc_id, video_id, has_ai, volunteer_id, scene_id, scene_num, start_time, end_time, description, ocr, merged_scene, note) 
                        VALUES('${descriptionId}', '${video_id}', '${has_ai}','${toUserId}', '${scene_id}', ${scene_num}, ${start_time}, ${end_time}, '${description}', '${ocr}', '${merged_scene}', '${note}'); `
                
                      
            }

            sql = 'START TRANSACTION;' + sql + 'COMMIT;';
            console.log({sql});
            
            let res = await db.query(sql);
            console.log(res);

        }catch(e){
            console.log(e);
            throw e;
        }
    }

    async start(userId, videoId){
     
        try {   
            let sceneData = await db.any(`SELECT * FROM descriptions WHERE video_id = $1 AND volunteer_id = $2 ORDER BY scene_num`, [videoId, userId]);
            // console.log({sceneData});

            let sql = '';
            for(let i=1; i<sceneData.length; i++){
                let data = sceneData[i];
                let { has_ai, desc_id, video_id, scene_id, scene_num, start_time, end_time,  description, ocr, note, merged_scene} = data;
                // let descriptionId = toUserId + '_' + video_id + '_ai_' + scene_num;
                if (description.length == 0)
                    continue;
                console.log({description, ocr});
                let new_description = ''
                let new_ocr = ''
                /** Transformer API call */
                let url = 'http://3.15.220.168:5000/' + description;

                await axios.get(url)
                    .then(res => {
                        console.log("Response is: ",res.data);
                        new_description = res.data['result'];
                    
                    if(ocr.length > 0){
                            let ocr_url = 'http://3.15.220.168:5000/' + ocr;

                        axios.get(ocr_url)
                            .then(ocr_response => {
                                console.log("OCR Response is: ",ocr_response.data);
                                new_ocr = ocr_response.data['result'];
                                sql = ` UPDATE descriptions SET description = '${new_description}', ocr = '${new_ocr}' WHERE volunteer_id = '${userId}' AND video_id = '${videoId}' AND desc_id = '${desc_id}'; `
                                let sql_commit = 'START TRANSACTION;' + sql + 'COMMIT;';
                                console.log({sql_commit});
                                
                                let res = db.query(sql_commit);
                                console.log(res);
                                })
                                .catch(error => {
                                    console.log(error);
                                });        
                            

                    }
                    else{
                        sql = ` UPDATE descriptions SET description = '${new_description}' WHERE volunteer_id = '${userId}' AND video_id = '${videoId}' AND desc_id = '${desc_id}'; `
                        let sql_commit = 'START TRANSACTION;' + sql + 'COMMIT;';
                        console.log({sql_commit});
                        
                        let res = db.query(sql_commit);
                        console.log(res);
                    }
                    
                    
                    })
                    .catch(error => {
                        console.log(error);
                    });

                console.log({new_ocr});
                console.log({new_description});                      

                // sql += ` UPDATE descriptions SET description = '${new_description}', ocr = '${new_ocr}' WHERE volunteer_id = '${userId}' AND video_id = '${videoId}' AND description_id = '${descriptionId}'; `
                
                      
            }

            sql = 'START TRANSACTION;' + sql + 'COMMIT;';
            console.log({sql});
            
            // let res = await db.query(sql);
            // console.log(res);

        }catch(e){
            console.log(e);
            throw e;
        }
    }

}

let cont = new insertIntoDescriptions();
// cont.run('5117b1e0-4c45-11ea-b77f-2e728ce88125', '9fe1e2c6-5cd2-11ea-bc55-0242ac130003', '7QZNpS0uos4');
// cont.start('d8fcfd52-b0b3-4969-bf03-1dc54b681b5d', 'Q9Xp77AENXI');