import express from "express";
import { Server } from "socket.io";

import fs from "fs";


const app = express(); // Creating App
const PORT = 3000;

// Initialize middle-ware(s)
app.use(express.json()); // Bodyparser built-in function
app.use(express.urlencoded({ extended: true }));

// View engine
app.set('view engine', 'ejs');

// Static files
app.use(express.static('views/static'))

// Matchmaking information
let playersConnected = 0;

app.get('/', function(req, res) {
    res.render("index", { data: playersConnected });
});


let serverListener;
serverListener = app.listen(PORT, function() {
    console.log("Webserver Started");
});

// Creating websocket
let websocket = new Server(serverListener);

websocket.on('connection', function(ws) {
    console.log('a user connected');

    ws.emit('enjaz:updating', { connectedUsers: playersConnected });

    ws.on('disconnect', function() {
        console.log("User disconnected");
    });

    ws.on('enjaz:new-contestant', function() {
        // Websocket broadcast
        websocket.emit('enjaz:updating', { connectedUsers: ++playersConnected });
    });
});