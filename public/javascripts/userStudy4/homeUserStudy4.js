$(document).ready(function () {
    fetchUsers();
});

function fetchUsers() {
    $.get('/userStudy4/users', function (rows) {
        let generatedHtml = '';
        for (let i = 0; i < rows.length; i++) {
            generatedHtml +=  `<a href="/userStudy4/video?userId=${rows[i].uuid}" class="list-group-item"> ${rows[i].name} </a>`
            // generatedHtml += `<a href="/userStudy4/videoHelper?userId=${rows[i].uuid}&pid=${rows[i].id}" class="list-group-item"  style= "text-align: center";> ${rows[i].name} </a>`
        }
        $( ".list-group" ).append(generatedHtml);
    });
}