const db = require('../db/database');
const Utils = require('../backend/utils');

class KeyframeObject { 
    
    constructor(keyframe_object_id, keyframe_id, object_name, confidence, x_coordinate, y_coordinate, width, height) {
        this.keyframe_object_id = keyframe_object_id;
        this.keyframe_id = keyframe_id;
        this.object_name = object_name;
        this.confidence = confidence;
        this.x_coordinate = x_coordinate;
        this.y_coordinate = y_coordinate;
        this.width = width;
        this.height = height;
    }   
    
    static parseKeyframeObjectArr(keyframeObjectArr, keyFrameId) {
        let objectsArr = [];
        for (let i = 0; i < keyframeObjectArr.length; i++) {
            let keyframeObjectJsonObj = keyframeObjectArr[i];
            let newObject = KeyframeObject.parseKeyframeObjectJson(keyframeObjectJsonObj, keyFrameId, i);
            objectsArr.push(newObject);
        }
        return objectsArr;
    }
    
    static parseKeyframeObjectJson(keyframeObjectJsonObj, keyFrameId, objectNum) {
        let keyframe_object_id = keyFrameId + '_' + objectNum;
        let keyframe_id = keyFrameId;
        let object_name = keyframeObjectJsonObj.object;
        let confidence = keyframeObjectJsonObj.confidence;
        let x_coordinate = keyframeObjectJsonObj.rectangle.x;
        let y_coordinate = keyframeObjectJsonObj.rectangle.y;
        let width = keyframeObjectJsonObj.rectangle.w;
        let height = keyframeObjectJsonObj.rectangle.h;
        return new KeyframeObject(keyframe_object_id, keyframe_id, object_name, confidence, x_coordinate, y_coordinate, width, height);
    }
    
    static async insertIntoKeyframeObjectTable(keyframeObjectArr) {
        console.log('DB Operation: Inserting the detected Keyframe-Objects');
        try {
            return await db.tx(t => {
                var queries = keyframeObjectArr.map(keyframeObject => {
                    return t.one('INSERT INTO keyframe_object(keyframe_object_id, keyframe_id, object_name, confidence, x_coordinate, y_coordinate, width, height) VALUES(${keyframe_object_id}, ${keyframe_id}, ${object_name}, ${confidence}, ${x_coordinate}, ${y_coordinate}, ${width}, ${height}) RETURNING id', keyframeObject, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }
    
}

module.exports = KeyframeObject;