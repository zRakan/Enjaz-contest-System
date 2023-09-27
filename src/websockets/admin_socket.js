import * as game from '../game.js';
import * as utils from '../utils.js';


let adminNamespace;

export default function(io) {
    console.log("admin socket init");

    adminNamespace = io.of('/requestContestants');
    
    // Prevent connections without the right API key
    adminNamespace.use(function(ws, next) {
        const api = ws.handshake.auth.api;
        if(!api || api != process.env.API_KEY) return;

        next(); // Accept connection
    });

    adminNamespace.on('connection', function(ws) {
        const req = ws.request;
        const ID = req.session.id;

        console.log("[ADMIN-SOCKET] Connected", ID);

        // Sending all non-accepted users
        ws.emit('enjaz:contestant:new', { players: game.getNonAcceptedPlayers() });
    });
}


export function getNamespace() {
    return adminNamespace;
}