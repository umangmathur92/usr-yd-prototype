const db = require('../db/database');
const Utils = require('../backend/utils');

class KeyframeTag { 
    
    constructor(keyframe_tag_id, keyframe_id, tag_name, confidence) {
        this.keyframe_tag_id = keyframe_tag_id;
        this.keyframe_id = keyframe_id;
        this.tag_name = tag_name;
        this.confidence = confidence;
    }   
    
    static parseKeyframeTagArr(keyframeTagArr, keyFrameId) {
        let tagsArr = [];
        for (let i = 0; i < keyframeTagArr.length; i++) {
            let keyframeTagJsonObj = keyframeTagArr[i];
            let newTag = KeyframeTag.parseKeyframeTagJson(keyframeTagJsonObj, keyFrameId, i);
            tagsArr.push(newTag);
        }
        return tagsArr;
    }

    static parseKeyframeTagJson(keyframeTagJsonObj, keyFrameId, tagNum) {
        let keyframe_tag_id = keyFrameId + '_' + tagNum;
        let keyframe_id = keyFrameId;
        let tag_name = keyframeTagJsonObj.name;
        let confidence = keyframeTagJsonObj.confidence;
        return new KeyframeTag(keyframe_tag_id, keyframe_id, tag_name, confidence);
    }

    static async insertIntoKeyframeTagTable(keyframeTagArr) {
        try {
            return await db.tx(t => {
                var queries = keyframeTagArr.map(keyframeTag => {
                    return t.one('INSERT INTO keyframe_tag(keyframe_tag_id, keyframe_id, tag_name, confidence) VALUES(${keyframe_tag_id}, ${keyframe_id}, ${tag_name}, ${confidence}) RETURNING id', keyframeTag, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }
 
}

module.exports = KeyframeTag;