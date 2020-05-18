/*
    contains all the apis related to scene table and merge_scene table
*/

const db = require('../db/database');
const Utils = require('../backend/utils');


class Scene {
    
    constructor(video_id, scene_id, block_id, scene_num, start_time, end_time, original_description, original_ocr) {
        this.video_id = video_id;
        this.scene_id = scene_id;
        this.block_id = block_id;
        this.scene_num = scene_num;
        this.start_time = start_time;
        this.end_time = end_time;
        this.original_description = original_description;
        this.original_ocr = original_ocr;
    }

    static async getSceneData(videoId, callback){
        return db.query(`Select * from scene where video_id = '${videoId}' order by start_time`);
    }
    

    setOriginalDescription(desc) {
        this.original_description = desc;
    }
    
    setOriginalOcr(desc) {
        this.original_ocr = desc;
    }
    
    static parseSceneJson(sceneJsonObj, video_id) {
        let block_id = '_';
        let scene_num = sceneJsonObj.id;
        let start_time = Utils.parseSecondsFromString(sceneJsonObj.instances[0].start);
        let end_time = Utils.parseSecondsFromString(sceneJsonObj.instances[0].end);
        let original_description = '';
        let original_ocr = '';
        let scene_id = block_id + '_' + scene_num;
        return new Scene(video_id, scene_id, block_id, scene_num, start_time, end_time, original_description, original_ocr);
    }

    static parseSceneArr(sceneJsonArr, video_id) {
        let scenesArr = [];
        for (let i = 0; i < sceneJsonArr.length; i++) {
            let sceneJsonObj = sceneJsonArr[i];
            let newScene = Scene.parseSceneJson(sceneJsonObj, video_id);
            scenesArr.push(newScene);
        }
        return scenesArr;
    }

    static async insertIntoSceneTable(sceneArr) {
        console.log('DB Operation: Inserting Scenes');
        try {
            return await db.tx(t => {
                var queries = sceneArr.map(scene => {
                    return t.one('INSERT INTO scene(video_id, scene_id, block_id, scene_num, start_time, end_time, original_description, original_ocr) VALUES(${video_id}, ${scene_id},${block_id}, ${scene_num}, ${start_time}, ${end_time}, ${original_description}, ${original_ocr}) RETURNING id', scene, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }


    static async getSceneDataFromMerge(videoId, callback){
        return db.query(`Select * from merge_scene where video_id = '${videoId}' order by start_time`);
    }


    static async addMergeSceneTable(sceneArr) {
        console.log('DB Operation: Inserting Scenes');
        try {
            return await db.tx(t => {
                var queries = sceneArr.map(scene => {
                    if(!scene.merged){
                        scene.merged = ''; 
                    }
                    console.log({scene})
                    return t.one('INSERT INTO merge_scene(scene_id, block_id, scene_num, start_time, end_time, original_description, original_ocr, video_id, merged) VALUES(${scene_id},${block_id}, ${scene_num}, ${start_time}, ${end_time}, ${original_description}, ${original_ocr},${video_id}, ${merged}) RETURNING id', scene, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }


    static async insertDescriptionTable_blue(sceneArr, userId) {
        console.log('DB Operation: Inserting Scenes in Description Table');
        try {
            return await db.tx(t => {
                var queries = sceneArr.map(scene => {
                    let descriptionId = userId + '_' + scene.video_id + '_ai_' + scene.scene_num;
                    return t.one(`INSERT INTO descriptions(desc_id, scene_id, scene_num, start_time, end_time, description, ocr, video_id, volunteer_id, has_ai) 
                                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING id`, 
                                    [descriptionId, scene.scene_id, scene.scene_num, scene.start_time, scene.end_time, 
                                    scene.description_bleu, scene.original_ocr,scene.video_id, userId], a => + a.id);
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

    static async updateDescriptionDataForAllScenes(sceneArr) {
        console.log('DB Operation: Updating Scene table with description data');
        try {
            return await db.tx(t => {
                var queries = sceneArr.map(scene => {
                    return t.one("UPDATE scene SET original_description = ${original_description} WHERE scene_id = ${scene_id} RETURNING id", scene, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }

    static async updateBleuDescription_Scene(sceneArr) {
        console.log('DB Operation: Updating scene table with description data');
        try {
            return await db.tx(t => {
                var queries = sceneArr.map(scene => {
                    return t.one("UPDATE scene SET description_bleu = ${description_bleu} WHERE scene_id = ${scene_id} and video_id = ${video_id} RETURNING id", scene, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }

    static async updateBleuPythiaCaption_Scene(sceneArr) {
        console.log('DB Operation: Updating scene table with filterd pythia data based on BLEU score');
        try {
            return await db.tx(t => {
                var queries = sceneArr.map(scene => {
                    return t.one("UPDATE scene SET pythia_caption_bleu = ${pythia_caption_bleu} WHERE scene_id = ${scene_id} and video_id = ${video_id} RETURNING id", scene, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }



    static async updateBleuDescription_MergeScene(sceneArr) {
        console.log('DB Operation: Updating Merge scene table with description data');
        try {
            return await db.tx(t => {
                var queries = sceneArr.map(scene => {
                    return t.one("UPDATE merge_scene SET description_bleu = ${description_bleu} WHERE scene_id = ${scene_id} and video_id = ${video_id} RETURNING id", scene, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }

    static async updatePythiaCaptionForAllScenes(sceneArr) {
        console.log('DB Operation: Updating Scene table with pythia caption');
        try {
            let sql = '';
            sceneArr.forEach((data) => {
                    sql += `UPDATE scene SET pythia_caption = '${data.caption}'
                            WHERE scene_id = '${data.sceneId}';`;
                    
                });
            sql = 'START TRANSACTION;' + sql + 'COMMIT;'
            console.log({sql});

            return await db.query(sql);
        } catch(e) {
            throw e;
        }
    }

    //Do not use
    static async aggregateShotCaptionsIntoSceneDescription(video) {
        console.log('DB Operation: Updating Scene table by aggregating description data from Shot table');
        return db.any("UPDATE scene SET original_description = (SELECT distinct array_to_string(array_agg(shot.original_description ORDER BY shot.shot_num ASC), E'\n') FROM shot, block, video WHERE scene.scene_id = shot.scene_id AND scene.block_id = block.block_id AND block.video_id = ${youtube_id}) RETURNING id", video, a => + a.id);
    }




    
}

module.exports = Scene;