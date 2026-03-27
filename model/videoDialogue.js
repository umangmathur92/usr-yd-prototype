const db = require('../db/database');

let videoDialgue = {
    
    insertDataIntoVideoDialogue: function(data, videoId, audioId, callback) {
        console.log('DB Operation: Inserting timestamps in video_dialogue table');
        console.log({data});
        let sql = '';
        for(let i=0; i< data.length; i++){
            let dialogue = data[i];
            sql += `INSERT INTO video_dialogs(video_id, start_time, end_time, sentence, audio_id) 
                    VALUES('${videoId}', ${dialogue.start}, ${dialogue.end}, '${dialogue.sentence}', '${audioId}');`
        }
        sql = 'START TRANSACTION;' + sql + 'COMMIT;' ;
        console.log({sql});
        return db.query(sql,callback);
    }
};


module.exports = videoDialgue;


