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
    $.post('/addvideo', jsonBody, function(response){
        window.alert(JSON.stringify(response));
    });
}

function clearAllBackendData() {
    $.get('/cleardatabase', function(response){
        window.alert(JSON.stringify(response));
    });
}