    // Ctrl events variables
    let isCtrlPressed = false;

    function isKeyDown(event) {
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

    function isKeyUp(event) {
        isCtrlPressed = false;
        let x = document.getElementById("demo");
        x.innerHTML = "The key is up now";
    }