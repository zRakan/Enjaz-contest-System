import { getNamespace } from "./websockets/game_socket.js";

import { updateTopPlayers, updateLeaderboard } from "./leaderboard.js";

import { getNamespace as leaderboard_socket } from "./websockets/leaderboard_socket.js";

// Matchmaking information
let gameState = 'waiting'; // [waiting, starting, started]

let playersConnected = {};
let playersCounter = 0;
let gameTimer

// Questions
const questions = [
    [
        { title: '1+1', options: [2, 1], id: 1, answer: 2 },
        { title: '1+2', options: [3, 2], id: 2, answer: 3 },
        { title: '3+1', options: [4, 0], id: 3, answer: 4 },
        { title: '4+0', options: [4, 2], id: 4, answer: 4 }
    ],

    [
        { title: '1+1', options: [2, 1], id: 5, answer: 2 },
        { title: '1+2', options: [3, 2], id: 6, answer: 3 },
        { title: '3+1', options: [4, 0], id: 7, answer: 4 },
        { title: '4+0', options: [4, 2], id: 8, answer: 4 }
    ],    
]

// Initialize answers
const answers = {};
for(let questionSet of questions) {
    for(let question in questionSet) {
        const ques = questionSet[question]
        answers[ques.id] = ques.answer;
    }
}

console.log(answers);

export function checkQuestionSet(setNumber) {
    return questions[setNumber];
}

function shuffle(questionSet) {
    let array = [...questions[questionSet]];

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
    if(currentQuestion+1 > questions[questionSet].length) return stopGame(); // Stop game if reached last ques
    currentQuestion++;
}

export function constructPlayerQuestion(playerId) {
    const currentQuestion = getGameQuestion();

    const playerData = playersConnected[playerId]
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
            // Next question
            nextQuestion(questionSet);

            // Start cooldown
            gameTimer = new Date();
            gameTimer.setSeconds(gameTimer.getSeconds() + 10);

            // Send questions to clients
            for(let playerId in playersConnected)
                constructPlayerQuestion(playerId);

            updateTopPlayers();
            return run;
        }(), 10000);
    }, 10000);
}

export async function stopGame() {
    const io = getNamespace();

    // Return all contestants to main menu
    io.to('contestant').emit('enjaz:updating', { type: 'game_state', current_state: 'not-started' });

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
    return playersConnected[id].id;
}

export function isPlayerJoined(id) {
    return playersConnected[id];
}

export function playerJoined(id, data) {
    playersConnected[id] = data;

    return ++playersCounter;
}

export function playerLeft(id) {
    delete playersConnected[id]; // Remove player information
    return --playersCounter;
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
        
            if(answer == answers[question]) {
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