import * as game from './game.js';

import { getNamespace } from './websockets/leaderboard_socket.js';

let sortedPlayers = [];
export function getTopPlayers() {
    return sortedPlayers;
}

export function updateLeaderboard(state) {
    const io = getNamespace();
    io.emit('enjaz:leaderboard:updating', { type: 'state', value: state })
}

export function updateTopPlayers()  {
    const players = { ...game.getPlayers() };
    sortedPlayers = [];

    for(let player in players)
        sortedPlayers.push({
            name: players[player].name,
            points: players[player].points,
            id: players[player].id
        });

    
    sortedPlayers.sort(function(a, b) { return b.points - a.points });

    console.log(sortedPlayers);

    // Send to all leaderboard clients
    getNamespace().emit('enjaz:leaderboard:updating', { type: 'leaderboard', value: sortedPlayers });
}