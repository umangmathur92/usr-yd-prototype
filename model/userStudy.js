const db = require('../db/database');

let userStudy = {

    addUser: function(user, callback) {
        console.log('Inser user:', user);
        return db.query(`INSERT into user_study_user (id,name) VALUES ($1, $2)`, [user.id, user.name], callback);
    },

    getAllUsers: function (callback) {
        return db.query('SELECT * FROM user_study_user ORDER BY id ASC', callback);
    },

    getUserById: function (id, callback) {
        return db.query(`SELECT * FROM user_study_user where id = ${id}`, callback);
    },
    getVideoByUserId: function (id, callback) {
       return db.query(`SELECT u.user_id, u.youtube_id, v.title, u.ai_support
                FROM user_study_video u JOIN video v
                ON u.youtube_id = v.youtube_id
                WHERE u.user_id = ${id}`, callback);
    },

    getVideosFromBottom : function(num, callback){
        return db.query(`SELECT * FROM user_study_video ORDER BY user_id DESC limit ${num}`, callback);
    },
    addVideo : function(data, callback){
        return db.query(`INSERT into user_study_video (user_id,youtube_id, ai_support) VALUES ($1, $2, $3)`, [data.id, data.youtube_id, data.ai_support], callback);
    }

};

module.exports = userStudy;


