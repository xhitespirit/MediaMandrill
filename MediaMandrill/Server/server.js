// console.log('[server.js][function] var', var);

import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import http from 'http';
import https from 'https';
import WebSocket, { WebSocketServer } from 'ws';
import fs from 'fs';

import os from 'os';
import { portHttp, portHttps, portWs, portWss, sslKey, sslCert, mandrillPath } from './config.js';



// ---------------------------
// initialisation
// ---------------------------

console.log('[Server] Starting MediaMandrill Server...');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let httpsOptions = null;
let sslEnabled = false;
const sslKeyPath = path.join(__dirname, sslKey);
const sslCertPath = path.join(__dirname, sslCert);
let mmSocket = null;
const pending = new Map(); // requestId → { res, timeout, event }
const sseClients = new Set(); // Set de res Express
const app = express();
let playerStateDebounce = null;


// recherche si présence de certificats
if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
	try {
		httpsOptions = {
			key: fs.readFileSync(sslKeyPath),
			cert: fs.readFileSync(sslCertPath)
		};
		sslEnabled = true;
		console.log('[Server] SSL Certificates found —> SSL enabled');
	} catch (e) {
		console.warn('[Server] Error while reading SSL Certificates:', e.message);
		httpsOptions = null;
		sslEnabled = false;
	}
} else {
	console.log('[Server] No SSL Certificate available —> SSL disabled');
}


app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, mandrillPath)));
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, mandrillPath, 'index.html'));
});


// ---------------------------
// déclaration des serveurs
// ---------------------------
const restServer = http.createServer(app);
const wsServer = http.createServer();
const serverHostname = os.hostname();
let restServerSSL = null;
let wsServerSSL = null;
if (sslEnabled && httpsOptions) {
	restServerSSL = https.createServer(httpsOptions, app);
	wsServerSSL = https.createServer(httpsOptions);
}
const wss = new WebSocketServer({ noServer: true });


// ---------------------------
// lancement écoutes
// ---------------------------
handleWebSocket();
handleRoutes();

restServer.listen(portHttp, '0.0.0.0', () => 							{ console.log(`[Server] REST API:		http://${serverHostname}:${portHttp}/`); } );
if (restServerSSL) {restServerSSL.listen(portHttps, '0.0.0.0', () =>	{ console.log(`[Server] REST API (SSL):	https://${serverHostname}:${portHttps}/`); } );
}

wsServer.listen(portWs, '0.0.0.0', () =>								{console.log(`[Server] WebSocket:		ws://${serverHostname}:${portWs}/`); });
if (wsServerSSL) {wsServerSSL.listen(portWss, '0.0.0.0', () =>			{console.log(`[Server] WebSocket (SSL):	wss://${serverHostname}:${portWss}/`) });
}


// ---------------------------
// traitement WebSocket
// ---------------------------
function handleWebSocket () {

	wsServer.on('upgrade', (req, socket, head) => {
		if (req.url === '/ws') {
			wss.handleUpgrade(req, socket, head, (ws) => {
				wss.emit('connection', ws, req);
			});
		} else {
			socket.destroy();
		}
	});
	
	if (wsServerSSL) {
		wsServerSSL.on('upgrade', (req, socket, head) => {
			if (req.url === '/ws') {
				wss.handleUpgrade(req, socket, head, (ws) => {
					wss.emit('connection', ws, req);
				});
			} else {
				socket.destroy();
			}
		});
	}

	wss.on('connection', (ws) => { // ws: représente la connexion spécifique MM. Utilisé pour écoute et envoie des message
		console.log('[Server] MediaMonkey connected via WebSocket');
		mmSocket = ws; // référence globale a ws pour réutilisation ( notamment sendWS() )

		ws.on('message', (msg) => {
			try {
				const data = JSON.parse(msg.toString());

				// ── Réponse à une requête en attente (a un requestId) ──
				if (data.requestId && pending.has(data.requestId)) {
					const { res, timeout, event, ts } = pending.get(data.requestId);
					const elapsed = Date.now() - ts;
					
					if (elapsed < 1000)	{ console.log(`[Server] Response     <--- MM:`, `\x1b[32m${data.requestId}: ${data.event} \x1b[32m (${elapsed}ms)\x1b[0m`); }
					else 				{ console.log(`[Server] Response     <--- MM:`, `\x1b[32m${data.requestId}: ${data.event} \x1b[33m (${elapsed}ms)\x1b[0m`); }
					
					if (data.event !== event) return;
					clearTimeout(timeout);
					pending.delete(data.requestId);
					return handlePendingResponse(data, res);
				}
				
				// ── Notification spontanée de MM (pas de requestId) ──
				else {
					console.log(`[Server] Notification <--- MM:`, `\x1b[36m${data.event}\x1b[0m`);
					handleMMNotification(data);
				}

			} catch (e) {
				console.warn('[Server] Non-JSON Message received:', msg.toString());
			}
		});

		ws.on('close', () => {
			console.log('[Server] MediaMonkey disconnected');
			mmSocket = null;
			pending.forEach(({ res, timeout }) => {
				clearTimeout(timeout);
				res.status(503).json({ error: 'MediaMonkey disconnected' });
			});
			pending.clear();
		});

		ws.on('error', (err) => {
			console.error('[Server] Error WebSocket MM:', err.message);
		});
	});
}


// ---------------------------
// diffusion d'événement SSE à tous les clients connectés
// ---------------------------
function broadcastSSE(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(client => {
        try {
            client.write(payload);
        } catch (e) {
            sseClients.delete(client);
        }
    });
}


// ---------------------------
// traitement des notification reçues de MediaMonkey
// ---------------------------
function handleMMNotification(data) {
    switch (data.event) {
        case 'playerTrack':
            broadcastSSE('playerTrack', data.track);
            break;
        case 'playerState':
            clearTimeout(playerStateDebounce);
            playerStateDebounce = setTimeout(() => {
                broadcastSSE('playerState', { state: data.state });
            }, 100);
            break;
        // case 'playerPlaylistChanged':
            // broadcastSSE('playerPlaylistChanged', {});
            // break;
        case 'playerPlaylist':
            broadcastSSE('playerPlaylist', { playlist: data.playlist });
            break;
        case 'playerShuffleChange':
            broadcastSSE('playerShuffleChange', { state: data.state });
            break;
        case 'playerShuffleState':
            broadcastSSE('playerShuffleState', { state: data.state });
            break;
        case 'playerSeekChange':
            broadcastSSE('playerSeekChange', { positionMs: data.positionMs });
            break;
        case 'playerPosition':
            broadcastSSE('playerPosition', { positionMs: data.positionMs });
            break;
		case 'playerVolume':
			broadcastSSE('playerVolume', { volume: data.volume });
			break;
        default:
            console.log(`[handleMMNotification]`, `\x1b[33mNotification MM unmanaged\x1b[0m`, `\x1b[33m${data.event}\x1b[0m`);
	}
}


// ---------------------------
// traitement des réponses
// ---------------------------
function handlePendingResponse(data, res) {
	
	// ── Réponses result (items & listes) ──
	const listEvents = [
		'mmInfo',
		'libraryStats',
		'libraryHash',
		'libraryTracks',
		'libraryAlbums',
		'libraryArtists',
		'libraryAlbumArtists',
		'libraryAuthors',
		'libraryGenres',
		'libraryMoods',
		'libraryPlaylists',
		'libraryTrack',
		'libraryAlbum',
		'libraryAlbumTracks',
		'libraryAlbumGenres',
		'libraryArtist',
		'libraryArtistTracks',
		'libraryArtistGenres',
		'libraryArtistAlbums',
		'libraryArtistId',
		'libraryAlbumArtistTracks',
		'libraryAlbumArtistAlbums',
		'libraryGenre',
		'libraryGenreId',
		'libraryGenreArtists',
		'libraryGenreAlbums',
		'libraryMoodTracks',
		'libraryPlaylist'
	];
	if (listEvents.includes(data.event)) {
		return res.json(data.result);
	}
	
	
	// ── Réponses library track thumbnail ──
	if (data.event === 'libraryTrackThumbnail') {
		if (!data.path) {
			return res.sendFile(path.join(__dirname, mandrillPath, 'resources/images/fallback_song.png'));
		}
		const filePath = decodeURIComponent( data.path.replace('file:///', '').replace(/\//g, '\\')	);
		return res.sendFile(filePath, (err) => {
			if (err) res.status(404).json({ error: 'Thumbnail not found' });
		});
	}
	
	// ── Réponses library album thumbnails ──
	if (data.event === 'libraryAlbumThumbnail') {
		if (!data.path) {
			return res.sendFile(path.join(__dirname, mandrillPath, 'resources/images/fallback_album.png'));
		}
		const filePath = decodeURIComponent( data.path.replace('file:///', '').replace(/\//g, '\\')	);
		return res.sendFile(filePath, (err) => {
			if (err) res.status(404).json({ error: 'Thumbnail not found' });
		});
	}
	
	// ── Réponses library artists thumbnails ──
	if (data.event === 'libraryArtistThumbnail') {
		if (!data.path) {
			return res.sendFile(path.join(__dirname, mandrillPath, 'resources/images/fallback_artists.png'));
		}
		const filePath = decodeURIComponent( data.path.replace('file:///', '').replace(/\//g, '\\')	);
		return res.sendFile(filePath, (err) => {
			if (err) res.status(404).json({ error: 'Thumbnail not found' });
		});
	}

	// ── Réponses player state ──
	if (data.event === 'playerState') {
		return res.json(data.state);
	}
	
	// ── Réponses player position ──
	if (data.event === 'playerPosition') {
		return res.json(data.positionMs);
	}

	// ── Réponses player playlist ──
	if (data.event === 'playerPlaylist') {
		return res.json(data.playlist);
	}
	
	// ── Réponses player shuffle ──
	if (data.event === 'playerShuffleState') {
		return res.json(data.state);
	}
	
	// ── Réponses player outputs ──
	if (data.event === 'playerGetOutputs') {
		return res.json(data.outputs);
	}

	// ── Réponses addtrack ──
	if (data.event === 'playerAddTracks') {
		return res.json({ ok: data.ok, error: data.error ?? null });
	}
	
	// ── Réponses playerTrack ──
	if (data.event === 'playerTrack') {
		return res.json(data.track);
	}
	
	// ── Réponses playerVolume ──
	if (data.event === 'playerVolume') {
		return res.json(data.volume);
	}
	
	// ── Fallback ──
	console.warn('[Server] handlePendingResponse: Event unmanaged:', data.event);
	res.status(500).json({ error: `Event unmanaged: ${data.event}` });
};


// ---------------------------
// helpers
// ---------------------------
function generateRequestId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


function sendWS(obj) {
	obj.requestId
		? console.log(`[Server] Request      ---> MM:`, `\x1b[32m${obj.requestId}: ${obj.action}\x1b[0m`)
		: console.log(`[Server] Request      ---> MM:`, `\x1b[35mfire: ${obj.action}\x1b[0m`);
	
    if (mmSocket && mmSocket.readyState === WebSocket.OPEN) {
        mmSocket.send(JSON.stringify(obj));
        return true;
    }
    return false;
}


function mmConnected(res) {
    if (!mmSocket || mmSocket.readyState !== WebSocket.OPEN) {
        res.status(503).json({ error: 'MediaMonkey not connected' });
        return false;
    }
    return true;
}


// Crée une requête en attente de réponse MM avec un requestId unique
// res      : objet réponse Express
// action   : commande à envoyer à MM
// event    : nom de l'événement attendu en retour
// payload  : données supplémentaires à envoyer avec la commande
// timeoutMs: délai avant timeout
function pendingRequest(res, action, event, payload = {}, timeoutMs = 5000) {
    const requestId = generateRequestId();

    const timeout = setTimeout(() => {
        pending.delete(requestId);
		res.status(504).json({ error: 'Timeout: no answer from MediaMonkey' });		
		console.log(`[Server] Request      ---- MM:`, `\x1b[31m${requestId}: ${action} / Timeout: ${timeoutMs}ms\x1b[0m`);
    }, timeoutMs);

	pending.set(requestId, { res, timeout, event, ts: Date.now() });
    sendWS({ action, requestId, ...payload });

    return requestId;
}


// ---------------------------
// routes REST
// ---------------------------
function handleRoutes() {
	handleRoutesPlayer();
	handleRoutesLibrary();
	handleRoutesSSE();
	handleRoutesMisc();
}


// ---------------------------
// routes player
// ---------------------------
function handleRoutesPlayer() {

	app.post('/player/play', (req, res) => {
		if (!mmConnected(res)) return;
		sendWS({ action: 'playerPlay' });
		res.json({ ok: true });
	});

	app.post('/player/pause', (req, res) => {
		if (!mmConnected(res)) return;
		sendWS({ action: 'playerPause' });
		res.json({ ok: true });
	});

	app.post('/player/toggle', (req, res) => {
		if (!mmConnected(res)) return;
		sendWS({ action: 'playerToggle' });
		res.json({ ok: true });
	});

	app.post('/player/stop', (req, res) => {
		if (!mmConnected(res)) return;
		sendWS({ action: 'playerStop' });
		res.json({ ok: true });
	});

	app.post('/player/next', (req, res) => {
		if (!mmConnected(res)) return;
		sendWS({ action: 'playerNext' });
		res.json({ ok: true });
	});

	app.post('/player/previous', (req, res) => {
		if (!mmConnected(res)) return;
		sendWS({ action: 'playerPrevious' });
		res.json({ ok: true });
	});
	
	app.post('/player/goto', (req, res) => {
		if (!mmConnected(res)) return;
		const { position } = req.body;
		if (typeof position !== 'number') {
			return res.status(400).json({ error: 'position needed (number)' });
		}
		sendWS({ action: 'playerGoTo', position });
		res.json({ ok: true });
	});

	app.post('/player/seek', (req, res) => {
		if (!mmConnected(res)) return;
		const { positionMs } = req.body;
		if (typeof positionMs !== 'number') {
			return res.status(400).json({ error: 'positionMs needed (number)' });
		}
		sendWS({ action: 'playerSeek', positionMs });
		res.json({ ok: true });
	});

	app.post('/player/shuffle/on', (req, res) => {
		if (!mmConnected(res)) return;
		sendWS({ action: 'playerShuffle', setState: 'on' });
		res.json({ ok: true });
	});

	app.post('/player/shuffle/off', (req, res) => {
		if (!mmConnected(res)) return;
		sendWS({ action: 'playerShuffle', setState: 'off' });
		res.json({ ok: true });
	});

	app.post('/player/shuffle/toggle', (req, res) => {
		if (!mmConnected(res)) return;
		sendWS({ action: 'playerShuffle', setState: 'toggle' });
		res.json({ ok: true });
	});
	
	app.get('/player/shuffle/state', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'playerShuffleState', 'playerShuffleState');
	});
	
	app.get('/player/state', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'playerState', 'playerState', {}, 1000);
	});
	
	app.get('/player/position', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'playerPosition', 'playerPosition', {}, 100);
	});

	app.get('/player/volume', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'playerVolume', 'playerVolume' );
	});

	app.post('/player/volume/set', (req, res) => {
		if (!mmConnected(res)) return;
		const { volume } = req.body;
		if (typeof volume !== 'number' || volume < 0 || volume > 1) {
			return res.status(400).json({ error: 'volume needed (number between 0 et 1)' });
		}
		sendWS({ action: 'playerVolumeSet', volume });
		res.json({ ok: true });
	});

	app.get('/player/playlist', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'playerPlaylist', 'playerPlaylist');
	});
	
	app.get('/player/track', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'playerTrack', 'playerTrack');
	});
	
	app.post('/player/addtracks', (req, res) => {
		if (!mmConnected(res)) return;
		const { songIds, params } = req.body;
		if (!Array.isArray(songIds) || songIds.length === 0) {
			return res.status(400).json({ error: 'songIds needed (array)' });
		}
		pendingRequest(res, 'playerAddTracks', 'playerAddTracks', { songIds, params });
	});

	app.post('/player/clearplaylist', (req, res) => {
		if (!mmConnected(res)) return;
		sendWS({ action: 'playerClearPlaylist' });
		res.json({ ok: true });
	});
	
	app.get('/player/output/get', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'playerGetOutputs', 'playerGetOutputs', {}, 20000);
	});

	app.post('/player/output/set', (req, res) => {
		if (!mmConnected(res)) return;
		const { uuid } = req.body;
		sendWS({ action: 'playerSetOutput', uuid: uuid ?? '' });
		res.json({ ok: true });
	});	
}


// ---------------------------
// routes library
// ---------------------------
function handleRoutesLibrary() {

	app.get('/library/stats', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'libraryStats', 'libraryStats', {}, 1000);
	});
	
	app.get('/library/hash', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'libraryHash', 'libraryHash', {}, 10000);
	});

	app.get('/library/tracks', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'libraryTracks', 'libraryTracks', {}, 30000);
	});

	app.get('/library/albums', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'libraryAlbums', 'libraryAlbums', {}, 30000);
	});

	app.get('/library/artists', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'libraryArtists', 'libraryArtists', {}, 30000);
	});

	app.get('/library/albumartists', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'libraryAlbumArtists', 'libraryAlbumArtists', {}, 30000);
	});
	
	app.get('/library/authors', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'libraryAuthors', 'libraryAuthors', {}, 30000);
	});

	app.get('/library/genres', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'libraryGenres', 'libraryGenres', {}, 30000);
	});

	app.get('/library/moods', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'libraryMoods', 'libraryMoods', {}, 30000);
	});
	
	app.get('/library/playlists', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'libraryPlaylists', 'libraryPlaylists', {}, 30000);
	});
	
	app.get('/library/track/:songId', (req, res) => {
		if (!mmConnected(res)) return;
		const songId = parseInt(req.params.songId);
		if (isNaN(songId)) {
			return res.status(400).json({ error: 'songId invalid' });
		}
		pendingRequest(res, 'libraryTrack', 'libraryTrack', { songId });
	});

	app.post('/library/track/:songId/tag/set', (req, res) => {
		if (!mmConnected(res)) return;
		const songId = parseInt(req.params.songId);
		if (isNaN(songId)) {
			return res.status(400).json({ error: 'songId invalid' });
		}
		const { tagName } = req.body;
		const { tagValue } = req.body;
		sendWS({ action: 'libraryTrackTagSet', songId, tagName, tagValue });
		res.json({ ok: true });
	});
	
	app.get('/library/track/:songId/thumbnail', (req, res) => {
		if (!mmConnected(res)) return;
		const songId = parseInt(req.params.songId);
		if (isNaN(songId)) {
			return res.status(400).json({ error: 'songId invalid' });
		}
		pendingRequest(res, 'libraryTrackThumbnail', 'libraryTrackThumbnail', { songId });
	});
	
	app.get('/library/album/:albumId', (req, res) => {
		if (!mmConnected(res)) return;
		const albumId = parseInt(req.params.albumId);
		if (isNaN(albumId)) {
			return res.status(400).json({ error: 'albumId invalid' });
		}
		pendingRequest(res, 'libraryAlbum', 'libraryAlbum', { albumId });
	});
	
	app.get('/library/album/:albumId/tracks', (req, res) => {
		if (!mmConnected(res)) return;
		const albumId = parseInt(req.params.albumId);
		if (isNaN(albumId)) {
			return res.status(400).json({ error: 'albumId invalid' });
		}
		pendingRequest(res, 'libraryAlbumTracks', 'libraryAlbumTracks', { albumId });
	});
	
	app.get('/library/album/:albumId/genres', (req, res) => {
		if (!mmConnected(res)) return;
		const albumId = parseInt(req.params.albumId);
		if (isNaN(albumId)) {
			return res.status(400).json({ error: 'albumId invalid' });
		}
		pendingRequest(res, 'libraryAlbumGenres', 'libraryAlbumGenres', { albumId });
	});	

	app.get('/library/album/:albumId/thumbnail', (req, res) => {
		if (!mmConnected(res)) return;
		const albumId = parseInt(req.params.albumId);
		if (isNaN(albumId)) {
			return res.status(400).json({ error: 'albumId invalid' });
		}
		pendingRequest(res, 'libraryAlbumThumbnail', 'libraryAlbumThumbnail', { albumId });
	});
	
	app.get('/library/artist/:artistId', (req, res) => {
		if (!mmConnected(res)) return;
		const artistId = parseInt(req.params.artistId);
		if (isNaN(artistId)) {
			return res.status(400).json({ error: 'artistId invalid' });
		}
		pendingRequest(res, 'libraryArtist', 'libraryArtist', { artistId });
	});
	
	app.get('/library/artist/:artistId/tracks', (req, res) => {
		if (!mmConnected(res)) return;
		const artistId = parseInt(req.params.artistId);
		if (isNaN(artistId)) {
			return res.status(400).json({ error: 'artistId invalid' });
		}
		pendingRequest(res, 'libraryArtistTracks', 'libraryArtistTracks', { artistId });
	});
	
	app.get('/library/artist/:artistId/genres', (req, res) => {
		if (!mmConnected(res)) return;
		const artistId = parseInt(req.params.artistId);
		if (isNaN(artistId)) {
			return res.status(400).json({ error: 'artistId invalid' });
		}
		pendingRequest(res, 'libraryArtistGenres', 'libraryArtistGenres', { artistId });
	});

	app.get('/library/artist/:artistId/albums', (req, res) => {
		if (!mmConnected(res)) return;
		const artistId = parseInt(req.params.artistId);
		if (isNaN(artistId)) {
			return res.status(400).json({ error: 'artistId invalid' });
		}
		pendingRequest(res, 'libraryArtistAlbums', 'libraryArtistAlbums', { artistId });
	});
	
	app.get('/library/artist/:artistName/id', (req, res) => {
		// à appeler ainsi: fetch(`/library/artist/${encodeURIComponent('The Doors')}/id`)
		if (!mmConnected(res)) return;
		const artistName = decodeURIComponent(req.params.artistName);
		if (!artistName?.trim()) {
			return res.status(400).json({ error: 'artistName invalid' });
		}
		pendingRequest(res, 'libraryArtistId', 'libraryArtistId', { artistName });
	});
	
	app.get('/library/artist/:artistId/thumbnail', (req, res) => {
		if (!mmConnected(res)) return;
		const artistId = parseInt(req.params.artistId);
		if (isNaN(artistId)) {
			return res.status(400).json({ error: 'artistId invalid' });
		}
		pendingRequest(res, 'libraryArtistThumbnail', 'libraryArtistThumbnail', { artistId });
	});

	app.get('/library/albumartist/:artistId/tracks', (req, res) => {
		if (!mmConnected(res)) return;
		const artistId = parseInt(req.params.artistId);
		if (isNaN(artistId)) {
			return res.status(400).json({ error: 'artistId invalid' });
		}
		pendingRequest(res, 'libraryAlbumArtistTracks', 'libraryAlbumArtistTracks', { artistId });
	});

	app.get('/library/albumartist/:artistId/albums', (req, res) => {
		if (!mmConnected(res)) return;
		const artistId = parseInt(req.params.artistId);
		if (isNaN(artistId)) {
			return res.status(400).json({ error: 'artistId invalid' });
		}
		pendingRequest(res, 'libraryAlbumArtistAlbums', 'libraryAlbumArtistAlbums', { artistId });
	});
	
	app.get('/library/genre/:genreId', (req, res) => {
		if (!mmConnected(res)) return;
		const genreId = parseInt(req.params.genreId);
		if (isNaN(genreId)) {
			return res.status(400).json({ error: 'genreId invalid' });
		}
		pendingRequest(res, 'libraryGenre', 'libraryGenre', { genreId });
	});
	
	app.get('/library/genre/:genreName/id', (req, res) => {
		// à appeler ainsi: fetch(`/library/genre/${encodeURIComponent('Hard Rock')}/id`)
		if (!mmConnected(res)) return;
		const genreName = decodeURIComponent(req.params.genreName);
		if (!genreName?.trim()) {
			return res.status(400).json({ error: 'genreName invalid' });
		}
		pendingRequest(res, 'libraryGenreId', 'libraryGenreId', { genreName });
	});
	
	app.get('/library/genre/:genreId/artists', (req, res) => {
		if (!mmConnected(res)) return;
		const genreId = parseInt(req.params.genreId);
		if (isNaN(genreId)) {
			return res.status(400).json({ error: 'genreId invalid' });
		}
		pendingRequest(res, 'libraryGenreArtists', 'libraryGenreArtists', { genreId });
	});
	
	app.get('/library/genre/:genreId/albums', (req, res) => {
		if (!mmConnected(res)) return;
		const genreId = parseInt(req.params.genreId);
		if (isNaN(genreId)) {
			return res.status(400).json({ error: 'genreId invalid' });
		}
		pendingRequest(res, 'libraryGenreAlbums', 'libraryGenreAlbums', { genreId });
	});
	
	app.get('/library/mood/:moodName/tracks', (req, res) => {
		// à appeler ainsi: fetch(`/library/mood/${encodeURIComponent('Late Night')}/tracks`)
		if (!mmConnected(res)) return;
		const moodName = decodeURIComponent(req.params.moodName);
		if (!moodName?.trim()) {
			return res.status(400).json({ error: 'moodName invalid' });
		}
		pendingRequest(res, 'libraryMoodTracks', 'libraryMoodTracks', { moodName });
	});

	app.get('/library/playlist/:playlistId', (req, res) => {
		if (!mmConnected(res)) return;
		const playlistId = parseInt(req.params.playlistId);
		if (isNaN(playlistId)) {
			return res.status(400).json({ error: 'playlistId invalid' });
		}
		pendingRequest(res, 'libraryPlaylist', 'libraryPlaylist', { playlistId });
	});
}

// ---------------------------
// routes SSE (Server-Sent Event)
// ---------------------------
function handleRoutesSSE() {
	app.get('/events', (req, res) => {

		// Headers SSE obligatoires
		res.setHeader('Content-Type',  'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection',    'keep-alive');
		res.flushHeaders();

		// Enregistrer le client
		sseClients.add(res);
		console.log('[SSE] Client(s) connected:', sseClients.size);

		// À la connexion — envoyer l'état actuel si MM est connecté
		if (mmSocket?.readyState === WebSocket.OPEN) {
			sendWS({ action: 'playerPlaylist',		requestId: null });
			// délai nécessaire pour s'assurer que playerPlaylist soit diffusé et reçu avant playerState
			setTimeout(() => {
				sendWS({ action: 'playerTrack',			requestId: null });
				sendWS({ action: 'playerShuffleState',	requestId: null });
				sendWS({ action: 'playerPosition',		requestId: null });
				sendWS({ action: 'playerState',			requestId: null });
				sendWS({ action: 'playerVolume',		requestId: null });
			}, 100); // 100ms d'attente
		}

		// Heartbeat toutes les 30s pour maintenir la connexion
		const heartbeat = setInterval(() => {
			try {
				res.write(':heartbeat\n\n');
			} catch (e) {
				clearInterval(heartbeat);
			}
		}, 30000);

		// Déconnexion du client
		req.on('close', () => {
			clearInterval(heartbeat);
			sseClients.delete(res);
			console.log(`[SSE] Client disconnected (total: ${sseClients.size})`);
		});
	});
}

// ---------------------------
// routes divers
// ---------------------------
function handleRoutesMisc() {

	// status
	app.get('/status', (req, res) => {
		res.json({
			mmConnected: mmSocket?.readyState === WebSocket.OPEN,
			pendingCount: pending.size
		});
	});
	
	// node.js server info
	app.get('/server/info', (req, res) => {
		res.json({
			hostname: os.hostname(),
			platform: os.platform(),
			version: os.version()
		});
	});
	
	// MediaMandrill infos
	app.get('/info', (req, res) => {
		if (!mmConnected(res)) return;
		pendingRequest(res, 'mmInfo', 'mmInfo', {}, 1000);
	});	
}

