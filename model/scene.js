const db = require('../db/database');
const Utils = require('../backend/utils');

class Scene {
    
    constructor(scene_id, block_id, scene_num, start_time, end_time, original_description, original_ocr) {
        this.scene_id = scene_id;
        this.block_id = block_id;
        this.scene_num = scene_num;
        this.start_time = start_time;
        this.end_time = end_time;
        this.original_description = original_description;
        this.original_ocr = original_ocr;
    }
    
    setOriginalDescription(desc) {
        this.original_description = desc;
    }
    
    setOriginalOcr(desc) {
        this.original_ocr = desc;
    }
    
    static parseSceneJson(sceneJsonObj) {
        let block_id = '_';
        let scene_num = sceneJsonObj.id;
        let start_time = Utils.parseSecondsFromString(sceneJsonObj.instances[0].start);
        let end_time = Utils.parseSecondsFromString(sceneJsonObj.instances[0].end);
        let original_description = '';
        let original_ocr = '';
        let scene_id = block_id + '_' + scene_num;
        return new Scene(scene_id, block_id, scene_num, start_time, end_time, original_description, original_ocr);
    }

    static parseSceneArr(sceneJsonArr) {
        let scenesArr = [];
        for (let i = 0; i < sceneJsonArr.length; i++) {
            let sceneJsonObj = sceneJsonArr[i];
            let newScene = Scene.parseSceneJson(sceneJsonObj);
            scenesArr.push(newScene);
        }
        return scenesArr;
    }

    static async insertIntoSceneTable(sceneArr) {
        console.log('DB Operation: Inserting Scenes');
        try {
            return await db.tx(t => {
                var queries = sceneArr.map(scene => {
                    return t.one('INSERT INTO scene(scene_id, block_id, scene_num, start_time, end_time, original_description, original_ocr) VALUES(${scene_id},${block_id}, ${scene_num}, ${start_time}, ${end_time}, ${original_description}, ${original_ocr}) RETURNING id', scene, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }

    static async aggregateShotOcrIntoSceneOcr(video) {
        console.log('DB Operation: Updating Scene table with OCR data from Shot table');
        return db.any("UPDATE scene SET original_ocr = (SELECT array_to_string(array_agg(original_ocr ORDER BY shot_num ASC), E'\n') FROM shot, block, video WHERE scene.scene_id = shot.scene_id AND scene.block_id = block.block_id AND block.video_id = ${youtube_id}) RETURNING id", video, a => + a.id);
    }

}

module.exports = Scene;