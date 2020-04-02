const fs = require('fs');
const Utils = require('./backend/utils');
var ffmpeg = require('ffmpeg');

class AudioVideoMerge{

    

    merge(videoFile, audioFile){
       let videoInsight = this.parseJson(videoFile);
       let audioInsight = this.parseAudioFile(audioFile);
        // let videoInsight = [
        //     { start: 0, end: 5 },
        //     { start: 5, end: 10},
        //     { start: 10, end: 15 },
        //     { start: 15, end: 20 },
        //     { start: 20, end: 25 },
        //     { start: 25, end: 30 },
        // ]

        // let audioInsight = [
        //     { start: 0, end: 1 },
        //     { start: 2, end: 4},
        //     { start: 5, end: 7 },
        //     { start: 10, end: 12 },
        //     { start: 12, end: 18 },

        // ]

       let videoIndex = 0;
       let mergedList = [];
       mergedList.push(videoInsight[videoIndex++]);
       let i = 0;
       while(i < audioInsight.length && videoIndex < videoInsight.length){
            let size = mergedList.length;
            let s1 = mergedList[size-1].start;
            let e1 = mergedList[size-1].end;
   
            let s2 = audioInsight[i].start;
            let e2 = audioInsight[i].end;

            if((s2 >= s1 && s2 <= e1) && (e2 >= s1 && e2 <= e1)) {
				i++;
				continue;
            }
            
            if(Math.min(s2, e2) >= e1) {
				mergedList.push(videoInsight[videoIndex++]);
				continue;
			}
           
            //merge condition
            if(s2 >= s1 && e2 > e1) {
				let next = videoInsight[videoIndex++]; 
				let min = Math.min(s1,  next.start);
                let max = Math.max(e1,next.end);
                let data ={
                    start : min,
                    end : max
                }
                mergedList.splice(mergedList.length-1);
                mergedList.push(data);
			}else if(s2 >= e1) {
				mergedList.push(videoInsight[videoIndex++]);
			}
			
			i++;
        }

        for(let j = videoIndex; j<videoInsight.length; j++) {
			mergedList.push(videoInsight[j]);
		}
        console.log({mergedList});
    }

    

    parseJson(file){
        let rawdata = fs.readFileSync(file);
        let videoJsonObj = JSON.parse(rawdata);
        let scenes = videoJsonObj.videos[0].insights.scenes;
        let arr = [];
        for(let i=0; i< scenes.length; i++){
            let instance = scenes[i].instances[0];
            let start = Utils.parseSecondsFromString(instance.start);
            let end = Utils.parseSecondsFromString(instance.end);
            let data = {
                start,
                end
            }
            arr.push(data);
            // console.log(start,'->', end);
        }
        console.log('video:', arr);

        return arr;
    }

    parseAudioFile(file){
        console.log("here");
        let rawdata = fs.readFileSync(file);
        let obj = JSON.parse(rawdata);
        let sentence = obj.result.sentence;
        let arr =[];
        for(let i=0; i< sentence.length; i++){
            // let instance = scenes[i].instances[0];
            let start = sentence[i].startTime;
            let end = sentence[i].endTime;
            // let end = Utils.parseSecondsFromString(instance.end);
            // console.log(start,'->', end);
            // console.log(start , ','  , end);
            let data = {
                start,
                end
            }
            arr.push(data);
        }

        console.log(arr);
        return arr;
    }


    convertVideoToAudio(path, fileName){
        let audioFile = path + '/' + fileName+'.mp3';
        let videoFile = path + '/' + fileName + '.mp4'
        console.log({path});
        console.log({audioFile});
        console.log({videoFile});

        try {
            var process = new ffmpeg(videoFile);
            process.then(function (video) {
                console.log({video});
                video.fnExtractSoundToMP3(audioFile, function (error, file) {
                    if (!error)
                        console.log('Audio file: ' + file);
                });
            }, function (err) {
                console.log('Error: ' + err);
            });
        } catch (e) {
            console.log('err->', e);
        }
      }


}

let file = 'insight.json';
let oceanFile = 'audio_ocean8.json';
let audioVideoMerge = new AudioVideoMerge();
// audioVideoMerge.parseJson(file);
// audioVideoMerge.parseAudioFile(oceanFile);
// audioVideoMerge.merge(file,oceanFile);
audioVideoMerge.convertVideoToAudio(__dirname, 'GXWpEjEFWkM_2020-03-31_1585712768');
