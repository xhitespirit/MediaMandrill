/**
 * js/songProperties.js
 * Ce fichier gère les fonctions d'edition de tag audio
 */
 
// log('[songProperties.js][function] var', var);

import { domElements, getDom, getDomElements } from './domElements.js';
const dom = new Proxy(domElements, { get(target, prop) {return target[prop]?.();} });

import { fetchGenres, fetchTrack, fetchMoods } from './dataFetching.js'; 
import { sortByMultipleFields, renderStars, cleanString, showMessageBox, setTrackTag, createForm, debounce, log, popDate } from './utils.js';
import { menuAddSectionForm, menuAddSectionList, menuBuildSectionList, menuFilterSectionList, menuController } from './menus.js';
import { tLng } from './i18n.js';



let messageBox, tagsSummary = {};
let registeredMenus = [];



/**
 * initialisation
 */
export async function songProperties(songId) {
	// Nettoyer les anciens menus enregistrés (si songEdit déjà ouvert)
	if (registeredMenus.length > 0) {
		registeredMenus.forEach(key => menuController.unregister(key));
		registeredMenus = [];
	}
	
	// song
	const song = await fetchTrack(songId);
	tagsSummary.song = song;

	// codec
	const audioCodec = song.fileType?.toLowerCase();
	const dateAdded = popDate(song.dateAdded);
	// const thumbnail = `/library/track/${songId}/thumbnail`;
	
	const boxContent = `
		<div class="song-prop-header">
			<div class="column">
				<img
					src="resources/images/fallback_artists.png"	
					data-src="/library/track/${songId}/thumbnail"
					alt="${song?.title}"
					class="song-prop-album-art"
					loading="lazy"
					onerror="this.onerror=null;this.src='resources/images/fallback_album.png';"
				>
			</div>
		
			<div class="column">
				<span class="np-song-title">${song?.title}</span>
				<div class="np-combine">
					<span class="artist-link nohover">${song?.artist.join(', ')}</span>
					<span class="album-link nohover">&nbsp;&nbsp;•&nbsp;&nbsp;${song?.album}</span>
				</div>
				<span class="np-moods">${tLng('songprop.author')}${song?.author.length > 0 ? song?.author.join(', ') : 'n/a'}</span>
				<span class="np-moods">${tLng('songprop.dateAdded')}${dateAdded}</span>
				<span class="np-audiocodec np-icon-${audioCodec}"></span>
			</div>
		</div>
		
		<div class="song-prop-row">
			<div id="songPropGenre" class="song-prop-row-left"></div>
			<div id="songPropGenreResult" class="song-prop-row-right"></div>
		</div>
		<div class="song-prop-row">
			<div id="songPropMood" class="song-prop-row-left"></div>
			<div id="songPropMoodResult" class="song-prop-row-right"></div>
		</div>
		<div class="song-prop-row">
			<div id="songPropDate" class="song-prop-row-left"></div>
			<div id="songPropDateResult" class="song-prop-row-right">${tLng('songprop.year')}</div>
		</div>
		<div class="song-prop-row">
			<div id="songPropRating" class="song-prop-row-left"></div>
			<div id="songPropRatingResult" class="song-prop-row-right"></div>
		</div>
		<div id="songPropFooter" class="song-prop-footer">
			<button class="button-OK hidden highlight" id="songPropSubmitBtn">${tLng('songprop.update')}</button>
		</div>
	`;
	// messageBox = showMessageBox('songEdit', tLng('songprop.box.title'), boxContent);
	messageBox = showMessageBox('songEdit', null, boxContent);
	messageBox.mount();

	// genres
	const genresAll = await fetchGenres();
	const menuDefinitionGenre = { name: 'editGenre', title: tLng('songprop.genres'), datatype: 'genre' }
	const genresAllSorted = sortByMultipleFields(
		genresAll.map(item => ({ id: item.genreId, label: item.label })),
		['label'],
		['asc']
	);
	await buildMenu('songPropGenre', menuDefinitionGenre, genresAllSorted);
	registeredMenus.push(menuDefinitionGenre.name);
	song?.genreId?.forEach(genreId => { getDom( menuDefinitionGenre.name + 'MenuSectionListItem' + genreId ).click(); });
	// initialise l'état du changement à faux
	tagsSummary[menuDefinitionGenre.datatype + 'Updated'] = false;
	
	// moods
	const moods = await fetchMoods();
	const menuDefinitionMood = { name: 'editMood', title: tLng('songprop.moods'), datatype: 'mood' }
	const moodsSorted = sortByMultipleFields(
		moods.map(mood => ({ id: mood.replace(/\s+/g, ''), label: mood })),
		['label'],
		['asc']
	);
	await buildMenu('songPropMood', menuDefinitionMood, moodsSorted);
	registeredMenus.push(menuDefinitionMood.name);
	song?.mood?.forEach(mood => { getDom( menuDefinitionMood.name + 'MenuSectionListItem' + mood.replace(/\s+/g, '') ).click(); });
	// initialise l'état du changement à faux
	tagsSummary[menuDefinitionMood.datatype + 'Updated'] = false;
	
	// date
	buildDateForm('songPropDate', song.year.slice(0, 4));	
	// initialise l'état valide à faux
	tagsSummary['dateIsValid'] = false;
		
	// rating
	buildStars('songPropRating', song.rating);

	// initialise l'état du changement à faux
	tagsSummary['ratingUpdated'] = false;

	// bouton Générer / action du clic
	getDom('songPropSubmitBtn').addEventListener('click', () => {
		if (tagsSummary) { 
			updateTags();
			messageBox.unmount();
		}
	});
}


/**
 * création des boutons/menus de règles
 * containerId: id DOM du container pour le bouton/menu
 * menuDefinition: définition du menu { type: 'Genre'/'Mood'/'Rating', title: 'Title' }
 * menuContent: liste à afficher dans le menu [ {id: 'Id', label : 'Label'} ]
 * query: pattern recherchée
 */
async function buildMenu(containerId, menuDefinition, menuContent) {
	
	const container = getDom(containerId);

	// construction du div contenant
	const menuDivId = document.createElement('div');
	menuDivId.classList.add('menu');

	// construction du bouton trigger
	const menuTriggerButtonId = document.createElement('button');
	menuTriggerButtonId.classList.add('button-menu');
	// menuTriggerButtonId.classList.add('highlight');
	
	menuTriggerButtonId.id = menuDefinition.name + 'MenuTrigger';
	menuTriggerButtonId.textContent = menuDefinition.title;

	// construction du div dropdown
	const menuDropdown = document.createElement('div');
	menuDropdown.classList.add('menu-dropdown');
	menuDropdown.classList.add('wauto');
	menuDropdown.id = menuDefinition.name + 'MenuDropdown';
	
	// assemblage dans les contenants
	menuDivId.appendChild(menuTriggerButtonId);
	menuDivId.appendChild(menuDropdown);
	container.appendChild(menuDivId);
	
	// définition de la hauteur maximale du menu
	const parentRect = getDom('songEdit').getBoundingClientRect();
	const rect = menuDropdown.getBoundingClientRect();
	const height = parentRect.bottom - rect.top - 40;
	const maxHeight = `${height}px`

	// construction du menu
	switch (menuDefinition.datatype) {

		case 'genre':
			await menuAddSectionForm(menuDropdown, menuDefinition.name + 'MenuSectionForm', menuDefinition.title);
			menuAddSectionList(menuDropdown, menuDefinition.name + 'MenuSectionList');
			menuBuildSectionList({
				containerId: menuDefinition.name + 'MenuSectionList',
				dataType: menuDefinition.datatype,
				content: menuContent,
				selectType: 'multi',
				onClickCallback: (click) => {trackChanges(click);},
			});
			
			// gestion de l'input / filtre
			const genreInput = await getDom(menuDefinition.name + 'MenuSectionFormInput');
			const genreInputHandler = debounce(async function () {
				const pattern = genreInput.value.trim();
				if (pattern.length >= 1) {
					const genresFiltered = menuContent.filter(s => s.label && cleanString(s.label).includes(cleanString(pattern)));
					menuFilterSectionList(menuDefinition.name + 'MenuSectionList', menuDefinition.datatype, genresFiltered);
				} else {
					menuFilterSectionList(menuDefinition.name + 'MenuSectionList', menuDefinition.datatype, null);
				}
			}, 200);
			genreInput.addEventListener('input', genreInputHandler);
			break;
			
		case 'mood':
			menuAddSectionList(menuDropdown, menuDefinition.name + 'MenuSectionList');
			menuBuildSectionList({
				containerId: menuDefinition.name + 'MenuSectionList',
				dataType: menuDefinition.datatype,
				content: menuContent,
				selectType: 'multi',
				onClickCallback: (click) => {trackChanges(click);},
			});
			break;
	}
	
	// gestion affichage: enregistrer le trigger auprès du contrôleur global
	const menuTrigger = await getDom(menuDefinition.name + 'MenuTrigger');
	menuController.register({ key: menuDefinition.name, trigger: menuTrigger, dropdown: menuDropdown, maxHeight: maxHeight });
}


/**
 * création des stars / rating
 * containerId: id DOM du container pour le bouton/menu
 * songRating: note à afficher (0, 20, 40, 60, 80, 100)
 */
async function buildStars(containerId, songRating) {
	
	const container = getDom(containerId);
	
	// construction du div contenant
	const starDivId = document.createElement('div');
	starDivId.classList.add('song-prop-stars');
	starDivId.innerHTML = renderStars(songRating);
	container.appendChild(starDivId);
	
	// class selected par défaut sur la star = songRating
	const starSelected = document.querySelector(`#${containerId} .star[data-star="${songRating}"]`);
	starSelected?.classList.add('selected');
	
	// écouteur sur les clics
	starDivId.addEventListener('click', async (e) => {
		const starNumber = Number(e.target.dataset.star);		
		if (starNumber > 0) {
			// met à zéro la note si la note cliquée est la note en vigueur
			if (e.target.classList.contains('selected')) {
				starDivId.innerHTML = renderStars(0);
				const starClicked = document.querySelector(`#${containerId} .star[data-star="${starNumber}"]`);
				starClicked.classList.remove('selected');
			}
			// définit la note cliquée
			else {
				starDivId.innerHTML = renderStars(starNumber);
				const starClicked = document.querySelector(`#${containerId} .star[data-star="${starNumber}"]`);
				starClicked.classList.add('selected');
			}
			
			// met à jour l'état du changement
			trackChanges({type: 'rating'});
		}
	});
}


/**
 * création des stars / rating
 * containerId: id DOM du container pour le bouton/menu
 * songdate: date à afficher
 */
async function buildDateForm (containerId, songDate) {
	
	const formParams = {
		containerId: containerId,
		classList: ['w120'],
		searchInputId: 'songPropDateFormInput',
		searchFormLabel: songDate,
	};
	await createForm(formParams);
	
	const dateInput = await getDom('songPropDateFormInput');
	
	dateInput.addEventListener('input', async function () {
		const pattern = dateInput.value.trim();
		if (isValidDate(pattern)) {
			dateInput.classList.add('selected');
			dateInput.dataset.type = 'date';
			dateInput.dataset.date = pattern;
			trackChanges({ type: 'date', isValid: true });
		} else {
			dateInput.classList.remove('selected');
			delete dateInput.dataset.type;
			delete dateInput.dataset.date;
			trackChanges({ type: 'date', isValid: false });
		}
	});
	
	// utilitaire de validation de format date YYYY, ou YYYY-MM ou YYYY-MM-DD
	function isValidDate(pattern) {
		if (!/^(?:\d{4}|\d{4}-\d{2}|\d{4}-\d{2}-\d{2})$/.test(pattern)) return false;

		const parts = pattern.split('-').map(Number);
		const [year, month = 1, day = 1] = parts;
		const date = new Date(year, month - 1, day);

		return (
			date.getFullYear() === year &&
			date.getMonth() === month - 1 &&
			date.getDate() === day
		);
	}
}


/**
 * mise à jour des règles
 */
async function trackChanges(params) {
	
	// type=date: marque le type de data comme valide / autres types: marque le type de data comme mis à jour
	if (params.type == 'date')	{ tagsSummary[`${params.type}IsValid`] = params.isValid; }
	else						{ tagsSummary[`${params.type}Updated`] = true; }
	
	// récupération des contenus
	const genresPattern = [];
	const moodsPattern = [];
	const datePattern = [];
	const ratingPattern = [];
	const selected = getDomElements(`#songEdit .selected`);

	selected.forEach(item => {
		if (item?.type === 'genre')			genresPattern.push( { item:parseInt(item.id, 10), label:item.label} );
		else if (item?.type === 'mood')		moodsPattern.push( {item: item.id, label:item.label} );
		else if (item?.type === 'date')		datePattern.push( item.date );
		else if (item?.type === 'rating')	ratingPattern.push( parseInt(item.star, 10) );
	});
	
	tagsSummary.genre = genresPattern;
	tagsSummary.mood = moodsPattern;
	tagsSummary.date = datePattern;
	tagsSummary.rating = ratingPattern;
	
	// affichage des boutons Générer et Réinitialiser
	if ( tagsSummary?.genreUpdated || tagsSummary?.moodUpdated || tagsSummary?.dateIsValid || tagsSummary?.ratingUpdated ) {
		getDom('songPropSubmitBtn').classList.remove('hidden');
	} else {
		getDom('songPropSubmitBtn').classList.add('hidden');
	}
	
	// afichage de la synthèse
	displayGenreSummary();
	displayMoodSummary();
	
	// affichage de la synthèse de la rule genres
	function displayGenreSummary() {
		let htmlDisplay;
		const genreLabels = genresPattern.map(m => m.label);
		if (genresPattern?.length > 0) {
			htmlDisplay = genreLabels.sort().join(' &bull; ');
			getDom('songPropGenreResult').innerHTML = htmlDisplay;
			getDom('songPropGenreResult').classList.remove('hidden');
		}
		else {
			getDom('songPropGenreResult').innerHTML = '';
			getDom('songPropGenreResult').classList.add('hidden');
		}
		
		// utilitaire de conversion de genreid en label
		function getLabelsFromIds(ids, genreList) {
			const idsAsInt = ids.map(id => parseInt(id, 10));
			return genreList
				.filter(g => idsAsInt.includes(g.genreid))
				.map(g => g.label);
		}
	}
	
	// affichage de la synthèse de la rule moods
	function displayMoodSummary() {
		let htmlDisplay;
		const moodsLabels = moodsPattern.map(m => m.label);
		if (moodsLabels?.length > 0) {
			htmlDisplay = moodsLabels.sort().join(' &bull; ');
			getDom('songPropMoodResult').innerHTML = htmlDisplay;
			getDom('songPropMoodResult').classList.remove('hidden');
		}
		else {
			getDom('songPropMoodResult').innerHTML = '';
			getDom('songPropMoodResult').classList.add('hidden');
		}
	}
}


/**
 * mise à jour des tags
 */
function updateTags() {
	if (tagsSummary?.genreUpdated) {
		const genresUpdated = tagsSummary.genre.map(g => g.label).join("; ");
		setTrackTag( tagsSummary.song.songId, 'genre', genresUpdated );
	}
	
	if (tagsSummary?.moodUpdated) {
		const moodsUpdated = tagsSummary.mood.map(m => m.label).join("; ");
		setTrackTag( tagsSummary.song.songId, 'mood', moodsUpdated );
	}
	
	if (tagsSummary?.dateIsValid) {
		const dateUpdated = tagsSummary.date;
		setTrackTag( tagsSummary.song.songId, 'year', Number(dateUpdated[0]) );
	}
	
	if (tagsSummary?.ratingUpdated) {
		const stars = tagsSummary.rating || -1;
		setTrackTag( tagsSummary.song.songId, 'rating', stars[0] || -1);
	}
}

