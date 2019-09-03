/* randomly sorts videos(with AI and without AI) and inserts rows in database
Author: Vaishali*/
const db = require('../db/database');
const userStudy = require('../model/userStudy');

class createHelperData {
    constructor() {
        this.id = 'id_1';
    }
    set name(name) {
        this._name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    get name() {
        return this._name;
    }
    sayHello() {
        console.log('Hello, my name is ' + this.name + ', I have ID: ' + this.id);
    }

    create1(userId, callback) {
        return db.query('SELECT * FROM us_user ORDER BY id ASC', callback);
    }

    create
}

var justAGuy = new createHelperData();
justAGuy.name = 'martin'; // The setter will be used automatically here.
justAGuy.sayHello(); // Will output 'Hello, my name is Martin, I have ID: id_1'

// userStudy.getAllUsers().then(function (result) {
//     userDetails = result;
//     console.log("Initialized user details");
//     // Use user details from here
//     console.log(result)
// }, function (err) {
//     console.log(err);
// })

justAGuy.create1().then(function (result) {
    userDetails = result;
    console.log("Initialized user details");
    // Use user details from here
    console.log(result)
}, function (err) {
    console.log(err);
});

