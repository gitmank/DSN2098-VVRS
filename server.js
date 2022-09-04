// backend javascript for server that listens on port :6969 to present home.html file
var http = require('http');
var express = require("express");
var app = express();
app.listen(6969);
app.use("/css", express.static(__dirname + "/css"));
app.use("/resources", express.static(__dirname + "/resources"));
app.use("/js", express.static(__dirname + "/js"));
app.use("/html", express.static(__dirname + "/html"));
app.get("/", (req, res) => {
    res.sendFile("/html/home.html");
});