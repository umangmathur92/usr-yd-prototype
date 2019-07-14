const pgp = require('pg-promise')();
var connection = {
    host: 'yd-prototype-db-new.cd8kr5vqcxkw.us-east-2.rds.amazonaws.com', //URL of DB
    port: 5432, //5432 is the default port for PostgreSQL
    database: 'yd-prototype-db',
    user: 'youdescribe_user',
    password: 'password123'
};
var db = pgp(connection);
module.exports = db;

// const pgp = require('pg-promise')();
// var connection = {
//     host: 'yd-prototype-db.cd8kr5vqcxkw.us-east-2.rds.amazonaws.com', //URL of DB
//     port: 5432, //5432 is the default port for PostgreSQL
//     database: 'yd-prototype-db',
//     user: 'youdescribe_user',
//     password: 'password123'
// };
// var db = pgp(connection);
// module.exports = db;