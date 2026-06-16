// console.log('[mmbridge_events.js][function] var', var);

'use strict';


// ── Dispatch des evenements reçus par depuis MM ──
function handleMMEvents() {

    // listener playbackState
    app.listen(app.player, 'playbackState', (evt) => {
        switch (evt) {
			case 'trackChanged':
				playerCurrentTrack();
				break;
			case 'play':
			case 'unpause':
			case 'pause':
			case 'stop':
			case 'completeEnd':
				playerState(evt);
				break;
			case 'volumeChanged':                                    // ← ajouter
				safeSend({ event: 'playerVolume', volume: app.player.volume });
				break;
        }
    });

    // listener du shuffleChange
    app.listen(app.player, 'shuffleChange', (state) => {
        playerShuffleChange();
    });

    // listener du seekChange — debounce 100ms (événement très fréquent)
    let seekDebounce = null;
    app.listen(app.player, 'seekChange', (positionMs) => {
        clearTimeout(seekDebounce);
        seekDebounce = setTimeout(() => {
            playerSeekChange(positionMs);
        }, 100);
    });

    // listener du nowPlayingModified // debounce: lors de l'ajout ou réordre de la playlist, MM génère plusieurs évenements
    let nowPlayingDebounce = null;
    app.listen(app.player, 'nowPlayingModified', () => {
        clearTimeout(nowPlayingDebounce);
        nowPlayingDebounce = setTimeout(() => {
            playerCurrentPlaylist();
        }, 200); // attend 200ms de silence avant d'envoyer
    });

    console.log('[mmbridge_events.js][handleMMEvents] Initialisé');
}



// ── Dispatch des commandes WebSocket reçues depuis le serveur ──
function handleWSCommands(cmd) {
    console.log('[mmbridge_events.js][handleWSCommands] action', cmd.action);

    if (!cmd || !cmd.action) return;

    switch (cmd.action) {

        // ── player ──
		case 'playerPlay':     app.player.playAsync();      break;
		case 'playerPause':    app.player.pauseAsync();     break;
		case 'playerToggle':   app.player.playPauseAsync(); break;
		case 'playerStop':     app.player.stopAsync();      break;
		case 'playerNext':     app.player.nextAsync();      break;
		case 'playerPrevious': app.player.prevAsync();      break;
		case 'playerGoTo':
			if (typeof cmd.position === 'number') {	app.player.setPlaylistPosAsync(cmd.position); }
			break;
		case 'playerSeek':
			if (typeof cmd.positionMs === 'number') { app.player.seekMSAsync(cmd.positionMs); }
			break;
			
        case 'playerState':
			playerState('tofetch', cmd.requestId);
            break;
			
		case 'playerPosition':
			playerPosition(cmd.requestId);
			break;
			
        case 'playerVolume':
			playerVolume(cmd.requestId);
            break;

        case 'playerVolumeSet':
			playerVolumeSet(cmd.volume);
            break;
			
        case 'playerPlaylist':
            playerCurrentPlaylist(cmd.requestId);
            break;
			
		case 'playerShuffle':
			playerShuffle(cmd.setState);
			break;
			
		case 'playerShuffleState':
			playerShuffleState(cmd.requestId)
			break;

		case 'playerAddTracks':
			playerAddTracks(cmd.songIds, cmd.params, cmd.requestId);
			break;
			
		case 'playerClearPlaylist':
			playerClearPlaylist();
			break;
			
		case 'playerTrack':
			playerCurrentTrack(cmd.requestId);
			break;
			
		case 'playerSetOutput':
			playerSetOutput(cmd.uuid);
			break;

		case 'playerGetOutputs':
			playerGetOutputs(cmd.requestId);
			break;


        // ── library — le requestId est transmis à data.js pour être renvoyé dans la réponse ──
		case 'libraryStats':
			libraryStats(cmd.requestId);
			break;
			
		case 'libraryHash':
			libraryHash(cmd.requestId);
			break;
			
        case 'libraryTracks':
            libraryTracks(cmd.requestId);
            break;

        case 'libraryAlbums':
            libraryAlbums(cmd.requestId);
            break;

        case 'libraryArtists':
            libraryArtists(cmd.requestId);
            break;

        case 'libraryAlbumArtists':
            libraryAlbumArtists(cmd.requestId);
            break;
			
        case 'libraryAuthors':
            libraryAuthors(cmd.requestId);
            break;
			
        case 'libraryGenres':
            libraryGenres(cmd.requestId);
            break;

        case 'libraryMoods':
            libraryMoods(cmd.requestId);
            break;
			
		case 'libraryPlaylists':
            libraryPlaylists(cmd.requestId);
            break;
		
        case 'libraryTrack':
            libraryTrack(cmd.songId, cmd.requestId);
            break;
			
        case 'libraryTrackTagSet':
			setTrackTag(cmd.songId, cmd.tagName, cmd.tagValue);
			break;
		
        case 'libraryTrackThumbnail':
            libraryTrackThumbnail(cmd.songId, cmd.requestId);
            break;
			
        case 'libraryAlbum':
            libraryAlbum(cmd.albumId, cmd.requestId);
            break;
			
        case 'libraryAlbumTracks':
            libraryAlbumTracks(cmd.albumId, cmd.requestId);
            break;
			
        case 'libraryAlbumGenres':
            libraryAlbumGenres(cmd.albumId, cmd.requestId);
            break;
			
		case 'libraryAlbumThumbnail':
            libraryAlbumThumbnail(cmd.albumId, cmd.requestId);
            break;
			
        case 'libraryArtist':
            libraryArtist(cmd.artistId, cmd.requestId);
            break;

        case 'libraryArtistTracks':
            libraryArtistTracks(cmd.artistId, cmd.requestId);
            break;
			
        case 'libraryArtistGenres':
            libraryArtistGenres(cmd.artistId, cmd.requestId);
            break;

        case 'libraryArtistAlbums':
            libraryArtistAlbums(cmd.artistId, cmd.requestId);
            break;

        case 'libraryArtistId':
            libraryArtistId(cmd.artistName, cmd.requestId);
            break;
			
        case 'libraryArtistThumbnail':
            libraryArtistThumbnail(cmd.artistId, cmd.requestId);
            break;
			
        case 'libraryAlbumArtistTracks':
            libraryAlbumArtistTracks(cmd.artistId, cmd.requestId);
            break;
			
        case 'libraryAlbumArtistAlbums':
            libraryAlbumArtistAlbums(cmd.artistId, cmd.requestId);
            break;
			
        case 'libraryGenre':
            libraryGenre(cmd.genreId, cmd.requestId);
            break;
			
		case 'libraryGenreId':
            libraryGenreId(cmd.genreName, cmd.requestId);
            break;
			
		case 'libraryGenreArtists':
            libraryGenreArtists(cmd.genreId, cmd.requestId);
            break;
			
		case 'libraryGenreAlbums':
            libraryGenreAlbums(cmd.genreId, cmd.requestId);
            break;

        case 'libraryMoodTracks':
            libraryMoodTracks(cmd.moodName, cmd.requestId);
            break;
			
		case 'libraryPlaylist':
            libraryPlaylist(cmd.playlistId, cmd.requestId);
            break;
			
        default:
            console.warn('[handleWSCommands] Commande inconnue:', cmd.action);
    }
}
