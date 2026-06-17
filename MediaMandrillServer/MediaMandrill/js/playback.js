/**
 * js/playback.js
 * Ce fichier gère les actions de lecture (lancer un album, une chanson, une playlist)
 */

// log('[playback.js][function] var', var);

import { domElements, getDom } from './domElements.js';
const dom = new Proxy(domElements, { get(target, prop) {return target[prop]?.();} });

import { log } from './utils.js';



/**
 * Lance la lecture d'une liste de chansons.
 * @param {Array<number>} songIds - Un tableau d'IDs de chansons à lire.
 * @param {Array<string>} filePaths - Un tableau de chemins de fichiers à lire (utilisé si songIds est vide).
 */
export async function playSongs(songIds = []) {
	if (songIds?.length > 0) {
		const params = { withClear: true,	startPlayback: true, }
		
		await fetch('/player/addtracks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( { songIds: songIds, params: params,} )
		});
	}
}


// Insère plusieurs pistes dans la playlist en cours
export async function insertSongs(songIds = [], position = 'after') {
	if (songIds?.length > 0) {
		const params = {};
		if (position == 'after') { params.afterCurrent = true; }
		
		await fetch('/player/addtracks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( { songIds: songIds, params: params,} )
		});
	}
}


/**
 * change le titre en lecture dans la liste de lecture en cours
 * @param index: index dans la liste de lecture en cours
 */
export async function playSongInCurrentPlaylist(index) {
	await fetch('/player/goto', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ position: index })
	});
	setTimeout(() => {
		fetch('/player/play', { method: 'POST' });
	}, 100); // 100ms d'attente
}

