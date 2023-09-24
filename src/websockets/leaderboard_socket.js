import * as leaderboard from "../leaderboard.js";

import * as game from '../game.js';


let leaderboardNamespace;
export default function(io) {
    console.log("leaderboard socket init");

    leaderboardNamespace = io.of('/leaderboard');

    leaderboardNamespace.on('connection', function(ws) {
        const req = ws.request;
        const ID = req.session.id;

        ws.emit('enjaz:leaderboard:updating', { type: 'state', value: game.getGameState() });

        if(game.getGameState() != 'waiting')
            ws.emit('enjaz:leaderboard:updating', { type: 'leaderboard', value: leaderboard.getTopPlayers() })

        console.log("[SOCKET] User Connected", ID);
    });
}

export function getNamespace() {
    return leaderboardNamespace;
}