const db = require('../db/database');
const Utils = require('../backend/utils');

class KeyframeObject { 
    
    constructor(keyframe_object_id, keyframe_id, object_name, confidence, coordinate_left, coordinate_right, coordinate_top, coordinate_bottom) {
        this.keyframe_object_id = keyframe_object_id;
        this.keyframe_id = keyframe_id;
        this.object_name = object_name;
        this.confidence = confidence;
        this.coordinate_left = coordinate_left;
        this.coordinate_right = coordinate_right;
        this.coordinate_top = coordinate_top;
        this.coordinate_bottom = coordinate_bottom;
    }   
    
}

module.exports = KeyframeObject;