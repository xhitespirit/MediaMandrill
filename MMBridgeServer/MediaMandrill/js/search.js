/**
 * js/search.js
 * Ce fichier gère les fonctions de recherche
 */

// log('[search.js][function] var', var);

import { domElements, getDom } from './domElements.js';
const dom = new Proxy(domElements, { get(target, prop) {return target[prop]?.();} });

import { fetchArtists, fetchAuthors, fetchAlbums, fetchTracks } from './dataFetching.js';
import { updateHash, goBack } from './router.js';
import { cleanString, createForm, debounce, log } from './utils.js';
import { displaySection, renderPlayButtons } from './views.js';
import { icon } from './graphics.js';
import { tLng, tLngPl } from './i18n.js';


/**
 * initialise la recherche
 */
export async function initSearch() {
	
	// construction du formulaire
	const searchFormId = 'searchFormGeneral';
	const formParams = {
		containerId: 'searchHeader',
		searchInputId: searchFormId,
		searchFormLabel: tLng('search.search'),
		iconFn: () => icon('search', 24, 24, []),
	};
	await createForm(formParams);
	
	// traitement de l'input
	const searchInput = await getDom(searchFormId);
	const searchContentArtists = getDom('searchResultsArtists');
	const searchContentAlbums = getDom('searchResultsAlbums');
	const searchContentSongs = getDom('searchResultsSongs');

	// Affichage lors du focus ou saisie dans le champ
	if (searchInput) {

		// ouvrir la recherche sur focus dans l'input
		searchInput.focus();

		// debounce: exécute les recherches au maximum toutes les 250ms
		const debouncedSearch = debounce(async (pattern) => {
			await displaySearchArtists(pattern);
			await displaySearchAlbums(pattern);
			await displaySearchSongs(pattern);
		}, 250);

		// traiter le contenu de l'input — si <2 caractères on efface immédiatement et on n'appelle pas le debounce
		searchInput.addEventListener('input', () => {
			const pattern = searchInput.value.trim();
			if (pattern.length < 2) {
				// vider les résultats immédiatement
				if (searchContentArtists) searchContentArtists.innerHTML = '';
				if (searchContentAlbums) searchContentAlbums.innerHTML = '';
				if (searchContentSongs) searchContentSongs.innerHTML = '';
				return;
			}
			debouncedSearch(pattern);
		});

		// fermer la recherche avec la touche Échap
		searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') {goBack();} });
	}
}


/**
 * affichage des artistes recherchés
 * query: pattern recherchée
 */
async function displaySearchArtists(pattern) {
	
	const mergedArtistsAuthors = [
		...(await fetchArtists()),
		...(await fetchAuthors())
	];

	const filteredArtists = mergedArtistsAuthors.filter(s => s.label && cleanString(s.label).includes(cleanString(pattern)));
	const songsIds = await getArtistsSongsIds(filteredArtists);
	
	let headerContent, headerButtons
	if (filteredArtists?.length > 0) {
		const paramsPlayButtons = { name: 'SearchArtists', type: 'songs',  marginTop: '6px', data: {songsIds: songsIds}, };
		headerContent = `<span class="section-title">${tLngPl('search.artists.count', filteredArtists.length)}</span>${renderPlayButtons(paramsPlayButtons).outerHTML}`;
		headerButtons = [ { type: 'DisplayGrid', isDefault: true }, { type: 'DisplayList' }, { type: 'LabelAsc', isDefault: true }, { type: 'LabelDesc' } ];		
	} else {
		headerContent = `<span class="section-title">${tLng('search.artists.none')}</span>`
		headerButtons = [];
	}
	const params = {
		containerId: 'searchResultsArtists',
		display: 'grid',
		type: 'artists',
		headerContent: headerContent,
		headerDisplayButtons: headerButtons,
		fields: [],
	};
	displaySection(params, filteredArtists);	
	
	async function getArtistsSongsIds(artistList) {
		
		const artistIdSet = new Set(artistList.map(a => a.artistId));
		const artistsSongs = (await fetchTracks()).filter(song =>
			Array.isArray(song.artistId) &&
			song.artistId.some(id => artistIdSet.has(id))
		);
		return artistsSongs.map(song => song.songId);
	}
}


/**
 * affichage des albums recherchés
 * query: pattern recherchée
 */
async function displaySearchAlbums(pattern) {
	const filteredAlbums = (await fetchAlbums()).filter(s => s.label && cleanString(s.label).includes(cleanString(pattern)));
	const songsIds = await getAlbumsSongsIds(filteredAlbums);

	let headerContent, headerButtons
	if (filteredAlbums?.length > 0) {
		const paramsPlayButtons = { name: 'SearchAlbums', type: 'songs',  marginTop: '6px', data: {songsIds: songsIds}, };
		headerContent = `<span class="section-title">${tLngPl('search.albums.count', filteredAlbums.length)}</span>${renderPlayButtons(paramsPlayButtons).outerHTML}`;
		headerButtons = [ { type: 'DisplayGrid', isDefault: true }, { type: 'DisplayList' }, { type: 'LabelAsc', isDefault: true }, { type: 'LabelDesc' }, { type: 'DateAsc' }, { type: 'DateDesc' }, { type: 'AddedAsc' }, { type: 'AddedDesc' } ];
	}
	else {
		headerContent = `<span class="section-title">${tLng('search.albums.none')}</span>`
		headerButtons = [];
	}
	const params = {
		containerId: 'searchResultsAlbums',
		type: 'albums',
		display: 'grid',
		headerContent: headerContent,
		headerDisplayButtons: headerButtons,
		fields: [],
	};
	displaySection(params, filteredAlbums);
	
	async function getAlbumsSongsIds(albumList) {
		const albumIdSet = new Set(albumList.map(album => album.albumId));
		const albumsSongs = (await fetchTracks()).filter(song => albumIdSet.has(song.albumId));
		return albumsSongs.map(song => song.songId);
	}
}


/**
 * affichage des titres recherchés
 * query: pattern recherchée
 */
async function displaySearchSongs(pattern) {
	const filteredSongs = (await fetchTracks()).filter(s => s.label && cleanString(s.label).includes(cleanString(pattern)));
	const songsIds = filteredSongs.map(song => song.songId);	

	let headerContent, headerButtons
	if (filteredSongs?.length > 0) {
		const paramsPlayButtons = { name: 'SearchSongs', type: 'songs',  marginTop: '6px', data: {songsIds: songsIds}, };
		headerContent = `<span class="section-title">${tLngPl('search.songs.count', filteredSongs.length)}</span>${renderPlayButtons(paramsPlayButtons).outerHTML}`;
		headerButtons = [ { type: 'LabelAsc', isDefault: true }, { type: 'LabelDesc' }, { type: 'AlbumAsc' }, { type: 'AlbumDesc' }, { type: 'ArtistAsc' }, { type: 'ArtistDesc' }, { type: 'AddedAsc' }, { type: 'AddedDesc' } ];
	}
	else {
		headerContent = `<span class="section-title">${tLng('search.songs.none')}</span>`
		headerButtons = [];
	}
	const params = {
		containerId: 'searchResultsSongs',
		type: 'tracks',
		headerContent: headerContent,
		headerDisplayButtons: headerButtons,
		fields: ['albumName'],
	};
	displaySection(params, filteredSongs);	
}
