import express from "express";
import wSocket from "express-ws";

const app = express();
const ws = wSocket(app); // Websocket

// View engine
app.set('view engine', 'ejs');

// Static files
app.use(express.static('views/static'))

app.get('/', function(req, res) {
    res.render("index", { data: "Test2" });
});


// Websocket
let i = 0;

app.ws('/echo', function(ws, req) {
    // Receiver
    ws.on('message', function(message) {
        console.log(`Message from client: ${message}`)
    });

    // Sender

    let currentInterval = setInterval(function() {
        ws.send(++i);
    }, 1000);

    ws.on("close", function(message) {
        clearInterval(currentInterval);
    })
});


app.listen(3000, function() {
    console.log("Webserver Started");
})