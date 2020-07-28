let userId = '';
let tutorialHtml = '';

$(document).ready(function () {
    let url = location.search.substring(1);
    userId = new URLSearchParams(url).get('userId');
    let targetUrl = '/userStudy4/users?userId=' + userId;
    fetchTutorialVideo();
    fetchVideo(targetUrl);
});

function fetchTutorialVideo() {
    let targetUrl = '/userStudy4/tutorialVideo';
    $.get(targetUrl, function (vidArr) {
        // let generatedHtml = '';
        let userName = vidArr[0].name;
        for (let i = 0; i < vidArr.length; i++) {
            let vid = vidArr[i];
            let videoId = vid.video_id;
            let videoTitle = vid.title;
            let volunteerId = vid.volunteer_id;
            let isAiSupported = vid.ai_support;
            let isOnDemandSupported = vid.on_demand_support;
            let aiSupportStr = isAiSupported ? 'With Baseline Descriptions' : 'Without Baseline Descriptions';
            let onDemandSupportStr = isOnDemandSupported ? 'With On Demand' : 'Without On Demand';
            let aiParam = vid.ai_support===true ? 'yes' : 'no';
            let surveyLink = "#";
            
                tutorialHtml += `<b><a href="/onDemandTutorial/${videoId}?u=${userId}&ai=${aiParam}" class="list-group-item" >
                <input type="checkbox" style="margin-right: 8px;">
                <img class="vid-thumbnail" src="https://i1.ytimg.com/vi/${videoId}/hqdefault.jpg">
                Tutorial Video : ${videoTitle} (${aiSupportStr} and ${onDemandSupportStr})</a></b>`;
                
                tutorialHtml += `</b><br>`;  
            }

    });
}

function fetchVideo(targetUrl) {
    $.get(targetUrl, function (vidJsonArr) {
        updateUI(vidJsonArr);
    });
}

function updateUI(vidArr) {
    console.log(vidArr);
    // let generatedHtml = '';
    let generatedHtml = tutorialHtml;
    let userName = vidArr[0].name;
    for (let i = 0; i < vidArr.length; i++) {
        let vid = vidArr[i];
        let videoId = vid.video_id;
        let videoTitle = vid.title;
        let volunteerId = vid.volunteer_id;
        let isAiSupported = vid.ai_support;
        let isOnDemandSupported = vid.on_demand_support;
        let aiSupportStr = isAiSupported ? 'With Baseline Descriptions' : 'Without Baseline Descriptions';
        let onDemandSupportStr = isOnDemandSupported ? 'With On Demand' : 'Without On Demand';
        let aiParam = vid.ai_support===true ? 'yes' : 'no';
        let surveyLink = "#";
        if(isAiSupported) {
            surveyLink = 'https://forms.gle/vkyExP3UqeNkNKiE9';
        } else {
            surveyLink = 'https://forms.gle/vkyExP3UqeNkNKiE9';
        }
        if(isOnDemandSupported){
            generatedHtml += `<b><a href="/onDemandUserStudy/${videoId}?u=${userId}&ai=${aiParam}" class="list-group-item" >
            <input type="checkbox" style="margin-right: 8px;">
            <img class="vid-thumbnail" src="https://i1.ytimg.com/vi/${videoId}/hqdefault.jpg">
            Video ${i+1}: ${videoTitle} (${aiSupportStr} and ${onDemandSupportStr})</a></b>`;
        }
        else{
            generatedHtml += `<b><a href="/audioDescriptionUserStudy/${videoId}?u=${userId}&ai=${aiParam}" class="list-group-item" >
            <input type="checkbox" style="margin-right: 8px;">
            <img class="vid-thumbnail" src="https://i1.ytimg.com/vi/${videoId}/hqdefault.jpg">
            Video ${i+1}: ${videoTitle} (${aiSupportStr} and ${onDemandSupportStr})</a></b>`;
        }
        generatedHtml += `<b><a href="${surveyLink}" class="list-group-item" target="_blank" >
        <input type="checkbox" style="margin-right: 8px;">
        <img src="../images/survey.png" class="img-survey">User Survey for Video ${i+1} (Google Form)</a></b>`;  
        generatedHtml += `<b><a href="#" class="list-group-item" >
        <input type="checkbox" style="margin-right: 8px;">
        <img src="../images/survey.png" class="img-survey">NASA TLX Survey for Video ${i + 1} (Not Clickable – You Will Be Given a Physical Form to Fill Out)</a></b><br>`;  
    }
    generatedHtml += `<b><a href="https://forms.gle/aEpEpjFyjrBP64sW9" class="list-group-item" target="_blank">
    <input type="checkbox" style="margin-right: 8px;">
    <img src="../images/survey.png" class="img-survey">General Survey (Google Form)</a></b>`;  
    $( ".list-group").append(generatedHtml);
}
