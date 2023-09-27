import fs from "fs/promises"

import { getNamespace } from "./websockets/game_socket.js";

import { updateTopPlayers, updateLeaderboard } from "./leaderboard.js";

//import { getNamespace as gameNamespace } from "./websockets/game_socket.js";
import { getNamespace as leaderboard_socket } from "./websockets/leaderboard_socket.js";
import { getNamespace as admin_socket } from "./websockets/admin_socket.js";

// Matchmaking information
let gameState = 'waiting'; // [waiting, starting, started, finished]

let playersConnected = {};
let playersCounter = 0;
let gameTimer

// Questions
import { getQuestions, getAnswers } from "./questions.js";
import { randomStr } from "./utils.js";

export function checkQuestionSet(setNumber) {
    return getQuestions()[setNumber];
}

function shuffle(questionSet) {
    let array = [...getQuestions()[questionSet]];

    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}

// Game management
let currentQuestion = 0;
export function getGameQuestion() {
    return currentQuestion-1;
}

function nextQuestion(questionSet) {
    if(currentQuestion+1 > getQuestions()[questionSet].length) return finishGame(); // Stop game if reached last ques
    currentQuestion++;
    return true;
}

export function constructPlayerQuestion(playerId) {
    const currentQuestion = getGameQuestion();
    const playerData = playersConnected[playerId];
    if(!playerData) return; // Ignore player id without object

    const playerQuestions = playerData.questions[currentQuestion];

    let payload = {
        current_timer: getGameTimer()
    };

    if(!playerData.answers[playerQuestions.id]) { // Check if current question is answered or not for specified user
        // Push player questions data
        payload = { ...payload,
            title: playerQuestions.title,
            options: playerQuestions.options,
            id: playerQuestions.id,    
        }
    }

    // Send to client
    playersConnected[playerId].session.emit('enjaz:question', payload);
}

export function startGame(questionSet) {
    const io = getNamespace();

    // Shuffling question set for each player
    for(let playerId in playersConnected) {
        const player = playersConnected[playerId];      
        if(!player.accept) { // Ignore & Delete non-accepted players
            delete playersConnected[playerId];
            continue; 
        }
        
        player.questions = shuffle(questionSet);
    }

    gameTimer = new Date();
    gameTimer.setSeconds(gameTimer.getSeconds() + 10);

    changeGameState('starting', io);

    io.except('contestant').emit('enjaz:updating', { type: 'game_state', current_state: 'not-joined' });
    io.except('contestant').disconnectSockets(); // Disconnect all websockets of non-participants
    
    leaderboard_socket().emit('enjaz:leaderboard:getid'); // Tell all users from leaderboard socket to request their IDs
    
    // Update leaderboard state
    updateLeaderboard('started');



    // Start game after 10 seconds
    const interval = setTimeout(async function() {
        if(getGameState() != 'starting') return clearTimeout(interval);

        changeGameState('started', io);

        const gameInterval = setInterval(function run() {
            if(getGameState() != 'started') return clearInterval(gameInterval);

            updateTopPlayers();

            // Next question
            if(nextQuestion(questionSet)) { // If returns true then it has question
                // Start cooldown
                gameTimer = new Date();
                gameTimer.setSeconds(gameTimer.getSeconds() + 10);

                // Send questions to clients
                for(let playerId in playersConnected)
                    constructPlayerQuestion(playerId);
            }
            return run;
        }(), 10000);
    }, 10000);
}

export async function finishGame() {
    const io = getNamespace();

    // Redirect all contestants to leaderboard
    io.to('contestant').emit('enjaz:updating', { type: 'game_state', current_state: 'not-started', redirect_leaderboard: true });

    // Change state of game
    changeGameState('finished', io);
}

export async function resetInfo() {
    const io = getNamespace();

    // Save player information before deletion
    let savedData = [];
    for(let playerId in playersConnected) {
        const { session, ...data } = playersConnected[playerId];
        savedData.push(data); 
    }

    await fs.writeFile(`./data/${randomStr(8)}.json`, JSON.stringify(savedData, null, 4));

    // Reset player information
    playersCounter = 0; // Reset player counter
    currentQuestion = 0; // Reset question counter
    playersConnected = {}; // Reset list
    io.emit('enjaz:updating', { type: "connected_users", connected_users: getNumberOfPlayers() });


    // Kick contestants from 'contestant' channel
    const contestants = await io.to('contestant').fetchSockets(); 
    console.log('number of contestants', contestants.length);
    for(let contestant of contestants) {
        console.log(contestant.id);

        contestant.leave('contestant'); 
    }

    // Change state of game
    changeGameState('waiting', io);

    // Update leaderboard state
    updateLeaderboard('waiting');
}

// Game information
export function getGameTimer() {
    return gameTimer; 
}

export function getGameState() {
    return gameState;
}

export function changeGameState(state, io) {
    io.to('contestant').emit('enjaz:updating', { type: 'game_state', current_state: state });
    gameState = state;
}

// Player information

/* Accept/Reject functions */
export function getNonAcceptedPlayers() {
    let nonAcceptedPlayers = [];

    for(let playerId in playersConnected) {
        const player = playersConnected[playerId];    
        !player.accept && nonAcceptedPlayers.push({ id: playerId, name: player.name, studentId: player.sId })
    }

    return nonAcceptedPlayers;    
}

export function acceptPlayer(ID) {
    const playerData = playersConnected[ID];
    if(playerData) { // Check if ID has an object
        playerData.accept = true;
        playerData.session.join('contestant'); // Set client websocket as contestant
        playerData.session.emit('enjaz:joined', { game_state: getGameState(), first_time: true });

        // Update player count
        getNamespace().emit('enjaz:updating', { type: "connected_users", connected_users: ++playersCounter });

        return true;
    }

    return false;
}

export function rejectPlayer(ID) {
    const playerData = playersConnected[ID];

    if(playerData) {
        playerData.session.emit('enjaz:rejected');
        delete playersConnected[ID];

        return true;
    }

    return false;
}


export function getNumberOfPlayers() {
    return playersCounter;
}

export function getPlayers() {
    return playersConnected;
}

export function updatePlayerSocket(id, ws) {
    console.log("Updating socket...",id)
    if(playersConnected[id]) {
        console.log(playersConnected[id].session == ws);
        playersConnected[id].session = ws
        console.log("Updated socket")
    }
}


export function getPlayerId(id){
    return playersConnected[id] && playersConnected[id].id;
}

export function isPlayerJoined(id) {
    return playersConnected[id] && playersConnected[id].accept;
}

export function playerJoined(id, data) {
    playersConnected[id] = data;

    // Send to admin websocket
    admin_socket().emit('enjaz:contestant:new', { players: [
        { id: id, name: data.name, studentId: data.sId }
    ]});

    return playersCounter;
}

export function playerLeft(id) {
    const isAccepted = playersConnected[id].accept;
    delete playersConnected[id]; // Remove player information

    isAccepted && (playersCounter--);
    return playersCounter;
}


function playerQuestionExists(playerQuestions, id) {
    for(let question of playerQuestions) if(question.id == id) return true;
    return false;
}

export function playerAnswer(id, data) {
    const playerData = playersConnected[id];

    const question = parseInt(data.id);
    const answer = data.answer;

    if(playerQuestionExists(playerData.questions, question)) { // Check if question id is in player object
        if(question && !playerData.answers[question]) { // Check if question is answered before or not
            playerData.answers[question] = true; // Indicate this question has been answered
        
            if(answer == getAnswers()[question]) {
                const remainingSeconds = ((getGameTimer() - new Date()) / 1000) | 0; // Using bitwise to truncate decimal points more performant than 'Math'
                const pointsAcquired = 1 + (remainingSeconds / 10);

                console.log(remainingSeconds, 1+(remainingSeconds/10))
                playerData.points = parseFloat((playerData.points + pointsAcquired).toFixed(10));
                return true;
            }
        }
    }

    return false;
}