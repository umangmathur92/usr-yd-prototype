class Step {
  constructor(init, recurringSpeech, action, check) {
    this.init = init;
    this.recurringSpeech = recurringSpeech;
    this.action = action;
    this.check = check;
  }
}

let tutorialSteps = [];

let step1 = new Step(
  function() {
    //tutorial_1_1.mp3
    console.log("tutorial 1 1");
    // if ((player.getPlayerState == YT.PlayerState.PLAYING)) pauseVideo();
    audio_clip.src = "../audio/tutorial_1_1.mp3";
      audio_clip.onended = function() {
        audio_clip.src = null;
      }
    // speak(
    //   "If you are unsure what to do at any point, press the I key to hear a reminder on the current task. Let's start. Pressing the spacebar will control video playback. Try this now"
    // );
    this.init = null;
  },
  function() {
    audio_clip.src = "../audio/tutorial_1_1.mp3";
      audio_clip.onended = function() {
        // audio_clip.src = null;
      
    audio_clip.src = "../audio/tutorial_1_2.mp3";
      audio_clip.onended = function() {
        audio_clip.src = null;
      }
    }
  //   //tutorial_1_2.mp3
  //   speak("Press the space key twice to play and pause the video");
  },
  function() {
    if ((player.getPlayerState == YT.PlayerState.PLAYING)) pauseVideo();
  },
  function() {
    if (playPause >= 1) {
      return true;
    } else {
      return false;
    }
  }
);

let step2 = new Step(
  function() {
    // if ((player.getPlayerState = YT.PlayerState.PLAYING)) pauseVideo();
    //tutorial_2_1.mp3
    // let randomNum = Math.random();
      audio_clip.src = "../audio/tutorial_2_1.mp3";
      audio_clip.onended = function() {
        audio_clip.src = null;
      }
    // speak(
    //   "Great. While the video plays, you will hear descriptions whenever there is text on the screen or a scene change. The video will continue playing during a description, or pause during an extended description. You can get additional information by requesting a description or by asking a question. First, let's try requesting a description. "
    // );
    this.init = null;
  },

  function() {
    //tutorial_2_2.mp3
    audio_clip.src = "../audio/tutorial_2_1.mp3";
      audio_clip.onended = function() {
        // audio_clip.src = null;
      
    audio_clip.src = "../audio/tutorial_2_2.mp3";
      audio_clip.onended = function() {
        audio_clip.src = null;
      }
    }
    // speak(
    //   "Press the spacebar to continue and then press D at any time to get a caption of the current image."
    // );
  },
  function() {
    if ((player.getPlayerState = YT.PlayerState.PLAYING)) pauseVideo();
  },
  function() {
    if (captionsRequested >= 1) {
      return true;
    }
  }
);

let step3 = new Step(
  function() {
    //tutorial_3_1.mp3
    // if ((player.getPlayerState = YT.PlayerState.PLAYING)) pauseVideo();
    console.log("tutorial 3 1");
    audio_clip.src = "../audio/tutorial_3_1.mp3";
      audio_clip.onended = function() {
        audio_clip.src = null;
      }
    // speak(
    //   "Good. Now, try asking a question about the current frame. You can ask something like, how many people are in the scene?"
    // );
    this.init = null;
  },

  function() {
    //tutorial_3_2.mp3
    audio_clip.src = "../audio/tutorial_3_1.mp3";
      audio_clip.onended = function() {
        // audio_clip.src = null;
    audio_clip.src = "../audio/tutorial_3_2.mp3";
      audio_clip.onended = function() {
        audio_clip.src = null;
      }
    }
    // speak(
    //   "Press the Q key to ask a question. After the beep, ask your question. "
    // );
  },
  function() {
    if ((player.getPlayerState = YT.PlayerState.PLAYING)) pauseVideo();
  },
  function() {
    if (questionsAsked >= 1) {
      return true;
    } else {
      return false;
    }
  }
);

let step4 = new Step(
  //tutorial_4_1.mp3
  function() {
    // if ((player.getPlayerState = YT.PlayerState.PLAYING)) pauseVideo();
    audio_clip.src = "../audio/tutorial_4_1.mp3";
      audio_clip.onended = function() {
        audio_clip.src = null;
      }
    // speak(
    //   "Great Question. Continue watching the video and request more information to get familiar with the interface. At the end of the video, a button will appear to take you back to the home page."
    // );
    this.init = null;
  },

  function() {
    //tutorial_4_2.mp3
    audio_clip.src = "../audio/tutorial_4_1.mp3";
      audio_clip.onended = function() {
        // audio_clip.src = null;
      
    audio_clip.src = "../audio/tutorial_4_2.mp3";
      audio_clip.onended = function() {
        audio_clip.src = null;
      }
    }
    // speak(
    //   "Remember to press the Q key to ask a question, or the D key to get a description"
    // );
  },
  function() {
    if ((player.getPlayerState = YT.PlayerState.PLAYING)) pauseVideo();
  },
  function() {
    return false;
  }
);

tutorialSteps.push(step1, step2, step3, step4);
