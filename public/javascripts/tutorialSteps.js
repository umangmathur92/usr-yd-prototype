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
    speak(
      "If you are unsure what to do at any point, press the I key to hear a reminder on the current task. Let's start. Pressing the p key will control video playback. Try this now"
    );
    this.init = null;
  },
  function() {
    speak("Press the space key twice to play and pause the video");
  },
  function() {
    if ((player.getPlayerState = YT.PlayerState.PLAYING)) pauseVideo();
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
    speak(
      "Great. While the video plays, you will hear descriptions whenever there is text on the screen or a scene change. The video will continue playing during a description, or pause during an extended description. You can get additional information by requesting a description or by asking a question. First, let's try requesting a description. "
    );
    this.init = null;
  },

  function() {
    speak(
      "Press the spacebar to continue and then press D at any time to get a caption of the current image."
    );
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
    speak(
      "Good. Now, try asking a question about the current frame. You can ask something like, how many people are in the scene?"
    );
    this.init = null;
  },

  function() {
    speak(
      "Press the Q key to ask a question. After the beep, ask your question. "
    );
  },
  function() {
    if ((player.getPlayerState = YT.PlayerState.PLAYING)) pauseVideo();
  },
  function() {
    return false;
  }
);

tutorialSteps.push(step1, step2, step3);
