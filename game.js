import { getInstance } from "./websocket.js";

// Matchmaking information
let gameState = 'waiting'; // [waiting, starting, started]

let playersConnected = {};
let playersCounter = 0;
let gameTimer

// Game management
export function startGame() {
    const io = getInstance();

    gameTimer = new Date();
    gameTimer.setSeconds(gameTimer.getSeconds() + 10);

    changeGameState('starting', io);

    io.except('contestant').emit('enjaz:updating', { type: 'game_state', current_state: 'not-joined' });
    io.except('contestant').disconnectSockets(); // Disconnect all websockets of non-participants

    // Start game after 10 seconds
    const interval = setTimeout(function() {
        if(getGameState() != 'starting') return clearTimeout(interval);

        changeGameState('started', io);
    }, 10000);
}

export async function stopGame() {
    const io = getInstance();

    // Return all contestants to main menu
    io.to('contestant').emit('enjaz:updating', { type: 'game_state', current_state: 'not-started' });

    // Reset player information
    playersCounter = 0;
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

export function getNumberOfPlayers() {
    return playersCounter;
}