var ques = ""

    // STT starts here
function startRecording(){
    // alert("Recording began")

    navigator.mediaDevices.getUserMedia({audio:true})
	.then(stream => {
        console.log("Texxt is: ");
		rec = new MediaRecorder(stream);
		rec.ondataavailable = e => {
            console.log("Texxt is: ");
			audioChunks.push(e.data);
			if (rec.state == "inactive"){
        let blob = new Blob(audioChunks,{type:'audio/wav'});
                // Call Jianfei's API
                
                    const url = "http://52.53.151.37:8080/v1/audioclips/speechtotext"
                    
            const param = {
                method: "POST",
                    body: {
                        "audiofile": blob,
                        "callbackurl": ""
                }    
            }
            let text= ""
            console.log("Texxt is: ");

            fetch(url,param)
            .then(data => {console.log(data);})
            .then(res => {console.log(res); text = res.data.sentence;})
            .catch(error=>console.log(error))




                // question = STT(input)
                $("#question").val(text);

                for(let i=0;i<framesCount;i++)
                    submitQuestion(i); 
    }}});   
}