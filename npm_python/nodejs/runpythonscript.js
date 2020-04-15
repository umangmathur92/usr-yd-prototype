const express = require('express')
const {spawn} = require('child_process');
const app = express()
const port = 3001
app.get('/', (req, res) => {
 
 var dataToSend;
 // spawn new child process to call the python script
//  const python = spawn('python', ['../python/helloworld.py']);
// multiple parameters
const python = spawn('python', ['../python/helloworld.py','this is a test','this is a test']);
 // collect data from script
 python.stdout.on('data', function (data) {
  console.log('Pipe data from python script ...');
  dataToSend = data.toString();
 });
 // in close event we are sure that stream from child process is closed
 python.on('close', (code) => {
 console.log(`child process close all stdio with code ${code}`);
 // send data to browser
 res.send(dataToSend)
 });
 
})
app.listen(port, () => console.log(`Example app listening on port 
${port}!`))