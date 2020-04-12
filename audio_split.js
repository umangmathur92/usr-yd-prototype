let MediaSplit = require('media-split');
let split = new MediaSplit({ input: './public/audio/MIrogue.mp3', sections: ['[01:30] My audio'] });
split.parse().then((sections) => {
  for (let section of sections) {
    console.log(section.name);      // filename
    console.log(section.start);     // section start
    console.log(section.end);       // section end
    console.log(section.trackName); // track name
  }
});