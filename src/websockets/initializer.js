// Websocket [Socket.io]
import { Server } from "socket.io";

// Websocket namespaces
import game_socket from "./game_socket.js";
import leaderboard_socket from "./leaderboard_socket.js";

let websocket;
export default function(listener, engine) {
    console.log("Imported websocket initializer.js");

    websocket = new Server(listener);
    websocket.engine.use(engine); // Using express-session with socket.io

    // Calling namespaces
    game_socket(websocket);
    leaderboard_socket(websocket);
    
    return websocket;
}

export async function getInstance() {
    return websocket;
}