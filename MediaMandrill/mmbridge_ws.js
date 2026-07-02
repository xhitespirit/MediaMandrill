/**
 * mmbridge_ws.js
 * webSocket et dispatch des commandes
 */

// console.log('[mmbridge_ws.js][function] var', var);

'use strict';



const WS_URL = 'ws://127.0.0.1:4081/ws';

let ws = null;


// ── Connexion WebSocket au serveur node.js MMBridgeServer ──
function connectWS() {
    try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('[connectWS] WebSocket connected to server:', WS_URL);
            playerState('tofetch');
            playerCurrentTrack();
            playerCurrentPlaylist();
            playerShuffleState();
            playerPosition();
            playerVolume();
        };

        ws.onclose = () => {
            console.log('[connectWS] WebSocket closed, reconnecting...');
            setTimeout(connectWS, 3000);
        };

        ws.onerror = (e) => {
            console.error('[connectWS] WebSocket error:', e);
        };

        ws.onmessage = (evt) => {
            try {
                const cmd = JSON.parse(evt.data);
                handleWSCommands(cmd);
            } catch (e) {
                console.error('[connectWS] Error parsing message:', e);
            }
        };

    } catch (e) {
        console.error('[connectWS] Websocket connection error:', e);
        setTimeout(connectWS, 3000);
    }
}


// ── Envoi sécurisé ──
function safeSend(obj) {
    console.log('[safeSend] event', obj.event);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(obj));
    }
}


