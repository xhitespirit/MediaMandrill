/**
 * init.js
 * démarrage de MediaMandrill
 */


// console.log('[init.js][function] var', var);


'use strict';


// Charger les modules locaux
localRequirejs('mmbridge_utils');
localRequirejs('mmbridge_events');
localRequirejs('mmbridge_ws');
localRequirejs('mmbridge_player');
localRequirejs('mmbridge_library');



window.whenReady(init);



async function init() {
	console.log('MediaMandrill add-on start');
	
	const MMFolder = app.filesystem.getScriptsPath() + 'MediaMandrill\\';
	const nodePath = MMFolder + 'Server\\node\\node.exe';

	console.log('MediaMandrill server start');
	app.utils.shellExecute(nodePath, '"' + MMFolder + 'Server\\server.js"');

	connectWS();
	handleMMEvents();
}

