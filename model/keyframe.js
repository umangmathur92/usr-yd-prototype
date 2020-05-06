const db = require('../db/database');
const Utils = require('../backend/utils');

class Keyframe {

    constructor(keyframe_id, shot_id, keyframe_num, start_time, end_time, thumbnail_id, thumbnail_url, caption, caption_confidence) {
        this.keyframe_id = keyframe_id;
        this.shot_id = shot_id;
        this.keyframe_num = keyframe_num;
        this.start_time = start_time;
        this.end_time = end_time;
        this.thumbnail_id = thumbnail_id;
        this.thumbnail_url = thumbnail_url;
        this.caption = caption;
        this.caption_confidence = caption_confidence;
    }

    static parseKeyframeJson(keyframeJsonObj, shot, video) {
        let shot_id = shot.shot_id;
        let keyframe_num = keyframeJsonObj.id;
        let keyframe_id = shot_id + '_' + keyframe_num;
        let start_time = Utils.parseSecondsFromString(keyframeJsonObj.instances[0].start);
        let end_time = Utils.parseSecondsFromString(keyframeJsonObj.instances[0].end); 
        let thumbnail_id = keyframeJsonObj.instances[0].thumbnailId;
        let thumbnail_url = Utils.getThumbUrlFromId(thumbnail_id, video.indexer_video_id);
        let caption = '';
        let caption_confidence = 0;
        return new Keyframe(keyframe_id, shot_id, keyframe_num, start_time, end_time, thumbnail_id, thumbnail_url, caption, caption_confidence);
    }

    static parseKeyFrameArr(keyframeJsonArr, shot, video) {
        let keyframesArr = [];
        for (let i = 0; i < keyframeJsonArr.length; i++) {
            let keyframeJsonObj = keyframeJsonArr[i];
            let newShot = Keyframe.parseKeyframeJson(keyframeJsonObj, shot, video);
            keyframesArr.push(newShot);
        }
        return keyframesArr;
    }

    static async insertIntoKeyframeTable(keyframeArr) {
        console.log('DB Operation: Inserting Keyframes');
        try {
            return await db.tx(t => {
                var queries = keyframeArr.map(keyframe => {
                    return t.one('INSERT INTO keyframe(keyframe_id, shot_id, keyframe_num, start_time, end_time, thumbnail_id, thumbnail_url, caption, caption_confidence) VALUES(${keyframe_id}, ${shot_id}, ${keyframe_num}, ${start_time}, ${end_time}, ${thumbnail_id}, ${thumbnail_url}, ${caption}, ${caption_confidence}) RETURNING id', keyframe, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }

    static async updateCaptionDataForKeyframes(keyframeArr) {
        console.log('DB Operation: Updating Keyframe table with caption data');
        try {
            return await db.tx(t => {
                var queries = keyframeArr.map(keyframe => {
                    return t.one("UPDATE keyframe SET caption = ${caption}, caption_confidence = ${caption_confidence} WHERE keyframe_id = ${keyframe_id} RETURNING id", keyframe, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }

    static async updatePythiaCaption(keyframeArr) {
        console.log('DB Operation: Updating Keyframe table with pythia caption');
        try {
            let sql = '';
            keyframeArr.forEach((data) => {
                    sql += `UPDATE keyframe SET pythia_caption = '${data.caption}'
                            WHERE keyframe_id = '${data.keyframe_id}';`;
                    
                });
            sql = 'START TRANSACTION;' + sql + 'COMMIT;'
            console.log({sql});

            return await db.query(sql);
        } catch(e) {
            throw e;
        }
    }


    static async getKeyFramesByVideoId(videoId) {
        console.log('get KeyFrames by video Id:', videoId);
        try {
            let sql = `select k.keyframe_id , s2.scene_id, k.shot_id,  k.keyframe_num, k.start_time, k.end_time, k.thumbnail_id,
                        k.thumbnail_url, k.caption,k.caption_confidence, k.pythia_caption
                        from keyframe k , shot s, scene s2
                        where k.shot_id = s.shot_id and s.scene_id = s2.scene_id
                        and s2.video_id = $1 order by k.start_time`;

            return await db.query(sql, [videoId]);
        } catch(e) {
            console.log({'error': e});
            throw e;
        }
    }

}

module.exports = Keyframe;