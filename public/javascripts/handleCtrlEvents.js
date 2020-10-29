function isKeyPress(event) {
  let x = document.getElementById("demo");

  let asciiValue = event.which;
  console.log("ascii value is: ", asciiValue);
  switch (asciiValue) {
    case 67:
    case 99:
      x.innerHTML = "The C Key was pressed!";
      console.log("The C Key was pressed!");
      // fetchKeyFrames();
      break;
    case 81:
    case 113:
      x.innerHTML = "The Q Key was pressed!";
      console.log("The Q Key was pressed!");
      askQuestion()
        // .then((questionsAsked += 1))
        // .then(console.log(questionsAsked));
      // startChatbot();
      break;
    case 69:
    case 100:
      x.innerHTML = "The D Key was pressed!";
      console.log("The D Key was pressed!");
      fetchImageCaption()
        // .then((captionsRequested += 1))
        // .then(console.log(captionsRequested));
      break;

    case 73:
    case 105:
      x.innerHTML = "The I Key was pressed!";
      if(isTutorial){
      if (player.getPlayerState() == YT.PlayerState.PLAYING) {pauseVideo();}
      if (tutorialStarted) {
        tutorialSteps[currentInstruction].recurringSpeech();
      } else {
        tutorialStarted = true;
        setInterval(tutorialProgress, 500);
      }

      console.log("The I Key was pressed!");
    }
      break;

    case 74:
    case 106:
      x.innerHTML = "The J Key was pressed!";
    //Add earcon
      if(isVote){
        updateUserVote(true);
      }

      console.log("The J Key was pressed!");
      break;

    case 75:
    case 107:
      x.innerHTML = "The K Key was pressed!";
      if(isVote){
        updateUserVote(false);
      }

      console.log("The K Key was pressed!");
      break;

    case 82:
    case 114:
      seekBackward(1);
      break;
    case 32:
      x.innerHTML = "The space Key was pressed!";
      
      if (player.getPlayerState() == YT.PlayerState.PLAYING) {
        if (isTutorial && tutorialStarted) {
          //speak("Video Play");
          playPause += 1;
          console.log("This is the file");
          // player.pauseVideo();
        }        
        pauseVideo();}
      else {
        if(isTutorial){
        if (tutorialStarted) {
          //speak("Video Play");
          player.playVideo();
        }
      }
      else playVideo();        
      }

      break;
  }
}
$(window).keypress(function(e) {
  if (e.key === " " || e.key === "Spacebar") {
    // ' ' is standard, 'Spacebar' was used by IE9 and Firefox < 37
    e.preventDefault();
    console.log("Space pressed");
    if (player.getPlayerState() == YT.PlayerState.PLAYING) pauseVideo();
    else playVideo();
  }
});

function isKeyDown(event) {
  let x = document.getElementById("demo");

//   if (event.ctrlKey) {
//     x.innerHTML = "The CTRL Key was pressed!";
//   } else if (event.keyCode == "37") {
//     x.innerHTML = "The Left Arrow Key was pressed!";
//     seekBackward();
//   } else if (event.keyCode == "39") {
//     x.innerHTML = "The Right Arrow Key was pressed!";
//     seekForward();
//   }
}

/** Ctrl + key events variables and functions */

let isCtrlPressed = false;

function isCtrlKeyDown(event) {
  let x = document.getElementById("demo");

  if (isCtrlPressed) {
    if (event.which == 81 || event.which == 113) {
      x.innerHTML = "The CTRL key + Q Key was pressed!";
      askQuestion();
    } else if (event.which == 67 || event.which == 99) {
      x.innerHTML = "The CTRL key + C Key was pressed!";
      fetchKeyFrames();
    }
  } else {
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

function seekBackward(newTime=5) {
  let isStatePlaying = false;
  if (player.getPlayerState() == YT.PlayerState.PLAYING) isStatePlaying = true;

  pauseVideo();
  let currentTime = player.getCurrentTime();

  if (currentTime > 5) player.seekTo(currentTime - newTime);
  else player.seekTo(0);

  if (isStatePlaying) playVideo();
}

function seekForward() {
  let isStatePlaying = false;
  if (player.getPlayerState() == YT.PlayerState.PLAYING) isStatePlaying = true;

  pauseVideo();
  let currentTime = player.getCurrentTime();
  // console.log(player.getDuration());
  if (currentTime < player.getDuration() - 5) player.seekTo(currentTime + 5);
  else player.seekTo(player.getDuration());

  if (isStatePlaying) playVideo();
}

function updateUserVote(isUpvote){
  
  if (isUpvote)
      audioVote.src = "../audio/earcons/vote-up.wav";
  else
      audioVote.src = "../audio/earcons/vote-down.wav";

  let currentTime = -1;
  if (player){
    currentTime = player.getCurrentTime();
    currentTime = currentTime.toFixed(2);
  }

  let data = {
    userId: volunteerId,
    videoId: youtubeId,
    isUpvote,
    youtubeTimestamp: currentTime,
    conditionType
  };

  $.post("/userStudy4/addVote", data, function(res) {
    console.log("Vote Added");
    console.log(res);
  });

}