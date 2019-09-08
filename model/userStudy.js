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
        return db.query(`SELECT u.vi_user_id, u.id, u.volunteer_id, u.video_id, v.title, u.ai_support, u.rating, u.comment 
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

    getUsers_VIStatus: function (status, callback) {
        return db.query(`SELECT * FROM us_user_blind where status= ${status}`, callback);
    },
    //get count of users
    getCount_VI: function (callback) {
        return db.query(`select count(*) from us_user_blind;`, callback);
    },



};


module.exports = userStudy;


