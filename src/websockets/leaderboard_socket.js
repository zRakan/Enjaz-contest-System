import * as leaderboard from "../leaderboard.js";

let leaderboardNamespace;
export default function(io) {
    console.log("leaderboard socket init");

    leaderboardNamespace = io.of('/leaderboard');

    leaderboardNamespace.on('connection', function(ws) {

    });
}

export function getNamespace() {
    return leaderboardNamespace;
}