const db = require('../db/database');
const uuidv1 = require('uuid/v1');


let sessionQnA = {

    addQuestionAnswer: function(data, callback) {
        // console.log('inside question:', data);
        const { sceneId, user, question='', answer='', 
            questionId ,  
            answerId, videoId, sessionType} = data;
        const sql = `START TRANSACTION; 
        INSERT into question (id, question) VALUES ('${questionId}','${question}') ON CONFLICT(id) DO UPDATE SET question ='${question}'; 
        INSERT into answer (id, answer) VALUES ('${answerId}','${data.answer}') ON CONFLICT(id) DO UPDATE SET answer='${answer}'; 
        INSERT into us3_session_qna(video_id,user_id,question_id, answer_id, session_type) VALUES ('${videoId}','${user}', '${questionId}', '${answerId}', '${sessionType}') 
        ON CONFLICT(video_id,user_id,question_id, answer_id) DO NOTHING; 
        COMMIT;`;
        console.log({'ADD Question answer Session :': sql});
        return db.query(sql, callback);
    }, 

    getQuestionAnswerByUserId: function (data, callback) {
        // console.log({id});
        let query = `select q.id as "questionId", a.id as "answerId",
                        q.question as question, a.answer as answer
                    from us3_session_qna s, question q, answer a
                    where s.question_id=q.id and s.answer_id=a.id and s.user_id='${data.userId}' and s.video_id= '${data.videoId}' ;`
        return db.query(query, callback);
    },

    deleteQuestionById : function(data, callback){
        // console.log('inside delete');
        const sql = `START TRANSACTION; 
                     Delete from question where id = '${data.questionId}'; 
                     Delete from answer where id = '${data.answerId}'; 
                     Delete from us3_session_qna where question_id = '${data.questionId}' AND answer_id = '${data.answerId}' ;
                     COMMIT;`;
        // console.log({sql});
         return db.query(sql, callback);
    }

};


module.exports = sessionQnA;