let userId = '';

$(document).ready(function () {
    let url = location.search.substring(1);
    userId = new URLSearchParams(url).get('userId');
    let targetUrl = '/userStudy/users?userId=' + userId;
    fetchVideo(targetUrl);
});

function fetchVideo(targetUrl) {
    $.get(targetUrl, function (vidJsonArr) {
        updateUI(vidJsonArr);
    });
}

function updateUI(vidArr) {
    console.log(vidArr);
    let generatedHtml = '';
    let userName = vidArr[0].name;
    for (let i = 0; i < vidArr.length; i++) {
        let vid = vidArr[i];
        let videoId = vid.video_id;
        let videoTitle = vid.title;
        let isAiSupported = vid.ai_support;
        let aiSupportStr = isAiSupported ? 'With AI support' : 'Without AI support';
        let aiParam = vid.ai_support===true ? 'yes' : 'no';
        generatedHtml += `<b><a href="/playvideo/${videoId}?u=${userId}&ai=${aiParam}" class="list-group-item" >
        <input type="checkbox" style="margin-right: 8px;">
        <img class="vid-thumbnail" src="https://i1.ytimg.com/vi/${videoId}/hqdefault.jpg">
        Video ${i+1}: ${videoTitle} (${aiSupportStr})</a></b>`;
        generatedHtml += `<b><a href="https://docs.google.com/forms/d/e/1FAIpQLSfQO6z0lrsHfgj5iR797uHUM-b6gXVz0BfTQT3Oj2HY9tYd1g/viewform?entry.2005620554=${userName} - ${userId}" class="list-group-item" >
        <input type="checkbox" style="margin-right: 8px;">
        <img src="../images/survey.png" class="img-survey">User Survey for Video ${i+1}</a></b>`;  
        generatedHtml += `<b><a href="https://docs.google.com/forms/d/e/1FAIpQLSfQO6z0lrsHfgj5iR797uHUM-b6gXVz0BfTQT3Oj2HY9tYd1g/viewform?entry.2005620554=${userName} - ${userId}" class="list-group-item" >
        <input type="checkbox" style="margin-right: 8px;">
        <img src="../images/survey.png" class="img-survey">NASA TLX Survey for Video ${i+1}</a></b><br>`;  
    }
    generatedHtml += `<b><a href="https://docs.google.com/forms/d/e/1FAIpQLSfQO6z0lrsHfgj5iR797uHUM-b6gXVz0BfTQT3Oj2HY9tYd1g/viewform?entry.2005620554=${userName} - ${userId}" class="list-group-item">
    <input type="checkbox" style="margin-right: 8px;">
    <img src="../images/survey.png" class="img-survey">General Survey</a></b>`;  
    $( ".list-group").append(generatedHtml);
}
