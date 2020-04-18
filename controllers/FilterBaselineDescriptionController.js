const db = require('../db/database');
let videoModel = require('../model/video.js');
const axios = require('axios');
const sceneModel = require('../model/scene');


class FilterBaselineDescriptionController{

    // userId= 09172c90-805c-11ea-bc55-0242ac130003 ORIGINAL
    //userID = d87ad780-805b-11ea-bc55-0242ac130003 BLEU
    static async filter(videoId){
        //SCENE table
         let sceneData = await sceneModel.getSceneData(videoId);
         for(let i=0; i < sceneData.length; i++){
             let scene = sceneData[i];
            let desc = await this.calculate(scene.original_description);
            scene.description_bleu = desc;
            console.log({scene});
         }
        
        //  update Bleu description in scene table
        let res = await sceneModel.updateBleuDescription_Scene(sceneData);
        console.log({res});


        let userId = 'd87ad780-805b-11ea-bc55-0242ac130003'
        let response = await sceneModel.insertDescriptionTable_blue(sceneData, userId);
        console.log({response});



        /* For Single sentence
        let sentence = 'Erinn Hayes looking at the camera \n a woman looking at the camera \na person looking at the camera';
        let res = await this.calculate(sentence);
        console.log({res});
        */


        //MERGE_SCENE 
        /*
        let sceneData = await sceneModel.getSceneDataFromMerge(videoId);
        for(let i=0; i < sceneData.length; i++){
            let scene = sceneData[i];
            let desc = await this.calculate(scene.original_description);
            scene.description_bleu = desc;
            console.log({scene});
        }
        
        let res = await sceneModel.updateBleuDescription_MergeScene(sceneData);
        console.log({res});
        */

    }

    static async scoreForDescription(){
        let desc = `Brian Dietzen smiling for the camera\na person sitting on a bench\nBrian Dietzen smiling for the camera
        Erinn Hayes smiling for the camera\nBrian Dietzen looking at the camera
        Erinn Hayes smiling for the camera\nBrian Dietzen posing for the camera`;

        let res = await this.calculate(desc);
        console.log({res});
    }


    static async calculate(description){
        let result = [];
        let rejected = [];
        let queue = description.split('\n');
        if(queue.length == 1){
            result.push(queue[0]);
            return result;
        }
        
        while(queue.length > 1){
            // console.log({queue});
            let sentence = queue.shift();
            let body = {
                sentence,
                reference: queue
            }

            // console.log({body});
            
            try {
                let res = await axios.post('http://localhost:3005/score', body);
                // console.log(res.data);
                let score = res.data;
                // console.log({score});
                if(score < 0.66){
                    result.push({sentence, score});
                }else{
                    rejected.push({sentence , score});
                }
                console.log({rejected});
                console.log({result});
            }catch(e){
                 console.log(e);
             }
        }
        result.push({sentence: queue[0]});
        console.log({rejected});
        console.log({result});

        let desc = '';
        result.forEach((element)=>{
            desc = desc + element.sentence + '\n';
            // console.log(element.sentence);
        });
      
        return desc;    
    }


    
}

FilterBaselineDescriptionController.filter('4d1OmRA6yyI');
// FilterBaselineDescriptionController.scoreForDescription();