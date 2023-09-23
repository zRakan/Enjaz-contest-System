import * as game from './game.js';

export function getTopPlayers()  {
    const players = { ...game.getPlayers() };
    const sortedPlayers = [];

    for(let player in players)
        sortedPlayers.push({
            name: players[player].name,
            points: players[player].points
        });


    
    sortedPlayers.sort(function(a, b) { return b.points - a.points });
    console.log(sortedPlayers);
}