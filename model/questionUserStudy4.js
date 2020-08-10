const db = require('../db/database');
const uuidv1 = require('uuid/v1');


let questionUserStudy4 = {

    addQuestion: function(data, callback) {
        // console.log('inside question:', data);
        // let questionId = uuidv1();
        let todayDate = new Date();
        // let answerId = uuidv1();
        const sql = `START TRANSACTION; 
        INSERT into question_us4 (question_id, question, user_id, video_timestamp, timestamp) VALUES ('${data.questionId}','${data.question}','${data.userId}', ${data.youtube_timestamp}, '${todayDate.toLocaleString()}'); 
        COMMIT;`;
        // console.log({sql});
        // callback = {questionId: questionId};
        return db.query(sql, callback);
    }, 

    addCaption: function(data, callback) {
        
        let answerId = uuidv1();
        let todayDate = new Date();
        let isCaption = true;
        console.log("New: ",typeof(data.youtube_timestamp));
        const sql = `START TRANSACTION; 
        INSERT into answer_us4 (answer_id, user_id, answer, is_caption, keyframes, video_timestamp, timestamp) VALUES ('${answerId}','${data.userId}','${data.caption}', ${isCaption}, '${data.key_frame}', ${data.youtube_timestamp}, '${todayDate.toLocaleString()}'); 
        COMMIT;`;
        return db.query(sql, callback);
    }, 

    addAnswer: function(data, callback) {
        
        let answerId = uuidv1();
        let todayDate = new Date();
        let isCaption = false;

        const sql = `START TRANSACTION; 
        INSERT into answer_us4 (answer_id, question_id, user_id, answer, is_caption, keyframes, video_timestamp, timestamp) VALUES ('${answerId}','${data.question_id}','${data.userId}','${data.answer}', ${isCaption}, '${data.key_frame}', ${data.youtube_timestamp}, '${todayDate.toLocaleString()}'); 
        COMMIT;`;
        return db.query(sql, callback);
    }, 


    getQuestionByUserId: function (userId, callback) {
        return db.query(`SELECT * FROM question_us4 where user_id = ${userId}`, callback);
    },


    deleteAllQuestionsByUserId : function(userId, callback){
        // console.log('inside delete');
        return db.query(`Delete from question_us4 where id = '${userId}'`, callback);
        const sql = `START TRANSACTION; 
                     Delete from scene_qna_mapping where question_id = '${data.questionId}' AND answer_id = '${data.answerId}' ;             
                     Delete from question where id = '${data.questionId}'; 
                     Delete from answer where id = '${data.answerId}'; 
                     COMMIT;`;
        // console.log({sql});
         return db.query(sql, callback);
    }

};


module.exports = questionUserStudy4;