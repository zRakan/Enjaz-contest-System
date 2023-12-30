import * as game from '../game.js';
import * as utils from '../utils.js';

let gameNamespace;
export default async function(io) {
    console.log("Game socket init");

    gameNamespace = io.of('/gameplay');

    gameNamespace.on('connection', function(ws) {
        const req = ws.request;
        const ID = req.session.id;

        console.log('[GAME-SOCKET] User Connected', ID);

        // Getting current connected users
        ws.emit('enjaz:updating', { type: "connected_users", connected_users: game.getNumberOfPlayers() });

        // is user already joined/waiting?
        if(game.getPlayerId(ID)) {
            // Update player socker
            game.updatePlayerSocket(ID, ws);

            if(game.isPlayerJoined(ID)) {
                let joinPayload = { game_state: game.getGameState(), bell_state: game.isPlayerBellAvailable(ID) };

                if(game.getGameState() == 'starting') // If game is starting, getting the starting timer
                    joinPayload['current_timer'] = game.getGameTimer();

                ws.join('contestant'); // Set client websocket as contestant
                ws.emit('enjaz:joined', joinPayload);
            } else {
                ws.emit('enjaz:waiting');
            }
        } else {
            if(game.getGameState() == 'waiting')
                ws.emit('enjaz:updating', { type: 'game_state', current_state: 'not-started' });
        }

        // New contestant
        ws.on('enjaz:new-contestant', function(data) {
            if(game.isPlayerJoined(ID) || game.getPlayerId(ID)) return;

            const NAME = data.name;

            // Check if 
            if(!utils.validateInput("arabic", NAME)) {
                console.log("[Socket-Validator] Disconnected client with bad input(s)", ws.id);
                return ws.disconnect(true);
            }
            
            // Callback to client
            //ws.emit('enjaz:joined', { game_state: game.getGameState(), first_time: true });


            /* Websocket broadcast
            gameNamespace.emit('enjaz:updating', { type: "connected_users",
                connected_users: game.playerJoined(ID, {
                    accept: false, // is player accepted to be compete or not
                    
                    session: ws,
                    id: utils.randomStr(16),
                    name: NAME,
                    sId: SID,

                    questions: {},
                    answers: {},

                    points: 0
                })
            });*/

            // Create player object
            game.playerJoined(ID, {
                accept: false, // is player accepted to be compete or not
                
                session: ws,
                id: utils.randomStr(16),
                name: NAME,

                points: 0,
                bell: false,
                pos: 0
            });

            console.log("Added contestant")
        });

        // Bell alert
        ws.on('enjaz:bell', function(cb) {
            if(!game.isPlayerJoined(ID) || !game.isPlayerBellAvailable(ID)) return;

            game.setPlayerBell(ID, true); // Indicate the player pressed the bell

            cb({ bell: game.isPlayerBellAvailable(ID) });
        });

        // Websocket disconnected
        /*ws.on('disconnect', function() {
            if(!game.isPlayerJoined(ID)) return;
            
            console.log("Disconnected information", game.isPlayerJoined(ID));
            gameNamespace.emit('enjaz:updating', { type: "connected_users", connected_users: game.playerLeft(ID) });
            console.log("[SOCKET] User Disconnected", ID);
        });*/
    });
};

export function getNamespace() {
    return gameNamespace;
}