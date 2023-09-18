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

const questions = [
    {
        '1+1': [2, 1],
        '1+2': [3, 2],
        '3+1': [4, 0],
        '4+0': [4, 2]
    },

    {
        '5+1': [6, 1],
        '6+2': [8, 2],
        '9+1': [10, 0],
        '10+0': [10, 2]
    },    
]

const API_KEY = 'RAKAN-33828438897517041749474368349544';
function checkAuthorization(req, res, next) {
    const apiKey = req.headers["api_key"];
    if(!apiKey || apiKey != API_KEY) return res.sendStatus(403);
    next();
}

app.post('/start/:question_id', checkAuthorization, function(req, res) {
    let questionId = req.params['question_id'];
    if(!questionId) res.sendStatus(403);

    questionId = parseInt(questionId);
    if(!questions[questionId-1]) return res.sendStatus(403);

    res.send("Good API");
    console.log(questions[questionId-1]);

    game.startGame();
});

app.post('/stop', checkAuthorization, async function(req, res) {
    res.send("Good API");
    await game.stopGame();
});

let serverListener;
serverListener = app.listen(PORT, function() {
    console.log("Webserver Started");
});

// Creating websocket
//import { startWebsocket } from "./websocket.js";
import { default as startWebsocket }  from './websockets/initializer.js';
startWebsocket(serverListener, sessionMD);
