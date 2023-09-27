import * as leaderboard from "../leaderboard.js";

import * as game from '../game.js';


let leaderboardNamespace;
export default function(io) {
    console.log("leaderboard socket init");

    leaderboardNamespace = io.of('/leaderboard');

    leaderboardNamespace.on('connection', function(ws) {
        const req = ws.request;
        const ID = req.session.id;

        let payload = { type: 'state', value: game.getGameState()};

        if(game.isPlayerJoined(ID))
            payload["id"] = game.getPlayerId(ID);

        ws.emit('enjaz:leaderboard:updating', payload);

        ws.on('enjaz:leaderboard:getid', function() {
            let pLoad = { type: 'get_id' }; 
            game.isPlayerJoined(ID) && (pLoad.id = game.getPlayerId(ID)); // Add ID if player joined

            ws.emit('enjaz:leaderboard:updating', pLoad);
        })

        if(game.getGameState() != 'waiting')
            ws.emit('enjaz:leaderboard:updating', { type: 'leaderboard', value: leaderboard.getTopPlayers() })

        console.log("[LEADERBOARD-SOCKET] User Connected", ID);
    });
}

export function getNamespace() {
    return leaderboardNamespace;
}