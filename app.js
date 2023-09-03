import express from "express";
import wSocket from "express-ws";

const app = express(); // Creating App & Websocket
const websocket = wSocket(app);
const PORT = 3000;

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
app.ws('/echo', function(ws, req) {

    // Receiver
    ws.on('message', function(message) {
        console.log(`Message from client: ${message}`)
    });

    // Sender
    ws.send(JSON.stringify({ type: "echo" }));
});

// Broadcast websocket
const websocketClients = websocket.getWss('/echo');

app.post('/contestant', function(req, res) {
    const contestant = req.body["name"];

    res.send("Test");

    // Send to all channels (clients)
    websocketClients.clients.forEach(function(client) {
        client.send(JSON.stringify({ type: "starting", contestant: contestant }));
    });
});

websocketClients.clients.forEach(function(client) {
    client.send("Test111-b");
});



app.listen(PORT, function() {
    console.log("Webserver Started");
})