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
        let surveyLink = "#";
        if(isAiSupported) {
            surveyLink = 'https://forms.gle/1T7FFNFkfzgwQSwbA';
        } else {
            surveyLink = 'https://forms.gle/ftZNSuNnEKaQGG3D9';
        }
        generatedHtml += `<b><a href="/playvideo/${videoId}?u=${userId}&ai=${aiParam}" class="list-group-item" >
        <input type="checkbox" style="margin-right: 8px;">
        <img class="vid-thumbnail" src="https://i1.ytimg.com/vi/${videoId}/hqdefault.jpg">
        Video ${i+1}: ${videoTitle} (${aiSupportStr})</a></b>`;
        generatedHtml += `<b><a href="${surveyLink}" class="list-group-item" target="_blank" >
        <input type="checkbox" style="margin-right: 8px;">
        <img src="../images/survey.png" class="img-survey">User Survey for Video ${i+1} (Google Form)</a></b>`;  
        generatedHtml += `<b><a href="#" class="list-group-item" >
        <input type="checkbox" style="margin-right: 8px;">
        <img src="../images/survey.png" class="img-survey">NASA TLX Survey for Video ${i+1} (Not clickable - You'll be given a physical form to fill out)</a></b><br>`;  
    }
    generatedHtml += `<b><a href="https://forms.gle/aEpEpjFyjrBP64sW9" class="list-group-item" target="_blank">
    <input type="checkbox" style="margin-right: 8px;">
    <img src="../images/survey.png" class="img-survey">General Survey (Google Form)</a></b>`;  
    $( ".list-group").append(generatedHtml);
}
