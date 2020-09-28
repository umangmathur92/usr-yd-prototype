const axios = require('axios');
const sceneModel = require('../model/scene');
const keyframeModel = require('../model/keyframe');
const qs = require('qs')


class PythiaCaptionGenerationController{

    static async generatePythiaCaption(videoId){
        try{
            let data = await keyframeModel.getKeyFramesByVideoId(videoId);
            // console.log({data});
            let captionArr = [];
            console.log('Fetching Pythia captions for keyframes.....');
            for(let i=0; i< data.length; i++){
                let thumbnail_url = data[i].keyframe_url;
                let keyframe_id = data[i].keyframe_id;
                console.log({thumbnail_url});
                let captionResponse = await this.fetchPythiaCaption(thumbnail_url);
                // console.log({Pycaption: captionResponse.data});
                data[i].updatedPythiaCaption =  captionResponse.data;
                captionArr.push({keyframe_id, thumbnail_url, caption: captionResponse.data });
            }
                // console.log({captionArr});
            //  console.log({data});
            let response = await keyframeModel.updatePythiaCaption(captionArr);
            // console.log(response);

            let pythiaCaptions = await keyframeModel.getKeyFramesByVideoId(videoId);
            // console.log({caption: pythiaCaptions.updatedPythiaCaption});

            let sceneMap = new Map();
            for(let i=0; i< data.length; i++){
                let sceneId = data[i].scene_id;
                let caption = data[i].updatedPythiaCaption;

                let value = sceneMap.get(sceneId);
                if(value){
                    if(!value.includes(caption)){
                        caption = value + '\n'  + caption;
                        sceneMap.set(sceneId, caption);
                    }
                }else{
                    sceneMap.set(sceneId, caption);
                }
            }

            // console.log({sceneMap});
            let sceneCaptionArr = [];
            for (let [key, value] of sceneMap) {
                console.log(key + ' = ' + value)
                sceneCaptionArr.push({sceneId:key, caption:value});
            }
            // console.log({sceneCaptionArr});

            await sceneModel.updatePythiaCaptionForAllScenes(sceneCaptionArr);
            console.log('Successfully updated pythia caption in scene table');
            
        }catch(e){
            console.log(e);
        }
         
    }

    static async fetchPythiaCaption(image_url){
        try{
            let result =  await axios({
                method: 'post',
                url : 'http://ec2-34-221-19-208.us-west-2.compute.amazonaws.com:8080/api',
                data: qs.stringify({
                    token : 'ZSDL6MXc6urYauWzVLXnUgE8yZcfCncCYgNyX4jRRnrGCTLmV4KUKrNDYSbfWAf2', 
                    image_url
                }),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            })
            return result;
        }catch(error){
            console.log(error);
            throw error;
        }
                    
    }

}

module.exports = PythiaCaptionGenerationController;

// PythiaCaptionGenerationController.generatePythiaCaption('GXWpEjEFWkM');
