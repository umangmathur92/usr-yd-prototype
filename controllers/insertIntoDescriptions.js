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

}

let cont = new insertIntoDescriptions();
// cont.run('5117b1e0-4c45-11ea-b77f-2e728ce88125', '9fe1e2c6-5cd2-11ea-bc55-0242ac130003', '7QZNpS0uos4');



