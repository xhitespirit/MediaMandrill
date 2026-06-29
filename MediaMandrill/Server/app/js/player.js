/**
 * js/player.js
 * Ce fichier gère l'interface utilisateur de la barre de lecture et ses interactions
 */
 
// log('[player.js][function] var', var);

import { domElements, getDom } from './domElements.js';
const dom = new Proxy(domElements, { get(target, prop) {return target[prop]?.();} });
import { tLng } from './i18n.js';

import { formatDuration, renderStars, updateFanart, setTrackTag, getDisplaySize, log, setMarquee } from './utils.js';
import { icon } from './graphics.js';
import { renderArtistLinks, renderAlbumLink, renderGenreLinks } from './views.js';
import { fetchArtistIds, fetchGenreIds } from './dataFetching.js';



// État centralisé du player
const playerState = {
    isPlaying: false,
	isPaused: false,
    songDuration: 0,
	lastTimePosition: 0,
    timerId: null,
	timerResyncId: null,
    isSeekingProgressBar: false,
	isSeekingVolume: false,
	track: null,
	shuffled: null,
	firstStateEvent: true,
	volume: 0,
};

// État centralisé de la liste de lecture en cours
const playerPlaylist = {
	tracks: [],
	playPosition: 0
};



/**
 * initialise l'écoute des événements SSE
 */
export function initPlayerEvents() {
	
    const evtSource = new EventSource('/events');

    evtSource.onopen = () => { log('[player.js][SSE] connected'); };
    evtSource.onerror = () => {	log('[player.js][SSE] disconnected'); };

	const sseHandlers = {
		playerState:			({ data }) => { updatePlayerState( { trigger: 'state', data: data.state } ) },
		playerTrack:			({ data }) => { updatePlayerState( { trigger: 'track', data: data } ) },
		playerShuffleChange:	({ data }) => { updatePlayerState( { trigger: 'shuffle', data: data.state } ) },
		playerShuffleState:		({ data }) => { updatePlayerState( { trigger: 'shuffle', data: data.state } ) },
		playerSeekChange:		({ data }) => { updatePlayerState( { trigger: 'position', data: data.positionMs } ) },
		playerPosition:			({ data }) => { updatePlayerState( { trigger: 'position', data: data.positionMs } ) },
		playerPlaylist:			({ data }) => { 
									updatePlayerPlaylist(data.playlist);
									updateNowPlayingList();
								},
		playerVolume:			({ data }) => { updatePlayerState( { trigger: 'volume', data: data.volume } ) },
	};

	Object.entries(sseHandlers).forEach(([event, handler]) => {
		evtSource.addEventListener(event, ({ data }) => {
			const parsed = JSON.parse(data);
			// log(`[player.js][initPlayerEvents] ${event}:`, parsed);
			handler({ data: parsed });
		});
	});
}


/**
 * initialise les éléments DOM et les écouteurs d'événements pour la barre de lecture.
 * @param {object} domElements - Un objet contenant les références aux éléments DOM.
 */
export async function initPlayerControls() {

	function playerControl(action) {
		if (playerState.isPlaying) {
			if (action === 'PlayPause') 	{ fetch('/player/toggle', { method: 'POST' }); }
			else if (action === 'Stop') 	{ fetch('/player/stop', { method: 'POST' }); }
			else if (action === 'Previous')	{ fetch('/player/previous', { method: 'POST' });; }
			else if (action === 'Next') 	{ fetch('/player/next', { method: 'POST' }); }
			else if (action === 'Shuffle') 	{ fetch('/player/shuffle/toggle', { method: 'POST' }); }
		}
		else {
			if (action === 'PlayPause') 	{ fetch('/player/play', { method: 'POST' }); }
		}
	}
	
	// initialisation des boutons
	dom.playerPrevButton.appendChild(icon('skipPrevious', 32, 32, []));
	dom.playerPlayPauseButton.appendChild(icon('play', 32, 32, []));
	dom.playerStopButton.appendChild(icon('stop', 32, 32, []));
	dom.playerNextButton.appendChild(icon('skipNext', 32, 32, []));
	dom.playerShuffleButton.appendChild(icon('shuffle', 24, 24, []));
	dom.playerVolDown.appendChild(icon('volDown', 24, 24, []));
	dom.playerVolUp.appendChild(icon('volUp', 24, 24, []));

    dom.playerPlayPauseButton.addEventListener('click',	() => { playerControl('PlayPause') });
	dom.playerStopButton.addEventListener('click', 		() => { playerControl('Stop') });
	dom.playerPrevButton.addEventListener('click',		() => { playerControl('Previous') });
	dom.playerNextButton.addEventListener('click',		() => { playerControl('Next') });
	dom.playerShuffleButton.addEventListener('click',	() => { playerControl('Shuffle') });
	dom.playerVolDown.addEventListener('click',	() => { setVolumeDiff(- 0.05) });
	dom.playerVolUp.addEventListener('click',	() => { setVolumeDiff(+ 0.05) });
	
	// curseur progression: pendant le déplacement (blocage de la progression automatique avec isSeeking)
	dom.playerProgressBar.addEventListener('input', () => {
		const newTime = Math.floor((dom.playerProgressBar.value / 100) * playerState.songDuration);
		dom.playerCurrentTime.textContent = formatDuration(newTime);
		playerState.isSeekingProgressBar = true;
	});

	// curseur progression: après le déplacement
	dom.playerProgressBar.addEventListener('change', async () => {
		if (playerState.isPlaying && playerState.songDuration > 0) {
			const percentage = Number(dom.playerProgressBar.value);
			const positionMs = Math.round((percentage / 100) * playerState.songDuration);
			await fetch('/player/seek', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ positionMs })
			});			
			// ajuste la progressbar
			updatePlayerStatePosition();
			updateProgressBar(playerState.lastTimePosition);
		}
		playerState.isSeekingProgressBar = false;
	});
	
	
	// curseur volume: pendant le déplacement 
	let volumeDebounce;
	dom.playerVolumeBar.addEventListener('input', () => {
		playerState.isSeekingVolume = true;
		clearTimeout(volumeDebounce);
		volumeDebounce = setTimeout(async () => {
			const volume = Number(dom.playerVolumeBar.value);
			setPlayerVolume(volume);
		}, 100);		
	});
	
	// curseur volume: après le déplacement 
	dom.playerVolumeBar.addEventListener('change', async () => {
		const volume = Number(dom.playerVolumeBar.value);
		setPlayerVolume(volume);
		playerState.isSeekingVolume = false;
	});
}


/**
 * obtient l'état du lecteur actif
 */
export function updatePlayerState(params) {
	
	const trigger = params.trigger;
	const data = params.data;

	switch (trigger) {
		
		case 'state':
			switch (data.evt) {
				
				case 'play':
					playerState.isPlaying = true;
					playerState.isPaused = false;
					updatePlayerBar();
					updateNowPlayingView();
					// updateNowPlayingFanart();
					updateFanart('npContainer', playerState.track.artist[0]);
					updatePlayingIndicator(playerState.track.positionInPlaylist);
					break;

				case 'pause':
					playerState.isPlaying = true;
					playerState.isPaused = true;
					if (playerState.firstStateEvent) {	// artefact pour gérer l'initialisation lorsque MM est en pause
						updateNowPlayingView();
						// updateNowPlayingFanart();
						updateFanart('npContainer', playerState.track.artist[0]);
					}
					updatePlayerBar();
					stopPlayerTimer();
					break;
					
				case 'unpause':
					playerState.isPlaying = true;
					playerState.isPaused = false;
					updatePlayerBar();
					// updateNowPlayingFanart();
					updateFanart('npContainer', playerState.track.artist[0]);
					break;
					
				case 'stop':
					playerState.isPlaying = data.isPlaying;
					playerState.isPaused = data.isPaused;
					if (!playerState.isPlaying || playerState.isPaused) { // artefact pour éviter l'évènement stop lors du changement de piste
						updatePlayerBar();
						updateNowPlayingView();
						updatePlayingIndicator(-1);
					}
					break;
					
				case 'completeEnd':
					playerState.isPlaying = false;
					playerState.isPaused = false;
					updatePlayerBar();
					updateNowPlayingView();
					updatePlayingIndicator(-1);
					// fetch('player/clearplaylist', { method: 'POST' });
					break;
			}
			if (playerState.firstStateEvent) {playerState.firstStateEvent = false;}
			
			break;
		
		case 'track':
			playerState.track = data;
			playerState.songDuration = data.songLength;
			updatePlayingIndicator(playerState.track.positionInPlaylist);
			break;
			
		case 'shuffle':
			if (playerState?.isPlaying) {
				playerState.shuffled = data;
				updatePlayingIndicator(playerState.track.positionInPlaylist);
				updatePlayerBar();
			}
			break;
			
		case 'position':
			playerState.lastTimePosition = data;
			updateProgressBar(data);
			break;
			
		case 'volume':
			playerState.volume = data;
			updateVolumeBar(data);
			break;
			
	}

	// console.group ('[player.js][updatePlayerState]');
	// log('[player.js][updatePlayerState] trigger:', trigger,' / evt:', data.evt);
	// log('[player.js][updatePlayerState] isPlaying:', playerState.isPlaying, ' / isPaused:', playerState.isPaused);
	// log('[player.js][updatePlayerState] player position:', playerState?.track?.positionInPlaylist || null);
	// log('[player.js][updatePlayerState] playlist position:', playerPlaylist.position);
	// log('[player.js][updatePlayerState] playerState:', playerState);
	// console.groupEnd();
}


/**
 * met à jour la barre du lecteur
 */
async function updatePlayerBar() {
	
	if (playerState.isPlaying || playerState.isPaused) {
		dom.playerBar.classList.remove('hidden');
		adaptDisplayToPlayerVisibility();

		const currentSong = playerState.track;
		const albumArt = `/library/track/${playerState.track.songId}/thumbnail`;
		const artistText = currentSong.artist ? currentSong.artist.join(', ') : tLng('player.artist.unknown');
		const albumText = currentSong.album || tLng('player.album.unknown');

		dom.playerAlbumArt.src = albumArt;
		dom.playerAlbumArt.alt = currentSong.title || tLng('player.title.unknown');
		dom.playerSongTitle.textContent = currentSong.title || tLng('player.title.unknown');
		
		setMarquee(dom.playerSongTitle);
		dom.playerSongTitle.dataset.songid = currentSong.id || '';
		
		dom.playerArtistAlbum.textContent = `${artistText} - ${albumText}`;
		setMarquee(dom.playerArtistAlbum);
		
		dom.playerPlayPauseButton.innerHTML = '';
		playerState.isPaused ? dom.playerPlayPauseButton.appendChild(icon('play', 32, 32, [])) : dom.playerPlayPauseButton.appendChild(icon('pause', 32, 32, []));
		dom.playerTotalTime.textContent = formatDuration(Math.round(playerState.songDuration));

		if (playerState.shuffled)	{ dom.playerShuffleButton.classList.add('active'); }
		else 						{ dom.playerShuffleButton.classList.remove('active'); }

		if (playerState.isPlaying && !playerState.isPaused)	{ startPlayerTimer(); }

		const positionMs = await fetch('/player/position').then(r => r.json());
		if (!playerState.isSeekingProgressBar) { updateProgressBar(positionMs); }
		
    } else {
        dom.playerBar.classList.add('hidden');
		adaptDisplayToPlayerVisibility();
		
		stopPlayerTimer();
		
        dom.playerSongTitle.textContent = tLng('player.noplayback');
        dom.playerArtistAlbum.textContent = '';
        dom.playerAlbumArt.src = 'resources/images/fallback_album.png';
        dom.playerProgressBar.value = 0;
        dom.playerCurrentTime.textContent = '0:00';
        dom.playerTotalTime.textContent = '0:00';
    }

	// fonction ajuste les classes des éléments dont l'affichage dépend de la visibilité du player
	async function adaptDisplayToPlayerVisibility() {
		const container =  dom.mainContainer;
		const playerBar = dom.playerBar;
		const vertBars = document.querySelectorAll('.bar-vertical');
		
		// ajuste la hauteur de mainContainer
		container.classList.toggle('player-bar-on', !playerBar.classList.contains('hidden'));
		container.classList.toggle('player-bar-off', playerBar.classList.contains('hidden'));
		
		// ajuste la hauteur de toutes les barres '.bar-vertical'
		vertBars.forEach(bar => {
			bar.classList.toggle('player-bar-on', !playerBar.classList.contains('hidden'));
			bar.classList.toggle('player-bar-off', playerBar.classList.contains('hidden'));
		});
	}	
}


/**
 * met à jour la vue de lecture en cours
 */
async function updateNowPlayingView() {
	
	if (playerState.isPlaying || playerState.isPaused) {
		const currentSong = playerState.track;

        // Paralléliser les fetch de artistIds et genreIds
        const [artistIds, genreIds] = await Promise.all([
            currentSong?.artist?.length > 0 ? fetchArtistIds(currentSong.artist) : null,
            currentSong?.genre?.length > 0 ? fetchGenreIds(currentSong.genre) : null
        ]);
		
		// pochette album
		const albumArt = new Image();
		albumArt.onload = () => {
			dom.npAlbumArt.classList.remove('art-loaded'); // fade-out
			setTimeout(() => {
				dom.npAlbumArt.src = albumArt.src;
				dom.npAlbumArt.classList.add('art-loaded'); // fade-in
			}, 300); // attente durée du fade-out en ms (identique à la transition dans CSS)
		};
		albumArt.src = `/library/track/${playerState.track.songId}/thumbnail`;		
		// ajoute un clic sur pochette pour scroller à l'élément en cours dans la playlist
		dom.npAlbumArt.addEventListener('click', async () => {
			const currentItem = document.querySelector('.np-playlist-item.playing');
			currentItem.scrollIntoView({
				behavior: 'smooth',
				block: 'center'
			});
		});
		
		// codec, samplerate, bitrate
		const audioCodec = currentSong.fileType;
		const samplerate = (parseInt(currentSong.frequency, 10) / 1000).toFixed(1); // kHz
		const bitrate = (parseInt(currentSong.bitrate, 10) / 1000).toFixed(0);

		const bull = '<span style="color: var(--text-medium);">&nbsp;&nbsp;&bull;&nbsp;&nbsp;</span>'

        // Groupe toutes les manipulations DOM en une seule passe
        requestAnimationFrame(() => {

			// titre
			dom.npSongTitle.innerHTML = currentSong.title || '';
			dom.npSongTitle.dataset.songid = currentSong.songId || '';
			
			// artistes
			dom.npArtist.innerHTML = currentSong?.artist?.length > 0
				? renderArtistLinks?.(currentSong.artist, artistIds) || currentSong.artist.join(', ')
				: '';

			// album
			dom.npAlbum.innerHTML = currentSong?.album && currentSong?.albumId
				? renderAlbumLink?.(currentSong.album, currentSong.albumId) || currentSong.album
				: '';
				
			// année
			dom.npYear.innerHTML = currentSong.year  || '';

			// Genres
			dom.npGenres.innerHTML = currentSong?.genre?.length > 0
				? bull + renderGenreLinks?.(currentSong.genre, genreIds) || currentSong.genre.join(', ')
				: '';

			// humeur
			const mood = currentSong.mood;
			dom.npMoods.innerHTML = mood?.length > 0
				? bull + mood.join(', ')
				: '';

			// note
			dom.npRating.replaceChildren(); // assure la suppression de l'écouteur du précédent chargement de la vue
			dom.npRating.innerHTML = `<div class='np-stars'>${renderStars(currentSong.rating)}</div>`;
			const stars = dom.npRating.querySelector('.np-stars');
			stars.addEventListener('click', async (e) => {
				const starNumber = Number(e.target.dataset.star);
				if (starNumber && starNumber != currentSong.rating) { setTrackTag(currentSong.songId, 'rating', starNumber); }
				stars.innerHTML = `${renderStars(starNumber)}`;
			});
			
			// codec - supprime anciennes classes et ajoute la nouvelle
			Array.from(dom.npCodecIcon.classList)
				.filter(cls => cls.startsWith('np-icon-'))
				.forEach(cls => dom.npCodecIcon.classList.remove(cls));
			dom.npCodecIcon.classList.add(`np-icon-${audioCodec}`);

			// samplerate
			dom.npCodecKHz.innerHTML = samplerate ?
				`<span style="color: var(--text-medium);">${samplerate}</span>kHz`
				: ''

			// bitrate
			dom.npCodecBps.innerHTML = bitrate ?
				`<span style="color: var(--text-medium);">${bitrate}</span>kbps`
				: ''
		});
		
	} else {
		dom.npAlbumArt.src = 'resources/images/fallback_album.png';
		dom.npAlbumArt.classList.add('art-loaded'); 
		dom.npSongTitle.innerHTML = tLng('player.noplayback');;
		dom.npArtist.innerHTML = '';
		dom.npAlbum.innerHTML = '';
		dom.npYear.innerHTML = '';
		dom.npGenres.innerHTML = '';
		dom.npMoods.innerHTML = '';
		dom.npRating.innerHTML = `<div class='np-stars'>${renderStars(0)}</div>`;
		dom.npCodecIcon.classList.forEach(cls => { if (cls.startsWith('np-icon-')) { dom.npCodecIcon.classList.remove(cls); } });
		dom.npCodecKHz.innerHTML = '';
		dom.npCodecBps.innerHTML = '';
		return;
	}
};


/**
 * récupération de la position de lecture
 */
async function updatePlayerStatePosition() {	
	const positionMs = await fetch('/player/position').then(r => r.json());
	playerState.lastTimePosition = positionMs;
}


/**
 * timer de synchronisation
 */
function startPlayerTimer() {
	
	stopPlayerTimer();
	
	// position initiale
	updatePlayerStatePosition();
	updateProgressBar(playerState.lastTimePosition);

	// avancement autonome toutes les 1s
    playerState.timerId = setInterval(() => {
        if (!playerState.isSeekingProgressBar && playerState.isPlaying && !playerState.isPaused) {
			// playerState.lastTimePosition++;
			playerState.lastTimePosition = playerState.lastTimePosition + 1000;
			updateProgressBar(playerState.lastTimePosition);
        }
	}, 1000);
	
	// Resynchronisation périodique avec MM toutes les 10s
    playerState.timerResyncId = setInterval(() => {
		updatePlayerStatePosition();
		updateProgressBar(playerState.lastTimePosition);
	}, 10000);
}


function stopPlayerTimer() {
	clearInterval(playerState.timerId);
	playerState.timerId = null;

	clearInterval(playerState.timerResyncId);
	playerState.timerResyncId = null;
	
	playerState.lastTimePosition = 0;
}


/**
 * met à jour la barre de progression
 */
function updateProgressBar(currentMs) {
	if (playerState.songDuration > 0) {
		const percentage = (currentMs / Math.round(playerState.songDuration)) * 100;
		dom.playerProgressBar.value = percentage;
		dom.playerCurrentTime.textContent = formatDuration(Math.min(Math.floor(currentMs)));
	} else {
		dom.playerProgressBar.value = 0;
		dom.playerCurrentTime.textContent = '0:00';
	}
}


/**
 * recharge la liste de lecture en cours (appelée après inserts)
 */
export function updatePlayerPlaylist(playlist) {
	playerPlaylist.items = playlist.tracks;	
	playerPlaylist.position = playlist.playPosition;
};


/**
 * affiche la liste de lecture en cours
 */
export function updateNowPlayingList() {
	const playlistContainer = dom.npPlaylistList;
	playlistContainer.innerHTML = '';
	
	const playlistItems = playerPlaylist.items;
	playlistItems.forEach((item, index) => {
		
		const entry = document.createElement('div');
		entry.className = 'np-playlist-item';
		const albumArt = `/library/track/${item.songId}/thumbnail`;
		entry.innerHTML = `
			<div class="np-playlist-thumb-wrapper">
				<img
					src="resources/images/fallback_song.png"	
					data-src="${albumArt}"
					alt="${item.title}"
					class="np-playlist-thumb"
					loading="lazy"
					onerror="this.onerror=null;this.src='resources/images/fallback_song.png';"
				>
				<button class="np-playlist-thumb-play-button" data-index="${index}" title="${tLng('player.playlist.btn.play')}">
					${icon('play',24, 24).outerHTML}
				</button>
			</div>
			<div class="info" data-songid=${item.songId}>
				<div id="np-playlist-item-${item.songId}" class="title click-song-title marquee">${item.title}</div>
				<div class="meta marquee">${item.artist?.join(', ') || tLng('player.artist.unknown')} &bull; ${item.album || tLng('player.album.unknown')}</div>
			</div>
		`;
		playlistContainer.appendChild(entry);
	});
	
	updatePlayingIndicator(playerPlaylist.position);
	
}


async function updatePlayingIndicator(index) {
	
	const npPlaylistItems = document.querySelectorAll('.np-playlist-item');
	
	// supprime l'indicateur de toutes les pistes
	npPlaylistItems.forEach(item => {
		item.classList.remove('playing');
		item.querySelector('.np-playlist-playing-indicator')?.remove();
	});
	
	// ajoute l'indicateur sur la piste en cours
	if (index >= 0) {
		const currentItem = npPlaylistItems[index];
		if (!currentItem) return;

		currentItem.classList.add('playing');

		const indicator = document.createElement('div');
		indicator.className = 'np-playlist-playing-indicator';
		indicator.innerHTML = icon('nowPlayingSpeaker', 30, 30).outerHTML;

		currentItem.querySelector('.np-playlist-thumb-wrapper')?.appendChild(indicator);

		// scroll à la piste en cours si pas en mode affichage mobile
		if (getDisplaySize() != 'm') {
			if (currentItem && currentItem.previousElementSibling) {
				currentItem.previousElementSibling.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}
			else {
				currentItem.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}
		}
	}	
}


/**
 * met à jour la barre de volume
 */
function updateVolumeBar(volume) {
	if (!playerState.isSeekingVolume) {
		dom.playerVolumeBar.value = volume;
		dom.playerVolumeBar.title = `${tLng('player.volume')}: ${Math.round(volume * 100)}`;
	}
}


/**
 * définit la sortie audio
 */
export function setPlayerOutput(uuid) {
	fetch('/player/output/set', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ uuid })
	});
}


/**
 * définit le volume sonore (entre 0 et 1)
 */
function setPlayerVolume(volume) {
	fetch('/player/volume/set', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ volume: volume })
	});
}


/**
 * définit le volume sonore (entre 0 et 1)
 */
function setVolumeDiff(volumeDiff) {
	let volume = playerState.volume + volumeDiff;
	if (volume < 0) { volume = 0; }
	else if (volume > 1) { volume = 1; }
	setPlayerVolume(volume);
}


/**
 * définit le volume sonore (entre 0 et 1)
 */
export function playerFullscreen() {
	dom.navBar.classList.toggle('hidden');
	
	dom.playerBar.classList.toggle('fullscreen');
	getDom('playerInfo').classList.toggle('hidden');
	getDom('playerControls').classList.toggle('hidden');
	getDom('playerVolume').classList.toggle('hidden');
	
	getDom('npRight').classList.toggle('hidden');

	dom.npRightBar.classList.toggle('hidden');
	
	dom.npContainer.classList.toggle('fullscreen');
	dom.npContainer.classList.contains('fullscreen')
		? document.documentElement.requestFullscreen()
		: document.exitFullscreen();
}

