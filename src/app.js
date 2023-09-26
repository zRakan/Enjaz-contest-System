import express from "express";
import session from "express-session";

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
app.set('views', 'src/views'); // Set views folder
app.use(express.static('./src/views/static')) // Set static folder

// Game state
import * as game from "./game.js";

app.get('/', function(req, res) {
    if(game.getGameState() != 'waiting' && !game.isPlayerJoined(req.session.id)) return res.redirect('leaderboard');

    console.log("Game state", game.getGameState())

    res.render("index", { data: game.getNumberOfPlayers() });
});

app.get('/leaderboard', function(req, res) {
    res.render('leaderboard', { 
        data: {
            state: game.getGameState()
        }
    });
});

const API_KEY = 'RAKAN-33828438897517041749474368349544';
function checkAuthorization(req, res, next) {
    const apiKey = req.headers["api_key"] || req.params["api_key"];
    if(!apiKey || apiKey != API_KEY) return res.sendStatus(403);
    next();
}

app.get('/admin/:api_key', checkAuthorization, function(req, res) {
    res.render('admin');  
})

app.post('/admin/:api_key/accept', checkAuthorization, function(req, res) {
    console.log(req.body);
    
    const ID = req.body["ID"];
    if(!ID) return res.sendStatus(400);

    console.log("Accepted", ID)
    res.send({ status: game.acceptPlayer(ID) ? 'success' : 'failed' });
});

app.post('/admin/:api_key/reject', checkAuthorization, function(req, res) {
    console.log(req.body);
    
    const ID = req.body["ID"];
    if(!ID) return res.sendStatus(400);

    console.log("Rejected", ID);
    res.send({ status: game.rejectPlayer(ID) ? 'success' : 'failed' });
});

// Static admin files
app.use('/admin/:api_key/', checkAuthorization, express.static('./src/views/static_admin'));

app.post('/start/:question_id', checkAuthorization, function(req, res) {
    let questionId = req.params['question_id'];
    if(!questionId) res.sendStatus(403);

    questionId = parseInt(questionId) - 1;
    if(!game.checkQuestionSet(questionId)) return res.sendStatus(403);

    res.send("Good API");
    game.startGame(questionId);

});

app.post('/stop', checkAuthorization, async function(req, res) {
    res.send("Good API");
    await game.finishGame();
});

app.post('/reset', checkAuthorization, async function(req, res) {
    res.send("Good API");
    await game.resetInfo();
});


let serverListener;
serverListener = app.listen(PORT, function() {
    console.log("Webserver Started");
});

// Creating websocket
//import { startWebsocket } from "./websocket.js";
import { default as startWebsocket }  from './websockets/initializer.js';
startWebsocket(serverListener, sessionMD);
