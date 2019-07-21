const db = require('../db/database');
const Utils = require('../backend/utils');

class Shot {
    
    constructor(shot_id, scene_id, shot_num, start_time, end_time, original_ocr, original_description, keyframe_json_arr) {
        this.shot_id = shot_id;
        this.scene_id = scene_id;
        this.shot_num = shot_num;
        this.start_time = start_time;
        this.end_time = end_time;
        this.original_ocr = original_ocr;
        this.original_description = original_description;
        this.keyframe_json_arr = keyframe_json_arr;
    }
        
    setOriginalOcr(desc) {
        this.original_ocr = desc;
    }
    
    static parseShotJson(shotJsonObj) {
        let scene_id = '_';
        let shot_num = shotJsonObj.id;
        let start_time = Utils.parseSecondsFromString(shotJsonObj.instances[0].start);
        let end_time = Utils.parseSecondsFromString(shotJsonObj.instances[0].end);
        let original_ocr = '';
        let original_description = '';
        let shot_id = scene_id + '_' + shot_num;
        let keyframe_arr = shotJsonObj.keyFrames;
        return new Shot(shot_id, scene_id, shot_num, start_time, end_time, original_ocr, original_description, keyframe_arr);
    }

    static parseShotArr(shotJsonArr) {
        let shotsArr = [];
        for (let i = 0; i < shotJsonArr.length; i++) {
            let shotJsonObj = shotJsonArr[i];
            let newShot = Shot.parseShotJson(shotJsonObj);
            shotsArr.push(newShot);
        }
        return shotsArr;
    }

    static async insertIntoShotTable(shotArr) {
        console.log('DB Operation: Inserting Shots');
        try {
            return await db.tx(t => {
                var queries = shotArr.map(shot => {
                    return t.one('INSERT INTO shot(shot_id, scene_id, shot_num, start_time, end_time, original_ocr, original_description) VALUES(${shot_id}, ${scene_id}, ${shot_num}, ${start_time}, ${end_time}, ${original_ocr}, ${original_description}) RETURNING id', shot, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }

    static async updateDescriptionDataForAllShots(shotArr) {
        console.log('DB Operation: Updating Shot table with caption data');
        try {
            return await db.tx(t => {
                var queries = shotArr.map(shot => {
                    return t.one("UPDATE shot SET original_description = ${original_description} WHERE shot_id = ${shot_id} RETURNING id", shot, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }
    
}

module.exports = Shot;