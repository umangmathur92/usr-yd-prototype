const db = require('../db/database');
const uuidv1 = require('uuid/v1');


let question = {

    createQuestion: function(data, callback) {
        console.log('inside question:', data);
        let questionId = uuidv1();
        let answerId = uuidv1();
        const sql = `START TRANSACTION; INSERT into question (id, question) VALUES ('${questionId}','${data.question}'); INSERT into answer (id, answer) VALUES ('${answerId}','${data.answer}'); INSERT into question_answer (user_id, question_id, answer_id) VALUES ('${data.user}', '${questionId}', '${answerId}'); COMMIT;`;
        console.log({sql});
        return db.query(sql, callback);
    }, 

    createAnswer: function(data, callback) {
        console.log('inside answer:', data);
        return db.query(`INSERT into answer (answer) VALUES ($1)`, [data.answer], callback);
    }, 

    getQuestionById: function (id, callback) {
        return db.query(`SELECT * FROM question where id = ${id}`, callback);
    },

    getQuestionAnswerByUserId: function (id, callback) {
        console.log({id});
        return db.query(`SELECT * FROM question_answer where user_id = '${id}'`, callback);
    },

    updateQuestion: function (data, callback) {
        console.log({'IINSIE US': data});
        return db.query(`UPDATE question set question = $1 where id= $2`, [data.question, data.id], callback);
    }

};


module.exports = question;