const express = require("express");
const app = express();
const path = require("path");
const https = require("https");
const fs = require("fs");
const socketio = require("socket.io");

// Load the certificates
const key = fs.readFileSync('key.pem');
const cert = fs.readFileSync('cert.pem');

const server = https.createServer({ key: key, cert: cert }, app);

const io = socketio(server);

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

io.on("connection", function(socket) {
    socket.on("send-location", function(data) {
        io.emit("receive-location", {id: socket.id, ...data})
    });

    socket.on("disconnect", function() {
        io.emit("user-disconnected", socket.id);
    });

    console.log("Connected");
});

app.get('/', function(req, res) {
    res.render("index");
});

server.listen(3000,'192.168.76.43', () => {
    console.log("Server running on https://192.168.76.43:3000");
});
