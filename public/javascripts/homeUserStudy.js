$(document).ready(function () {
    fetchUsers();
});

function fetchUsers() {
    $.get('/userStudy/users', function (rows) {
        let generatedHtml = '';
        for (let i = 0; i < rows.length; i++) {
            generatedHtml +=  `<a href="/userStudy/video?userId=${rows[i].uuid}" class="list-group-item"> ${rows[i].name} </a>`
        }
        $( ".list-group" ).append(generatedHtml);
    });
}