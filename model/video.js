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
        let inputJson = JSON.parse(requestBody.inputJson);  
        let id = -1;
        let youtube_id = requestBody.youtubeId;
        let indexer_video_id = inputJson.id;
        let title = requestBody.title;
        let duration = Utils.parseSecondsFromString(inputJson.summarizedInsights.duration.time);
        let summarised_insights_json = inputJson.summarizedInsights;
        let insights_json = inputJson.videos[0].insights;
        return new Video(id, youtube_id, indexer_video_id, title, duration, summarised_insights_json, insights_json);
    }

}

module.exports = Video;