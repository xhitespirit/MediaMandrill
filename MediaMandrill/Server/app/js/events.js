/**
 * js/events.js
 * Ce fichier contient les fonctions de prise en charge des évenements de type clicks
 */

// log('[events.js][function] var', var);

import { domElements } from './domElements.js';
const dom = new Proxy(domElements, { get(target, prop) {return target[prop]?.();} });

import { fetchArtistTracks, fetchAlbumTracks, fetchGenre, fetchPlaylist } from './dataFetching.js'; 
import { playSongs, insertSongs, playSongInCurrentPlaylist } from './playback.js';

import { updateHash, showView, goBack, goParent } from './router.js';
import { log, debounce, normalizeArticleForSort } from './utils.js';
import { songProperties } from './songProperties.js';

import { activeContainer } from './router.js';

import { playerFullscreen } from './player.js';



export function initEvents() {
	initGlobalClicks();
	initGlobalKeydown();
}


// clicks --------------------------------------------------------------------------
async function initGlobalClicks() {
	
	// Gestionnaire central des clics
	document.body.addEventListener('click', async (event) => {
		
		// navigation
		if (await clickNavLink(event)) return;
		if (await clickGoBack(event)) return;
		if (await clickGoUp(event)) return;
		if (await clickGoParent(event)) return;
		
		if (await clickNavSearch(event)) return;
		
		if (await clickCardArtist(event)) return;
		if (await clickCardAlbum(event)) return;
		if (await clickCardGenre(event)) return;
		if (await clickCardPlaylist(event)) return;
		
		if (await clickLinkArtist(event)) return;
		if (await clickLinkAlbum(event)) return;
		if (await clickLinkGenre(event)) return;
		
		// lecture
		if (await clickButtonPlayAll(event)) return;
		if (await clickButtonPlaySong(event)) return;
		
		// edition
		if (await clickSongTitle(event)) return;
		
		// now playing		
		if (await clickButtonPlaySongNp(event)) return;
		
		// player
		if (await clickPlayerAlbumArt(event)) return;
		if (await clickPlayerFullscreen(event)) return;
	});
}


// navigation --------------------------------------------------------------------------
function clickNavLink (event) {
	const target = event.target.closest('.nav-link');
	if (target) {
		event.preventDefault();
		if (target.id === 'navWelcome')			{ showView('welcome') }
		else if (target.id === 'navArtists')	{ showView('artists') }
		else if (target.id === 'navAlbums')		{ showView('albums') }
		else if (target.id === 'navGenres')		{ showView('genres') }
		else if (target.id === 'navPlaylists')	{ showView('playlists') }
		else if (target.id === 'navDynList')	{ showView('dynlist') }
		else if (target.id === 'navNowPlaying')	{ showView('nowplaying') }
		
		else if (target.id === 'artistsTypeBtnAuthors')	{ showView('authors') }
		else if (target.id === 'authorsTypeBtnArtists')	{ showView('artists') }
		
		return true;
	}
	return false;
}


function clickNavSearch(event) {
	const target = event.target.closest('.button-nav-search');
	if (target) {
		event.preventDefault();
		updateHash('#/search');
		return true;
	}
	return false;
}


// cards & list-items
function clickCardArtist(event) {
	const target = event.target.closest('.card[data-artistid], .list-item[data-artistid]');
	const context = event.target.closest('.handleclick-artists') || event.target.closest('.handleclick-authors');;
	if (target && context) {
		event.preventDefault();
		const artistId = parseInt(target.dataset.artistid);
		if (!isNaN(artistId)) {	updateHash(`#/artist/${artistId}`);	}
		return true;
	}
	return false;
}

function clickCardAlbum(event) {
	const target = event.target.closest('.card[data-albumid], .list-item[data-albumid]');
	const context = event.target.closest('.handleclick-albums');
	if (target && context) {
		event.preventDefault();
		const albumId = parseInt(target.dataset.albumid);
		if (!isNaN(albumId)) { updateHash(`#/album/${albumId}`); }
		return true;
	}
	return false;
}

function clickCardGenre(event) {
	const target = event.target.closest('.card[data-genreid], .list-item[data-genreid]');
	const context = event.target.closest('.handleclick-genres');
	if (target && context) {
		event.preventDefault();
		const genreId = parseInt(target.dataset.genreid);
		if (!isNaN(genreId)) { updateHash(`#/genre/${genreId}`); }
		return true;
	}
	return false;
}

function clickCardPlaylist(event) {
	const target = event.target.closest('.card[data-playlistid], .list-item[data-playlistid]');
	const context = event.target.closest('.handleclick-playlists');
	if (target && context) {
		event.preventDefault();
		const playlistId = parseInt(target.dataset.playlistid);
		if (!isNaN(playlistId)) { updateHash(`#/playlist/${playlistId}`); }
		return true;
	}
	return false;
}


// Links
function clickLinkArtist(event) {
	const target = event.target.closest('.artist-link');
	if (target) {
		event.preventDefault();
		const artistId = parseInt(target.dataset.artistid);
		if (!isNaN(artistId)) { updateHash(`#/artist/${artistId}`); }
		return true;
	}
	return false;
}

function clickLinkAlbum(event) {
	const target = event.target.closest('.album-link');
	if (target) {
		event.preventDefault();
		const albumId = parseInt(target.dataset.albumid);
		if (!isNaN(albumId)) { updateHash(`#/album/${albumId}`); }
		return true;
	}
	return false;
}

function clickLinkGenre(event) {
	const target = event.target.closest('.genre-link');
	if (target) {
		event.preventDefault();
		const genreId = parseInt(target.dataset.genreid);
		const genreName = target.textContent;
		if (!isNaN(genreId)) { updateHash(`#/genre/${genreId}`); }
		return true;
	}
	return false;
}


// boutons
function clickGoBack(event) {
	const target = event.target.closest('.button-back');
	if (target) {
		event.preventDefault();
		goBack();
		return true;
	}
	return false;
}

function clickGoUp(event) {
	const target = event.target.closest('.button-up');
	if (target) {
		event.preventDefault();
		dom.mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
		return true;
	}
	return false;	
}

function clickGoParent(event) {
	const target = event.target.closest('.button-parent');
	if (target) {
		event.preventDefault();
		goParent();
		return true;
	}
	return false;	
}


// lecture --------------------------------------------------------------------------
async function clickButtonPlayAll(event) {
	
	const target = event.target.closest('.button-play-all');	
	if (!target) return false;
	
	event.preventDefault();
	
	// songs
	if (target.classList.contains('songs')) {
		const songIds = target.dataset.songsids?.split(',').map(id => parseInt(id, 10));
		if (songIds?.length > 0) {
			if (target.classList.contains('play'))				{ playSongs(songIds); }
			else if (target.classList.contains('add-next'))		{ insertSongs(songIds, 'after'); }
			else if (target.classList.contains('add-end'))		{ insertSongs(songIds, 'end'); }
		}
	}
	
	// artiste
	if (target.classList.contains('artist')) {
		const artistId = parseInt(target.dataset.artistid);
		if (!isNaN(artistId)) {
			const songIds = (await fetchArtistTracks(artistId)).map(song => song.songId);
			if (target.classList.contains('play'))				{ playSongs(songIds); }
			else if (target.classList.contains('add-next'))		{ insertSongs(songIds, 'after'); }
			else if (target.classList.contains('add-end'))		{ insertSongs(songIds, 'end'); }
		}
	}

	// album
	if (target.classList.contains('album')) {
		const albumId = parseInt(target.dataset.albumid);
		if (!isNaN(albumId)) {
			const songIds = (await fetchAlbumTracks(albumId)).map(song => song.songId);
			if (target.classList.contains('play'))				{ playSongs(songIds); }
			else if (target.classList.contains('add-next'))		{ insertSongs(songIds, 'after'); }
			else if (target.classList.contains('add-end'))		{ insertSongs(songIds, 'end'); }
		}
	}
	
	// genre
	if (target.classList.contains('genre')) {
		const genreId = parseInt(target.dataset.genreid);
		if (!isNaN(genreId)) {
			const songIds = (await fetchGenre(genreId)).tracks.map(song => song.songId);
			if (target.classList.contains('play'))				{ playSongs(songIds); }
			else if (target.classList.contains('add-next'))		{ insertSongs(songIds, 'after'); }
			else if (target.classList.contains('add-end'))		{ insertSongs(songIds, 'end'); }
		}
	}
	
	// playlist
	if (target.classList.contains('playlist')) {
		const playlistId = parseInt(target.dataset.playlistid);
		if (!isNaN(playlistId)) {
			const songIds = (await fetchPlaylist(playlistId)).tracks.map(song => song.songId);
			if (target.classList.contains('play'))				{ playSongs(songIds); }
			else if (target.classList.contains('add-next'))		{ insertSongs(songIds, 'after'); }
			else if (target.classList.contains('add-end'))		{ insertSongs(songIds, 'end'); }
		}
	}
	
	return true;
}


// boutons lecture titres unitaires
async function clickButtonPlaySong(event) {
	
	const target = event.target.closest('.button-play-song');
	if (!target) return false;

	event.preventDefault();
	
	const songRow = target.closest('.song-row');
	const songId = parseInt(songRow?.dataset.songid, 10);
	if (!isNaN(songId)) {
		if (target.classList.contains('play'))				{ playSongs([songId]); }
		else if (target.classList.contains('add-next'))		{ insertSongs([songId], 'after'); }
		else if (target.classList.contains('add-end'))		{ insertSongs([songId], 'end'); }
	}
	
	return true;
}


// now playing
async function clickButtonPlaySongNp(event) {
	const target = event.target.closest('.np-playlist-thumb-play-button');
	if (!target) return false;
	
	event.preventDefault();
	const index = parseInt(target.dataset.index, 10);
	await playSongInCurrentPlaylist(index);
	
	return true;
}


// boutons edition titres
async function clickSongTitle(event) {
	const target = event.target.closest('.song-title, .np-song-title, .click-song-title');
	if (!target) return false;
	
	event.stopPropagation();
	event.preventDefault();
	
	const targetSongId = event.target.closest('[data-songid]');
	const songId = parseInt(targetSongId?.dataset.songid, 10);
	
	if (!isNaN(songId) && songId > 0) {
		songProperties(songId);
	} else {
		console.warn('[clickSongTitle] Unable to edit: songId is missing');
	}
	return true;
}


// player --------------------------------------------------------------------------
function clickPlayerAlbumArt (event) {
	const target = event.target.closest('.player-info');
	if (!target) return false;
		
	const currentHash = location.hash;
	if (currentHash === '#/nowplaying') {
		event.preventDefault();
		goBack();
	}
	else {
		event.preventDefault();
		updateHash('#/nowplaying')
	}
	return true;
}

function clickPlayerFullscreen(event) {
	const target = event.target.closest('.button-fullscreen');
	if (target) {
		event.preventDefault();
		playerFullscreen();
		return true;
	}
	return false;	
}


// keyscroll --------------------------------------------------------------------------
function initGlobalKeydown() {
	let keydownBuffer = '';
	
	const keyscrollSearch = debounce((pattern) => {
		// scroll sur .card-title
		keyscrollCardTitle(pattern);
		keydownBuffer = '';
	}, 500);

	document.body.addEventListener('keydown', (event) => {
		const key = keydownHandleKeys(event);
			if (!key) {
				keydownBuffer = '';
				return;
			}
			keydownBuffer += key;
			event.preventDefault();
			keyscrollSearch(keydownBuffer);
		});
}


function keydownHandleKeys(event) {
	const container = dom[activeContainer.id];
	if (event.ctrlKey || event.altKey || event.metaKey) return null;
	if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return null;

	const ignoredKeys = ['Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete', 'Tab'];
	if (ignoredKeys.includes(event.key)) return null;
	if (event.key.length !== 1) return null;

	return event.key.toUpperCase();
}


function keyscrollCardTitle(pattern) {
	const container = dom[activeContainer.id];
	if (!container?.classList.contains('keyscroll')) return false;

	const cards = container.querySelectorAll('.card-title');
	const target = [...cards].find(card => titleMatches(card.textContent, pattern));
	
	if (!target) return false;

	// scroll à target
	target.scrollIntoView({ behavior: 'smooth', block: 'center' });
	
	// trouver la card parente
	const parentCard = target.closest('.card') || target.parentElement;
	if (!parentCard) return false;

	// animation highlight
	parentCard.classList.remove('keyscroll-highlight');
	void parentCard.offsetWidth;
	parentCard.classList.add('keyscroll-highlight');
	setTimeout(() => { parentCard.classList.remove('keyscroll-highlight'); }, 4000);
	
	return true;

	function titleMatches(text, pattern) {
		const titleText = (text || '').trim();
		const normalizedTitle = normalizeArticleForSort(titleText);
		const normalizedPattern = normalizeArticleForSort(pattern);
		const rawPattern = (pattern || '').trim().toUpperCase();

		if (!rawPattern) return false;

		return (
			normalizedTitle.startsWith(normalizedPattern) ||
			titleText.toUpperCase().startsWith(rawPattern)
		);
	}
}