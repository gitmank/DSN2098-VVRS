// backend javascript for server that listens on port :6969

// importing .env, http, express.js, html body parser, mongoose for MongoDB
require("dotenv").config();
let http = require('http');
let express = require("express");
let bodyParser = require("body-parser");
const { default: mongoose } = require('mongoose');
const { doesNotMatch } = require("assert");
let app = express();

// connecting to MongoDB Atlas
mongoose.connect(process.env.ATLAS_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true });
// creating user schema
let userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    isAdmin: {type: Boolean, default: false}
});
// creating user model
let User = mongoose.model("User", userSchema);

// initializing server
app.listen(6969, "localhost");
// middleware
app.use("/", (req, res, next) => {
    console.log(req.method + req.ip + req.path);
    next();
});
app.use("/css", express.static(__dirname + "/css"));
app.use("/resources", express.static(__dirname + "/resources"));
app.use("/js", express.static(__dirname + "/js"));
app.use("/html", express.static(__dirname + "/html"));

// root path request and response
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/html/home.html");
});

// response to POST request from login.html page
app.post("/authenticate", bodyParser.urlencoded({ extended: false }), (req, res) => {
    let temp = {
        username: process.env.VVRS_ADMIN_USERNAME,
        password: process.env.VVRS_ADMIN_PASSWORD,
        isAdmin: true
    }
    if(req.body.username == temp.username && req.body.password == temp.password) {
        if(temp.isAdmin) {
            res.sendFile(__dirname + "/html/admin-home.html");
        }
        else {
            res.sendFile(__dirname + "/html/student-home.html");
        }
    }
    else {
        console.log("Invalid Credentials!");
        res.sendFile(__dirname + "/html/login.html");
    }
});

// response to POST requests from signup.html page
app.post("/add-user", bodyParser.urlencoded({extended: false}), (req, res) => {
    if (req.body.password != req.body.confirm_password) {
        console.log("Passwords don't match");
        res.sendFile(__dirname + "/html/signup.html");
    }
    else {
        // creating a User
        let temp = new User({
        username: req.body.username,
        password: req.body.password
        });
        // saving User to DB
        temp.save((error, data) => {
            if(error) {
                console.log(error);
                res.sendFile(__dirname + "/html/signup.html");
            }
            else {
                console.log("User added");
                res.sendFile(__dirname + "/html/login.html");
            }
        })
    }
});