const db = require('../db/database');
let videoModel = require('../model/video.js');
const axios = require('axios');
const sceneModel = require('../model/scene');


class FilterBaselineDescriptionController{

    static async filter(videoId){
        try{
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
            return res;
        }catch(e){
            console.log(e);
            throw e;
        }
       
    }


    //Filter Pythia caption 
    static async filterPythiaCaption(videoId){
        try{
            let sceneData = await sceneModel.getSceneData(videoId);
            for(let i=0; i < sceneData.length; i++){
                let scene = sceneData[i];
               let desc = await this.calculate(scene.pythia_caption);
               scene.pythia_caption_bleu = desc;
               console.log({scene});
            }
            //  update Bleu description in scene table
            let res = await sceneModel.updateBleuPythiaCaption_Scene(sceneData);
            console.log({res});
            return res;
        }catch(e){
            console.log(e);
            throw e;
        }
    }

    
    //MERGE_SCENE 
    static async filter_MergeSceneTable(){
        try{
            let sceneData = await sceneModel.getSceneDataFromMerge(videoId);
            for(let i=0; i < sceneData.length; i++){
                let scene = sceneData[i];
                let desc = await this.calculate(scene.original_description);
                scene.description_bleu = desc;
                console.log({scene});
            }
            
            let res = await sceneModel.updateBleuDescription_MergeScene(sceneData);
            console.log({res});
            return res;
        }catch(e){
            console.log(e);
            throw e;
        }
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
            return queue[0];
        }
        
        while(queue.length > 1){
            let sentence = queue.shift();
            let body = {
                sentence,
                reference: queue
            }
            try {
                let res = await axios.post('http://localhost:3005/score', body);
                let score = res.data;
                if(score < 0.56){
                    result.push({sentence, score});
                }else{
                    rejected.push({sentence , score});
                }
                // console.log({rejected});
                // console.log({result});
            }catch(e){
                 console.log(e);
             }
        }
        result.push({sentence: queue[0]});
        // console.log({rejected});
        // console.log({result});

        let desc = '';
        result.forEach((element)=>{
            desc = desc + element.sentence + '\n';
        });
      
        return desc;    
    }
    
}

module.exports = FilterBaselineDescriptionController;