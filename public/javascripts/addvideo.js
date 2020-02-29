$(document).ready(function() {
    $("#btnSubmit").click(function () {
        submitVideoData();
    });
    $("#btnClearDb").click(function () {
        clearAllBackendData();
    });
});

function submitVideoData() {
    let youtubeId = $('#youtubeId').val();
    let title = $('#title').val();
    let inputJson = $('#inputJson').val();
    let jsonBody = {
        "youtubeId": youtubeId,
        "title": title,
        "inputJson": inputJson
    };
    $.ajax({
        type: 'POST',
        timeout: 1*60*60*1000,
        url : "/addvideo",
        dataType: "json",
        async:true,
        crossDomain:true,
        data: jsonBody,
        success: function (response) {
            window.alert(JSON.stringify(response));
        },
        error: function (response, textStatus, errorThrown) {
            console.log(errorThrown);
            window.alert(JSON.stringify(response));
        }
      });
}

function clearAllBackendData() {
    $.get('/cleardatabase', function(response){
        window.alert(JSON.stringify(response));
    });
}