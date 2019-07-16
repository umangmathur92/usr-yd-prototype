const Utils = require('../backend/utils');

class Ocr { 
    
    constructor(text, confidence, start_time, end_time, shot_id, shot_num, left, top, width, height) {
        this.text = text;
        this.confidence = confidence;
        this.start_time = start_time;
        this.end_time = end_time;
        this.shot_id = shot_id;
        this.shot_num = shot_num;
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }   
    
    static parseOcrJsonArr(ocrJsonArr) {
        let ocrArr = [];
        for(let i=0; i<ocrJsonArr.length; i++) {
            let ocrJsonObj = ocrJsonArr[i];
            let text = ocrJsonObj.text;
            let confidence = ocrJsonObj.confidence;
            let left = ocrJsonObj.left;
            let top = ocrJsonObj.top;
            let width = ocrJsonObj.width;
            let height = ocrJsonObj.height;
            let instancesJsonArr = ocrJsonObj.instances;
            for(let j=0; j<instancesJsonArr.length; j++) {
                let instanceJsonObj = instancesJsonArr[j];
                let start_time = Utils.parseSecondsFromString(instanceJsonObj.start);
                let end_time = Utils.parseSecondsFromString(instanceJsonObj.end);
                let shot_id = '-';
                let shot_num = -1;
                let ocrObj = new Ocr(text, confidence, start_time, end_time, shot_id, shot_num, left, top, width, height);
                ocrArr.push(ocrObj);
            }
        }
        return ocrArr;
    }

    static async updateShotTableWithOcrData(concatenatedOcrTextArr) {
        try {
            return await db.tx(t => {
                var queries = concatenatedOcrTextArr.map(ocrObj => {
                    //return t.one('', ocrObj, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }
}

module.exports = Ocr;