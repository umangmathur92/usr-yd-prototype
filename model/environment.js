const db = require('../db/database');
const Utils = require('../backend/utils');

class Environment {

    constructor(keyframe_environment_id, keyframe_id, environment_id, probability) {
        this.keyframe_environment_id = keyframe_environment_id;
        this.keyframe_id = keyframe_id;
        this.environment_id = environment_id;
        this.probability = probability;
    }

    static parseEnvironmentJsonObj(envPredJsonObj, keyframeId) {
        let keyframe_id = keyframeId;
        let environment_id = envPredJsonObj.label_id;
        let probability = envPredJsonObj.probability;
        let keyframe_environment_id = keyframeId + '_' + environment_id;
        return new Environment(keyframe_environment_id, keyframe_id, environment_id, probability);
    }

    static parseEnvJsonArr(envPredictionsJsonArr, keyframeId) {
        let envArr = [];
        for(let i=0; i<envPredictionsJsonArr.length; i++) {
            let envPredJsonObj = envPredictionsJsonArr[i];
            let newEnvPrediction = Environment.parseEnvironmentJsonObj(envPredJsonObj, keyframeId);
            envArr.push(newEnvPrediction);
        }
        return envArr;
    }

    static async insertIntoKeyframeEnvironmentTable(kfEnvironmentArr) {
        console.log('DB Operation: Inserting the detected Environments for all keyframes');
        try {
            return await db.tx(t => {
                var queries = kfEnvironmentArr.map(keyframeEnv => {
                    return t.one('INSERT INTO keyframe_environment(keyframe_environment_id, keyframe_id, environment_id, probability) VALUES(${keyframe_environment_id}, ${keyframe_id}, ${environment_id}, ${probability}) RETURNING id', keyframeEnv, a => + a.id);
                });
                return t.batch(queries);
            });
        } catch(e) {
            throw e;
        }
    }

}

module.exports = Environment;