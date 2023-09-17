// Matchmaking information
let gameState = "waiting"; // [waiting, starting, started]

let playersConnected = {};
let playersCounter = 0;


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