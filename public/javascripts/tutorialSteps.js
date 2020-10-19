let isFirstStep1 = true;
let isFirstStep2 = true;
let isFirstStep3 = true;
let isFirstStep4 = true;

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
  function () {
    this.init = null;
  },
  function () {
    if (isFirstStep1) {
      audio_clip.src = "../audio/tutorial_1_1.mp3";
      audio_clip.onended = function () {
        audio_clip.src = "../audio/tutorial_1_2.mp3";
        audio_clip.onended = function () {
          audio_clip.src = null;
        };
      };
      isFirstStep1 = false;
    } else {
      audio_clip.src = "../audio/tutorial_1_2.mp3";
      audio_clip.onended = function () {
        audio_clip.src = null;
      };
    }
  },
  function () {
    if (player.getPlayerState == YT.PlayerState.PLAYING) pauseVideo();
  },
  function () {
    if (playPause >= 1) {
      return true;
    } else {
      return false;
    }
  }
);

let step2 = new Step(
  function () {
    this.init = null;
  },

  function () {
    if (isFirstStep2) {
      audio_clip.src = "../audio/tutorial_2_1.mp3";
      audio_clip.onended = function () {
        audio_clip.src = "../audio/tutorial_2_2.mp3";
        audio_clip.onended = function () {
          audio_clip.src = null;
        };
      };
      isFirstStep2 = false;
    } else {
      audio_clip.src = "../audio/tutorial_2_2.mp3";
      audio_clip.onended = function () {
        audio_clip.src = null;
      };
    }
  },
  function () {
    if ((player.getPlayerState = YT.PlayerState.PLAYING)) pauseVideo();
  },
  function () {
    if (captionsRequested >= 1) {
      return true;
    }
  }
);

let step3 = new Step(
  function () {
    console.log("tutorial 3 1");
    audio_clip.src = "../audio/tutorial_3_1.mp3";
    audio_clip.onended = function () {
      audio_clip.src = null;
    };
    this.init = null;
  },

  function () {
    if (isFirstStep3) {
      audio_clip.src = "../audio/tutorial_3_1.mp3";
      audio_clip.onended = function () {
        audio_clip.src = "../audio/tutorial_3_2.mp3";
        audio_clip.onended = function () {
          audio_clip.src = null;
        };
      };
      isFirstStep3 = false;
    } else {
      audio_clip.src = "../audio/tutorial_3_2.mp3";
      audio_clip.onended = function () {
        audio_clip.src = null;
      };
    }
  },
  function () {
    if ((player.getPlayerState = YT.PlayerState.PLAYING)) pauseVideo();
  },
  function () {
    if (questionsAsked >= 1) {
      return true;
    } else {
      return false;
    }
  }
);

let step4 = new Step(
  function () {
    audio_clip.src = "../audio/tutorial_4_1.mp3";
    audio_clip.onended = function () {
      audio_clip.src = null;
    };
    this.init = null;
  },

  function () {
    if (isFirstStep4) {
      audio_clip.src = "../audio/tutorial_4_1.mp3";
      audio_clip.onended = function () {
        audio_clip.src = "../audio/tutorial_4_2.mp3";
        audio_clip.onended = function () {
          audio_clip.src = null;
        };
      };
      isFirstStep4 = false;
    } else {
      audio_clip.src = "../audio/tutorial_4_2.mp3";
      audio_clip.onended = function () {
        audio_clip.src = null;
      };
    }
  },
  function () {
    if ((player.getPlayerState = YT.PlayerState.PLAYING)) pauseVideo();
  },
  function () {
    return false;
  }
);

tutorialSteps.push(step1, step2, step3, step4);
