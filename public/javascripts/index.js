var player;

$(document).ready(function() {
    
});

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '270',
        width: '480',
        videoId: 'M7lc1UVf-VE',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        },
        playerVars: { 'autoplay': 1, 'controls': 1,'autohide':1,'wmode':'opaque','origin':'http://localhost:3000' }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();
}

var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(stopVideo, 6000);
        done = true;
    }
}
function stopVideo() {
    player.stopVideo();
}
