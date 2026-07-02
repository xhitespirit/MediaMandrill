/**
 * js/views.js
 * Ce fichier contient les fonctions d'affichage
 */
 
// log('[views.js][function] var', var);
 
import { domElements, getDom, getDomElements } from './domElements.js';
const dom = new Proxy(domElements, { get(target, prop) {return target[prop]?.();} });

import { icon } from './graphics.js';
import {
	createToggle, replaceClassByPrefix, sortByMultipleFields, setupAlphaBar,
	popDate, formatDuration, renderStars, updateFanart, shuffleArray, log, getInfoFromTheAudioDB,
	debounce, cleanString, normalizeArticleForSort
} from './utils.js';
import {
	fetchArtists, fetchAuthors, fetchAlbums, fetchGenres, fetchPlaylists, fetchArtistIds,
	fetchArtist, fetchArtistAlbums, fetchArtistTracks, fetchArtistGenres,
	fetchAlbum, fetchAlbumTracks, fetchAlbumGenres,
	fetchGenre,	fetchPlaylist, fetchGenreArtists, fetchGenreAlbums
} from './dataFetching.js'; 
import { menuAddSectionForm, menuAddSectionList, menuBuildSectionList, menuController, menuFilterSectionList  } from './menus.js';
import { tLng, tLngPl } from './i18n.js';



// initialisation
export async function initViews() {
	
	let params;
	let buttons;
	
	// welcome
	// welcomeAlbumsLatestView
	buttons = [ { type: 'DisplayLine', isDefault: true } ];
	params = {
		containerId: 'welcomeAlbumsLatestView',
		type: 'albums',
		display: 'line',
		headerContent: `<span class="section-title">${tLng('views.albumslatest.title')}</span>`,
		headerDisplayButtons: buttons,
		fields: ['artistName'],
	};
	displaySection( params, await sortByMultipleFields( await fetchAlbums(), ['dateAdded'], ['desc']).slice(0, 10) );
	
	// welcomeAlbumsRandomView
	await updateAlbumsRandomView();
	async function updateAlbumsRandomView() {
		buttons = [ { type: 'DisplayLine', isDefault: true } ];
		params = {
			containerId: 'welcomeAlbumsRandomView',
			type: 'albums',
			display: 'line',
			headerContent: `<span id="welcomeAlbumsRandomTitle" class="section-title hover">${tLng('views.albumsrandom.title')}</span>`,
			headerDisplayButtons: buttons,
			fields: ['artistName'],
		};
		displaySection( params, await shuffleArray(await fetchAlbums(), 10) );
		dom.welcomeAlbumsRandomTitle.addEventListener('click', async () => { await updateAlbumsRandomView(); });
	}
	
	// welcomeArtistsRandomView
	await updateArtistsRandomView();
	async function updateArtistsRandomView() {
		buttons = [ { type: 'DisplayLine', isDefault: true } ];
		params = {
			containerId: 'welcomeArtistsRandomView',
			type: 'artists',
			display: 'line',
			headerContent: `<span id="welcomeArtistsRandomTitle" class="section-title hover">${tLng('views.artistsrandom.title')}</span>`,
			headerDisplayButtons: buttons,
			fields: [],
		};
		displaySection( params, await shuffleArray(await fetchArtists(), 10) );
		dom.welcomeArtistsRandomTitle.addEventListener('click', async () => { await updateArtistsRandomView(); });
	}
	// fin welcome
	
	
	// artistes
	let btnArtistsHeader, btnAuthorsHeader;
	btnArtistsHeader = {
		id: 'artistsTypeBtnArtists',
		classList: ['button-artists', 'nav-link', 'nomedia', 'active'],
		icon: 'interpreter',
		title: tLng('views.artists.title'),
	};
	btnAuthorsHeader = {
		id: 'artistsTypeBtnAuthors',
		classList: ['button-artists', 'nav-link', 'nomedia'],
		icon: 'composer',
		title: tLng('views.authors.title'),
	};
	dom.artistsType.innerHTML = '';
	dom.artistsType.appendChild(addButton(btnArtistsHeader));
	dom.artistsType.appendChild(addButton(btnAuthorsHeader));
	buttons = [ { type: 'DisplayGrid', isDefault: true }, { type: 'DisplayList' }, { type: 'LabelAsc', isDefault: true }, { type: 'LabelDesc' }, { type: 'FilterGenre' } ];
	params = {
		containerId: 'artistsView',
		type: 'artists',
		display: 'grid',
		headerContent: null,
		headerDisplayButtons: buttons,
		fields: ['AlphaBar'],
	};
	displaySection(params, await fetchArtists());
	
	
	// compositeurs
	btnArtistsHeader = {
		id: 'authorsTypeBtnArtists',
		classList: ['button-artists', 'nav-link', 'nomedia'],
		icon: 'interpreter',
		title: tLng('views.artists.title'),
	};
	btnAuthorsHeader = {
		id: 'authorsTypeBtnAuthors',
		classList: ['button-artists', 'nav-link', 'nomedia', 'active'],
		icon: 'composer',
		title: tLng('views.authors.title'),
	};
	dom.authorsType.innerHTML = '';
	dom.authorsType.appendChild(addButton(btnArtistsHeader));
	dom.authorsType.appendChild(addButton(btnAuthorsHeader));
	buttons = [ { type: 'DisplayGrid', isDefault: true }, { type: 'DisplayList' }, { type: 'LabelAsc', isDefault: true }, { type: 'LabelDesc' }, { type: 'FilterGenre' } ];
	params = {
		containerId: 'authorsView',
		display: 'grid',
		type: 'artists',
		headerContent: `<span class="section-title">${tLng('views.authors.title')}</span>`,
		headerDisplayButtons: buttons,
		fields: ['AlphaBar'],
	};
	displaySection(params, await fetchAuthors());
	

	// albums
	buttons = [ { type: 'DisplayGrid', isDefault: true }, { type: 'DisplayList' }, { type: 'LabelAsc', isDefault: true }, { type: 'LabelDesc' }, { type: 'DateAsc' }, { type: 'DateDesc' }, { type: 'AddedAsc' }, { type: 'AddedDesc' }, { type: 'FilterGenre' } ];
	params = {
		containerId: 'albumsView',
		type: 'albums',
		display: 'grid',
		headerContent: null,
		headerDisplayButtons: buttons,
		fields: ['artistName', 'AlphaBar'],
	};
	displaySection(params, await fetchAlbums());


	// genres
	buttons = [ { type: 'DisplayColumns', isDefault: true }, { type: 'DisplayList' }, { type: 'LabelAsc', isDefault: true }, { type: 'LabelDesc' } ];
	params = {
		containerId: 'genresView',
		type: 'genres',
		display: 'column',
		headerContent: null,
		headerDisplayButtons: buttons,
		fields: ['AlphaBar'],
	};
	displaySection(params, await fetchGenres());


	// playlists
	buttons = [ { type: 'DisplayColumns', isDefault: true }, { type: 'DisplayList' }, { type: 'LabelAsc', isDefault: true }, { type: 'LabelDesc' } ];
	params = {
		containerId: 'playlistsView',
		type: 'playlists',
		display: 'column',
		headerContent: null,
		headerDisplayButtons: buttons,
		fields: [],
	};
	displaySection(params, await fetchPlaylists());	
}


/**
* génère l'affichage des sections
* @param param:
* 	containerId: id du div contenant la section
* 	headerContent:
* 	type: artists / albums / genres / songs / playlistsSpecial / playlistsFile
* 	headerDisplayButtons: 
*		 liste des boutons d'affichage: DisplayGrid  /DisplayList / LabelAsc / LabelDesc / ArtistAsc / ArtistDesc / AlbumAsc / AlbumDesc / DateAsc / DateDesc / TrackAsc / TrackDesc
* 		 exemple: const displayButtons = [ {type: 'LabelAsc'}, {type: 'LabelDesc', isDefault: true}, {type: 'DateAsc', isDefault: true}, {type: 'DateDesc'} ];
* 	fields: liste des champs à afficher: const showFields = [ 'Artist', 'SongNumber','AlbumName', 'AlphaBar' ];
* @param music: object contenant les éléments musicaux
 */
export async function displaySection(params, music) {
	
	const container = getDom(params.containerId);
	const sectionType = params.type;
	const sectionDisplay = params.display;
	let sectionHeaderContent = params.headerContent;
	const displayButtons = params.headerDisplayButtons;
	const showFields = params.fields;
	const contentDivId = params.containerId + 'Content';
	
	// définition des titres de section
	if (!sectionHeaderContent) {
		if (sectionType === 'artists')			{ sectionHeaderContent = `<span class="section-title">${tLng('views.artists.title')}</span>` }
		else if (sectionType === 'albums')		{ sectionHeaderContent = `<span class="section-title">${tLng('views.albums.title')}</span>` }
		else if (sectionType === 'genres')		{ sectionHeaderContent = `<span class="section-title">${tLng('views.genres.title')}</span>` }
		else if (sectionType === 'tracks')		{ sectionHeaderContent = `<span class="section-title">${tLng('views.tracks.title')}</span>` }
		else if (sectionType === 'playlists')	{ sectionHeaderContent = `<span class="section-title">${tLng('views.playlists.title')}</span>` }
	}
	// définition des titres de boutons (pour tri par LabelAsc ou LabelDesc)
	let btnSortLabel;
	if (sectionType === 'artists')			{ btnSortLabel = tLng('views.btn.sort.artist') }
	else if (sectionType === 'albums')		{ btnSortLabel = tLng('views.btn.sort.album') }
	else if (sectionType === 'genres')		{ btnSortLabel = tLng('views.btn.sort.genre') }
	else if (sectionType === 'tracks')		{ btnSortLabel = tLng('views.btn.sort.song') }
	else if (sectionType === 'playlists')	{ btnSortLabel = tLng('views.btn.sort.playlists') }
	
	// définition des boutons et toggles d'affichage
	const toogleDisplay = 'toggle-' + contentDivId + '-display';
	const toogleSort = 'toggle-' + contentDivId + '-sort';	
	const btnsDisplayDefinition = [
		{ cat: 'disp', type: 'DisplayGrid',		id: contentDivId + 'BtnSortByDisplayGrid', classList: ['button-display-type', toogleDisplay],			icon: 'grid',	title: tLng('views.btn.disp.grid') },
		{ cat: 'disp', type: 'DisplayList',		id: contentDivId + 'BtnSortByDisplayList', classList: ['button-display-type', toogleDisplay],			icon: 'list',	title: tLng('views.btn.disp.list') },
		{ cat: 'disp', type: 'DisplayColumns',	id: contentDivId + 'BtnSortByDisplayCol',  classList: ['button-display-type', toogleDisplay],			icon: 'column',	title: tLng('views.btn.disp.col') },
		{ cat: 'disp', type: 'DisplayLine',		id: contentDivId + 'BtnSortByDisplayLine', classList: ['button-display-type', toogleDisplay, 'hidden'],	icon: 'list',	title: tLng('views.btn.disp.line') },
		
		{ cat: 'sort', type: 'LabelAsc',	id: contentDivId + 'BtnSortByLabelAsc',		classList: ['button-sort-type', toogleSort], icon: 'chevronUp',   title: btnSortLabel,					field: 'name' },
		{ cat: 'sort', type: 'LabelDesc',	id: contentDivId + 'BtnSortByLabelDesc',	classList: ['button-sort-type', toogleSort], icon: 'chevronDown', title: btnSortLabel,					field: 'name' },
		{ cat: 'sort', type: 'ArtistAsc',	id: contentDivId + 'BtnSortByArtistAsc',	classList: ['button-sort-type', toogleSort], icon: 'chevronUp',   title: tLng('views.btn.sort.artist'),	field: 'artist' },
		{ cat: 'sort', type: 'ArtistDesc',	id: contentDivId + 'BtnSortByArtistDesc',	classList: ['button-sort-type', toogleSort], icon: 'chevronDown', title: tLng('views.btn.sort.artist'),	field: 'artist' },
		{ cat: 'sort', type: 'AlbumAsc',	id: contentDivId + 'BtnSortByAlbumAsc',		classList: ['button-sort-type', toogleSort], icon: 'chevronUp',   title: tLng('views.btn.sort.album'),	field: 'album' },
		{ cat: 'sort', type: 'AlbumDesc', 	id: contentDivId + 'BtnSortByAlbumDesc',	classList: ['button-sort-type', toogleSort], icon: 'chevronDown', title: tLng('views.btn.sort.album'),	field: 'album' },
		{ cat: 'sort', type: 'DateAsc',		id: contentDivId + 'BtnSortByDateAsc',		classList: ['button-sort-type', toogleSort], icon: 'chevronUp',   title: tLng('views.btn.sort.date'),	field: 'date' },
		{ cat: 'sort', type: 'DateDesc',	id: contentDivId + 'BtnSortByDateDesc',		classList: ['button-sort-type', toogleSort], icon: 'chevronDown', title: tLng('views.btn.sort.date'),	field: 'date' },
		{ cat: 'sort', type: 'TrackAsc',	id: contentDivId + 'BtnSortByTrackAsc',		classList: ['button-sort-type', toogleSort], icon: 'chevronUp',   title: tLng('views.btn.sort.track'),	field: 'track' },
		{ cat: 'sort', type: 'TrackDesc',	id: contentDivId + 'BtnSortByTrackDesc',	classList: ['button-sort-type', toogleSort], icon: 'chevronDown', title: tLng('views.btn.sort.track'),	field: 'track' },
		{ cat: 'sort', type: 'AddedAsc',	id: contentDivId + 'BtnSortByAddedAsc',		classList: ['button-sort-type', toogleSort], icon: 'chevronUp',   title: tLng('views.btn.sort.added'),	field: 'added' },
		{ cat: 'sort', type: 'AddedDesc',	id: contentDivId + 'BtnSortByAddedDesc',	classList: ['button-sort-type', toogleSort], icon: 'chevronDown', title: tLng('views.btn.sort.added'),	field: 'added' },
		
		{ cat: 'filt', type: 'FilterGenre',	id: contentDivId + 'BtnFiltByGenre',	classList: ['button-filter-type'], icon: 'filter', title: tLng('views.btn.sort.added') }
	];
	const btnsToDisplay = displayButtons.map(btn => {
		const match = btnsDisplayDefinition.find(t => t.type === btn.type);
		return match ? { ...btn, ...match } : btn;
	});
	
	// création de la section
	await createSection({
		containerId: params.containerId,
		type: sectionType,
		header: sectionHeaderContent,
		buttons: btnsToDisplay,
		contentDivId: contentDivId,
		contentDisplay: sectionDisplay,
	});
	
	// création du contenu initial de section
	await createSectionContent({
		contentDivId: contentDivId,
		content: music,
		contentType: sectionType,
		displayType: sectionDisplay,
		showFields: showFields,
	});
	
	// affichage
	if (music?.length > 0) {
		
		// Factory function pour créer les renderers
		const renderFunction = (params) => {
			return () => {
				renderSectionContent({
					...{ contentDivId, showFields, contentType: sectionType },
					...params
				});
			};
		};

		// Map des fonctions de rendu
		const renderMap = {
			// Display types
			'DisplayGrid':		renderFunction( {displayType: 'grid'} ),
			'DisplayList':		renderFunction( {displayType: 'list'} ),
			'DisplayColumns':	renderFunction( {displayType: 'column'} ),
			'DisplayLine':		renderFunction( {displayType: 'line'} ),
			
			// Sort by label
			'LabelAsc':			renderFunction( {sort: {label: 'asc'}} ),
			'LabelDesc':		renderFunction( {sort: {label: 'desc'}} ),
			
			// Sort by artist
			'ArtistAsc':		renderFunction( {sort: {artist: 'asc'}} ),
			'ArtistDesc':		renderFunction( {sort: {artist: 'desc'}} ),
			
			// Sort by album
			'AlbumAsc':			renderFunction(	{sort: {album: 'asc'}} ),
			'AlbumDesc':		renderFunction( {sort: {album: 'desc'}} ),
			
			// Sort by date
			'DateAsc':			renderFunction( {sort: {year: 'asc'}} ),
			'DateDesc':			renderFunction( {sort: {year: 'desc'}} ),
			
			// Sort by track
			'TrackAsc':			renderFunction( {sort: {disc: 'asc', track: 'asc'}} ),
			'TrackDesc':		renderFunction( {sort: {disc: 'desc', track: 'desc'}} ),
			
			// Sort by added
			'AddedAsc':			renderFunction( {sort: {added: 'asc'}} ),
			'AddedDesc':		renderFunction( {sort: {added: 'desc'}} ),
		};

		// création des toggles
		btnsToDisplay.forEach(btn => {
			const renderFn = renderMap[btn.type];
			if (renderFn) { createToggle( getDom(btn.id), btn.cat === 'disp' ? toogleDisplay : toogleSort, renderFn); }
		});

		// Actionne les boutons par défaut
		const btnsDefaultIds = btnsToDisplay.filter(btn => btn.isDefault).map(btn => btn.id);
		btnsDefaultIds.forEach(id => {
			getDom(id)?.click();
		});
		
	} else {
		getDom(contentDivId).innerHTML = '-';
	}
}


/**
* génère le contenu d'une section, avec son entête et son contenu
* @param sectionTitle: titre affiché dans la section 
* @param buttons: objet contenant les boutons
* @param content: contenu (html) de la section
*/
export async function createSection(params) {
	
	const containerId = params.containerId;
	const sectionType = params.type;
	const sectionHeader = params.header;
	const buttons = params.buttons;
	const contentDivId = params.contentDivId;
	const contentDisplay = params.contentDisplay

	const container = getDom(containerId);
	container.innerHTML = '';
	const buttonsDisp = buttons.filter(btn => btn.cat === "disp");
	const buttonsSort = buttons.filter(btn => btn.cat === "sort");
	const buttonsFilt = buttons.filter(btn => btn.cat === "filt");
	let btnParams;

	// construction du div section header
	const sectionHeaderDiv = document.createElement('div');
	sectionHeaderDiv.classList.add('section-header');
	container.appendChild(sectionHeaderDiv);

	// construction de la colonne gauche
	const columnLeft = document.createElement('div');
	columnLeft.classList.add('left-column');
	columnLeft.innerHTML = sectionHeader;
	sectionHeaderDiv.appendChild(columnLeft);
	
	// construction de la colonne droite
	const columnRight = document.createElement('div');
	columnRight.classList.add('right-column');
	sectionHeaderDiv.appendChild(columnRight);
	
	// construction des boutons disp
	buttonsDisp.forEach(btn => {
		btnParams = {
			id: btn.id,
			classList: btn.classList,
			icon: btn.icon,
			title: btn.title,
		};
		columnRight.appendChild(addButton(btnParams));
	});
	
	// construction du menu sort
	if (buttonsSort.length > 0) {
		const menuDefinition = { name: contentDivId + 'Sort', title: tLng('views.btn.sort'), icon: 'sort', datatype: 'sort' };
		await buildMenu(columnRight, menuDefinition, buttonsSort);
	}
	
	// construction du menu filter par genre
	if (buttonsFilt.length > 0) {
		const menuDefinition = { name: contentDivId + 'FilterGenre', title: tLng('views.btn.filtgenre'), icon: 'filter', datatype: 'genre', onCloseFn: filterViewByGenre };
		const genresAll = await fetchGenres();
		const genresSorted = sortByMultipleFields(
			genresAll.map(item => ({ id: item.genreId, label: item.label })),
			['label'],
			['asc']
		);
		genresSorted.unshift( {id: 'none', label: 'Aucun'} );
		await buildMenu(columnRight, menuDefinition, genresSorted);
	}
	
	// construction du div section content
	const sectionContentDiv = document.createElement('div');
	sectionContentDiv.classList.add('handleclick-' + sectionType);
	if (contentDisplay === 'grid') { sectionContentDiv.classList.add('view-grid') }
	else if (contentDisplay === 'column') { sectionContentDiv.classList.add('view-column') }
	else if (contentDisplay === 'line') { sectionContentDiv.classList.add('view-line') }
	sectionContentDiv.id = contentDivId;
	container.appendChild(sectionContentDiv);
}


/**
* crée le contenu de section
* @param contentDivId: id du div contenant la liste
* @param contentType: artist / album / genre / track
* @param content: music
* @param displayType: grid / list / column / line
* @param showFields: [ artistName, albumName, trackNumber ]
* @param sortFields: sortFields
* @param sortOrders: sortOrders
*/
export async function createSectionContent(params) {
	
	const contentDivId = params.contentDivId;
	const contentType = params.contentType;
	const displayType = params.displayType;
	const showFields = params.showFields;
	const content = params.content

	const showArtist = showFields.includes('artistName');
	const showAlbum = showFields.includes('albumName');
	const showTrackNumber = showFields.includes('trackNumber');
	const showGenre = showFields.includes('genreName');
	const showAlphaBar = showFields.includes('AlphaBar');
	
	switch (contentType) {
		
		case 'artists':
		case 'authors':
			createGenericItems(contentDivId, content, {
				smallImage: false,
				itemType: 'artist',
				fieldId: 'artistId',
				fieldLabel: 'artist',
				imageSrc: (artist) => `/library/artist/${artist.artistId}/thumbnail`,
				fallbackImage: 'resources/images/fallback_artists.png',
				subtitles: [
					(artist) => artist.authCount ? tLng('views.artists.author') : '',
				],
				emptyMessage: tLng('views.artists.notfound'),
			});
			break;
				
		case 'albums':
			createGenericItems(contentDivId, content, {
				smallImage: false,
				itemType: 'album',
				fieldId: 'albumId',
				fieldLabel: 'album',
				fieldYear: 'year',
				fieldAdded: 'dateAdded',
				imageSrc: (album) => `/library/album/${album.albumId}/thumbnail`,
				fallbackImage: 'resources/images/fallback_album.png',
				subtitles: [
					(album) => showArtist ? (album.albumArtist || tLng('views.artists.unknown')) : '',
					(album) => (album.year && album.year.length >= 4) ? album.year.slice(0, 4) : '',
				],
				emptyMessage: tLng('views.albums.notfound'),
			});
			break;
			
		case 'genres':
			createGenericItems(contentDivId, content, {
				smallImage: true,
				itemType: 'genre',
				fieldId: 'genreId',
				fieldLabel: 'genre',
				imageSrc: (genre) => 'resources/images/fallback_genre.png',
				fallbackImage: 'resources/images/fallback_genre.png',
				emptyMessage: tLng('views.genres.notfound'),
			});
			break;
			
		case 'playlists':
			createGenericItems(contentDivId, content, {
				smallImage: true,
				itemType: 'playlist',
				fieldId: 'playlistId',
				fieldLabel: 'playlistName',
				imageSrc: (playlist) => playlist.isAutoPlaylist ? 'resources/images/fallback_playlist_dynamic.png' : 'resources/images/fallback_playlist.png',
				fallbackImage: 'resources/images/fallback_playlist.png',
				emptyMessage: tLng('views.playlists.notfound'),
			});
			break;
			
		case 'tracks':
			await createTracks( contentDivId, content, showTrackNumber, showAlbum, showGenre );
	}
	
	// alphabar
	if (showAlphaBar) {
		setupAlphaBar( contentDivId, '.card-title', (contentType === 'artists') );
	}
}


/**
* Fonction générique pour créer items (artists, albums, genres, playlists)
* @param contentDivId: id du div contenant
* @param items: liste des éléments à afficher
* @param displayType: grid/list/columns/line
* @param config: {
*   displayType: grid /list / column / line
*   idField: nom du champ ID (artistId, albumId, etc.)
*	itemType: artist / album / genre / playlist
*   labelField: nom du champ label,
*   fallbackImage: chemin image par défaut,
*   imageSrc: (item) => URL de l'image,
*   subtitles: [(item) => subtitle1, (item) => subtitle2], // optionnel
*   smallImage: true / false // pour genres/playlists
*   emptyMessage: message si vide
* }
*/
function createGenericItems(contentDivId, items, params) {
	
	const container = getDom(contentDivId);
	
	if (!items?.length) {
		container.innerHTML = `<p>${params.emptyMessage}</p>`;
		return;
	}
	
	const displayClass = 'card';
	const imageDisplayClass = params.smallImage ? 'card-image-container small' : 'card-image-container';
	const contentClass = 'card-content';
	const titleClass = 'card-title';
	const subtitleClass = 'card-subtitle';
	
	container.innerHTML = `
		${items.map(item => {
			const id = item[params.fieldId];
			const label = item[params.fieldLabel];
			const year = item[params.fieldYear];
			const added = item[params.fieldAdded];
			const imageSrc = params.imageSrc(item);
			
			const subtitlesHtml = (params.subtitles ?? [])
				.map(fn => fn(item))
				.filter(Boolean)
				.map(sub => `<div class="${subtitleClass}">${sub}</div>`)
				.join('');
				
			const data = {
				[`${params.itemType}id`]:	item[params.fieldId],
				label:						item[params.fieldLabel],
				year:						item[params.fieldYear],
				added:						item[params.fieldAdded]
			};
			const dataAttrs = buildDataAttrs(data);
			
			return `
				<a href="#" class="musitem ${displayClass}" ${dataAttrs}>
					<div class="${imageDisplayClass}">
						<img
							src="${params.fallbackImage}"
							data-src="${imageSrc}"
							alt="${label}"
							class="card-image"
							loading="lazy"
							onerror="this.onerror=null;this.src='${params.fallbackImage}';"
						/>
					</div>
					<div class="${contentClass}">
						<div class="${titleClass}">${label}</div>
						${subtitlesHtml}
					</div>
				</a>
			`;
		}).join('')}
	`;
}


/**
* génère le rendu html des chansons
* @param contentDivId: id du div contenant
* @param tracks: objet contenant
* @param displayType: grid/list/columns
* @param showTrack: boolean
* @param showAlbum: boolean
*/
export async function createTracks(contentDivId, tracks, showTrack = false, showAlbum = false, showGenre = false) {

	const container = getDom(contentDivId);

    if (!tracks || tracks.length === 0) {
        container.innerHTML = `<p>${tLng('views.tracks.notfound')}</p>`;
        return;
    }

	const discCount = new Set(tracks.map(track => track.discNumber).filter(v => v != null)).size;
	
    // génération asynchrone des rows
    const rows = await Promise.all(
        tracks.map(async track => {
			const trackNumber = track.trackNumber
				? discCount > 1
					? `<span class="track-number">${track.discNumber + '. ' + track.trackNumber}.</span>`
					: `<span class="track-number">${track.trackNumber}.</span>`
				: '';
			const songArtistLink = await renderArtistLinks(track.artist, track.artistId);
			const songStars = renderStars(track.rating);
			const songDuration = track.songLength ? `<span class="song-duration">${formatDuration(track.songLength)}</span>` : '';

			let songAlbumLink, songGenreLink;
			if (showAlbum && track.album) { songAlbumLink = `<span class="track-album">${renderAlbumLink(track.album, track.albumId)}</span>`; }
			if (showGenre && track.genre) { songGenreLink = `<span class="track-album">${renderGenreLinks(track.genre, track.genreId)}</span>`; }
			
			const data = {
				songid:	track.songId,
				label:	track.title,
				album:	track.album,
				artist:	track.artist,
				added:	track.dateAdded,
				track:	track.trackNumber,
				disc:	track.discNumber,
				year:	track.year,
			};
			const dataAttrs = buildDataAttrs(data);
			
            return `
                <div class="song-row" ${dataAttrs}>
				
                    <div class="song-left">
                        <button id="playSongButton" class="button-play-song play" title="${tLng('views.btn.play')}">
							${icon('play', 16, 16, []).outerHTML}
                        </button>
                        ${showTrack ? trackNumber : ''}
                        <span class="song-title marquee">${track.title}</span>
                    </div>

                    <div class="song-right">
                        <div class="song-artist-album-block">
                            <div class="song-artist">${songArtistLink}</div>
                            ${showAlbum ? `<div class="song-album">${songAlbumLink}</div>` : ''}
							${showGenre ? `<div class="song-album">${songGenreLink}</div>` : ''}
                        </div>
                        <div class="song-rating">${songStars}</div>
                        ${songDuration}
                        <div class="song-right-buttons-insert">
                            <button id="playSongButtonAddNext" class="button-play-song add-next" title="${tLng('views.btn.addnext')}">
                                ${icon('listAddNext', 16, 16, []).outerHTML}
                            </button>
                            <button id="playSongButtonAddEnd" class="button-play-song add-end" title="${tLng('views.btn.addend')}">
                                ${icon('listAddEnd', 16, 16, []).outerHTML}
                            </button>
                        </div>
                    </div>
                </div>
            `;			
        })
    );
	
	// assemblage
	container.innerHTML = `	${rows.join('')}`;
}


/**
* génère le rendu de section
* @param contentDivId: id du div contenant la liste
* @param music: objet music
* @param displayType: grid/list/columns
* @param sort: {field1: asc, field2: desc}
* @param showFields: []
*/
export function renderSectionContent(params) {
	
	const contentDivId = params.contentDivId;
	const container = getDom(contentDivId);
	const contentType = params.contentType;
	const displayType = params.displayType;
	const sort = params.sort;
	
	// gestion affichage: type
	if (displayType === 'grid')			{ replaceClassByPrefix(container, 'view-', 'view-grid'); }
	else if (displayType === 'list')	{ replaceClassByPrefix(container, 'view-', 'view-list'); }
	else if (displayType === 'column')	{ replaceClassByPrefix(container, 'view-', 'view-column'); }
	else if (displayType === 'line')	{ replaceClassByPrefix(container, 'view-', 'view-line'); }
	
	// gestion affichage: ordre
	if (sort) {	sortByDataset(container, sort, (contentType === 'artists')); }

	
	function sortByDataset(container, sortConfig, normalizeArticle = false) {
		const items = [...container.children];
		const originalIndex = new Map(items.map((el, i) => [el, i]));

		items.sort((a, b) => {
			for (const [datasetName, direction] of Object.entries(sortConfig)) {
				const va = a.dataset[datasetName];
				const vb = b.dataset[datasetName];

				if (va == null && vb == null) continue;
				if (va == null) return direction === 'asc' ? 1 : -1;
				if (vb == null) return direction === 'asc' ? -1 : 1;

				const na = Number(va);
				const nb = Number(vb);

				if (!isNaN(na) && !isNaN(nb)) {
					const diff = na - nb;
					if (diff !== 0) return direction === 'asc' ? diff : -diff;
					continue;
				}

				const left = (normalizeArticle ? normalizeArticleForSort(va) : String(va ?? '')).trim();
				const right = (normalizeArticle ? normalizeArticleForSort(vb) : String(vb ?? '')).trim();

				// 1) comparaison "base" (insensible casse/accents), mais conserve la ponctuation
				let cmp = left.localeCompare(right, undefined, { sensitivity: 'base', numeric: true });
				if (cmp !== 0) return direction === 'asc' ? cmp : -cmp;

				// 2) comparaison plus précise pour distinguer ponctuation / casse si nécessaires
				cmp = left.localeCompare(right, undefined, { sensitivity: 'variant', numeric: true });
				if (cmp !== 0) return direction === 'asc' ? cmp : -cmp;

				// 3) tie-breaker: utiliser un champ id si présent (dataset.labelid / dataset.id)
				const aid = a.dataset[`${datasetName}id`] ?? a.dataset.id ?? null;
				const bid = b.dataset[`${datasetName}id`] ?? b.dataset.id ?? null;
				if (aid != null && bid != null && aid !== bid) {
					const ai = Number(aid), bi = Number(bid);
					if (!isNaN(ai) && !isNaN(bi)) {
						const idDiff = ai - bi;
						if (idDiff !== 0) return direction === 'asc' ? idDiff : -idDiff;
					} else {
						const idCmp = String(aid).localeCompare(String(bid), undefined, { numeric: true });
						if (idCmp !== 0) return direction === 'asc' ? idCmp : -idCmp;
					}
				}

				// 4) dernier recours: préserver l'ordre stable d'origine
				return originalIndex.get(a) - originalIndex.get(b);
			}
			return 0;
		});

		items.forEach(el => container.appendChild(el));
	}	
	
	
	
	
	
}


/**
* Récupère et affiche les détails d'un artiste, ses albums et ses titres.
* @menuInfo infos du menu cliqué
*/
function filterViewByGenre(menuInfo) {
	const key = menuInfo.key;
	const selected = getDomElements(`#${key}MenuSectionList .selected`);
	
	if (selected.length > 0) {
		const genreId = selected[0].id;
		switch (key) {
			case 'artistsViewContentFilterGenre':
				manageVisibility(genreId, 'artistsViewContent', 'artistid');
				break;
				
			case 'authorsViewContentFilterGenre':
				manageVisibility(genreId, 'authorsViewContent', 'artistid');
				break;
				
			case 'albumsViewContentFilterGenre':
				manageVisibility(genreId, 'albumsViewContent', 'albumid');
				break;
		}
	}
	
	// utilitaire de gestion d'affichage
	async function manageVisibility(genreId, viewDivId, type) {
		if (genreId === 'none') {
			document.querySelectorAll(`#${viewDivId} a.musitem`).forEach(card => {
				const id = card.dataset[type];
				card.classList.remove('hidden');
			});
		}
		else {
			let allowedIds;
			switch (type) {
				case 'artistid':
					const filteredArtists = await fetchGenreArtists(genreId);
					allowedIds = filteredArtists.flatMap(item => item.artistId);
					document.querySelectorAll(`#${viewDivId} a.musitem`).forEach(card => {
						const id = card.dataset.artistid;
						card.classList.toggle('hidden', !allowedIds.includes(id));
					});
					break;
					
				case 'albumid':
					const filteredAlbums = await fetchGenreAlbums(genreId);
					allowedIds = filteredAlbums.flatMap(item => item.albumId);
					document.querySelectorAll(`#${viewDivId} a.musitem`).forEach(card => {
						const id = card.dataset.albumid;
						card.classList.toggle('hidden', !allowedIds.includes(id));
					});
			}
		}
	}
}


/**
* Récupère et affiche les détails d'un artiste, ses albums et ses titres.
* @param {number} artistId - l'id de l'artiste
*/
export async function displayArtistDetails(artistId) {
	
	// récupération des détails de l'artiste	
	const artistDetails = await fetchArtist(artistId);
	const artistGenres = await fetchArtistGenres(artistId);	
	const artistAlbums = await fetchArtistAlbums(artistId);
	const artistSongs = await fetchArtistTracks(artistId);
	
	// Affichage
	if (artistDetails) {
		const audioDb = await getInfoFromTheAudioDB({ searchType: 'artist', artistName: artistDetails.artist });
		const description = audioDb?.biography ? audioDb.biography : null;
		const paramsPlayButtons = {	name: 'Artist', type: 'artist', marginTop: '32px', data: {artistid: artistDetails.artistId}, };
		
		const infoParts = [];
		if (artistDetails.albumsCount)	{ infoParts.push(`<span>${tLngPl('views.albums.count', artistDetails.albumsCount)}</span>`); }
		if (artistDetails.tracksCount)	{ infoParts.push(`<span>${tLngPl('views.tracks.count', artistDetails.tracksCount)}</span>`); }
		if (artistDetails.authCount)	{ infoParts.push(`<span>${tLngPl('views.auth.count', artistDetails.authCount)}</span>`); }

		dom.artistDetailsContent.innerHTML = `
			<div class="music-detail-header">
				<div class="music-detail-image-container">
					<img
						src="resources/images/fallback_artists.png"
						data-src="/library/artist/${artistDetails.artistId}/thumbnail"
						alt="${artistDetails.artist}"
						loading="lazy"
						onerror="this.onerror=null;this.src='resources/images/fallback_artists.png';"
					>
				</div>
				<div class="music-detail">
					<span class="music-detail-label marquee">${artistDetails.artist}</span>
					<span class="music-detail-info text-medium"">${artistGenres?.genre.split(';').join('&nbsp;&nbsp;&bull;&nbsp;&nbsp;') || ''}</span>
					<span class="music-detail-info">${infoParts.join('&nbsp;&nbsp;&bull;&nbsp;&nbsp;')}</span>
					${renderPlayButtons(paramsPlayButtons).outerHTML}
				</div>
			</div>
			${description ? `
				<section class="music-detail-description section-block">
					${description}
				</section>
			` : ''}
			<div id="artistDetailsAlbums" class="section-block">
			</div>
			<div id="artistDetailsSongs" class="section-block">
			</div>
		`;

		let params, buttons;
		// liste des albums
		buttons = [ { type: 'DisplayGrid', isDefault: true }, { type: 'DisplayList' }, { type: 'LabelAsc' }, { type: 'LabelDesc' }, { type: 'DateAsc' }, { type: 'DateDesc', isDefault: true } ];
		params = {
			containerId: 'artistDetailsAlbums',
			type: 'albums',
			display: 'grid',
			headerContent: null,
			headerDisplayButtons: buttons,
			fields: [],
		};
		displaySection(params, artistAlbums);
		
		// liste des titres
		buttons = [ { type: 'LabelAsc', isDefault: true }, { type: 'LabelDesc' }, { type: 'AlbumAsc' }, { type: 'AlbumDesc' }, { type: 'DateAsc' }, { type: 'DateDesc' }, { type: 'AddedAsc' }, { type: 'AddedDesc' } ];
		params = {
			containerId: 'artistDetailsSongs',
			type: 'tracks',
			headerContent: null,
			headerDisplayButtons: buttons,
			fields: ['albumName'],
		};
		displaySection(params, artistSongs);
		
		// fanart
		updateFanart('artistDetailsContainer', artistDetails.artist);
		
	} else {
		dom.artistDetailsContent.innerHTML = `<p>${tLng('views.nodetails')}</p>`;
	}
}


/**
* Récupère et affiche les détails d'un album
* @param {number} albumId - l'id de l'album
*/
export async function displayAlbumDetails(albumId) {
	
	// récupération des détails de l'album
	const albumDetails = await fetchAlbum(albumId);
	const albumSongs = await fetchAlbumTracks(albumId);
	const albumGenres = await fetchAlbumGenres(albumId);
	
	// Affichage
	if (albumDetails) {
		const audioDb = await getInfoFromTheAudioDB({ searchType: 'album', artistName: albumDetails.albumArtist, albumName: albumDetails.album });
		const description = audioDb?.description ? audioDb.description : null;
		const albumArtistId = albumDetails.albumArtistId;
		const albumArtistlink = renderArtistLinks( [albumDetails.albumArtist], [albumArtistId] );
		const year = (albumDetails.year && albumDetails.year.length >= 4) ? albumDetails.year.slice(0, 4) : '';
		const counts = albumDetails.discsCount > 1
			? `<span class="music-detail-info">${tLngPl('views.tracks.count', albumDetails.tracksCount) + ' (' + tLngPl('views.discs.count', albumDetails.discsCount) + ')'}</span>`
			: `<span class="music-detail-info">${tLngPl('views.tracks.count', albumDetails.tracksCount)}</span>`;

		const dateAdded = popDate(albumDetails.dateAdded);
		const paramsPlayButtons = {	name: 'Album', type: 'album', marginTop: '32px', data: {albumid: albumId}, };

		const infoParts = [];
		if (albumArtistlink)	{ infoParts.push(`<span class="info-artist">${albumArtistlink}</span>`); }
		if (year)				{ infoParts.push(`<span>${year}</span>`); }
		
		dom.albumDetailsContent.innerHTML = `
			<div class="music-detail-header">
				<div class="music-detail-image-container">
					<img
						src="resources/images/fallback_artists.png"	
						data-src="/library/album/${albumDetails.albumId}/thumbnail"
						alt="${albumDetails.album}"
						loading="lazy"
						onerror="this.onerror=null;this.src='resources/images/fallback_album.png';"
					>
				</div>
				<div class="music-detail">
					<span class="music-detail-label marquee">${albumDetails.label}</span>
					<span class="music-detail-info text-medium">${infoParts.join('&nbsp;&nbsp;&bull;&nbsp;&nbsp;')}</span>
					<div class="music-detail-wrapper">
						<span class="music-detail-info text-medium">${albumGenres?.genre.split(';').join('&nbsp;&nbsp;&bull;&nbsp;&nbsp;') || ''}</span>
					</div>
					<span class="music-detail-info">${counts}</span>
					<span class="music-detail-info">${tLng('views.albums.dateAdded')}${dateAdded}</span>
					${renderPlayButtons(paramsPlayButtons).outerHTML}
				</div>
			</div>
			${description ? `
				<section class="music-detail-description section-block">
					${description}
				</section>
			` : ''}
			<div id="albumDetailsSongs" class="section-block">
			</div>
		`;
		
		let params, buttons;
		// liste des titres
		buttons = [ { type: 'TrackAsc', isDefault: true }, { type: 'TrackDesc' }, { type: 'LabelAsc' }, { type: 'LabelDesc' } ];
		params = {
			containerId: 'albumDetailsSongs',
			type: 'tracks',
			headerContent: null,
			headerDisplayButtons: buttons,
			fields: ['trackNumber', 'artistName', 'genreName'],
		};
		displaySection(params, albumSongs);
		
		// fanart
		updateFanart('albumDetailsContainer', albumDetails.albumArtist);

	} else {
		dom.albumDetailsContent.innerHTML = `<p>${tLng('views.nodetails')}</p>`;
	}
}


/**
* Récupère et affiche les détails d'un album
* @param {number} genreId - l'id du genre
* @param {number} genreName - le nom du genre
*/
export async function displayGenreDetails(genreId) {
	
	// récupération des infos du genre
	const genreDetails = await fetchGenre(genreId);
	
	// Affichage
	if (genreDetails) {
		const paramsPlayButtons = {	name: 'Genre', type: 'genre', marginTop: '32px', data: {genreid: genreId}, };
		dom.genreDetailsContent.innerHTML = `
			<div class="music-detail-header">
				<div class="music-detail-image-container">
					<img src="resources/images/fallback_genre.png" alt="${genreDetails.label}" class="music-detail-image" loading="lazy">
				</div>
				<div class="music-detail">
					<span class="music-detail-label">${genreDetails.label}</span>
					<span class="music-detail-info">${tLngPl('views.tracks.count', genreDetails.tracksCount)}</span>
					${renderPlayButtons(paramsPlayButtons).outerHTML}
				</div>
			</div>
			<div id="genreDetailsSongs" class="section-block">
			</div>
		`;
		
		let params, buttons;
		// liste des titres
		buttons = [ { type: 'LabelAsc', isDefault: true }, { type: 'LabelDesc' }, { type: 'AlbumAsc' }, { type: 'AlbumDesc' }, { type: 'ArtistAsc' }, { type: 'ArtistDesc' }, { type: 'AddedAsc' }, { type: 'AddedDesc' } ];
		params = {
			containerId: 'genreDetailsSongs',
			type: 'tracks',
			headerContent: null,
			headerDisplayButtons: buttons,
			fields: ['albumName'],
		};
		displaySection(params, genreDetails.tracks);	

	} else {
		dom.genreDetailsContent.innerHTML = `<p>${tLng('views.nodetails')}</p>`;
	}
}


/**
 * Récupère et affiche les détails d'une playlist.
 * @param {string} playlistPath - Path de la playlist.
 * @param {string} playlistName - Nom de la playlist.
 */
export async function displayPlaylistDetails(playlistId) {
	
	// récupération des chansons de la playlist
	const playlistDetails = await fetchPlaylist(playlistId);
	
	// Affichage
	if (playlistDetails) {
		
		let sectionTitle;
		sectionTitle = tLng('views.playlists.section.track');
		const paramsPlayButtons = {	name: 'Playlist', type: 'playlist', marginTop: '32px', data: {playlistId: playlistDetails.playlistId} };

		dom.playlistDetailsContent.innerHTML = `
			<div class="music-detail-header">
				<div class="music-detail-image-container">
					<img src="resources/images/fallback_playlist.png" alt="${playlistDetails.label}" class="music-detail-image" loading="lazy">
				</div>
				<div class="music-detail">
					<span class="music-detail-label">${playlistDetails.label}</span>
					<span class="music-detail-info">${playlistDetails.tracksCount} ${sectionTitle}</span>
					${renderPlayButtons(paramsPlayButtons).outerHTML}
				</div>
			</div>
			<div id="playlistDetailsElements" class="section-block">
				<!-- liste des éléments (artists, albums, songs) -->
			</div>
		`;
		
		let params, buttons;
		
		// === 3. Cas SONG ===
		buttons = [ { type: 'LabelAsc', isDefault: true }, { type: 'LabelDesc' }, { type: 'AlbumAsc' }, { type: 'AlbumDesc' }, { type: 'ArtistAsc' }, { type: 'ArtistDesc' }, { type: 'AddedAsc' }, { type: 'AddedDesc', isDefault: true } ];
		params = {
			containerId: 'playlistDetailsElements',
			type: 'tracks',
			headerContent: null,
			headerDisplayButtons: buttons,
			fields: ['albumName'],
		};			
		displaySection(params, shuffleArray(playlistDetails.tracks));

	} else {
		dom.playlistDetailsContent.innerHTML = `<p>${tLng('views.nodetails')}</p>`;
	}
}


// Utilitaire pour générer les liens artistes
export function renderArtistLinks(artists, artistIds) {
    if (!artists || artists.length === 0) return tLng('views.artists.unknown');
    return artists.map((name, i) => {
        const id = artistIds?.[i] ?? null;
        return id !== null
            ? `<a href="#" class="artist-link" data-artistid="${id}">${name}</a>`
            : name;
    }).join('<span class="artist-link">,&nbsp;</span>');
}


// Utilitaire pour générer le lien album
export function renderAlbumLink(album, albumId) {
    if (!album || !albumId) return tLng('views.albums.unknown');
    return `<a href="#" class="album-link" data-albumid="${albumId}">${album}</a>`;
}


// Utilitaire pour générer les liens genres
export function renderGenreLinks(genres, genreIds) {
    if (!genres || genres.length === 0) return tLng('views.genres.unknown');
    return genres.map((name, i) => {
        const id = genreIds?.[i] ?? null;
        return id !== null
            ? `<a href="#" class="genre-link" data-genreid="${id}">${name}</a>`
            : name;
    }).join('<span class="genre-link">,&nbsp;</span>');
}


// Utilitaire pour générer les boutons de lecture
export function renderPlayButtons(params) {
	// params = {
		// name: 'Album',
		// type: 'album',
		// data: {albumid: albumId}, 
	// };
		
	// construction du div play buttons
	const buttonsDiv = document.createElement('div');
	buttonsDiv.classList.add('music-detail-playbuttons');
	
	let btnParams;
	// bouton Lire
	btnParams = {
		id: 'btnPlay' + params.name,
		classList: ['button-play-all', params.type, 'play', 'highlight'],
		icon: 'play',
		title: 'Lire',
		data: params.data,
	};
	buttonsDiv.appendChild(addButton(btnParams));
	
	// bouton add next
	btnParams = {
		id: 'btnPlay' + params.name + 'AddNext',
		classList: ['button-play-all', params.type, 'add-next'],
		icon: 'addnext',
		title: 'Suite',
		data: params.data,
	};
	buttonsDiv.appendChild(addButton(btnParams));
	
	// bouton add end
	btnParams = {
		id: 'btnPlay' + params.name + 'AddEnd',
		classList: ['button-play-all', params.type, 'add-end'],
		icon: 'addend',
		title: 'Dernier',
		data: params.data,
	};
	buttonsDiv.appendChild(addButton(btnParams));
	
	return buttonsDiv;
}


/**
 * création des boutons/menus de règles
 * containerId: id DOM du container pour le bouton/menu
 * menuDefinition: définition du menu { name: 'Name', datatype: 'Artist'/'Genre'/'Mood'/'Rating', title: 'Title' }
 * menuContent: liste à afficher dans le menu [ {id: 'Id', label : 'Label'} ]
 */
async function buildMenu(container, menuDefinition, menuContent) {
	
	// construction du div contenant
	const menuDivId = document.createElement('div');
	menuDivId.classList.add('menu');

	// construction du bouton trigger
	const btnParams = {
		id: menuDefinition.name + 'MenuTrigger',
		classList: ['button-display-type'],
		icon: menuDefinition.icon,
		title: menuDefinition.title,
	};

	// construction du div dropdown
	const menuDropdown = document.createElement('div');
	menuDropdown.classList.add('menu-dropdown', 'wauto', 'alignright');
	menuDropdown.id = menuDefinition.name + 'MenuDropdown';

	// assemblage dans les contenants
	menuDivId.appendChild(addButton(btnParams));
	menuDivId.appendChild(menuDropdown);
	container.appendChild(menuDivId);
	
	// définition de la hauteur maximale du menu
	const maxHeight = `calc(100dvh - 300px)`;
		
	// création du contenu du menu
	buildMenuContent(menuDefinition, menuDropdown, menuContent);

	// gestion affichage: enregistrer le trigger auprès du contrôleur global
	const menuTrigger = await getDom(menuDefinition.name + 'MenuTrigger');
	menuController.unregister(menuDefinition.name); // supprime l'enregistrement d'un trigger identique précédent
    menuController.register({
		key: menuDefinition.name,
		trigger: menuTrigger,
		dropdown: menuDropdown,
		maxHeight: maxHeight,
		onClose: (menuInfo) => { menuDefinition.onCloseFn?.(menuInfo) }
    });
}


/**
 * création des contenu de menu
 * menuDefinition: définition du menu { name: 'Name', datatype: 'Artist'/'Genre'/'Mood'/'Rating', title: 'Title' }
 * menuDropdown: élément Dom du drop down à remplir
 * menuContent: liste à afficher dans le menu [ {id: 'Id', label : 'Label'} ]
 */
async function buildMenuContent(menuDefinition, menuDropdown, menuContent) {

	switch (menuDefinition.datatype) {
		
		case 'genre':
			await menuAddSectionForm(menuDropdown, menuDefinition.name + 'MenuSectionForm', 'Genres');
			menuAddSectionList(menuDropdown, menuDefinition.name + 'MenuSectionList');
			menuBuildSectionList({
				containerId: menuDefinition.name + 'MenuSectionList',
				dataType: menuDefinition.datatype,
				content: menuContent,
				selectType: 'mono',
				// onClickCallback: () => {},
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
			
		case 'sort':
			menuAddSectionList(menuDropdown, menuDefinition.name + 'MenuSectionList');
			
			// ajout des boutons sort au menu section list			
			const sortSectionList = getDom(menuDefinition.name + 'MenuSectionList');
			const btnGrouped = Object.groupBy(menuContent, item => item.field);		
			for (const field in btnGrouped) {
				const btnField = menuContent.filter(btn => btn.field === field);		
				const sortSectionRow = document.createElement('div');
				sortSectionRow.classList.add('menu-item', 'nohover', 'font100');
				sortSectionList.appendChild(sortSectionRow);
				
				btnField.forEach(btn => {
					const btnParams = {
						id:btn.id,
						classList: btn.classList,
						icon: btn.icon,
					};
					sortSectionRow.appendChild(addButton(btnParams));
				});
				
				const span = document.createElement('span');
				span.textContent = btnField[0].title;
				sortSectionRow.appendChild(span);
			}
		
			break;
	}
}


// Utilitaire pour générer les boutons d'affichage
function addButton(params) {
	// const btnParams = {
		// id: params.id,
		// classList: params.classList,
		// icon: params.icon,
		// title: params.title,
		// data: params.data,
	// };
	
	let iconClass = [], titleClass = [];
	if (params.title) {
		iconClass.push('button-svg');
		titleClass.push('button-title');
	}
	
	// créaton du bouton
	const btn = document.createElement('button');
	btn.id = params.id;
	btn.classList.add(...params.classList);
	
	// icone
	if (params.icon == 'grid')				{ btn.appendChild(icon('displayGrid', 24, 24, iconClass));}
	else if (params.icon == 'list')			{ btn.appendChild(icon('displayList', 24, 24, iconClass));}
	else if (params.icon == 'column')		{ btn.appendChild(icon('displayColumn', 24, 24, iconClass));}
	else if (params.icon == 'sort')			{ btn.appendChild(icon('displaySort', 24, 24, iconClass));}
	else if (params.icon == 'chevronUp')	{ btn.appendChild(icon('chevronUp', 24, 24, iconClass));}
	else if (params.icon == 'chevronDown')	{ btn.appendChild(icon('chevronDown', 24, 24, iconClass));}
	else if (params.icon == 'play')			{ btn.appendChild(icon('play', 24, 24, iconClass));}
	else if (params.icon == 'addnext')		{ btn.appendChild(icon('listAddNext', 24, 24, iconClass));}
	else if (params.icon == 'addend')		{ btn.appendChild(icon('listAddEnd', 24, 24, iconClass));}
	else if (params.icon == 'interpreter')		{ btn.appendChild(icon('interpreter', 24, 24, iconClass));}
	else if (params.icon == 'composer')		{ btn.appendChild(icon('composer', 24, 24, iconClass));}
	else if (params.icon == 'filter')		{ btn.appendChild(icon('displayFilter', 24, 24, iconClass));}
	
	// titre
	const span = document.createElement('span');
	span.classList.add(...titleClass);
	span.textContent = params.title;
	btn.appendChild(span);

	// attributs supplémentaires
	if (params.data) {
		Object.entries(params.data).forEach(([key, value]) => { btn.setAttribute(`data-${key}`, value); });
	}

	return btn;
}


// Utilitaire pour générer les data- pour objets html
function buildDataAttrs(obj) {
    return Object.entries(obj)
        .filter(([_, v]) => v != null && v !== '')
        .map(([k, v]) => `data-${k}="${v}"`)
        .join(' ');
}

