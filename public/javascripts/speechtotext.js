var ques = ""

    // STT starts here
function startRecording(){
    alert("Recording began")

    navigator.mediaDevices.getUserMedia({audio:true})
	.then(stream => {
		rec = new MediaRecorder(stream);
		rec.ondataavailable = e => {
			audioChunks.push(e.data);
			if (rec.state == "inactive"){
        let blob = new Blob(audioChunks,{type:'audio/wav'});
                // Call Jianfei's API

                question = STT(input)
                for(let i=0;i<framesCount;i++)
                    submitQuestion(i); 
    }}});   
}