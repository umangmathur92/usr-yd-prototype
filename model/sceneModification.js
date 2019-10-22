const db = require('../db/database');

let sceneModification = {

    addModifiedScene: function(data, callback) {
        console.log('inside modified scene:', data);
        const { scene_id, user, block_id, scene_num,start_time, end_time,  description, ocr } = data;
        const sql = `
        INSERT INTO us3_description_modified(user_id, scene_id, block_id, scene_num, start_time, end_time, description, ocr) 
        VALUES('${user}', '${scene_id}', '${block_id}', ${scene_num}, ${start_time}, ${end_time}, '${description}', '${ocr}')
        ON CONFLICT(scene_id, user_id) DO UPDATE SET description ='${description}'; `;
        console.log({sql});
        return db.query(sql, callback);
    }, 

    getDescriptionByUserId: function (id, callback) {
        console.log({id});
        let query = `select * from us3_description_modified
        where user_id='${id}';`
        return db.query(query, callback);
    },

};


module.exports = sceneModification;