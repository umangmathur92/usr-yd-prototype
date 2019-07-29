const db = require('../db/database');
const Utils = require('../backend/utils');

class Block { 
    
    constructor(block_id, video_id, block_num, start_time, end_time, original_description) {
        this.block_id = block_id;
        this.video_id = video_id;
        this.block_num = block_num;
        this.start_time = start_time;
        this.end_time = end_time;
        this.original_description = original_description;
    }   
    
    setOriginalDescription(desc) {
        this.original_description = desc;
    }
    
    static parseBlockJson(blockJsonObj, youtube_id) {
        let video_id = youtube_id;
        let block_num = blockJsonObj.id;
        let start_time = Utils.parseSecondsFromString(blockJsonObj.instances[0].start);
        let end_time = Utils.parseSecondsFromString(blockJsonObj.instances[0].end);
        let original_description = '';
        let block_id = video_id + '_' + block_num;
        return new Block(block_id, video_id, block_num, start_time, end_time, original_description);
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
    
    static async insertIntoBlockTable(blockArr) {
        console.log('DB Operation: Inserting Blocks');
        try {
            return await db.tx(t => {
                var queries = blockArr.map(block => {
                    return t.one('INSERT INTO block(block_id, video_id, block_num, start_time, end_time, original_description) VALUES(${block_id},${video_id}, ${block_num}, ${start_time}, ${end_time}, ${original_description}) RETURNING id', block, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }

    static async updateBlockTableDescription(blockArr) {
        console.log('DB Operation: Updating Blocks Descriptions');
        try {
            return await db.tx(t => {
                var queries = blockArr.map(block => {
                    return t.one('UPDATE block SET original_description = ${original_description} WHERE block_id = ${block_id} RETURNING id', block, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }
    
}

module.exports = Block;