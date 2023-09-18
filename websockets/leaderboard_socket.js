let leaderboard_socket;
export default function(io) {
    console.log("leaderboard socket init");

    leaderboard_socket = io.of('/leaderboard');
}

export function getNamespace() {
    return leaderboard_socket;
}