// let MediaSplit = require('media-split');
// let split = new MediaSplit({ input: './public/audio/MIrogue.mp3', sections: ['[00:00 - 01:30] My audio'] });
// split.parse().then((sections) => {
//   for (let section of sections) {
//     console.log(section.name);      // filename
//     console.log(section.start);     // section start
//     console.log(section.end);       // section end
//     console.log(section.trackName); // track name
//   }
// });


// async function mp3Split(file, midTime){

//     let split = new MediaSplit({ input: file, sections: [`[00:00 - ${midTime}] output1`] });

//     split.parse().then((sections) => {
//         for (let section of sections) {
//           console.log(section.name);      // filename
//           console.log(section.start);     // section start
//           console.log(section.end);       // section end
//           console.log(section.trackName); // track name
//         }
//       });

const axios = require('axios');
const FormData = require('form-data');
const fetch = require("node-fetch");

let form = new FormData();
let file = '';

fetch("./public/audio/MIrogue.mp3").then(
    res => {
        file = res.value;
    }
)
form.append("file",file);
axios.post('splitMp3', form, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
})


//       split = new MediaSplit({ input: file, sections: [`[${midTime}] output2`] });

//       split.parse().then((sections) => {
//         for (let section of sections) {
//           console.log(section.name);      // filename
//           console.log(section.start);     // section start
//           console.log(section.end);       // section end
//           console.log(section.trackName); // track name
//         }
//       });

//     }