const db = require('../db/database');

let sceneModification = {

    // addModifiedScene: function(data, callback) {
    //     console.log('inside modified scene:', data);
    //     const { has_ai, videoId, scene_id, user, block_id, scene_num,start_time, end_time,  description, ocr } = data;
    //     let descriptionId = user + '_' + video_id + '_ai_' + scene_num;
    //     console.log({descriptionId});
    //     const sql = `
    //     INSERT INTO descriptions(desc_id, video_id, has_ai, volunteer_id, scene_id, scene_num, start_time, end_time, description, ocr) 
    //     VALUES('${descriptionId}', '${videoId}', '${has_ai}','${user}', '${scene_id}', ${scene_num}, ${start_time}, ${end_time}, '${description}', '${ocr}')
    //     ON CONFLICT(scene_id, user_id) DO UPDATE SET description ='${description}'; `;
    //     console.log({sql});
    //     return db.query(sql, callback);
    // }, 

    getDescriptionByUserId: function (id, callback) {
        console.log({id});
        let query = `select * from us3_description_modified
        where user_id='${id}';`
        return db.query(query, callback);
    },

};


module.exports = sceneModification;