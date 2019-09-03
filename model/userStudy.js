const db = require('../db/database');

let userStudy = {
    
    addUser: function(user, callback) {
        console.log('Insert user:', user);
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
    getHelperVideo: function (callback) {
        return db.query(`SELECT u.volunteer_id, u.video_id, v.title, u.ai_support FROM us_helper_video u 
                                JOIN video v 
                                ON u.video_id = v.youtube_id `, callback);
    },
};


module.exports = userStudy;


