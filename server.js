// backend javascript for server that listens on port :6969

// importing .env, http, express.js, html body parser, mongoose for MongoDB
require("dotenv").config();
let http = require('http');
let express = require("express");
let bodyParser = require("body-parser");
const { default: mongoose } = require('mongoose');
const { doesNotMatch } = require("assert");
const { createDiffieHellmanGroup } = require("crypto");
const bcrypt = require("bcrypt")
const cookie = require("cookie");
const cookieParser = require("cookie-parser");

let app = express();

// connecting to MongoDB Atlas
mongoose.connect(process.env.ATLAS_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true });

// creating schema
let userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String},
    isAdmin: {type: Boolean, default: false}
});
let reportSchema = new mongoose.Schema({
    username: {type: String}, // of student
    email: {type: String}, // of student
    category: {type: String, default: "Misc"}, // bug, vulnerability, misc
    severity: {type: String}, // low, moderate critical
    status: {type: String, default: "Open"}, // open, closed, seen, accepted, rejected
    description: {type:String}, // by user
    mediaLink: {type:String}, // from user
    comment: {type:String}, // by admin
})

// creating user model
let User = mongoose.model("User", userSchema);
let Report = mongoose.model("Report", reportSchema);

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
app.use(cookieParser())

// root path request and response
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/html/home.html");
});

app.get("/login", bodyParser.urlencoded({ extended: false }), (req, res) => {
    if(req.cookies.user == "admin") {
        res.sendFile(__dirname + "/html/admin-home.html");
    }
    else if(req.cookies.user == "student") {
        res.sendFile(__dirname + "/html/student-home.html");
    }
    else res.sendFile(__dirname + "/html/login.html");
})

app.get("/logout", bodyParser.urlencoded({ extended: false }), (req, res) => {
    res.clearCookie("user");
    res.sendFile(__dirname + "/html/home.html");
})

app.get("/profile", bodyParser.urlencoded({ extended: false }), (req, res) => {
    User.find({username: req.cookies.username}, (error, data) => {
        if(!error) {
            res.render("user-profile.ejs", {
                user: data[0]
            })
        }
    })
})

app.post("/searchReport", bodyParser.urlencoded({ extended: false }), (req, res) => {
    Report.find({_id: req.body.reportID}, (error, data) => {
        if(!error) {
            res.render("singleReport.ejs", {
                report: data[0]
            })
        }
    })
})

app.post("/respondToReport", bodyParser.urlencoded({ extended: false }), (req, res) => {
    Report.find({_id: req.body.reportID}, (error, data) => {
        if(!error) {
            res.render("singleReport-admin.ejs", {
                report: data[0]
            })
        }
    })
})

app.post("/deleteReport", bodyParser.urlencoded({ extended: false }), (req, res) => {
    Report.deleteMany({_id: req.body.reportID}, (error, data) => {
        if(!error) {
            res.redirect("/login")
        }
    })
})

app.get("/viewReports", bodyParser.urlencoded({ extended: false }), (req, res) => {
    Report.find({username: req.cookies.username}, (error, data) => {
        if(!error) {
            res.render("student-reports.ejs", {
                reports: data
            })
        }
    })
})

app.get("/showAllReports", bodyParser.urlencoded({ extended: false }), (req, res) => {
    Report.find({}, (error, data) => {
        if(!error) {
            res.render("admin-reports.ejs", {
                reports: data
            })
        }
    })
})

app.get("/showOpenReports", bodyParser.urlencoded({ extended: false }), (req, res) => {
    Report.find({status: "Open"}, (error, data) => {
        if(!error) {
            res.render("admin-reports.ejs", {
                reports: data
            })
        }
    })
})

app.get("/showCriticalReports", bodyParser.urlencoded({ extended: false }), (req, res) => {
    Report.find({severity: "Critical"}, (error, data) => {
        if(!error) {
            res.render("admin-reports.ejs", {
                reports: data
            })
        }
    })
})
app.get("/showSeenReports", bodyParser.urlencoded({ extended: false }), (req, res) => {
    Report.find({status: "Seen"}, (error, data) => {
        if(!error) {
            res.render("admin-reports.ejs", {
                reports: data
            })
        }
    })
})
app.get("/showAcceptedReports", bodyParser.urlencoded({ extended: false }), (req, res) => {
    Report.find({status: "Accepted"}, (error, data) => {
        if(!error) {
            res.render("admin-reports.ejs", {
                reports: data
            })
        }
    })
})

// updating password
app.post("/changePassword", bodyParser.urlencoded({ extended: false }), async (req, res) => {
    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.newPassword, salt)
        User.findOneAndUpdate({username: req.cookies.username}, {password: hashedPassword}, (error, data) => {
            if(!error) {
                console.log("Password Updated")
                res.redirect("/logout");
            }
        })
    }
    catch {
        res.sendStatus(500).send()
    }
})

// updating email
app.post("/changeEmail", bodyParser.urlencoded({ extended: false }), async (req, res) => {
    User.findOneAndUpdate({username: req.cookies.username}, {email: req.body.newEmail}, (error, data) => {
        if(!error) {
            console.log("Email Updated")
            res.redirect("/profile")
        }
    })
})

app.post("/updateReport", bodyParser.urlencoded({ extended: false }), async (req, res) => {
    Report.findOneAndUpdate({_id: req.body.reportID}, {status: req.body.status, comment: req.body.comment}, (error, data) => {
        if(!error) {
            console.log("Email Updated")
            res.redirect("/login")
        }
    })
})

// response to POST request from login.html page
app.post("/authenticate", bodyParser.urlencoded({ extended: false }), async (req, res) => {
    try {
        User.find({username: req.body.username}, async (error, data) => {
            if(!error) {
                var passwordsMatch = await bcrypt.compare(req.body.password, data[0].password)
                var usernamesMatch = req.body.username == data[0].username
                if (data.length>0) {
                    if(usernamesMatch && passwordsMatch) {
                        if(data[0].isAdmin) {
                            res.cookie("user", "admin", {maxAge: 1000000, httpOnly: true})
                            res.cookie("username", req.body.username, {maxAge: 1000000, httpOnly: true})
                            res.sendFile(__dirname + "/html/admin-home.html");
                        }
                        else {
                            res.cookie("user", "student", {maxAge: 500000, httpOnly: true})
                            res.cookie("email", data[0].email, {maxAge: 500000, httpOnly: true})
                            res.cookie("username", req.body.username, {maxAge: 1000000, httpOnly: true})
                            res.sendFile(__dirname + "/html/student-home.html");
                        }
                    }
                    else {
                        console.log("Invalid Credentials!");
                        res.sendFile(__dirname + "/html/login.html");
                    }
                }
                else {
                    console.log("User does not exist!")
                    res.sendFile(__dirname + "/html/signup.html");
                }
            }
        })
    }
    catch {
        res.sendStatus(500).send()
    }
});

// response to POST requests from signup.html page
app.post("/add-user", bodyParser.urlencoded({extended: false}), async (req, res) => {
    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt)
        User.find({username: req.body.username}, (error, data) => {
            if(!error) {
                if(data.length == 0) {
                    if (req.body.password != req.body.confirm_password) {
                        console.log("Passwords don't match");
                        res.sendFile(__dirname + "/html/signup.html");
                    }
                    else {
                        // creating a User
                        let temp = new User({
                            username: req.body.username,
                            password: hashedPassword
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
                }
                else {
                    console.log("Username exists!")
                    res.sendFile(__dirname + "/html/login.html");
                }
            }
        })
    }
    catch {
        res.sendStatus(500).send()
    }
});

app.post("/newReport", bodyParser.urlencoded({extended: false}), (req, res) => {
    temp = new Report({
        username: req.cookies.username,
        email: req.cookies.email,
        category: req.body.category,
        severity: req.body.severity,
        description: req.body.description,
        mediaLink: req.body.mediaLink
    })
    temp.save((error, data) => {
        if(!error) {
            console.log("Report added!")
        }
        res.redirect("/login");
    })
})