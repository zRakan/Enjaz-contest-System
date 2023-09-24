import * as leaderboard from "../leaderboard.js";


let leaderboardNamespace;
export default function(io) {
    console.log("leaderboard socket init");

    leaderboardNamespace = io.of('/leaderboard');

    leaderboardNamespace.on('connection', function(ws) {
        const req = ws.request;
        const ID = req.session.id;
        
        console.log("[SOCKET] User Connected", ID);
    });
}

export function getNamespace() {
    return leaderboardNamespace;
}