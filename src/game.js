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

// Bell state
let currentBell = 0;


import { randomStr } from "./utils.js";

// Game management
export function startGame() {
    const io = getNamespace();

    for(let playerId in playersConnected) {
        const player = playersConnected[playerId];      
        if(!player.accept) { // Ignore & Delete non-accepted players
            delete playersConnected[playerId];
            continue; 
        }
    }

    gameTimer = new Date();
    gameTimer.setSeconds(gameTimer.getSeconds() + 10);

    changeGameState('starting', io);

    io.except('contestant').emit('enjaz:updating', { type: 'game_state', current_state: 'not-joined' });
    io.except('contestant').disconnectSockets(); // Disconnect all websockets of non-participants
    
    leaderboard_socket().emit('enjaz:leaderboard:getid'); // Tell all users from leaderboard socket to request their IDs
    
    // Update leaderboard state
    updateLeaderboard('started');

    // Remove all elements from admin page
    admin_socket().emit('enjaz:contestant:remove');

    setTimeout(function() {
        changeGameState('started', io);
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
    playersConnected = {}; // Reset list
    io.emit('enjaz:updating', { type: "connected_users", connected_users: getNumberOfPlayers() });

    // Reset bell state
    currentBell  = 0;

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

/* Bell */
export function setPlayerBell(id, state) {
    const player = playersConnected[id]
    
    if(player) {
        player.bell = state;
        player.pos = ++currentBell;

        admin_socket().emit("enjaz:contestant:bell",  { players: [
            { id: id, name: player.name, pos: player.pos }
        ]})

        return true;
    }

    return false;
}

export function isPlayerBellAvailable(id) {
    return playersConnected[id] && !playersConnected[id].bell;
}

export function resetBell() {
    for(let playerId in playersConnected) {
        const player = playersConnected[playerId];    
        player.bell = false;
        player.pos = 0;
    }

    currentBell = 0;

    getNamespace().to('contestant').emit('enjaz:updating', { type: "bell_state", bell_state: true });
    return true;
}


/* Accept/Reject functions */
export function getPlayersInfo() {
    let nonAcceptedPlayers = [];
    let bellUsers = [];

    for(let playerId in playersConnected) {
        const player = playersConnected[playerId];
        const playerObj = { id: playerId, name: player.name };

        !player.accept && nonAcceptedPlayers.push(playerObj)
        player.bell && bellUsers.push({...playerObj, pos: player.pos });
    }

    return [nonAcceptedPlayers, bellUsers];    
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
        { id: id, name: data.name }
    ]});

    return playersCounter;
}

export function playerLeft(id) {
    const isAccepted = playersConnected[id].accept;
    delete playersConnected[id]; // Remove player information

    isAccepted && (playersCounter--);
    return playersCounter;
}

export function playerAnswer(id) {
    const playerData = playersConnected[id];

    if(playerData) {
        playerData.points++;

        // Update leaderboard
        updateTopPlayers();

        // Clear bell users from admin dashboard
        admin_socket().emit('enjaz:reset:bell');
        resetBell();
    } else return false;

    return true;
}