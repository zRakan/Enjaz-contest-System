// Websocket [Socket.io]
import { Server } from "socket.io";



// Import utils
import * as game from "./game.js";
import * as utils from "./utils.js";

let websocket;
export function startWebsocket(listener, engine) {
    websocket = new Server(listener);
    websocket.engine.use(engine); // Using express-session with socket.io


    /*
        Events: {
            'enjaz:updating': [
                { type: "connected_users", connected_users: Integer },
                { type: "game_state", current_state: String }
            ],

            'enjaz:joined': { game_state: String, first_time: Boolean } 
        }
    */
    websocket.on('connection', function(ws) {
        const req = ws.request;
        const ID = req.session.id;

        console.log('[SOCKET] User Connected', ID);

        // Getting current connected users
        ws.emit('enjaz:updating', { type: "connected_users", connected_users: game.getNumberOfPlayers() });

        // is user already joined?
        if(game.isPlayerJoined(ID)) {
            ws.join('contestant'); // Set client websocket as contestant
            ws.emit('enjaz:joined', { game_state: game.getGameState() });
        }

        // New contestant
        ws.on('enjaz:new-contestant', function(data) {
            if(game.isPlayerJoined(ID)) return;
            ws.join('contestant'); // Set client websocket as contestant

            const NAME = data.name;
            const SID = data.sid;

            // Check if 
            if(!utils.validateInput("arabic", NAME) || !utils.validateInput("numbers", SID) || SID.length != 9) {
                console.log("[Socket-Validator] Disconnected client with bad input(s)", ws.id);
                return ws.disconnect(true);
            } 

            // Save websocket session
            console.log(game.isPlayerJoined(ID) ? "Non-First time" : "First time");

            // Callback to client
            ws.emit('enjaz:joined', { game_state: game.getGameState(), first_time: true });

            // Websocket broadcast
            websocket.emit('enjaz:updating', { type: "connected_users", connected_users: game.playerJoined(ID, { displayedName: utils.randomStr(8), name: NAME, sId: SID }) });

            console.log("Added contestant")
        });

        // Websocket disconnected
        /*ws.on('disconnect', function() {
            if(!game.isPlayerJoined(ID)) return;
            
            console.log("Disconnected information", game.isPlayerJoined(ID));
            websocket.emit('enjaz:updating', { type: "connected_users", connected_users: game.playerLeft(ID) });
            console.log("[SOCKET] User Disconnected", ID);
        });*/
    });


    return websocket
}

export function getInstance() {
    return websocket;
}