import express from "express";
import session from "express-session";

// Websocket [Socket.io]
import { Server } from "socket.io";

// Reading & Writing files [fs]
import fs from "fs";


const app = express(); // Creating App
const PORT = 3000;

// Initialize middle-ware(s)
const sessionMD = session({ // Session system
    secret: 'enjaz-STCO',
    resave: true,
    saveUninitialized: true,
    //cookie: { secure: true }
});

app.use(sessionMD);

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
websocket.engine.use(sessionMD); // Using express-session with socket.io

let connectedSockets = {}; // { socketObj: [] }
websocket.on('connection', function(ws) {
    const req = ws.request;

    console.log('[SOCKET] User Connected', req.session.id);

    ws.emit('enjaz:updating', { connectedUsers: playersConnected });

    ws.on('disconnect', function() {
        if(!connectedSockets[req.session.id]) return;
        
        connectedSockets[req.session.id] && delete connectedSockets[req.session.id];
        websocket.emit('enjaz:updating', { connectedUsers: --playersConnected });
    });

    ws.on('enjaz:new-contestant', function() {
        if(connectedSockets[req.session.id]) return;

        // Save websocket session
        console.log(connectedSockets[req.session.id] ? "Non-First time" : "First time");
        connectedSockets[req.session.id] = true

        // Websocket broadcast
        websocket.emit('enjaz:updating', { connectedUsers: ++playersConnected });

        console.log("Added contestant")
    });
});

