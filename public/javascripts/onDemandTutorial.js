let player;
let youtubeId = "";
let videotime = 0;
let timeupdater = null;
let sceneIdToListPositionMap = new Map();
let sceneToBlockMap = new Map();
let userId = "c833874d-e2f1-45b3-afd1-16ac6d7fa0b4";
let volunteerId;
let prevSceneNum = -1;
let timeAtWhichLastPaused = -1;
let previouslyHighlightedContainerId = "#doesnotexist";
let enableAi = false;
let autoPauseAtEachScene = true;
let timeElapsedOnPage = 0;
let isTimerPaused = false;
let allSceneArr = [];
let allBlockArr = [];
let audioArr = [];
let startTimesArr = [];
let allDialogArraySTartTimes = [];
let allDialogArrayEndTimes = [];

let allSentenceStartTimes = [];
let allSentenceEndTimes = [];
let isSceneExtended = []; // Required to check if a scene has to be auto-paused to play the extended audio
let allSentenceAudioType = [];
let allSentenceSceneNum = [];
let scene_audio_extend_set = new Set();
let sentenceAudioMap = {};
let allSentenceInlineStartTimeArr = [];
let allSentenceInlineDurArr = [];
let allSentenceInlineArr = [];
let allSentenceExtendedArr = [];
let allSentenceExtendedAudioArr = [];

let currAudio = null;
let currAudioTime;
let wasCurrAudioPaused = false;
let STATE = 0;
let YT_STATE = 0;
let STATE_TIME = -1;
let STATE_CHANGE = 0;
let YT_FLAG = false;
let YT_FLAG_Dial = false;
let YT_FLAG_EXT = false;
let first_extend_flag = true;
let desc_flag = false;
let audio_flag = false;

let noOfQuestionsAsked = 0;
let playQuestionAudio = new Audio("../audio/tutorial_question.mp3");
// let audio_clip = document.getElementById("myAudio");

let tutorialStarted = false;
let currentInstruction = 0;
let playPause = 0;
let captionsRequested = 0;
let questionsAsked = 0;

$(document).ready(function() {
  $("#btn-video-breakpoint-toggle").prop("checked", true);
  volunteerId = getUrlVars()["u"];
  // userId = getUrlVars()["u"];
  enableAi = getUrlVars()["ai"] == "yes" ? true : false;
  let href = location.href;
  const lastPathSegment = new URL(href).pathname.split("/").pop();
  youtubeId = lastPathSegment;
  fetchVideoInfo(youtubeId);

  $("#btn-play-pause").click(function() {
    onPlayPauseButtonClick();
  });
  $("#btn-timer").click(function() {
    isTimerPaused = !isTimerPaused;
    if (isTimerPaused) {
      $("#btn-timer").attr("src", "/images/play_white.png");
    } else {
      $("#btn-timer").attr("src", "/images/pause_white.png");
    }
  });
  setInterval(incrementSeconds, 1000);
});

function tutorialProgress() {
  if (tutorialSteps[currentInstruction].init) {
    tutorialSteps[currentInstruction].init();
    tutorialSteps[currentInstruction].recurringSpeech();
  }

  if (tutorialSteps[currentInstruction].check()) {
    currentInstruction += 1;
  }
}

function incrementSeconds() {
  if (!isTimerPaused) {
    timeElapsedOnPage += 1;
    $("#txt-timeElaspsed").html(formatTimeForTimer(timeElapsedOnPage));
  }
}

function fetchVideoInfo(youtubeId) {
  WebSocketTest();
  console.log(userId);
  // let targetUrl = '/fetchVideoData' + '?videoid=' + youtubeId;
  let targetUrl = `/fetchVideoData?videoid=${youtubeId}&userId=${userId}`;
  $.get(targetUrl, function(response) {
    let vidJson = response;
    let vidTitle = vidJson.title;
    $("#txtVidtitle").html("Video Title: " + vidTitle);
    desc_flag = true;
  });

  let target_url_sentence =
    "/getSentences" + "?videoId=" + youtubeId + "&userId=" + userId;
  $.get(target_url_sentence, function(response) {
    // KeyFramesArr = response;
    // debugger;
    console.log("sentence start times" + response[0]);
    allSentenceArr = response;
    let prevSceneNo = -1;
    for (val of response) {
      allSentenceStartTimes.push(val["audio_start_time"]);
      // allSentenceEndTimes.push(val['audio_end_time']);
      allSentenceAudioType.push(val["audio_type"]);
      allSentenceSceneNum.push(val["scene_num"]);
      // let sceneId = val['scene_id'];
      let sceneNum = val["scene_num"];
      if (sceneNum != prevSceneNo) {
        startTimesArr.push(val["start_time"]);
        prevSceneNo = sceneNum;
      }
      let randomNum = Math.random();
      // let descType = val['has_ai'] ? 'ai' : 'non_ai';
      let descType = "ai";
      // let sentNumArr = val['sentence_id'].split('_');
      // let sentNum = sentNumArr[sentNumArr.length - 1];
      let audioType = val["audio_type"];
      let path = val["audio_path"];
      // let path = val['audio_path'].split('/');
      // let path_ext = path[path.length - 1];
      // let src = `../audio/${youtubeId}/${descType}/${userId}/${sceneNum}/new/${path_ext}` + '?random='+randomNum;
      let src = path + "?random=" + randomNum;
      console.log(src);
      let audioFile = new Audio(src);
      // audioArr.push(audioFile);

      if (
        !scene_audio_extend_set.has(val["scene_num"]) &&
        val["audio_type"] == "extended"
      ) {
        scene_audio_extend_set.add(val["scene_num"]);
        //create audio object
        sentenceAudioMap[val["scene_num"]] = [audioFile];
        allSentenceExtendedArr.push(val["audio_start_time"]);
        allSentenceExtendedAudioArr.push(audioFile);
      } else if (val["audio_type"] == "extended") {
        // create audio object
        sentenceAudioMap[val["scene_num"]].push(audioFile);
        allSentenceExtendedArr.push(val["audio_start_time"]);
        allSentenceExtendedAudioArr.push(audioFile);
      } else if (val["audio_type"] == "inline") {
        allSentenceInlineStartTimeArr.push(val["audio_start_time"]);
        allSentenceInlineDurArr.push(val["audio_length"]);
        allSentenceInlineArr.push(audioFile);
      }

      // debugger;
    }
    let j = 0,
      num = 0;
    let presentScene = allSentenceArr[0]["scene_num"];
    let flag = true;
    for (val of allSentenceArr) {
      if (val["scene_num"] != presentScene) {
        if (flag) isSceneExtended.push(false);
        flag = true;
      }

      if (flag && val["audio_type"] == "extended") {
        isSceneExtended.push(true);
        flag = false;
      }
    }
    audio_flag = true;
  });
  console.log("Times", allDialogArraySTartTimes);
}

function millisToMinutesAndSeconds(secs) {
  var minutes = Math.floor(secs / 60);
  var seconds = ((secs % 60) / 1).toFixed(1);
  return minutes + ":" + seconds;
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "270",
    width: "480",
    videoId: youtubeId,
    playerVars: {
      autoplay: 1,
      enablejsapi: 1,
      cc_load_policy: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      wmode: "opaque"
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}

async function onPlayerReady(event) {
  pauseVideo();
  player.setVolume(75);
  $("#total_time").text(formatTime(player.getDuration()));
  updateTime();
}

async function updateTime() {
  while (true) {
    if (desc_flag) {
      var oldTime = videotime;
      if (player && player.getCurrentTime) {
        videotime = player.getCurrentTime();
      }
      // if(Math.floor(videotime/30) <= noOfQuestionsAsked)
      //     STATE = 0;

      // if(Math.floor(videotime/30) > noOfQuestionsAsked){
      //     if(player.getPlayerState() == YT.PlayerState.PLAYING){
      //         pauseVideo();
      //     await checkQuestion();
      //     }
      // }

      // else if(prevSceneNum >= 0 && videotime - oldTime > 0.3) {
      if (prevSceneNum >= 0 && videotime - oldTime > 0.3) {
        console.log("Forward");
        STATE = 0;
        await updateProgress(videotime); // S1 Different func
      } else if (oldTime - videotime > 0.3) {
        console.log("Rewind");
        STATE = 0;
        await updateProgress(videotime); //  S1 Different func
      } else if (YT_FLAG) YT_FLAG = false;
      else if (videotime !== oldTime) {
        console.log(
          "Playing: oldtime: " +
            oldTime +
            " videotime: " +
            videotime +
            " State time: " +
            STATE_TIME
        ); // S2 Different func
        if (STATE == 0) {
          // currAudio.play();
          await onProgress(videotime);
        } else if (STATE == 1) {
          if (YT_FLAG_EXT) {
            YT_FLAG_EXT = false;
            continue;
          }

          pauseVideo();
          YT.currentTime = STATE_TIME;
          YT_FLAG = true;
          console.log("Extended fault");
          if (currAudio && currAudio !== null) currAudio.pause();
          // currAudio.play();
          console.log("Current Audio is paused: 0" + STATE_TIME);
          STATE = 2;
        } else if (STATE == 2) {
          pauseVideo();
          YT.currentTime = STATE_TIME;
          YT_FLAG = true;
          videotime = player.getCurrentTime();
          if (currAudio && currAudio !== null) currAudio.play();
          STATE = 1;
        }
      } else {
        // console.log("Paused");  // modify currAudio.onended func

        if (
          STATE == 0 &&
          currAudio &&
          currAudio !== null &&
          isPlaying(currAudio)
        )
          currAudio.pause();
      }
      $("#elapsed_time").text(formatTime(player.getCurrentTime()));
      console.log("Time event");
      // msleep(100);
    }
    await new Promise(r => setTimeout(r, 100));
  }
}

// when the time changes, this will be called.

async function updateProgress(currentTime) {
  currentTime = currentTime.toFixed(3);
  let currScene = getIndexFromExtended(currentTime);

  // let sceneNum = currScene.sc_num;

  prevSceneNum = currScene;

  if (currAudio !== null && isPlaying(currAudio)) currAudio.pause();
  currAudio = null;
  player.setVolume(75);
}

async function onProgress(currentTime) {
  // debugger;
  currentTime = currentTime.toFixed(3);
  // let currScene = getSceneFromTime(currentTime);
  let currScene = getIndexFromExtended(currentTime);
//   console.log(currScene);
  // let sceneNum = currScene.sc_num;
  let sceneNum = currScene;

  if (prevSceneNum == -1 && first_extend_flag) {
    first_extend_flag = false;
  } else if ((sceneNum != -1 && sceneNum != prevSceneNum)) {
    if (true || scene_audio_extend_set.has(prevSceneNum)) {
      STATE = 1;
      pauseVideo();
      let totalAudios = sentenceAudioMap[prevSceneNum];
      let flag = true;
      let i = 0;
      YT_FLAG = true;
      if (flag && currAudio == null) {
        // currAudio = sentenceAudioMap[prevSceneNum][0];
        currAudio = allSentenceExtendedAudioArr[currScene];
        player.setVolume(15);
        currAudio.play();
        currAudio.onended = function() {
          console.log("player state is: " + player.getPlayerState());
          if (player.getPlayerState() == YT.PlayerState.PAUSED) {
            STATE = 0;
            STATE_TIME = -1;
            currAudio = null;
            player.setVolume(75);
            playVideo();
          }
        };

        prevSceneNum = sceneNum;

        // YT_FLAG_EXT = true;
        STATE = 1;
        STATE_CHANGE = 1;
        console.log("STATE: EXTENDED");

        STATE_TIME = player.getCurrentTime();
        // debugger;
        // prevSceneNum = sceneNum-1;
      }
      prevSceneNum = sceneNum;
    }
    prevSceneNum = sceneNum;
  } //else if (prevSceneNum == -1) prevSceneNum = sceneNum;
  else if (currAudio !== null && !isPlaying(currAudio)) currAudio.play();
  // logic for inline
  else {
    let res = isInlineAudio(currentTime);
    let index = res[1];
    if (res[0] && currAudio == null && index >= 0) {
      currAudio = allSentenceInlineArr[index];
      let diff = res[2];
      currAudio.currentTime = diff;
      player.setVolume(15);
      currAudio.play();
      currAudio.onended = function() {
        currAudio = null;
        console.log("Test1: ", index);
        player.setVolume(75);
      };
    }
  }
  // else{
  //     // YT_FLAG_Dial = false;
  //     if(currAudio!==null && !isPlaying(currAudio) && !YT_FLAG_Dial)
  //     currAudio.play();
  // }
}

function onPlayerStateChange(event) {
  let playerState = event.data;
  switch (playerState) {
    case YT.PlayerState.PLAYING:
      audio_clip.pause();
      isChatbotInProcess = false;
      isQuestionInProcess = false;
      console.log("i was called: playing state");
      $("#btn-play-pause").html(
        '<img src = "/images/pause.png" style="height: 25px; width: 25px;">'
      );
      break;
    case YT.PlayerState.PAUSED:
      $("#btn-play-pause").html(
        '<img src = "/images/play.png" style="height: 25px; width: 25px;">'
      );
      timeAtWhichLastPaused = player.getCurrentTime();
      console.log(timeAtWhichLastPaused);
      console.log("i was called: paused state");
      break;
    case YT.PlayerState.UNSTARTED:
    case YT.PlayerState.ENDED:
      if (scene_audio_extend_set.has(sceneNum)) {
        // STATE = 1;
        // pauseVideo();
        // let totalAudios = sentenceAudioMap[prevSceneNum];
        let flag = true;
        // let i=0;
        // YT_FLAG = true;
        if (flag && currAudio == null) {
          currAudio = sentenceAudioMap[sceneNum][0];
          console.log(
            "Will play now!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
          );
          player.setVolume(15);
          currAudio.play();
          currAudio.onended = function() {
            console.log("player state is: " + player.getPlayerState());
          };
        }
      }
    case YT.PlayerState.CUED:
      $("#btn-play-pause").html(
        '<img src = "/images/play.png" style="height: 25px; width: 25px;">'
      );
      timeAtWhichLastPaused = player.getCurrentTime();
      console.log("i was called: cued state");
      break;
  }
}

function playVideo() {
  if (tutorialStarted) {
    //speak("Video Play");
    player.playVideo();
  }
}

function pauseVideo() {
  if (tutorialStarted) {
    //speak("Video Play");
    playPause += 1;
    console.log("This is the file");
    player.pauseVideo();
  }
}

function stopVideo() {
  player.stopVideo();
}

function getSceneFromTime(currentTime) {
  let listContainer = document.querySelector(".list-container");
  console.log("This: " + listContainer.dataset);
  sceneDetails = JSON.parse(listContainer.dataset.sceneDetails);

  // let startTimesArr = [];
  // for(let i=0; i< sceneDetails.length; i++) {
  //     let startTime = parseFloat(sceneDetails[i].start_time);
  //     startTimesArr.push(startTime);
  // }
  let sceneIndex = getIndexOfInputArrForTargetVal(currentTime, startTimesArr);
  return sceneDetails[sceneIndex];
}

function getIndexFromExtended(currentTime) {
  let index = getIndexOfInputArrForTargetVal(
    currentTime,
    allSentenceExtendedArr
  );
  console.log(index);
  return index;
}

//Returns index of array item whose value is equal-to or lesser-than(also nearest-in-value) the target (binary search algorithm)
function getIndexOfInputArrForTargetVal(target, inputArr) {
  let start = 0;
  let end = inputArr.length - 1;
  let index = -1;
  while (start <= end) {
    let mid = Math.floor((start + end) / 2);
    if (inputArr[mid] == target) {
      index = mid;
      break;
    } else if (inputArr[mid] < target) {
      index = mid;
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  return index;
}

function isInlineAudio(target) {
  let inputArr = allSentenceInlineStartTimeArr;
  let start = 0;
  let end = inputArr.length - 1;
  let index = -1;
  while (start <= end) {
    let mid = Math.floor((start + end) / 2);
    if (inputArr[mid] == target) {
      index = mid;
      break;
    } else if (inputArr[mid] < target) {
      index = mid;
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  console.log(
    "inside inline: ",
    target,
    " and ",
    allSentenceInlineStartTimeArr[index] + allSentenceInlineDurArr[index]
  );
  if (
    index < 0 ||
    target >
      allSentenceInlineStartTimeArr[index] + allSentenceInlineDurArr[index]
  )
    return [false, index, 0];
  // may return the difference of current time and inline start time
  else return [true, index, target - allSentenceInlineStartTimeArr[index]];
}

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(
    m,
    key,
    value
  ) {
    vars[key] = value;
  });
  return vars;
}

function formatTime(time) {
  var minutes = Math.floor(time / 60);
  var seconds = time - minutes * 60;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  var s = parseFloat(seconds).toFixed(1);
  return minutes + ":" + s;
}

function formatTimeForTimer(time) {
  var minutes = Math.floor(time / 60);
  var seconds = time - minutes * 60;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  var s = parseFloat(seconds).toFixed(0);
  return minutes + ":" + s;
}

function onPlayPauseButtonClick() {
  let playerState = player.getPlayerState();
  switch (playerState) {
    case YT.PlayerState.PLAYING:
      pauseVideo();
      break;
    case YT.PlayerState.PAUSED:
    case YT.PlayerState.UNSTARTED:
    case YT.PlayerState.ENDED:
    case YT.PlayerState.CUED:
      playVideo();
      break;
  }
}

function isPlaying(audioElement) {
  if (audioElement != null) return !audioElement.paused;
}
