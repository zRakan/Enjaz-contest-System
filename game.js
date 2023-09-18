import { getInstance } from "./websocket.js";

// Matchmaking information
let gameState = 'waiting'; // [waiting, starting, started]

let playersConnected = {};
let playersCounter = 0;

// Game management
export function startGame() {
    const io = getInstance();

    const startingTime = new Date();
          startingTime.setSeconds(startingTime.getSeconds() + 10);

    gameState = 'starting';
    io.to('contestant').emit('enjaz:updating', { type: 'game_state', current_state: gameState });

    // Start game after 10 seconds
    setTimeout(function() {
        gameState = 'started';
        io.to('contestant').emit('enjaz:updating', { type: 'game_state', current_state: gameState });        
    }, 10000);
}

export function stopGame() {

}

// Game information
export function getGameState() {
    return gameState;
}

export function changeGameState(state) {
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