const Utils = require('../backend/utils');

class Block { 
    constructor(id, video_id, block_num, start_time, end_time, original_description) {
        this.id = id;
        this.video_id = video_id;
        this.block_num = block_num;
        this.start_time = start_time;
        this.end_time = end_time;
        this.original_description = original_description;
    }   
    
    setOriginalDescription(desc) {
        this.original_description = desc;
    }
    
    static parseBlockJson(blockJsonObj,vidId) {
        let id = -1;
        let video_id = vidId;
        let block_num = blockJsonObj.id;
        let start_time = Utils.parseSecondsFromString(blockJsonObj.instances[0].start);
        let end_time = Utils.parseSecondsFromString(blockJsonObj.instances[0].end);
        let original_description = '';
        return new Block(id, video_id, block_num, start_time, end_time, original_description);
    }
    
    static parseBlockArr(blockJsonArr, vidId) {
        let blocksArr = [];
        for (let i = 0; i < blockJsonArr.length; i++) {
            let blockJsonObj = blockJsonArr[i];
            let newBlock = Block.parseBlockJson(blockJsonObj, vidId);
            blocksArr.push(newBlock);
        }
        return blocksArr;
    }
    
}

module.exports = Block;