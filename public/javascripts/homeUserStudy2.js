$(document).ready(function () {
    fetchUsers();
});

function fetchUsers() {
    $.get('/userStudy2/users', function (rows) {
        let generatedHtml = '';
        for (let i = 0; i < rows.length; i++) {
            generatedHtml += `<a href="/userStudy/videoHelper?userId=${rows[i].uuid}&pid=${rows[i].id}" class="list-group-item"  style= "text-align: center";> ${rows[i].name} </a>`
        }
        $( ".list-group" ).append(generatedHtml);
    });
}