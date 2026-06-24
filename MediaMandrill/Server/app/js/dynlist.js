/**
 * js/dynlist.js
 * Ce fichier gère les fonctions de liste dynamique
 */

// log('[dynlist.js][function] var', var);

import { domElements, getDom, getDomElements } from './domElements.js';
const dom = new Proxy(domElements, { get(target, prop) {return target[prop]?.();} });

import { fetchArtists, fetchAuthors, fetchAlbums, fetchGenres, fetchTracks, fetchMoods } from './dataFetching.js'; 
import { sortByMultipleFields, renderStars, createToggle, cleanString, shuffleArray, debounce, log } from './utils.js';
import { menuAddSectionForm, menuAddSectionToggle, menuAddSectionList, menuBuildSectionList, menuFilterSectionList, menuController, menuAddSectionCalendar } from './menus.js';
import { displaySection, renderPlayButtons } from './views.js';
import { tLng, tLngPl } from './i18n.js';



let tracksAll;
let artistsAll;
let authorsAll;
let albumsAll;
let genresAll;
let moodsAll;

let tracksFiltered = tracksAll;
let artistsFiltered = artistsAll;
let authorsFiltered = authorsAll;
let albumsFiltered = albumsAll;
let genresFiltered = genresAll;
let moodsFiltered = moodsAll;
let ratingsFiltered;
let addedFiltered;

const rulesSummary = {
	updated:	false,
	limit:		{ crit: "oneOf", pattern: [] },
    artist:		{ crit: "oneOf", pattern: [] },
	author:		{ crit: "oneOf", pattern: [] },
	album:		{ crit: "oneOf", pattern: [] },
    genre:		{ crit: "oneOf", pattern: [] },
    mood:		{ crit: "oneOf", pattern: [] },
    rating:		{ crit: "oneOf", pattern: [] },
	added:		{ crit: "oneOf", pattern: null },
};



/**
 * initialisation
 */
export async function initDynamicList() {
	
	// initialisation des variables globales
	tracksAll = await fetchTracks();
	artistsAll = await fetchArtists();
	authorsAll = await fetchAuthors();
	albumsAll = await fetchAlbums();
	genresAll = await fetchGenres();
	moodsAll = await fetchMoods();
	
	// construction des menus
	await initMenus();
	// boutons Reset & Refresh / action du clic
	dom.dynListResetBtn.addEventListener('click', () => { resetDynamicList(); });
	dom.dynListRefreshBtn.addEventListener('click', () => {
		tracksFiltered = updateDynamicList();
		displayDynamicList(tracksFiltered);
	});
}


async function resetDynamicList () {
	// Désenregistre les menus
	menuController.unregister('listLimit');
	menuController.unregister('listArtist');
	menuController.unregister('listAuthor');
	menuController.unregister('listAlbum');
	menuController.unregister('listGenre');
	menuController.unregister('listMood');
	menuController.unregister('listRating');
	menuController.unregister('listAdded');
	
	// vidage des div
	const container = getDom('dynListBuild');
	container.querySelectorAll('.dynlist-menu').forEach(el => {	el.innerHTML = ''; });
	container.querySelectorAll('.dynlist-rule').forEach(el => {	el.innerHTML = ''; });
	dom.dynListResult.innerHTML = '';
	
	// vide les règles
	rulesSummary.updated = false;
	rulesSummary.limit =	{ crit: "oneOf", pattern: [] };
	rulesSummary.artist =	{ crit: "oneOf", pattern: [] };
	rulesSummary.album =	{ crit: "oneOf", pattern: [] };
	rulesSummary.genre =	{ crit: "oneOf", pattern: [] };
	rulesSummary.mood =		{ crit: "oneOf", pattern: [] };
	rulesSummary.rating =	{ crit: "oneOf", pattern: [] };
	rulesSummary.added =	{ crit: "oneOf", pattern: null };
	
	// reconstruction de la vue (et prise en compte du cache à jour
	initDynamicList();
}


async function initMenus() {
	
	// limite
	const limits = [
		{ id: 0, label : tLng('dynlist.limit.none') },
		{ id: 20, label : '20' },
		{ id: 50, label : '50' },
		{ id: 100, label : '100' },
		{ id: 500, label : '500' },
	];
	const menuDefinitionLimit = { name: 'listLimit', title: tLng('dynlist.title.limit'), datatype: 'limit' };
	await buildMenu('dynListLimit', menuDefinitionLimit, limits);
	getDom('listLimitMenuSectionListItem100')?.click(); // limite 100 par défaut
	
	// artistes
	const menuDefinitionArtist = { name: 'listArtist', title: tLng('dynlist.title.artists'), datatype: 'artist' };
	const artistsSorted = sortByMultipleFields(
		artistsAll.map(item => ({ id: item.artistId, label: item.label })),
		['label'],
		['asc']
	);
	await buildMenu('dynListArtist', menuDefinitionArtist, artistsSorted);
	
	// authors
	const menuDefinitionAuthors = { name: 'listAuthor', title: tLng('dynlist.title.authors'), datatype: 'author' };
	const authorsSorted = sortByMultipleFields(
		authorsAll.map(item => ({ id: item.artistId, label: item.label })),
		['label'],
		['asc']
	);
	await buildMenu('dynListAuthors', menuDefinitionAuthors, authorsSorted);
	
	// albums
	const menuDefinitionAlbum = { name: 'listAlbum', title: tLng('dynlist.title.albums'), datatype: 'album' };
	const albumsSorted = sortByMultipleFields(
		albumsAll.map(item => ({ id: item.albumId, label: item.label })),
		['label'],
		['asc']
	);
	await buildMenu('dynListAlbum', menuDefinitionAlbum, albumsSorted);

	// genres
	const menuDefinitionGenre = { name: 'listGenre', title: tLng('dynlist.title.genres'), datatype: 'genre' };
	const genresSorted = sortByMultipleFields(
		genresAll.map(item => ({ id: item.genreId, label: item.label })),
		['label'],
		['asc']
	);
	await buildMenu('dynListGenre', menuDefinitionGenre, genresSorted);

	// moods
	const menuDefinitionMood = { name: 'listMood', title: tLng('dynlist.title.moods'), datatype: 'mood' };
	const moodsSorted = sortByMultipleFields(
		moodsAll.map(item => ({ id: item, label: item })),
		['label'],
		['asc']
	);
	await buildMenu('dynListMood', menuDefinitionMood, moodsSorted);

	// ratings
	const stars = [
		{ id: 100, label : renderStars(100) },
		{ id: 80, label : renderStars(80) },
		{ id: 60, label : renderStars(60) },	
		{ id: 40, label : renderStars(40) },
		{ id: 20, label : renderStars(20) },
		{ id: 0, label : renderStars(0) },
	];
	const menuDefinitionRating = { name: 'listRating', title: tLng('dynlist.title.rating'), datatype: 'rating' };
	await buildMenu('dynListRating', menuDefinitionRating, stars);
	
	// added
	const menuDefinitionAdded = { name: 'listAdded', title: tLng('dynlist.title.added'), datatype: 'added' };
	await buildMenu('dynListAdded', menuDefinitionAdded);
}


/**
 * création des boutons/menus de règles
 * containerId: id DOM du container pour le bouton/menu
 * menuDefinition: définition du menu { name: 'Name', datatype: 'Artist'/'Genre'/'Mood'/'Rating', title: 'Title' }
 * menuContent: liste à afficher dans le menu [ {id: 'Id', label : 'Label'} ]
 */
async function buildMenu(containerId, menuDefinition, menuContent) {
	
	const container = getDom(containerId);
	container.innerHTML = '';

	// construction du div contenant
	const menuDivId = document.createElement('div');
	menuDivId.classList.add('menu');

	// construction du bouton trigger
	const menuTriggerButtonId = document.createElement('button');
	menuTriggerButtonId.classList.add('button-menu');
	menuTriggerButtonId.id = menuDefinition.name + 'MenuTrigger';
	menuTriggerButtonId.textContent = menuDefinition.title;

	// construction du div dropdown
	const menuDropdown = document.createElement('div');
	menuDropdown.classList.add('menu-dropdown', 'wauto', 'aligncenter', 'wlimited');
	menuDropdown.id = menuDefinition.name + 'MenuDropdown';

	// assemblage dans les contenants
	menuDivId.appendChild(menuTriggerButtonId);
	menuDivId.appendChild(menuDropdown);
	container.appendChild(menuDivId);
	
	// définition de la hauteur maximale du menu
	const maxHeight = `calc(100dvh - 300px)`;
		
	// création du contenu du menu
	buildMenuContent(menuDefinition, menuDropdown, menuContent);

	// gestion affichage: enregistrer le trigger auprès du contrôleur global
	const menuTrigger = await getDom(menuDefinition.name + 'MenuTrigger');
    menuController.register({
		key: menuDefinition.name,
		trigger: menuTrigger,
		dropdown: menuDropdown,
		maxHeight: maxHeight,
		onClose: (menuInfo) => {
			if (rulesSummary.updated) {
				updateMenuContent('listArtistMenuSectionList', artistsFiltered.flatMap(a => a.artistId || []));
				updateMenuContent('listAuthorMenuSectionList', authorsFiltered.flatMap(a => a.artistId || []));
				updateMenuContent('listAlbumMenuSectionList', albumsFiltered.flatMap(a => a.albumId || []));
				updateMenuContent('listGenreMenuSectionList', genresFiltered.flatMap(g => g.genreId || []));
				updateMenuContent('listMoodMenuSectionList', moodsFiltered);
				updateMenuContent('listRatingMenuSectionList', ratingsFiltered);
				displayDynamicList(tracksFiltered);
			}
		}
    });
}


/**
 * création des boutons/menus de règles
 * menuDefinition: définition du menu { name: 'Name', datatype: 'Artist'/'Genre'/'Mood'/'Rating', title: 'Title' }
 * menuDropdown: élément Dom du drop down à remplir
 * menuContent: liste à afficher dans le menu [ {id: 'Id', label : 'Label'} ]
 */
async function buildMenuContent(menuDefinition, menuDropdown, menuContent) {
	let sectionToggle;
	switch (menuDefinition.datatype) {
		case 'limit':
			menuAddSectionList(menuDropdown, menuDefinition.name + 'MenuSectionList');
			menuBuildSectionList({
				containerId: menuDefinition.name + 'MenuSectionList',
				dataType: menuDefinition.datatype,
				content: menuContent,
				selectType: 'mono',
				onClickCallback: () => {updateRules();},
			});
			break;
			
		case 'artist':
		case 'author':
			await menuAddSectionForm(menuDropdown, menuDefinition.name + 'MenuSectionForm', menuDefinition.title);
			menuAddSectionList(menuDropdown, menuDefinition.name + 'MenuSectionList');			
			menuBuildSectionList({
				containerId: menuDefinition.name + 'MenuSectionList',
				dataType: menuDefinition.datatype,
				content: menuContent,
				selectType: 'multi',
				onClickCallback: () => {updateRules();},
			});

			// gestion de l'input / filtre
			const artistInput = await getDom(menuDefinition.name + 'MenuSectionFormInput');
			// debounce le filtrage pour éviter d'appeler le filtre à chaque frappe
			const artistInputHandler = debounce(async () => {
				const pattern = artistInput.value.trim();
				if (pattern.length >= 1) {
					const artistsFlt = menuContent.filter(s => s.label && cleanString(s.label).includes(cleanString(pattern)));
					menuFilterSectionList(menuDefinition.name + 'MenuSectionList', menuDefinition.datatype, artistsFlt);
				} else {
					menuFilterSectionList(menuDefinition.name + 'MenuSectionList', menuDefinition.datatype, null);
				}
			}, 200);
			artistInput.addEventListener('input', artistInputHandler);
			break;
			
		case 'album':
			await menuAddSectionForm(menuDropdown, menuDefinition.name + 'MenuSectionForm', menuDefinition.title);
			menuAddSectionList(menuDropdown, menuDefinition.name + 'MenuSectionList');
			menuBuildSectionList({
				containerId: menuDefinition.name + 'MenuSectionList',
				dataType: menuDefinition.datatype,
				content: menuContent,
				selectType: 'multi',
				onClickCallback: () => {updateRules();},
			});

			// gestion de l'input / filtre
			const albumInput = await getDom(menuDefinition.name + 'MenuSectionFormInput');
			// debounce le filtrage pour éviter d'appeler le filtre à chaque frappe
			const albumInputHandler = debounce(async () => {
				const pattern = albumInput.value.trim();
				if (pattern.length >= 1) {
					const albumsFlt = menuContent.filter(s => s.label && cleanString(s.label).includes(cleanString(pattern)));
					menuFilterSectionList(menuDefinition.name + 'MenuSectionList', menuDefinition.datatype, albumsFlt);
				} else {
					menuFilterSectionList(menuDefinition.name + 'MenuSectionList', menuDefinition.datatype, null);
				}
			}, 200);
			albumInput.addEventListener('input', albumInputHandler);
			break;

		case 'genre':
			sectionToggle = [ {id: 'oneOf', label : tLng('dynlist.toggle.oneof')}, {id: 'allOf', label : tLng('dynlist.toggle.allof')} ];
			menuAddSectionToggle({
				menuContainer: menuDropdown,
				sectionId: menuDefinition.name + 'MenuSectionToggle',
				dataType: 'genre',
				toggleDefinition: sectionToggle,
				onClickCallback: () => {updateRules();},
			});
			await menuAddSectionForm(menuDropdown, menuDefinition.name + 'MenuSectionForm', 'Genres');
			menuAddSectionList(menuDropdown, menuDefinition.name + 'MenuSectionList');
			menuBuildSectionList({
				containerId: menuDefinition.name + 'MenuSectionList',
				dataType: menuDefinition.datatype,
				content: menuContent,
				selectType: 'multi',
				onClickCallback: () => {updateRules();},
			});

			// gestion de l'input / filtre
			const genreInput = await getDom(menuDefinition.name + 'MenuSectionFormInput');
			const genreInputHandler = debounce(async () => {
				const pattern = genreInput.value.trim();
				if (pattern.length >= 1) {
					const genresFlt = menuContent.filter(s => s.label && cleanString(s.label).includes(cleanString(pattern)));
					menuFilterSectionList(menuDefinition.name + 'MenuSectionList', menuDefinition.datatype, genresFlt);
				} else {
					menuFilterSectionList(menuDefinition.name + 'MenuSectionList', menuDefinition.datatype, null);
				}
			}, 200);
			genreInput.addEventListener('input', genreInputHandler);
			break;

		case 'mood':
			sectionToggle = [ {id: 'oneOf', label : tLng('dynlist.toggle.oneof')}, {id: 'allOf', label : tLng('dynlist.toggle.allof')} ];
			menuAddSectionToggle({
				menuContainer: menuDropdown,
				sectionId: menuDefinition.name + 'MenuSectionToggle',
				dataType: 'mood',
				toggleDefinition: sectionToggle,
				onClickCallback: () => {updateRules();},
			});
			menuAddSectionList(menuDropdown, menuDefinition.name + 'MenuSectionList');
			menuBuildSectionList({
				containerId: menuDefinition.name + 'MenuSectionList',
				dataType: menuDefinition.datatype,
				content: menuContent,
				selectType: 'multi',
				onClickCallback: () => {updateRules();},
			});
			break;

		case 'rating':
			menuAddSectionList(menuDropdown, menuDefinition.name + 'MenuSectionList');
			menuBuildSectionList({
				containerId: menuDefinition.name + 'MenuSectionList',
				dataType: menuDefinition.datatype,
				content: menuContent,
				selectType: 'multi',
				onClickCallback: () => {updateRules();},
			});
			break;
			
		case 'added':
			menuAddSectionCalendar(
				menuDropdown,
				menuDefinition.name + 'MenuSectionCalendar',
				{
					onDateChange: ({ dates, dateStr }) => {	updateRules( {calendarDate: dateStr} ); }
				},
			);
			break;
	}
}


/**
 * met à jour l'affichage des éléments non selectionnés: cache les éléments non présents dans ids
 * containerId: id du conteneur de liste
 * ids: liste des ids retenus
 * menuContent: liste à afficher dans le menu [ {id: 'Id', label : 'Label'} ]
 */
function updateMenuContent(containerId, ids) {
    const allowed = new Set(ids);
    const container = getDom(containerId);
    for (const child of container.children) {
        const childId = child.dataset.id;
        child.classList.toggle('hidden', !allowed.has(childId));
    }
}


/**
 * mise à jour des règles
 */
async function updateRules( params ) {
	
	// récupération des critères
	const summaryCrit = getDomElements(`#dynListBuild .active`);
	summaryCrit.forEach(item => {
		switch (item.type) {
			case 'genre':
				rulesSummary.genre.crit = item.id;
				break;
			case 'mood':
				rulesSummary.mood.crit = item.id;
				break;
		}
	});
	
	// récupération des selections dans les listes (classe selected)
	const summaryContent = getDomElements(`#dynListBuild .selected`);
	if (summaryContent.length) {
		
		// vide les anciennes patterns
		["limit", "artist", "author", "album", "genre", "mood", "rating"].forEach(key => { rulesSummary[key].pattern = []; });
		
		// rempli les patterns
		summaryContent.forEach(item => {
			switch (item.type) {
				case 'limit':
					rulesSummary.limit.pattern.push(parseInt(item.id, 10));
					break;
				case 'artist':
					rulesSummary.artist.pattern.push(parseInt(item.id, 10));
					break;
				case 'author':
					rulesSummary.author.pattern.push(parseInt(item.id, 10));
					break;
				case 'album':
					rulesSummary.album.pattern.push(parseInt(item.id, 10));
					break;
				case 'genre':
					rulesSummary.genre.pattern.push(parseInt(item.id, 10));
					break;
				case 'mood':
					rulesSummary.mood.pattern.push(item.id);
					break;
				case 'rating':
					rulesSummary.rating.pattern.push(parseInt(item.id, 10));
					break;
			}
		});
		rulesSummary.updated = true;
	}
	
	// récupération du calendrier
	if (params?.calendarDate) {
		rulesSummary.added.pattern = params.calendarDate;
		rulesSummary.updated = true;
	}
	
	// si changement
	if (rulesSummary.updated) {
		dom.dynListResetBtn.classList.remove('hidden');
		dom.dynListRefreshBtn.classList.remove('hidden');
		
		// afichage de la synthèse
		displayRuleLimitSummary();
		displayRuleArtistSummary();
		displayRuleAuthorSummary();
		displayRuleAlbumSummary();
		displayRuleGenreSummary();
		displayRuleMoodsSummary();
		displayRuleRatingsSummary();
		displayRuleAddedSummary();
		
		// met à jour dynamiquemenent les listes filtrées
		tracksFiltered = await updateDynamicList();
		artistsFiltered = filterArtistsFromTracks(tracksFiltered, artistsAll);
		authorsFiltered = filterAuthorsFromTracks(tracksFiltered, authorsAll);
		albumsFiltered = filterAlbumsFromTracks(tracksFiltered, albumsAll);
		genresFiltered = filterGenresFromTracks(tracksFiltered, genresAll);
		moodsFiltered = filterMoodsFromTracks(tracksFiltered);
		ratingsFiltered = filterRatingsFromTracks(tracksFiltered);
	}
	
	// si pas changement
	else {
		dom.dynListResetBtn.classList.add('hidden');
		dom.dynListRefreshBtn.classList.add('hidden');
	}
	
	// affichage de la synthèse de la rule limit
	function displayRuleLimitSummary() {
		let htmlDisplay;
		if (rulesSummary.limit.pattern.length == 1 && parseInt(rulesSummary.limit.pattern[0], 10) !== 0) {
			// critères
			htmlDisplay = tLng('dynlist.summary.limit') + rulesSummary.limit.pattern;
			
			// insertion dans html et affichage
			getDom('listLimitMenuTrigger').innerHTML = htmlDisplay;
		}
		else {
			getDom('listLimitMenuTrigger').innerHTML = tLng('dynlist.title.limit');
		}
	}
	
	// affichage de la synthèse de la rule artists
	function displayRuleArtistSummary() {
		let htmlDisplay;
		if (rulesSummary.artist.pattern.length > 0)	{
			// critères
			htmlDisplay = tLng('dynlist.summary.artists');
			
			// récupération des labels par artistid
			const artistLabels = getLabelsFromIds(rulesSummary.artist.pattern, artistsAll, 'artistId');
			htmlDisplay += artistLabels.sort().join(', ');
			
			// insertion dans html et affichage
			getDom('dynListRuleArtist').innerHTML = htmlDisplay;
			getDom('dynListRuleArtist').classList.remove('hidden');
		}
		else {
			getDom('dynListRuleArtist').innerHTML = '';
			getDom('dynListRuleArtist').classList.add('hidden');
		}
	}
	
	// affichage de la synthèse de la rule authors
	function displayRuleAuthorSummary() {
		let htmlDisplay;
		if (rulesSummary.author.pattern.length > 0)	{
			// critères
			htmlDisplay = tLng('dynlist.summary.authors');
			
			// récupération des labels par artistid
			const authorsLabels = getLabelsFromIds(rulesSummary.author.pattern, authorsAll, 'artistId');
			htmlDisplay += authorsLabels.sort().join(', ');
			
			// insertion dans html et affichage
			getDom('dynListRuleAuthors').innerHTML = htmlDisplay;
			getDom('dynListRuleAuthors').classList.remove('hidden');
		}
		else {
			getDom('dynListRuleAuthors').innerHTML = '';
			getDom('dynListRuleAuthors').classList.add('hidden');
		}
	}
	
	// affichage de la synthèse de la rule albums
	function displayRuleAlbumSummary() {
		let htmlDisplay;
		if (rulesSummary.album.pattern.length > 0)	{
			// critères
			htmlDisplay = tLng('dynlist.summary.albums');
			
			// récupération des labels par albumid
			const albumLabels = getLabelsFromIds(rulesSummary.album.pattern, albumsAll, 'albumId');
			htmlDisplay += albumLabels.sort().join(', ');
			
			// insertion dans html et affichage
			getDom('dynListRuleAlbum').innerHTML = htmlDisplay;
			getDom('dynListRuleAlbum').classList.remove('hidden');
		}
		else {
			getDom('dynListRuleAlbum').innerHTML = '';
			getDom('dynListRuleAlbum').classList.add('hidden');
		}
	}
	
	// affichage de la synthèse de la rule genres
	function displayRuleGenreSummary() {		
		let htmlDisplay;
		if (rulesSummary.genre.pattern.length > 0) {
			// critères
			if (rulesSummary.genre.crit == 'oneOf')		{htmlDisplay = tLng('dynlist.summary.genres.oneof');}
			else if (rulesSummary.genre.crit == 'allOf')	{htmlDisplay = tLng('dynlist.summary.genres.allof');}
			
			// récupération des labels par genreid
			const genreLabels = getLabelsFromIds(rulesSummary.genre.pattern, genresAll, 'genreId');
			htmlDisplay += genreLabels.sort().join(', ');
			
			// insertion dans html et affichage
			getDom('dynListRuleGenre').innerHTML = htmlDisplay;
			getDom('dynListRuleGenre').classList.remove('hidden');
		}
		else {
			getDom('dynListRuleGenre').innerHTML = '';
			getDom('dynListRuleGenre').classList.add('hidden');
		}
	}
	
	// affichage de la synthèse de la rule moods
	function displayRuleMoodsSummary() {
		let htmlDisplay;
		if (rulesSummary.mood.pattern.length > 0)	{
			// critères
			if (rulesSummary.mood.crit == 'oneOf')		{htmlDisplay = tLng('dynlist.summary.moods.oneof');}
			else if (rulesSummary.mood.crit == 'allOf')	{htmlDisplay = tLng('dynlist.summary.moods.allof');}
			htmlDisplay += rulesSummary.mood.pattern.sort().join(', ');
			
			// insertion dans html et affichage
			getDom('dynListRuleMood').innerHTML = htmlDisplay;
			getDom('dynListRuleMood').classList.remove('hidden');
		}
		else {
			getDom('dynListRuleMood').innerHTML = '';
			getDom('dynListRuleMood').classList.add('hidden');
		}
	}
	
	// affichage de la synthèse de la rule ratings
	function displayRuleRatingsSummary() {
		let htmlDisplay;		
		if (rulesSummary.rating.pattern.length > 0)	{
			// critères
			htmlDisplay = tLng('dynlist.summary.rating');
			
			// generation des *
			const patternAsInt = rulesSummary.rating.pattern.map(id => parseInt(id, 10));
			const stars = patternAsInt.map(id => renderStars(id));
			htmlDisplay += stars.join(',&nbsp;');
			
			// insertion dans html et affichage
			getDom('dynListRuleRating').innerHTML = htmlDisplay;
			getDom('dynListRuleRating').classList.remove('hidden')
		}
		else {
			getDom('dynListRuleRating').innerHTML = '';
			getDom('dynListRuleRating').classList.add('hidden');
		}
	}
	
	// affichage de la synthèse de la rule added
	function displayRuleAddedSummary() {
		let htmlDisplay;
		if (rulesSummary.added?.pattern) {
			// critères
			htmlDisplay = tLng('dynlist.summary.added') + rulesSummary.added.pattern;
			
			// insertion dans html et affichage
			getDom('dynListRuleAdded').innerHTML = htmlDisplay;
			getDom('dynListRuleAdded').classList.remove('hidden');
		}
		else {
			getDom('dynListRuleAdded').innerHTML = '';
			getDom('dynListRuleAdded').classList.add('hidden');
		}
	}
	
	// utilitaire de conversion de Ids en label
	function getLabelsFromIds(ids, idList, idField) {
		const idSet = new Set(ids.map(id => String(id).trim()));
		return idList
			.filter(item => idSet.has(String(item[idField]).trim()))
			.map(item => item.label);
	}
	
	// filtre et renvoie la liste des artistes uniques présents dans tracks
	function filterArtistsFromTracks(tracks, artistsAll) {
		// extraire tous les IDs uniques
		const artistIds = new Set([
			...tracks.flatMap(track => track.artistId),
			...tracks.map(track => track.albumArtistId)
		]);
		// filtrer les artistes existants
		return artistsAll.filter( a => artistIds.has(a.artistId) );
	}
	
	// filtre et renvoie la liste des authors uniques présents dans tracks
	function filterAuthorsFromTracks(tracks, authorsAll) {
		// extraire tous les IDs uniques
		const authorIds = new Set( tracks.flatMap(track => track.authorId || []) );
		// filtrer les artistes existants
		return authorsAll.filter( a => authorIds.has(a.artistId) );
	}
	
	// filtre et renvoie la liste des artistes uniques présents dans tracks
	function filterAlbumsFromTracks(tracks, albumsAll) {
		// extraire tous les IDs uniques
		const albumIds = new Set( tracks.flatMap(track => track.albumId || []) );
		// filtrer les albums existants
		return albumsAll.filter( g => albumIds.has(g.albumId) );
	}

	// filtre et renvoie la liste des genres uniques présents dans tracks
	function filterGenresFromTracks(tracks, genresAll) {
		// extraire tous les IDs uniques
		const genreIds = new Set( tracks.flatMap(track => track.genreId || []) );
		// filtrer les genres existants
		return genresAll.filter( g => genreIds.has(g.genreId) );
	}

	// filtre et renvoie la liste des moods uniques présents dans tracks
	function filterMoodsFromTracks(tracks) {
		// extraire tous les moods uniques
		const moods = new Set( tracks.flatMap(track => track.mood || []) );
		// transformer en tableau
		return [...moods].sort();
	}

	// filtre et renvoie la liste des notes uniques présents dans tracks
	function filterRatingsFromTracks(tracks) {
		// extraire tous les ratings uniques
		const ratings = new Set( tracks.flatMap(track => track.rating || []) );	
		// artefact: ajout des ratings 0* si présence de -1
		if (ratings.has("-1")) {ratings.add("0");}
		// transformer en tableau
		return [...ratings].sort();
	}
}


/**
 * création de la liste dynamique
 */
function updateDynamicList() {
	
	let tracksFlt = tracksAll;
	tracksFlt = filterTracksByArtists(tracksFlt);
	tracksFlt = filterTracksByAuthors(tracksFlt);
	tracksFlt = filterTracksByAlbums(tracksFlt);
	tracksFlt = filterTracksByGenres(tracksFlt);
	tracksFlt = filterTracksByMoods(tracksFlt);
	tracksFlt = filterTracksByRatings(tracksFlt);
	tracksFlt = filterTracksByAdded(tracksFlt);
	
	return tracksFlt;
	
	// utilitaire de filtre par rule sur artist
	function filterTracksByArtists(tracks) {
		const rulePattern = rulesSummary?.artist?.pattern;
		
		let tracksFlt = tracks;
		if (rulePattern?.length > 0) {
			const ruleSet = new Set(rulePattern.map(id => parseInt(id, 10)));
			tracksFlt = tracks.filter( song => song.artistId.some(id => ruleSet.has(parseInt(id, 10))) || ruleSet.has(parseInt(song.albumArtistId, 10)) );
		}
		return tracksFlt;
	}
	
	// utilitaire de filtre par rule sur author
	function filterTracksByAuthors(tracks) {
		const rulePattern = rulesSummary?.author?.pattern
		
		let tracksFlt = tracks;
		if (rulePattern?.length > 0) {
			const ruleSet = new Set(rulePattern.map(id => parseInt(id, 10)));
			tracksFlt = tracks.filter(song => ruleSet.has(parseInt(song.authorId, 10)) );
		}
		return tracksFlt;
	}

	// utilitaire de filtre par rule sur album
	function filterTracksByAlbums(tracks) {
		const rulePattern = rulesSummary?.album?.pattern
		
		let tracksFlt = tracks;
		if (rulePattern?.length > 0) {
			const ruleSet = new Set(rulePattern.map(id => parseInt(id, 10)));
			tracksFlt = tracks.filter(song => ruleSet.has(parseInt(song.albumId, 10)) );
		}
		return tracksFlt;
	}

	// utilitaire de filtre par rule sur genre
	function filterTracksByGenres(tracks) {
		const ruleCrit = rulesSummary?.genre?.crit
		const rulePattern = rulesSummary?.genre?.pattern
		
		let tracksFlt = tracks;
		if (rulePattern?.length > 0) {
			const ruleSet = new Set(rulePattern.map(id => parseInt(id, 10)));
			if (ruleCrit == 'oneOf')		{ tracksFlt = tracks.filter(song => song.genreId?.some(id => ruleSet.has(parseInt(id, 10)))); }
			else if (ruleCrit == 'allOf')	{ tracksFlt = tracks.filter(song => rulePattern.every(id => song.genreId?.includes(String(id)))); }
		}
		return tracksFlt;
	}
	
	// utilitaire de filtre par rule sur mood
	function filterTracksByMoods(tracks) {
		const ruleCrit = rulesSummary?.mood?.crit;
		const rulePattern = rulesSummary?.mood?.pattern;
		
		let tracksFlt = tracks;
		if (rulePattern?.length > 0) {
			const ruleSet = new Set(rulePattern);
			if (ruleCrit == 'oneOf')		{ tracksFlt = tracks.filter( song => song.mood.some(mood => ruleSet.has(mood)) ); }
			else if (ruleCrit == 'allOf')	{ tracksFlt = tracks.filter( song => rulePattern.every(mood => song.mood.includes(mood)) ); }			
		}
		return tracksFlt;
	}
	
	// utilitaire de filtre par rule sur Rating
	function filterTracksByRatings(tracks) {
		const rulePattern = [...(rulesSummary?.rating?.pattern || [])]; // tips pour ne pas alterer rulesSummary à cause de l'ajout possible de l'artefact -1

		// artefact: ajout des pistes non notées lorsque choix 0*
		if (rulePattern.includes(0)) { rulePattern.push(-1); }
		
		let tracksFlt = tracks;
		if (rulePattern.length > 0) {
			const ruleSet = new Set(rulePattern.map(id => parseInt(id, 10)));
			tracksFlt = tracks.filter( song => ruleSet.has(parseInt(song.rating, 10)) );
		}
		return tracksFlt;
	}

	// utilitaire de filtre par rule sur Added
	function filterTracksByAdded(tracks) {
		let tracksFlt = tracks;
		
		if (rulesSummary.added?.pattern) {
			const dateAdded = Number( (rulesSummary.added.pattern).replace(/-/g, '') );				
			tracksFlt = tracks.filter( track => Number(track.dateAdded) >= Number(dateAdded) );
		}
		return tracksFlt;
	}
}


/**
 * affichage de la liste dynamique
 */
function displayDynamicList(tracks) {	

	const tracksLimit = filterTracksByLimit(tracks);

	const songsIds = tracksLimit.map(song => song.songId);
	let headerContent, headerButtons
	if (tracksLimit?.length > 0) {
		const paramsPlayButtons = {	name: 'dynListResult', type: 'songs',  marginTop: '6px', data: {songsids: shuffleArray(songsIds)}, };
		headerContent = `<span class="section-title">${tLngPl('dynlist.count.tracks', songsIds.length)}</span>${renderPlayButtons(paramsPlayButtons).outerHTML}`;
		headerButtons = [ { type: 'LabelAsc', isDefault: true }, { type: 'LabelDesc' }, { type: 'AlbumAsc' }, { type: 'AlbumDesc' }, { type: 'ArtistAsc' }, { type: 'ArtistDesc' }, { type: 'AddedAsc' }, { type: 'AddedDesc' } ];	
	}
	else {
		headerContent = `<span class="section-title">${tLng('dynlist.count.notrack')}</span>`
		headerButtons = [];
	}
	const params = {
		containerId: 'dynListResult',
		type: 'tracks',
		headerContent: headerContent,
		headerDisplayButtons: headerButtons,
		fields: ['albumName'],
	};
	displaySection(params, tracksLimit);
	
	
	// utilitaire de filtre par rule sur Limit
	function filterTracksByLimit(tracks) {
		const limit = parseInt(rulesSummary?.limit?.pattern[0], 10);
		let tracksLimit = tracks;
		if (typeof limit === 'number' && limit > 0) { tracksLimit = shuffleArray(tracks, limit); }
		return tracksLimit;
	}
}

