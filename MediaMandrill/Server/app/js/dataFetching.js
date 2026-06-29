/**
 * js/dataFetching.js
 * Ce fichier contient les fonctions de récupération de données
 */


// log('[dataFeching.js][function] var', var);

import { log, sortByMultipleFields, loadIndicator } from './utils.js';
import { initViews } from './views.js';



let tracksCache, artistsCache, authorsCache, albumsCache, genresCache, moodsCache, playlistsCache
export const cacheStats = {
	tracks:		localStorage.getItem('cacheTracksCount'),
	albums:		localStorage.getItem('cacheAlbumsCount'),
	artists:	localStorage.getItem('cacheArtistsCount'),
	authors:	localStorage.getItem('cacheAuthorsCount'),
	genres:		localStorage.getItem('cacheGenresCount'),
	playlists:	localStorage.getItem('cachePlaylistsCount'),
	hash:		localStorage.getItem('cacheLibraryHash'),
};



// mise à jour des caches
setTimeout(() => { updateCache() }, 90000);



/**
 * met à jour les caches
 */
export async function updateCache(trigger = null) {	
	const mmHash = await fetchLibraryHash();
	if ( cacheStats.hash != mmHash || trigger === 'force' ) {
		// log('[dataFeching.js][updateCache] Updating...', mmHash);
		await updateCacheTracks();
		await updateCacheArtists();
		await updateCacheAuthors();
		await updateCacheAlbums();
		await updateCacheGenres();
		await updateCacheMoods();
		await updateCachePlaylists();
		
		cacheStats.hash = mmHash;
		localStorage.setItem('cacheLibraryHash', cacheStats.hash);
		initViews();
	}
}


/**
 * récupère toutes les pistes et met à jour le cache
 */
async function updateCacheTracks() {
    try {
		loadIndicator('on');
        const response = await fetch('/library/tracks');
        if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
        
        const tracks = await response.json();
        tracksCache = tracks;
		
		const compressed = LZString.compressToUTF16(JSON.stringify(tracksCache));
		localStorage.setItem('cacheTracks', compressed);
		
		cacheStats.tracks = tracksCache.length;
		localStorage.setItem('cacheTracksCount', cacheStats.tracks);
		loadIndicator('off');
    }
	catch (e) {
        console.error('[dataFetching][updateCacheTracks] failed:', e);
    }
}


/**
 * récupère tous les artistes et met à jour le cache
 */
async function updateCacheArtists() {
    try {
		loadIndicator('on');
        const response = await fetch('/library/artists');
        if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
        
        const artists = await response.json();
        artistsCache = artists;

		const compressed = LZString.compressToUTF16(JSON.stringify(artistsCache));
		localStorage.setItem('cacheArtists', compressed);

		cacheStats.artists = artistsCache.length;
		localStorage.setItem('cacheArtistsCount', cacheStats.artists);
		loadIndicator('off');
    }
	catch (e) {
        console.error('[dataFetching][updateCacheArtists] failed:', e);
    }
}


/**
 * récupère tous les compositeurs et met à jour le cache
 */
async function updateCacheAuthors() {
    try {
		loadIndicator('on');
        const response = await fetch('/library/authors');
        if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
        
        const composers = await response.json();
        authorsCache = composers;

		const compressed = LZString.compressToUTF16(JSON.stringify(authorsCache));
		localStorage.setItem('cacheAuthors', compressed);
		
		cacheStats.authors = authorsCache.length;
		localStorage.setItem('cacheAuthorsCount', cacheStats.authors);
		loadIndicator('off');
    }
	catch (e) {
        console.error('[dataFetching][updateCacheAuthors] failed:', e);
    }
}


/**
 * récupère tous les albums et met à jour le cache
 */
async function updateCacheAlbums() {
    try {
		loadIndicator('on');
        const response = await fetch('/library/albums');
        if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
        
        const albums = await response.json();
		albumsCache = albums;
		
		const compressed = LZString.compressToUTF16(JSON.stringify(albumsCache));
		localStorage.setItem('cacheAlbums', compressed);
		
		cacheStats.albums = albumsCache.length;
		localStorage.setItem('cacheAlbumsCount', cacheStats.albums);
		loadIndicator('off');
    }
	catch (e) {
        console.error('[dataFetching][updateCacheAlbums] failed:', e);
    }
}


/**
 * récupère tous les genres et met à jour le cache
 */
async function updateCacheGenres() {
    try {
		loadIndicator('on');
        const response = await fetch('/library/genres');
        if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
        
		const genres = await response.json();
		genresCache = genres;

		const compressed = LZString.compressToUTF16(JSON.stringify(genresCache));
		localStorage.setItem('cacheGenres', compressed);
		
		cacheStats.genres = genresCache.length;
		localStorage.setItem('cacheGenresCount', cacheStats.genres);
		loadIndicator('off');
    }
	catch (e) {
        console.error('[dataFetching][updateCacheGenres] failed:', e);
    }
}


/**
 * récupère toutes les moods et met à jour le cache
 */
async function updateCacheMoods() {
    try {
		loadIndicator('on');
        const response = await fetch('/library/moods');
        if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
        
		const moods = await response.json();
		moodsCache = moods;
		
		const compressed = LZString.compressToUTF16(JSON.stringify(moodsCache));
		localStorage.setItem('cacheMoods', compressed);
		
		// cacheStats.moods = moodsCache.length;
		// localStorage.setItem('cacheMoodsCount', cacheStats.moods);
		loadIndicator('off');
	}
	catch (e) {
		console.error('[dataFetching][updateCacheMoods] failed:', e);
	}
}


/**
 * récupère tous les genres et met à jour le cache
 */
async function updateCachePlaylists() {
    try {
		loadIndicator('on');
        const response = await fetch('/library/playlists');
        if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
        
		const playlists = await response.json();
		playlistsCache = playlists;
		
		const compressed = LZString.compressToUTF16(JSON.stringify(playlistsCache));
		localStorage.setItem('cachePlaylists', compressed);
		
		cacheStats.playlists = playlistsCache.length;
		localStorage.setItem('cachePlaylistsCount', cacheStats.playlists);
		loadIndicator('off');
    }
	catch (e) {
        console.error('[dataFetching][updateCachePlaylists] failed:', e);
    }
}


/**
 * récupère les stats de la DB
 */
export async function fetchLibraryStats() {
    try {
        const response = await fetch('/library/stats');
        if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
        
        const stats = await response.json();
        return stats;
    }
	catch (e) {
        console.error('[dataFetching][fetchLibraryStats] failed:', e);
    }
}


/**
 * récupère les stats de la DB
 */
export async function fetchLibraryHash() {
    try {
        const response = await fetch('/library/hash');
        if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
        
        const hash = await response.json();
        return hash;
    }
	catch (e) {
        console.error('[dataFetching][fetchLibraryHash] failed:', e);
    }
}


/**
 * récupère tous les titres
 */
export async function fetchTracks() {
    // 1) Charge le cache depuis localStorage
    if (!tracksCache) {
		const compressed = localStorage.getItem('cacheTracks');
		tracksCache = await JSON.parse(await LZString.decompressFromUTF16(compressed) || null);
	}
	
    // 2) Charge le cache depuis MM si pas chargé
    if (!tracksCache) { await updateCacheTracks(); }
	return tracksCache;
}


/**
 * récupère tous les artistes
 */
export async function fetchArtists() {
    // 1) Charge le cache depuis localStorage
    if (!artistsCache) {
		const compressed = localStorage.getItem('cacheArtists');
		artistsCache = await JSON.parse(LZString.decompressFromUTF16(compressed) || null);
	}
	
    // 2) Charge le cache depuis MM si pas chargé
    if (!artistsCache) { await updateCacheArtists(); }
	return artistsCache;
}


/**
 * récupère tous les compositeurs
 */
export async function fetchAuthors() {
    // 1) Charge le cache depuis localStorage
    if (!authorsCache) {
		const compressed = localStorage.getItem('cacheAuthors');
		authorsCache = await JSON.parse(LZString.decompressFromUTF16(compressed) || null);
	}
	
    // 2) Charge le cache depuis MM si pas chargé
    if (!authorsCache) { await updateCacheAuthors(); }
	return authorsCache;
}

/**
 * récupère tous les albums
 */
export async function fetchAlbums() {
    // 1) Charge le cache depuis localStorage
    if (!albumsCache) {
		const compressed = localStorage.getItem('cacheAlbums');
		albumsCache = await JSON.parse(LZString.decompressFromUTF16(compressed) || null);
	}
	
    // 2) Charge le cache depuis MM si pas chargé
    if (!albumsCache) { await updateCacheAlbums(); }
	return albumsCache;
}


/**
 * récupère tous les genres
 */
export async function fetchGenres() {
    // 1) Charge le cache depuis localStorage
    if (!genresCache) {
		const compressed = localStorage.getItem('cacheGenres');
		genresCache = await JSON.parse(LZString.decompressFromUTF16(compressed) || null);	
	}
	
    // 2) Charge le cache depuis MM si pas chargé
    if (!genresCache) { await updateCacheGenres(); }
	return genresCache;
}


/**
 * récupère toutes les moods
 */
export async function fetchMoods() {
    // 1) Charge le cache depuis localStorage
    if (!moodsCache) {
		const compressed = localStorage.getItem('cacheMoods');
		moodsCache = await JSON.parse(LZString.decompressFromUTF16(compressed) || null);
	}
	
    // 2) Charge le cache depuis MM si pas chargé
    if (!moodsCache) { await updateCacheMoods(); }
	return moodsCache;
}


/**
 * récupère toutes les playlists
 */
export async function fetchPlaylists() {
    // 1) Charge le cache depuis localStorage
    if (!playlistsCache) {
		const compressed = localStorage.getItem('cachePlaylists');
		playlistsCache = await JSON.parse(LZString.decompressFromUTF16(compressed) || null);
	}
	
    // 2) Charge le cache depuis MM si pas chargé
    if (!playlistsCache) { await updateCachePlaylists(); }
	return playlistsCache;
}


/**
 * récupère les détails d'une track
 */	
export async function fetchTrack(trackId) {
	const trackDetails = await fetch(`/library/track/${trackId}`).then(r => r.json());
	return trackDetails;
}


/**
 * récupère les détails d'artiste
 */	
export async function fetchArtist(artistId) {
	const artistDetails = await fetch(`/library/artist/${artistId}`).then(r => r.json());
	return artistDetails;
}


/**
 * récupère les albums d'artiste
 */
export async function fetchArtistAlbums(artistId) {
	loadIndicator('on');
	const artistAlbums = await fetch(`/library/artist/${artistId}/albums`).then(r => r.json());
	const albumArtistAlbums = await fetch(`/library/albumartist/${artistId}/albums`).then(r => r.json());
	
    const merged = [...artistAlbums, ...albumArtistAlbums];
    const unique = merged.filter(
        (album, index, self) =>
            index === self.findIndex(a => a.albumId === album.albumId)
    );
	loadIndicator('off');
    return unique;
}


/**
 * récupère les titres d'artiste
 */
export async function fetchArtistTracks(artistId) {
	loadIndicator('on');
	const artistTracks = await fetch(`/library/artist/${artistId}/tracks`).then(r => r.json());
	const albumArtistTracks = await fetch(`/library/albumartist/${artistId}/tracks`).then(r => r.json());

    const merged = [...artistTracks, ...albumArtistTracks];
    const unique = merged.filter(
        (song, index, self) =>
            index === self.findIndex(a => a.songId === song.songId)
    );
	loadIndicator('off');
    return unique;
}


/**
 * récupère les genres d'artiste
 */
export async function fetchArtistGenres(artistId) {
	loadIndicator('on');
	const artistGenres = await fetch(`/library/artist/${artistId}/genres`).then(r => r.json());
	loadIndicator('off');
    return artistGenres;
}


/**
 * récupère les détails d'album
 */	
export async function fetchAlbum(albumId) {
	const album = await fetch(`/library/album/${albumId}`).then(r => r.json());
	return album;
}


/**
 * récupère les détails d'album
 */	
export async function fetchAlbumTracks(albumId) {
	loadIndicator('on');
	const albumTracksUnsorted = await fetch(`/library/album/${albumId}/tracks`).then(r => r.json());	
	const albumTracks = sortByMultipleFields( albumTracksUnsorted, ['discNumber', 'trackNumber'], ['asc', 'asc'] );
	loadIndicator('off');
	return albumTracks;
}



/**
 * récupère les genres d'album
 */
export async function fetchAlbumGenres(albumId) {
	loadIndicator('on');
	const albumGenres = await fetch(`/library/album/${albumId}/genres`).then(r => r.json());
	loadIndicator('off');
    return albumGenres;
}


/**
 * récupère les titres de genre
 */	
export async function fetchGenre(genreId) {
	loadIndicator('on');
	const genreSongs = await fetch(`/library/genre/${genreId}`).then(r => r.json());
	loadIndicator('off');
	return genreSongs;
}


/**
 * récupère les artistes du genre
 */	
export async function fetchGenreArtists(genreId) {
	loadIndicator('on');
	const genreArtists = await fetch(`/library/genre/${genreId}/artists`).then(r => r.json());
	loadIndicator('off');
	return genreArtists;
}


/**
 * récupère les artistes du genre
 */	
export async function fetchGenreAlbums(genreId) {
	loadIndicator('on');
	const genreAlbums = await fetch(`/library/genre/${genreId}/albums`).then(r => r.json());
	loadIndicator('off');	
	return genreAlbums;
}



/**
 * récupère les détails de playlist
 */	
export async function fetchPlaylist(playlistId) {
	loadIndicator('on');
	const playlistDetails = await fetch(`/library/playlist/${playlistId}`).then(r => r.json());
	loadIndicator('off');
	return playlistDetails;
}


export async function fetchArtistIds(artists) {
	if (!artists || artists.length === 0) return [];
	const ids = await Promise.all(
		artists.map(name =>
			fetch(`/library/artist/${encodeURIComponent(name)}/id`)
				.then(r => r.json())
				.catch(() => null)
		)
	);
	return ids;
}


export async function fetchGenreIds(genres) {
	if (!genres || genres.length === 0) return [];
	const ids = await Promise.all(
		genres.map(name =>
			fetch(`/library/genre/${encodeURIComponent(name)}/id`)
				.then(r => r.json())
				.catch(() => null)
		)
	);
	return ids;
}

