import * as game from '../game.js';
import * as utils from '../utils.js';

let gameNamespace;
export default async function(io) {
    console.log("Game socket init");

    gameNamespace = io.of('/gameplay');

    gameNamespace.on('connection', function(ws) {
        const req = ws.request;
        const ID = req.session.id;

        console.log('[SOCKET] User Connected', ID);

        // Getting current connected users
        ws.emit('enjaz:updating', { type: "connected_users", connected_users: game.getNumberOfPlayers() });

        // is user already joined/waiting?
        if(game.getPlayerId(ID)) {
            // Update player socker
            game.updatePlayerSocket(ID, ws);

            if(game.isPlayerJoined(ID)) {
                let joinPayload = { game_state: game.getGameState() };

                if(game.getGameState() == 'starting') // If game is starting, getting the starting timer
                    joinPayload['current_timer'] = game.getGameTimer();

                ws.join('contestant'); // Set client websocket as contestant
                ws.emit('enjaz:joined', joinPayload);

                if(game.getGameState() == 'started') game.constructPlayerQuestion(ID);
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
            const SID = data.sid;

            // Check if 
            if(!utils.validateInput("arabic", NAME) || !utils.validateInput("numbers", SID) || SID.length != 9) {
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
                sId: SID,

                questions: {},
                answers: {},

                points: 0
            });

            console.log("Added contestant")
        });

        // New answer
        ws.on('enjaz:answer', function(data, callback) {
            if(!game.isPlayerJoined(ID)) return;
            if(!data.id || !data.answer) {
                console.log("[Socket-Validator] Disconnected client with bad input(s)", ws.id);
                return ws.disconnect(true);
            };

            console.log("Answered");
            callback({
                good: game.playerAnswer(ID, { id: data.id, answer: data.answer })
            });
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