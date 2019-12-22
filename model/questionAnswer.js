const db = require('../db/database');
const uuidv1 = require('uuid/v1');


let question = {

    createQuestion: function(data, callback) {
        // console.log('inside question:', data);
        let questionId = uuidv1();
        let answerId = uuidv1();
        const sql = `START TRANSACTION; 
        INSERT into question (id, question) VALUES ('${questionId}','${data.question}'); 
        INSERT into answer (id, answer) VALUES ('${answerId}','${data.answer}'); 
        INSERT into question_answer (user_id, question_id, answer_id) VALUES ('${data.user}', '${questionId}', '${answerId}'); 
        COMMIT;`;
        // console.log({sql});
        return db.query(sql, callback);
    }, 

    addQuestionAnswer: function(data, callback) {
        // console.log('inside question:', data);
        const { sceneId, user, question='', answer='', 
            questionId= uuidv1(),  
            answerId = uuidv1(), videoId } = data;
        const sql = `START TRANSACTION; 
        INSERT into question (id, question) VALUES ('${questionId}','${question}') ON CONFLICT(id) DO UPDATE SET question ='${question}'; 
        INSERT into answer (id, answer) VALUES ('${answerId}','${data.answer}') ON CONFLICT(id) DO UPDATE SET answer='${answer}'; 
        INSERT into scene_qna_mapping (video_id, scene_id,user_id,question_id, answer_id) VALUES ('${videoId}', '${sceneId}','${user}', '${questionId}', '${answerId}') 
        ON CONFLICT(scene_id,user_id,question_id, answer_id) DO NOTHING; 
        COMMIT;`;
        console.log({'ADD TEST:': sql});
        return db.query(sql, callback);
    }, 

    createAnswer: function(data, callback) {
        // console.log('inside answer:', data);
        return db.query(`INSERT into answer (answer) VALUES ($1)`, [data.answer], callback);
    }, 

    getQuestionById: function (id, callback) {
        return db.query(`SELECT * FROM question where id = ${id}`, callback);
    },

    getQuestionAnswerByUserId: function (data, callback) {
        // console.log({id});
        let query = `select q.id as "questionId", a.id as "answerId",
        s.scene_id as "sceneId", q.question as question, a.answer as answer
        from scene_qna_mapping s, question q, answer a
        where s.question_id=q.id and s.answer_id=a.id and s.user_id='${data.userId}' and s.video_id= '${data.videoId}';`
        return db.query(query, callback);
    },

    updateQuestion: function (data, callback) {
        // console.log({'IINSIE US': data});
        return db.query(`UPDATE question set question = $1 where id= $2`, [data.question, data.id], callback);
    },

    updateAnswer: function (data, callback) {
        // console.log({'IINSIE US': data});
        return db.query(`UPDATE answer set answer = $1 where id= $2`, [data.answer, data.id], callback);
    },

    deleteQuestionById : function(data, callback){
        // console.log('inside delete');
        const sql = `START TRANSACTION; 
                     Delete from question where id = '${data.questionId}'; 
                     Delete from answer where id = '${data.answerId}'; 
                     Delete from scene_qna_mapping where question_id = '${data.questionId}' AND answer_id = '${data.answerId}' ;
                     COMMIT;`;
        // console.log({sql});
         return db.query(sql, callback);
    }

};


module.exports = question;