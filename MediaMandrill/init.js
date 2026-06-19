// console.log('[init.js][function] var', var);

'use strict';

// ─────────────────────────────────────────
// init.js — Point d'entrée MMBridge
// ─────────────────────────────────────────

// Charger les modules locaux EN PREMIER (avant tout requirejs)
localRequirejs('mmbridge_events');
localRequirejs('mmbridge_ws');
localRequirejs('mmbridge_player');
localRequirejs('mmbridge_library');



init();


function init() {
	console.log('MediaMandrill add-on start');
	
	const MMFolder = app.filesystem.getScriptsPath() + 'MediaMandrill\\';
	const nodePath = MMFolder + 'Server\\node\\node.exe';

	console.log('MediaMandrill server start');
	app.utils.shellExecute(nodePath, '"' + MMFolder + 'Server\\server.js"');

	connectWS();
	handleMMEvents();	
}

