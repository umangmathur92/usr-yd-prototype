const db = require('../db/database');

let userStudy = {
    
    addUser: function(user, callback) {
        // console.log('Insert user:', user);
        return db.query(`INSERT into us_user (uuid,name) VALUES ($1, $2)`, [user.id, user.name], callback);
    }, 
    getAllUsers: function (callback) {
        return db.query('SELECT * FROM us_user ORDER BY id ASC', callback);
    }, 
    getUserById: function (id, callback) {
        return db.query(`SELECT * FROM us_user where uuid = ${id}`, callback);
    },
    getVideoByUserId: function (id, callback) {
        return db.query(`SELECT u.user_id, u.video_id, v.title, u.ai_support FROM us_user_video u JOIN video v ON u.video_id = v.youtube_id WHERE u.user_id = ${id}`, callback);
    }, 
    getVideosFromBottom : function(num, callback){
        return db.query(`SELECT * FROM us_user_video ORDER BY id DESC limit ${num}`, callback);
    },
    addVideo : function(data, callback){
        return db.query(`INSERT into us_user_video (user_id,youtube_id, ai_support) VALUES ($1, $2, $3)`, [data.id, data.youtube_id, data.ai_support], callback);
    },
    getHelperVideo: function (id, callback) {
        return db.query(`SELECT u.vi_user_id, u.id, u.volunteer_id, u.video_id, v.title, u.ai_support, u.rating, u.comment, u.video_understanding 
                            FROM us_helper_video u 
                            JOIN video v 
                            ON u.video_id = v.youtube_id 
                            WHERE u.vi_user_id = '${id}'
                            order by u.id`, callback);
    },
    updateStatus_VIUser: function (data, callback) {
        console.log({'IINSIE US': data});
        return db.query(`UPDATE us_user_blind set submitted = $1 where uuid= $2`, [data.status, data.id], callback);
    },
    updateVIUserInfo: function (data, callback) {
        return db.query(`UPDATE us_user_blind set email= $2, vid_desc_frequency=$3, access_preference=$4, access_pref_other= $5 where uuid= $1`, [data.id, data.email, data.vid_desc_frequency, data.access_preference, data.access_pref_other], callback);
    },
    getUsers_VIStatus: function (status, callback) {
        return db.query(`SELECT * FROM us_user_blind where status= ${status}`, callback);
    },
    //get count of users
    getAllUser_VI: function (id, callback) {
        return db.query(`select * from us_user_blind where uuid = '${id}';`, callback);
    },

    deleteSceneById : function(data, videoId, user_id, callback){
         console.log('inside delete', data);
         let sql = `Delete from descriptions where video_id='${videoId}' and scene_id = '${data.sceneId} and volunteer_id='${user_id}''`;
         console.log({sql});
        return db.query(sql, callback);
    },
    updateSceneEndTime: function (data, callback) {
        return db.query(`UPDATE descriptions set end_time = $1
                        where video_id = $2 and scene_id= $3 and volunteer_id = $4`, [data.endTime, data.video_id, data.scene_id, data.volunteer_id], callback);
    },

};


module.exports = userStudy;


