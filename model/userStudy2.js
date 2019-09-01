const db = require('../db/database');
let userStudy2 = {

    getAllUsers: function (callback) {
        return db.query('SELECT * FROM us_user_blind ORDER BY id ASC', callback);
    }, 

    getUserById: function (id, callback) {
        return db.query(`SELECT * FROM us_user_blind where uuid = ${id}`, callback);
    },
};

module.exports = userStudy2;
