const {spawn} = require('child_process');

async function generateBLEUScore(reference, sentence){
 console.log('nodejs-> ref: ',reference,' and sen: ',sentence);
let dataToSend;
 // spawn new child process to call the python script with parameters
const python = spawn('python', ['../python/helloworld.py',reference,sentence]);
 // collect data from script
 python.stdout.on('data', function (data) {
  console.log('Pipe data from python script ...');
  dataToSend = data.toString();
 });

 python.on('close', (code) => {
 console.log(`child process close all stdio with code ${code}`);
 return dataToSend
 });
}

module.exports = {
    generateBLEUScore: generateBLEUScore,
}