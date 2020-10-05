function isKeyPress(event) {
  let x = document.getElementById("demo");
  
    let asciiValue = event.which;
    console.log("ascii value is: ",asciiValue);
    switch(asciiValue){
      case 67:
      case 99: x.innerHTML = "The C Key was pressed!";
                console.log("The C Key was pressed!");
              // fetchKeyFrames();
                break;
      case 81:
      case 113: x.innerHTML = "The Q Key was pressed!";
                  console.log("The Q Key was pressed!");
                // askQuestion();
                  startChatbot();
                  break;
      case 69:
      case 100: x.innerHTML = "The D Key was pressed!";
                  console.log("The D Key was pressed!");
                  // fetchAnswer();
                  break;
                    
      case 32:
            x.innerHTML = "The space Key was pressed!";
            if(player.getPlayerState() == YT.PlayerState.PLAYING)
                pauseVideo();
            else
                playVideo();
            break;  
    }
  }

  function isKeyDown(event){
    
    let x = document.getElementById("demo");

    if (event.ctrlKey) {
        x.innerHTML = "The CTRL Key was pressed!";
    }
    else if (event.keyCode == '37'){
      x.innerHTML = "The Left Arrow Key was pressed!";
      seekBackward();
    }
    else if (event.keyCode == '39'){
      x.innerHTML = "The Right Arrow Key was pressed!";
      seekForward();
    }
  }

/** Ctrl + key events variables and functions */ 
    let isCtrlPressed = false;

    function isCtrlKeyDown(event) {
        let x = document.getElementById("demo");
        
        if(isCtrlPressed){
            if(event.which == 81 || event.which == 113)
                {x.innerHTML = "The CTRL key + Q Key was pressed!";
                askQuestion();
            }
            else if(event.which == 67 || event.which == 99)
                {x.innerHTML = "The CTRL key + C Key was pressed!";
                fetchKeyFrames();}
        }
        else{
        if (event.ctrlKey) {
          x.innerHTML = "The CTRL key was pressed!";
          isCtrlPressed = true;
        } else {
          x.innerHTML = "The CTRL key was NOT pressed!";
          isCtrlPressed = false;
        }
        }
      }

    function isCtrlKeyUp(event) {
        isCtrlPressed = false;
        let x = document.getElementById("demo");
        x.innerHTML = "The key is up now";
    }

    function seekBackward(){
      let isStatePlaying = false;
      if(player.getPlayerState() == YT.PlayerState.PLAYING)   
          isStatePlaying = true;
  
      pauseVideo();
      let currentTime = player.getCurrentTime();
      
      if(currentTime > 5)
          player.seekTo(currentTime - 5);
      else
          player.seekTo(0);
      
      if(isStatePlaying)
          playVideo();
  }
  
  function seekForward(){
      let isStatePlaying = false;
      if(player.getPlayerState() == YT.PlayerState.PLAYING)   
          isStatePlaying = true;
  
      pauseVideo();
      let currentTime = player.getCurrentTime();
      // console.log(player.getDuration());
      if(currentTime < player.getDuration() - 5)
          player.seekTo(currentTime + 5);
      else
          player.seekTo(player.getDuration());
      
      if(isStatePlaying)
          playVideo();
  }