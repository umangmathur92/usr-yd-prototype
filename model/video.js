const db = require('../db/database');
const Utils = require('../backend/utils');

class Video { 

    constructor(id, youtube_id, indexer_video_id, title, duration, summarised_insights_json, insights_json) {
        this.id = id;
        this.youtube_id = youtube_id;
        this.indexer_video_id = indexer_video_id;
        this.title = title;
        this.duration = duration;
        this.summarised_insights_json = summarised_insights_json;
        this.insights_json = insights_json;
    }   
    
    static parseVideoFromIndexerJson(requestBody) {
        // console.log({parseVideoFromIndexerJson : requestBody});
        // console.log({inputJson: requestBody.inputJson});
        let inputJson = requestBody.inputJson;  
        let id = -1;
        let youtube_id = requestBody.youtubeId;
        let indexer_video_id = inputJson.id;
        let title = inputJson.name;
        let duration = Utils.parseSecondsFromString(inputJson.summarizedInsights.duration.time);
        let summarised_insights_json = inputJson.summarizedInsights;
        let insights_json = inputJson.videos[0].insights;
        return new Video(id, youtube_id, indexer_video_id, title, duration, summarised_insights_json, insights_json);
    }

    static async insertIntoVideoTable(newVid) {
        console.log('DB Operation: Inserting Video');
        try {
            let videoEntry = await db.one('INSERT INTO video (youtube_id, indexer_video_id, title, duration, summarised_insights_json, insights_json) VALUES ( $1, $2, $3, $4, $5, $6 ) RETURNING id', [newVid.youtube_id, newVid.indexer_video_id, newVid.title, newVid.duration, newVid.summarised_insights_json, newVid.insights_json]);
            return videoEntry.id;
        } catch(e) {
            console.log({'error': e});
            throw e;
        }
    }

    static async updateAudioId(data) {
        console.log('DB Operation: Updating Audio');
        try {
             return await db.query('UPDATE video set audio_id=$1 where youtube_id=$2', [data.audioId, data.videoId]);
        } catch(e) {
            console.log({'error': e});
            throw e;
        }
    }

    static async getSceneByAudioId(audioId) {
        console.log('get scene data by audio Id:', audioId);
        try {

            let query = `select s.video_id, s.id, s.scene_id, s.block_id, s.scene_num, s.start_time, s.end_time, s.original_description, s.original_ocr
                         from video v, scene s
                         where v.youtube_id = s.video_id and v.audio_id = $1
                         order by scene_num`;

             return await db.query(query, [audioId]);
        } catch(e) {
            console.log({'error': e});
            throw e;
        }
    }

}

module.exports = Video;