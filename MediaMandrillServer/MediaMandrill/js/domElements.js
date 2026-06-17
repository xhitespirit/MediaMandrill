/**
 * js/domElements.js
 * Ce fichier contient les éléments du DOM
 */
 
// log('[domElements.js][function] var', var);


/**
 * constante regroupant la principaux éléments DOM figés 
 */
export const domElements = {
	
	// conteneur principal
	mainContainer: () => document.getElementById('mainContainer'),
	
	// navigation
	navBar: () => document.getElementById('navBar'),
	navButtonBurger: () => document.getElementById('navButtonBurger'),
	navButtonSearch: () => document.getElementById('navButtonSearch'),
	navWelcome: () => document.getElementById('navWelcome'),
	navArtists: () => document.getElementById('navArtists'),
	navAuthors: () => document.getElementById('navAuthors'),
	navAlbums: () => document.getElementById('navAlbums'),
	navGenres: () => document.getElementById('navGenres'),
	navPlaylists: () => document.getElementById('navPlaylists'),
	navDynList: () => document.getElementById('navDynList'),
	navNowPlaying: () => document.getElementById('navNowPlaying'),
	
	// menu Burger
	burgerMenuTrigger: () => document.getElementById('burgerMenuTrigger'),
	burgerMenuDropdown: () => document.getElementById('burgerMenuDropdown'),
	burgerMenuPlayers: () => document.getElementById('burgerMenuPlayers'),
	burgerMenuStats: () => document.getElementById('burgerMenuStats'),
	burgerMenuTestFunction: () => document.getElementById('burgerMenuTestFunction'),
	burgerMenuRefreshViews: () => document.getElementById('burgerMenuRefreshViews'),
	burgerMenuRefreshCache: () => document.getElementById('burgerMenuRefreshCache'),
	burgerMenuLangEn: () => document.getElementById('burgerMenuLangEn'),
	burgerMenuLangFr: () => document.getElementById('burgerMenuLangFr'),
	burgerMenuCertificate: () => document.getElementById('burgerMenuCertificate'),

	
	// vue welcome
	welcomeContainer: () => document.getElementById('welcomeContainer'),
	welcomeAlbumsLatestView: () => document.getElementById('welcomeAlbumsLatestView'),
	welcomeAlbumsRandomView: () => document.getElementById('welcomeAlbumsRandomView'),
	welcomeArtistsRandomView: () => document.getElementById('welcomeArtistsRandomView'),
	welcomeArtistsRandomTitle: () => document.getElementById('welcomeArtistsRandomTitle'),
	welcomeAlbumsRandomTitle: () => document.getElementById('welcomeAlbumsRandomTitle'),
	
	// vue recherche
	searchContainer: () => document.getElementById('searchContainer'),
	searchFormGeneral: () => document.getElementById('searchFormGeneral'),
	searchResultsContent: () => document.getElementById('searchResultsContent'),
	searchViewBtnClose: () => document.getElementById('searchViewBtnClose'),
	searchViewBtnUp: () => document.getElementById('searchViewBtnUp'),

	// vue artistes
	artistsContainer: () => document.getElementById('artistsContainer'),
	artistsType: () => document.getElementById('artistsType'),
	artistsView: () => document.getElementById('artistsView'),
	authorsView: () => document.getElementById('authorsView'),
	artistsViewContentAlphaBar: () => document.getElementById('artistsViewContentAlphaBar'),
	authorsViewContentAlphaBar: () => document.getElementById('authorsViewContentAlphaBar'),
	artistsViewBtnUp: () => document.getElementById('artistsViewBtnUp'),
	
	// vue compositeurs
	authorsContainer: () => document.getElementById('authorsContainer'),
	authorsView: () => document.getElementById('authorsView'),
	authViewContentAlphaBar: () => document.getElementById('authViewContentAlphaBar'),
	authorsViewBtnUp: () => document.getElementById('authorsViewBtnUp'),

	// vue albums
	albumsContainer: () => document.getElementById('albumsContainer'),
	albumsView: () => document.getElementById('albumsView'),
	albumsContentAlphaBar: () => document.getElementById('albumsContentAlphaBar'),
	albumsViewBtnUp: () => document.getElementById('albumsViewBtnUp'),

	// vue genres
	genresContainer: () => document.getElementById('genresContainer'),
	genresView: () => document.getElementById('genresView'),
	genresContentAlphaBar: () => document.getElementById('genresContentAlphaBar'),
	genresViewBtnUp: () => document.getElementById('genresViewBtnUp'),
	
	// vue playlists
	playlistsContainer: () => document.getElementById('playlistsContainer'),
	playlistsView: () => document.getElementById('playlistsView'),
	playlistsViewBtnUp: () => document.getElementById('playlistsViewBtnUp'),
	
	// vue dynamic lists
	dynListContainer: () => document.getElementById('dynListContainer'),
	dynListResult: () => document.getElementById('dynListResult'),
	dynListResetBtn: () => document.getElementById('dynListResetBtn'),
	dynListRefreshBtn: () => document.getElementById('dynListRefreshBtn'),

	// vue détaillée artiste
	artistDetailsContainer: () => document.getElementById('artistDetailsContainer'),
	artistDetailsContent: () => document.getElementById('artistDetailsContent'),
	artistDetailsAlbumsContent: () => document.getElementById('artistDetailsAlbumsContent'),
	artistDetailsSongsContent: () => document.getElementById('artistDetailsSongsContent'),

	// vue détallée album
	albumDetailsContainer: () => document.getElementById('albumDetailsContainer'),
	albumDetailsContent: () => document.getElementById('albumDetailsContent'),
	albumDetailsSongsContent: () => document.getElementById('albumDetailsSongsContent'),

	// vue détaillée genre
	genreDetailsContainer: () => document.getElementById('genreDetailsContainer'),
	genreDetailsContent: () => document.getElementById('genreDetailsContent'),
	genreDetailsSongsContent: () => document.getElementById('genreDetailsSongsContent'),

	// vue détaillée playlist
	playlistDetailsContainer: () => document.getElementById('playlistDetailsContainer'),
	playlistDetailsContent: () => document.getElementById('playlistDetailsContent'),
	playlistDetailsSongsContent: () => document.getElementById('playlistDetailsSongsContent'),
	
	// vue détaillées - boutons back
	artistDetailsBtnBack: () => document.getElementById('artistDetailsBtnBack'),
	albumDetailsBtnBack: () => document.getElementById('albumDetailsBtnBack'),
	genreDetailsBtnBack: () => document.getElementById('genreDetailsBtnBack'),
	playlistDetailsBtnBack: () => document.getElementById('playlistDetailsBtnBack'),
	
	// vue détaillées - boutons parent
	artistDetailsBtnParent: () => document.getElementById('artistDetailsBtnParent'),
	albumDetailsBtnParent: () => document.getElementById('albumDetailsBtnParent'),
	genreDetailsBtnParent: () => document.getElementById('genreDetailsBtnParent'),
	playlistDetailsBtnParent: () => document.getElementById('playlistDetailsBtnParent'),
	
	// vue détaillées - boutons up
	artistDetailsBtnUp: () => document.getElementById('artistDetailsBtnUp'),
	genreDetailsBtnUp: () => document.getElementById('genreDetailsBtnUp'),
	playlistDetailsBtnUp: () => document.getElementById('playlistDetailsBtnUp'),
	
	// player
	playerBar: () => document.getElementById('playerBar'),
	playerAlbumArt: () => document.getElementById('playerAlbumArt'),
	playerSongTitle: () => document.getElementById('playerSongTitle'),
	playerArtistAlbum: () => document.getElementById('playerArtistAlbum'),
	playerPrevButton: () => document.getElementById('playerPrevButton'),
	playerPlayPauseButton: () => document.getElementById('playerPlayPauseButton'),
	playerStopButton: () => document.getElementById('playerStopButton'),
	playerNextButton: () => document.getElementById('playerNextButton'),
	playerShuffleButton: () => document.getElementById('playerShuffleButton'),
	playerProgressBar: () => document.getElementById('playerProgressBar'),
	playerCurrentTime: () => document.getElementById('playerCurrentTime'),
	playerTotalTime: () => document.getElementById('playerTotalTime'),
	playerVolumeBar: () => document.getElementById('playerVolumeBar'),
	playerVolDown: () => document.getElementById('playerVolDown'),
	playerVolUp: () => document.getElementById('playerVolUp'),
	
	// vue now playing
	npContainer: () => document.getElementById('npContainer'),
	npAlbumArt: () => document.getElementById('npAlbumArt'),
	npSongTitle: () => document.getElementById('npSongTitle'),
	npArtist: () => document.getElementById('npArtist'),
	npAlbum: () => document.getElementById('npAlbum'),
	npYear: () => document.getElementById('npYear'),
	npGenres: () => document.getElementById('npGenres'),
	npMoods: () => document.getElementById('npMoods'),
	npRating: () => document.getElementById('npRating'),
	npCodecIcon: () => document.getElementById('npCodecIcon'),
	npCodecKHz: () => document.getElementById('npCodecKHz'),
	npCodecBps: () => document.getElementById('npCodecBps'),	
	npPlaylistList: () => document.getElementById('npPlaylistList'),
	npBtnClose: () => document.getElementById('npBtnClose'),

};


/**
 * fonction pour récupérer le DOM à la volée (simplification d'écriture)
 */
export function getDom(elemlentId) {
	return document.getElementById(elemlentId);	
}


/**
 * fonction pour récupérer les éléments du DOM correspondant au critère
 */
export function getDomElements(crit) {	
	const elmts = document.querySelectorAll(crit);
	const results = Array.from(elmts).map(el => ({ ...el.dataset }));
	return results;
}
