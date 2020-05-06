const fs = require('fs');




class parseScene {
    
    convertMinToSecs(input) {
        var parts = input.split(':'),
            minutes = +parts[1],
            seconds = +parts[2];
        return (minutes * 60 + seconds).toFixed(3);
        // return input;
    };
    
    parseJson(file){
      let rawdata = fs.readFileSync(file);
      let videoJsonObj = JSON.parse(rawdata);
      // console.log(videoJsonObj);
      let scenes = videoJsonObj.videos[0].insights.scenes;
      for(let i=0; i< scenes.length;i++){
     
        let    sceneId= scenes[i].id;
         let   startTime = this.convertMinToSecs(scenes[i].instances[0].start);
          let  endTime = this.convertMinToSecs(scenes[i].instances[0].end);
        
        // console.log(data);
        console.log(endTime);
        // console.log(sceneId, '  ', startTime , ' ',endTime);
        }
    }

  


    parseAudioFile(file){
      let rawdata = fs.readFileSync(file);
      let audioJsonObj = JSON.parse(rawdata);
       console.log('inside parse audio');
      let row = audioJsonObj.result.sentence;
      for(let i=0; i< row.length;i++){
        // console.log(data);
        console.log(row[i].sentence);
        
        }
    }
  
  }


    
  let file = '../videoData_us3_phase1/ocean8.json';
  let parse = new parseScene();
//  parse.parseJson(file);
 parse.parseAudioFile('Shoplifting Scene - Ocean_s 8 -  1080p - Sandra Bullock-OYjaBQ8dDHc.json');

