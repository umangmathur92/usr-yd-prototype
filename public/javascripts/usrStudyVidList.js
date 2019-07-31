//get parameters from query string
let url = location.search.substring(1);
let urlParams = new URLSearchParams(url);
let userId = urlParams.get('userId');
let targetUrl = '/userStudy/users?userId=' + userId;
console.log('target URL:' +  targetUrl);


$(document).ready(function () {
    getDateTime();
    fetchVideo();
});


function getDateTime(){
    let date = new Date(Date.now()).toLocaleString();
    //document.getElementById('date').innerHTML = date;
    console.log(date);
}

function fetchVideo() {
    $.get(targetUrl, function (rows) {
        console.log({rows});
        let videos = '';
        for (let i = 0; i < rows.length; i++) {
            let val = rows[i].ai_support===true ? 'With AI support' : 'Without AI support';
            let aiParam = rows[i].ai_support===true ? 'yes' : 'no';
            videos +=  `<b><a href="/playvideo/${rows[i].video_id}?u=${userId}&ai=${aiParam}" class="list-group-item" ><img class="vid-thumbnail" src="https://i1.ytimg.com/vi/${rows[i].video_id}/hqdefault.jpg">Video ${i+1}: ${rows[i].title} (${val})</a></b>`
            // videos +=  ` <a href="/playvideo/${rows[i].youtube_id}" class="list-group-item" >Participant ${rows[i].user_id} ----  ${rows[i].youtube_id}----AI support: ${rows[i].ai_support}</a>`
        }
        videos += `<br><b><a href="https://docs.google.com/forms/d/e/1FAIpQLSfQO6z0lrsHfgj5iR797uHUM-b6gXVz0BfTQT3Oj2HY9tYd1g/viewform?entry.2005620554=${rows[0].name} - ${rows[0].user_id}" class="list-group-item" ><img src="../images/survey.png" class="img-survey">User Survey for ${rows[0].name}</a></b>`;  
        $( ".list-group" ).append( videos);
    });
}
