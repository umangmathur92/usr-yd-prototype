const db = require('../db/database');

let userStudy = {

    create: function(userStudy, callback) {
        return db.query('Insert into user_study (id, name, video) values(?,?,?)', [userStudy.id, userStudyuser.name, userStudy.video], callback);
    },

    getAllUsers: function (callback) {
        return db.query('Select * from user_study', callback);
    },

    getUserById: function (id, callback) {
        return db.query('Select * from user_study where id = ?', [id], callback);
    }

};

module.exports = userStudy;


