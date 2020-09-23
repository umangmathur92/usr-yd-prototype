const db = require('../db/database');

let keyframeRevise = {

    addKeyframe: function(data, callback) {

        const sql = `START TRANSACTION; 
        INSERT into keyframe_revised (keyframe_id, video_id, keyframe_num, keyframe_url, timestamp) VALUES ('${data.keyframeId}','${data.videoId}',${data.keyframeNum}, '${data.keyframeURL}', ${data.timestamp}); 
        COMMIT;`;

        return db.query(sql, callback);
    }, 

    updateKeyframe: function(data, callback) {
        
        const sql = `START TRANSACTION; 
        INSERT into keyframe_revised (keyframe_id, video_id, keyframe_num, keyframe_url, timestamp) VALUES ('${data.keyframeId}','${data.videoId}',${data.keyframeNum}, '${data.keyframeURL}', ${data.timestamp}); 
        COMMIT;`;

        return db.query(sql, callback);
    }
}


module.exports = keyframeRevise;