/**
 * js/utils.js
 * Ce fichier contient les fonctions liées au routage de navigations
 */

// log('[router.js][function] var', var);

import { domElements, getDom } from './domElements.js';
const dom = new Proxy(domElements, { get(target, prop) {return target[prop]?.();} });

import { displayArtistDetails, displayAlbumDetails, displayGenreDetails, displayPlaylistDetails } from './views.js';
import { log, setMarquee, observeMarqueesOnPage } from './utils.js';



// Initialisation
export const activeContainer = {
	id: null,
};
const hashHistory = [];
const viewHistory = {
	artists: '#/artists',
	authors: '#/authors',
	albums: '#/albums',
	genres: '#/genres',
	playlists: '#/playlists',
}
const scrollMemory = {};
let isGoingBack = false;
const routeConfigs = [
	{ path: '#/welcome', action: () => 		{ showContainer('welcomeContainer', scrollMemory['#/welcome']); } },
	{ path: '#/artists', action: () => 		{ showContainer('artistsContainer', scrollMemory['#/artists']); } },
	{ path: '#/authors', action: () => 		{ showContainer('authorsContainer', scrollMemory['#/authors']); } },
	{ path: '#/albums', action: () => 		{ showContainer('albumsContainer', scrollMemory['#/albums']); } },
	{ path: '#/genres', action: () => 		{ showContainer('genresContainer', scrollMemory['#/genres']); } },
	{ path: '#/playlists', action: () => 	{ showContainer('playlistsContainer', scrollMemory['#/playlists']); } },
	{ path: '#/dynlist', action: () => 		{ showContainer('dynListContainer', scrollMemory['#/dynlist']); } },
	
	{ path: '#/nowplaying', action: () => 	{ showContainer('npContainer'); } },
	{ path: '#/search', action: () => 		{ showContainer('searchContainer', scrollMemory['#/search']); } },

	{ path: '#/artist/:id', action: async ({id}) =>	{
		if (rebuildView('artists')) { await displayArtistDetails(parseInt(id)); }
		showContainer('artistDetailsContainer', scrollMemory['#/artist/' + id]);
	} },
	
	{ path: '#/album/:id', action: async ({id}) => {
		if (rebuildView('albums')) { await displayAlbumDetails(parseInt(id)); }
		showContainer('albumDetailsContainer', scrollMemory['#/album/' + id]);
	} },
	
	{ path: '#/genre/:id', action: async ({id}) => {
		if (rebuildView('genres')) { await displayGenreDetails(parseInt(id)); }
		showContainer('genreDetailsContainer', scrollMemory['#/genre/' + id]);
	} },
	
	{ path: '#/playlist/:id', action: async ({id}) => {
		if (rebuildView('playlists')) { await displayPlaylistDetails(parseInt(id)); }
		showContainer('playlistDetailsContainer', scrollMemory['#/playlist/' + id]);
	} }
];
let compiledRoutes = [];
const domCache = {
	containerViews: [],
	containerDetails: [],
	navLinks: [],
	containerMap: {},
	navMap: {}
};


function cacheDomElements() {
	domCache.containerViews = document.querySelectorAll('.container-view');
	domCache.containerDetails = document.querySelectorAll('.container-details');
	domCache.navLinks = document.querySelectorAll('.nav-link');
	
	domCache.containerMap = {
		welcomeContainer: dom.welcomeContainer,
		artistsContainer: dom.artistsContainer,
		authorsContainer: dom.authorsContainer,
		albumsContainer: dom.albumsContainer,
		genresContainer: dom.genresContainer,
		playlistsContainer: dom.playlistsContainer,
		dynListContainer: dom.dynListContainer,
		npContainer: dom.npContainer,
		searchContainer: dom.searchContainer,
		artistDetailsContainer: dom.artistDetailsContainer,
		albumDetailsContainer: dom.albumDetailsContainer,
		genreDetailsContainer: dom.genreDetailsContainer,
		playlistDetailsContainer: dom.playlistDetailsContainer
	};
	
	domCache.navMap = {
		welcomeContainer: dom.navWelcome,
		artistsContainer: dom.navArtists,
		artistDetailsContainer: dom.navArtists,
		authorsContainer: dom.navArtists,
		albumsContainer: dom.navAlbums,
		albumDetailsContainer: dom.navAlbums,
		genresContainer: dom.navGenres,
		genreDetailsContainer: dom.navGenres,
		playlistsContainer: dom.navPlaylists,
		playlistDetailsContainer: dom.navPlaylists,
		dynListContainer: dom.navDynList,
		npContainer: dom.navNowPlaying,
		searchContainer: null
	};
}


function compileRoutes() {
	compiledRoutes = routeConfigs.map(config => {
		const paramNames = [];
		const regexPath = config.path.replace(/:([a-zA-Z]+)/g, (_, key) => {
			paramNames.push(key);
			return '([^/]+)';
		});
		
		return {
			...config,
			regex: new RegExp('^' + regexPath + '$'),
			paramNames
		};
	});
}


function parseRoute(hash) {
	for (const route of compiledRoutes) {
		const match = hash.match(route.regex);
		
		if (match) {
			const params = {};
			route.paramNames.forEach((key, i) => {
				params[key] = match[i + 1];
			});
			return { action: route.action, params };
		}
	}
	return null;
}


// initialisation du browsing
export function initBrowsing() {
	// Compile les routes UNE SEULE FOIS au démarrage
	compileRoutes();
	
	// Cache les éléments DOM critiques UNE SEULE FOIS
	cacheDomElements();
	
	const hash = location.hash;
	const route = parseRoute(hash);
	
	// initialise l'historique
	hashHistory.push(hash);
	
	// ajoute l'écouteur du changement de hash
	window.addEventListener('hashchange', async () => {
		const hash = location.hash;
		navigateTo(hash);
	});
	
	// démarre le browsing
	if (hash)	{ route.action(route.params || {}); }
	else		{ updateHash('#/nowplaying'); }
}


/**
 * Définit la vue à afficher
 */
export function showView(view) {
	const viewRoutes = {
		welcome:	'#/welcome',
		artists:	location.hash.startsWith('#/artist/') ? '#/artists' : viewHistory.artists,
		authors:	location.hash.startsWith('#/authors/') ? '#/authors' : viewHistory.authors,
		albums:		location.hash.startsWith('#/album/') ? '#/albums' : viewHistory.albums,
		genres:		location.hash.startsWith('#/genre/') ? '#/genres' : viewHistory.genres,
		playlists:	location.hash.startsWith('#/playlist/') ? '#/playlists' : viewHistory.playlists,
		dynlist:	'#/dynlist',
		nowplaying:	'#/nowplaying'
	};
	
	const route = viewRoutes[view];
	updateHash(route);
}


// utilitaire pour determiner s'il est nécessaire de reconstruire la view xxxDetails (retour sur le même artiste, album, etc)
function rebuildView(view) {
	if (location.hash === viewHistory[view]) {return false;}
	else {return true;}
}


/**
 * affiche une vue spécifique et masque les autres
 * @param {string} containerId - L'ID du conteneur à afficher
 * @param {int} scrollPos - position du scrollY
 */
function showContainer(containerId, scrollPos = 0) {
	// Masque les conteneurs - utilise le CACHE au lieu de querySelectorAll
	domCache.containerViews.forEach(cont => { cont.classList.add('hidden') });
	domCache.containerDetails.forEach(cont => { cont.classList.add('hidden') });
	
    // Afficher le conteneur désiré (utilise le cache)
	const containerToShow = domCache.containerMap[containerId];
    if (containerToShow) {
        containerToShow.classList.remove('hidden');
		dom.mainContainer.scrollTop = scrollPos;
		
		// initialise tous les marquees de la page
		containerToShow.querySelectorAll('.marquee').forEach(setMarquee);
		
		// observe les marquee et leurs changements sur la page
		observeMarqueesOnPage(containerToShow);
    }
	
    // mettre à jour la classe 'active' sur les navLinks
    domCache.navLinks.forEach(link => { link.classList.remove('active') });
	const navElement = domCache.navMap[containerId];
	if (navElement) {
		navElement.classList.add('active');
	}
	
	// mettre le focus sur l'input de recherche si conteneur recherche affiché 
	if (containerId === 'searchContainer') {
		const searchInput = getDom('searchFormGeneral');
		if (searchInput) {setTimeout(() => searchInput.focus(), 50);}
	}
	
	// mettre à jour la const globale activeContainer
	activeContainer.id = containerId;
}


export function updateHash(newHash) {
	const currentHash = location.hash;
	
	// Mémorise l'état de la vue actuelle
	const viewMemoryMap = {
		artist: 'artists',
		album: 'albums',
		genre: 'genres',
		playlist: 'playlists'
	};

	for (const [type, key] of Object.entries(viewMemoryMap)) {
		if ( currentHash.startsWith('#/' + type) ) {
				viewHistory[key] = currentHash;
			break;
		}
	}

	// Mémorise la position du scroll de la vue actuelle
	scrollMemory[decodeURIComponent(currentHash)] = dom.mainContainer.scrollTop;
	
	// Met à jour le hash
	const path = newHash.startsWith('#') ? newHash.slice(1) : newHash;
	location.hash = path;
}


function navigateTo(newHash) {	
	// Met à jour l'historique
	updateHashHistory(newHash);

	// Va vers la destination
	const route = parseRoute(newHash);	
	if (route)	{ route.action(route.params || {}); }
	else		{ console.warn('[navigateTo] Route not found:', newHash);}
}


function updateHashHistory(newHash) {
	if (!isGoingBack) {
		if ( hashHistory[hashHistory.length - 1] !== newHash ) { hashHistory.push(newHash) }
	}
	else {
		hashHistory.pop();
		isGoingBack = false;
	}
}


export function goBack() {
	if (hashHistory.length > 1) {
		isGoingBack = true;
		const previousHash = hashHistory[hashHistory.length - 2];
		if (previousHash) {	updateHash(previousHash); }
	}
}


export function goParent() {
	const currentHash = location.hash;
	
	const parentRoutes = {
		artist: '#/artists',
		album: '#/albums',
		genre: '#/genres',
		playlist: '#/playlists'
	};

	for (const [key, parent] of Object.entries(parentRoutes)) {
		if (currentHash.startsWith('#/' + key)) {
			updateHash(parent);
			return;
		}
	}
}

