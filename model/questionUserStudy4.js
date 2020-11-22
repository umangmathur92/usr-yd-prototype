const db = require('../db/database');
const uuidv1 = require('uuid/v1');

let conditionTypes = {
    'A' : 'AI baseline and on-demand',
    'B' : 'Human baseline and on-demand',
    'C' : 'Only on-demand',
    'D' : 'AI baseline and on-demand (Tutorial)'
}


let questionUserStudy4 = {

    addQuestion: function(data, callback) {
        // console.log('inside question:', data);
        // let questionId = uuidv1();
        let todayDate = new Date();
        let condition = conditionTypes[data.conditionType];
        console.log(data);
        console.log({condition});
        const search = "'";
        const replaceWith = "''";
        data.question = data.question.split(search).join(replaceWith);
        
        const sql = `START TRANSACTION; 
        INSERT into question_us4 (question_id, question, user_id, video_id, video_timestamp, timestamp, condition_type) VALUES ('${data.questionId}','${data.question}','${data.userId}', '${data.videoId}', ${data.youtubeTimestamp}, '${todayDate.toLocaleString()}', '${condition}'); 
        COMMIT;`;
        // console.log({sql});
        // callback = {questionId: questionId};
        return db.query(sql, callback);
    }, 

    addCaption: function(data, callback) {
        
        let captionId = uuidv1();
        let todayDate = new Date();
        let condition = conditionTypes[data.conditionType];
        const sql = `START TRANSACTION; 
        INSERT into captions_us4 (caption_id, user_id, video_id, caption, keyframe, youtube_timestamp, timestamp, condition_type) VALUES ('${captionId}','${data.userId}', '${data.videoId}', '${data.caption}', '${data.keyFrame}', ${data.youtubeTimestamp}, '${todayDate.toLocaleString()}', '${condition}'); 
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

        /** Adding answer to a particular question*/
    addAnswerToQuestion: function(data, callback) {

        return db.query(`UPDATE question_us4 SET answer = $1 WHERE question_id= $2 AND user_id=$3`, [data.answer, data.questionId, data.userId], callback);
    }, 

    updateQuestion: function (data, callback) {
        // console.log({'IINSIE US': data});
        return db.query(`UPDATE question_us4 SET keyframe = $1, dialog_id = $2 WHERE question_id= $3 AND user_id=$4`, [data.keyframe, data.dialogId, data.questionId, data.userId], callback);
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
    },

    addVote: function(data, callback) {
        
        let voteId = uuidv1();
        let todayDate = new Date();
        let condition = conditionTypes[data.conditionType];

        const sql = `START TRANSACTION; 
        INSERT into votes_us4 (vote_id, user_id, video_id, youtube_timestamp, timestamp, is_upvote, condition_type) VALUES ('${voteId}','${data.userId}', '${data.videoId}', ${data.youtubeTimestamp}, '${todayDate.toLocaleString()}', ${data.isUpvote}, '${condition}'); 
        COMMIT;`;
        return db.query(sql, callback);
    }, 

};


module.exports = questionUserStudy4;