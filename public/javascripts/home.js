let videoListJsonArray;

$(document).ready(function() {
    fetchVideoList();
});

function fetchVideoList() {
    $.get('/getAllVideos', function(response) {
        videoListJsonArray = response;
        console.log(JSON.stringify(videoListJsonArray));
        for(let i=0; i<videoListJsonArray.length; i++) {
            let currVideoJson = videoListJsonArray[i];
            let title = currVideoJson.title;
            $('#vidlist').append('<li class="vidlistitem">' + title + '</li>');
        }
        setVidListClickListener();
    });
}

function setVidListClickListener() {
    $(".vidlistitem").click(function() {
        let index = $('.vidlistitem').index(this);
        let currVideoJson = videoListJsonArray[index];
        let youtubeId = currVideoJson.youtube_id;
        //window.alert(JSON.stringify(currVideoJson));
        window.location.href = "/playvideo/"+youtubeId;
    });
}