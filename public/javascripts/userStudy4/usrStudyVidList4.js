let userId = '';
let tutorialHtml = '';

$(document).ready(function () {
    let url = location.search.substring(1);
    userId = new URLSearchParams(url).get('userId');
    
    fetchTutorialVideo();
    
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
            let targetUrl = '/userStudy4/users?userId=' + userId;
            fetchVideo(targetUrl);
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
        let volunteerId = vid.volunteer_id; // on-demand Describer
        let isAiSupported = vid.ai_support;
        let isOnDemandSupported = vid.on_demand_support;
        let describerId = volunteerId=='f03cb948-474b-4084-9192-650ba62d396b'? 1 : 2;
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
            generatedHtml += `<b><a href="/onDemandUserStudy/${videoId}?u=${userId}&ai=${aiParam}&did=${describerId}" class="list-group-item" >
            <input type="checkbox" style="margin-right: 8px;">
            <img class="vid-thumbnail" src="https://i1.ytimg.com/vi/${videoId}/hqdefault.jpg">
            Video ${i+1}: ${videoTitle} (${aiSupportStr} and ${onDemandSupportStr})</a></b>`;
        }
        else{
            if(isAiSupported)
                generatedHtml += `<b><a href="/audioDescriptionUserStudy/${videoId}?u=${userId}&ai=${aiParam}&did=${describerId}" class="list-group-item" >
                <input type="checkbox" style="margin-right: 8px;">
                <img class="vid-thumbnail" src="https://i1.ytimg.com/vi/${videoId}/hqdefault.jpg">
                Video ${i+1}: ${videoTitle} (${aiSupportStr} and ${onDemandSupportStr})</a></b>`;
            else
                generatedHtml += `<b><a href="/playvideoaudio/${videoId}?u=${userId}&ml=${aiParam}" class="list-group-item" >
                <input type="checkbox" style="margin-right: 8px;">
                <img class="vid-thumbnail" src="https://i1.ytimg.com/vi/${videoId}/hqdefault.jpg">
                Video ${i+1}: ${videoTitle} (${aiSupportStr} and ${onDemandSupportStr})</a></b>`;
        }
        generatedHtml += `<b><a href="${surveyLink}" class="list-group-item" target="_blank" >
        <input type="checkbox" style="margin-right: 8px;">
        <img src="../images/survey.png" class="img-survey">User Survey for Video ${i+1} (Google Form)</a></b><br>`;    
    }
    generatedHtml += `<b><a href="https://forms.gle/aEpEpjFyjrBP64sW9" class="list-group-item" target="_blank">
    <input type="checkbox" style="margin-right: 8px;">
    <img src="../images/survey.png" class="img-survey">General Survey (Google Form)</a></b>`;  
    $( ".list-group").append(generatedHtml);
}
