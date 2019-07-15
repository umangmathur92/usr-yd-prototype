const db = require('../db/database');
const Utils = require('../backend/utils');

class Scene {
    
    constructor(id, block_id, scene_num, start_time, end_time, original_description, original_ocr) {
        this.id = id;
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
        let id = -1;
        let block_id = -1;
        let scene_num = sceneJsonObj.id;
        let start_time = Utils.parseSecondsFromString(sceneJsonObj.instances[0].start);
        let end_time = Utils.parseSecondsFromString(sceneJsonObj.instances[0].end);
        let original_description = '';
        let original_ocr = '';
        return new Scene(id, block_id, scene_num, start_time, end_time, original_description, original_ocr);
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

}

module.exports = Scene;