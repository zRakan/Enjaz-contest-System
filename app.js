import express from "express";
import wSocket from "express-ws";
import fs from "fs";

// Logger
import { logger } from "./logger.js";


const app = express(); // Creating App & Websocket
const websocket = wSocket(app);

const PORT = 3000;
const IS_PRODUCTION = false;


// Reading JSON file
let studentsData = JSON.parse(fs.readFileSync('./students.json'));
console.log(studentsData);

let winners = [];

for(let student in studentsData) {
    if(studentsData[student].winner)
        winners.push({
            contestant: studentsData[student].name,
            winAt: studentsData[student].finished,
            section: studentsData[student].section
        });
}

console.log(winners);


// Initialize middle-ware(s)
app.use(express.json()); // Bodyparser built-in function
app.use(express.urlencoded({ extended: true }));
app.use(logger); // Logging middleware


// View engine
app.set('view engine', 'ejs');

// Static files
app.use(express.static('views/static'))

if(IS_PRODUCTION) app.set('trust proxy', 1) // Trust first proxy

app.get("/CTF", function(req, res) {
    res.render('CTF');
})

app.get('/', function(req, res) {
    res.render('index');
});


// Websocket
let states = [
    { stoppedTimer: null, currentTimer: null, currentContestant: null, currentSocket: null }, // Male
    { stoppedTimer: null, currentTimer: null, currentContestant: null, currentSocket: null }, // Female
];

app.ws('/controller/:section', function(ws, req) {
    const section = parseInt(req.params["section"]);
    if(section != 1 && section != 2) {
        //res.status(400).send({ status: "error", message: "Invalid data" });
        ws.close();
        return;
    }

    console.log("Connected", req.params);

    const currentState = states[section-1];
    currentState.currentSocket = ws; // Set socket for instance

    // Receiver
    ws.on('message', function(message) {
        console.log(`Message from client: ${message}`)
    });

    // Sender
    ws.send(JSON.stringify({ type: "echo" }));
});

// Broadcast websocket
const websocketClients = websocket.getWss('/controller');

app.post('/contestant/:section', function(req, res) {
    const contestant = req.body["name"]; // Contestant name
    const phoneNumber = req.body["pNumber"]; // Phone number
    if(!contestant && !phoneNumber) {
        res.status(400).send({ status: "error", message: "Invalid data" });
        return;
    }

    const section = parseInt(req.params["section"]);

    if(section != 1 && section != 2) {
        res.status(400).send({ status: "error", message: "Invalid data" });
        return;
    }

    const currentState = states[section-1];

    // Reset stopped timer
    currentState.stoppedTimer = null;

    // Current state
    currentState.currentContestant = phoneNumber; // contestant
    currentState.currentTimer = new Date(); // Counting date

    studentsData[phoneNumber] = {
        name: contestant,
        section: section
    };

    // Save student data
    fs.writeFileSync("./students.json", JSON.stringify(studentsData, null, 4));


    res.send({ status: "success" });

    // Send to all channels (clients)
    /*websocketClients.clients.forEach(function(client) {
        client.send(JSON.stringify({ type: "starting", contestant: contestant }));
    });*/

    // Send to instance
    currentState.currentSocket.send(JSON.stringify({ type: "starting", contestant: contestant }));
});

app.post('/stop/:section', function(req, res) {
    console.log("Stopped");
    const section = parseInt(req.params["section"]);

    if(section != 1 && section != 2) {
        res.status(400).send({ status: "error", message: "Invalid data" });
        return;
    }

    const currentState = states[section-1];
    currentState.stoppedTimer = new Date();

    res.send({ status: "success" });
    currentState.currentSocket.send(JSON.stringify({ type: "stop" }));

    // Send to all channels (clients)
    /*websocketClients.clients.forEach(function(client) {
        client.send(JSON.stringify({ type: "stop" }));
    });*/
});


app.post('/judged/:section', function(req, res) {
    const judgeResult = req.body["result"]; // [correct, wrong];
    const section = parseInt(req.params["section"]);

    if(section != 1 && section != 2) {
        res.status(400).send({ status: "error", message: "Invalid data" });
        return;
    }

    // States
    const currentState = states[section-1];

    const isWinner = judgeResult == 'correct';
    const finishedAt = (currentState.stoppedTimer ? currentState.stoppedTimer : new Date()) - currentState.currentTimer;

    currentState.currentSocket.send(JSON.stringify({ type: "finished", winner: isWinner, diff: finishedAt }));

    if(isWinner) {
        studentsData[currentState.currentContestant].winner = true;
        studentsData[currentState.currentContestant].finished = finishedAt;    

        winners.push({
            contestant: studentsData[currentState.currentContestant].name,
            winAt: finishedAt,
            section: section
        });

        // Save student data
        fs.writeFileSync("./students.json", JSON.stringify(studentsData, null, 4));

        // Update leaderboard for all channels (clients)
        websocketClients.clients.forEach(function(client) {
            client.send(JSON.stringify({ type: "update", newWinners: winners, from: section }));
        });
    }


    res.send({ status: "success" });
});

app.get("/winners", function(req, res) {
    res.send({ status: "success", data: winners })
});

// CTF contest
const CTF_KEY = "Engaz{n3v3r_liv3_in_som3_on3_3lse_shadow}";
app.post("/CTF/:section", function(req, res) {
    const ctfKey = req.body["CTF_KEY"];
    if(!ctfKey) {
        res.status(400).send({ status: "error", message: "Invalid data" });
        return;
    }

    const section = parseInt(req.params["section"]);

    if(section != 1 && section != 2) {
        res.status(400).send({ status: "error", message: "Invalid data" });
        return;
    }

    // States
    const currentState = states[section-1];
    const isWinner = ctfKey == CTF_KEY;

    const finishedAt = (currentState.stoppedTimer ? currentState.stoppedTimer : new Date()) - currentState.currentTimer;
    currentState.currentSocket.send(JSON.stringify({ type: "finished", winner: isWinner, diff: finishedAt }));

    if(isWinner) {
        studentsData[currentState.currentContestant].winner = true;
        studentsData[currentState.currentContestant].finished = finishedAt;    

        winners.push({
            contestant: studentsData[currentState.currentContestant].name,
            winAt: finishedAt,
            section: section
        });

        // Save student data
        fs.writeFileSync("./students.json", JSON.stringify(studentsData, null, 4));

        // Update leaderboard for all channels (clients)
        websocketClients.clients.forEach(function(client) {
            client.send(JSON.stringify({ type: "update", newWinners: winners, from: section }));
        });
    }

    res.send({ status: "success" });
});


app.listen(PORT, function() {
    console.log("Webserver Started");
})