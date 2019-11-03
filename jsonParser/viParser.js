/**
 * created by: Vaishali
 * json parser for parsing VI json
 */

const fs = require('fs');
const csv = require('csv-parser');

class us3_addVideo {

  parseJsonUpdated(file){
      
    let rawdata = fs.readFileSync(file);
    let videoJsonObj = JSON.parse(rawdata);
    // console.log(videoJsonObj);

    for (let key in videoJsonObj) {
        if (videoJsonObj.hasOwnProperty(key)) {
            console.log(videoJsonObj.summarizedInsights["audioEffects"]); 
        }
     
      }
 
}

}
  

  //LITTLE WOMEN
let file = '../videoData_us3_phase1/vi.json';


let addVideo = new us3_addVideo();
addVideo.parseJsonUpdated(file);