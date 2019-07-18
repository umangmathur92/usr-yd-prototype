const db = require('../db/database');
const Utils = require('../backend/utils');

class KeyframeTag { 
    
    constructor(keyframe_tag_id, keyframe_id, tag_name, confidence) {
        this.keyframe_tag_id = keyframe_tag_id;
        this.keyframe_id = keyframe_id;
        this.tag_name = tag_name;
        this.confidence = confidence;
    }   
    
    
}

module.exports = KeyframeTag;