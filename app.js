import express from "express";
import wSocket from "express-ws";
import fs from "fs";


const app = express(); // Creating App & Websocket
const websocket = wSocket(app);
const PORT = 3000;

// Reading JSON file
let studentsData = JSON.parse(fs.readFileSync('./students.json'));
console.log(studentsData);

let winners = [];

for(let student in studentsData) {
    if(studentsData[student].winner)
        winners.push({
            contestant: studentsData[student].name,
            winAt: studentsData[student].finished
        });
}

console.log(winners);


// Initialize middle-ware(s)
app.use(express.json()); // Bodyparser built-in function
app.use(express.urlencoded({ extended: true }));

// View engine
app.set('view engine', 'ejs');

// Static files
app.use(express.static('views/static'))

app.get('/', function(req, res) {
    res.render("index", { data: "Test2" });
});


// Websocket
app.ws('/controller', function(ws, req) {

    // Receiver
    ws.on('message', function(message) {
        console.log(`Message from client: ${message}`)
    });

    // Sender
    ws.send(JSON.stringify({ type: "echo" }));
});

// Broadcast websocket
const websocketClients = websocket.getWss('/controller');

let stoppedTimer, currentTimer, currentContestant;
app.post('/contestant', function(req, res) {
    const contestant = req.body["name"]; // Contestant name
    const phoneNumber = req.body["pNumber"]; // Phone number

    // Reset stopped timer
    stoppedTimer = null;

    // Current state
    currentContestant = phoneNumber; // contestant
    currentTimer = new Date(); // Counting date

    studentsData[phoneNumber] = {
        name: contestant
    };

    // Save student data
    fs.writeFileSync("./students.json", JSON.stringify(studentsData, null, 4));


    res.send({ status: "success" });

    // Send to all channels (clients)
    websocketClients.clients.forEach(function(client) {
        client.send(JSON.stringify({ type: "starting", contestant: contestant }));
    });
});

app.post('/stop', function(req, res) {
    stoppedTimer = new Date();

    // Send to all channels (clients)
    websocketClients.clients.forEach(function(client) {
        client.send(JSON.stringify({ type: "stop" }));
    });
    
    res.send({ status: "success" });
});


app.post('/judged', function(req, res) {
    const judgeResult = req.body["result"]; // [correct, wrong];
    const isWinner = judgeResult == 'correct';
    const finishedAt = (stoppedTimer ? stoppedTimer : new Date()) - currentTimer;

    if(isWinner) {
        studentsData[currentContestant].winner = true;
        studentsData[currentContestant].finished = finishedAt;    

        winners.push({
            contestant: studentsData[currentContestant].name,
            winAt: finishedAt
        });

        // Save student data
        fs.writeFileSync("./students.json", JSON.stringify(studentsData, null, 4));
    }

    // Send to all channels (clients)
    websocketClients.clients.forEach(function(client) {
        client.send(JSON.stringify({ type: "finished", winner: isWinner, diff: finishedAt }));
    });

    res.send({ status: "success" });
});

app.get("/winners", function(req, res) {
    res.send({ status: "success", data: winners })
})

app.listen(PORT, function() {
    console.log("Webserver Started");
})