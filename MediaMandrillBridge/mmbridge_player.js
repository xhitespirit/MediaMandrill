// console.log('[mmbridge_player.js][function] var', var);

'use strict';


const splitSemicol = val => {
    return val ? val.split(';').map(s => {
        return s.trim();
    }).filter(Boolean) : [];
};


// ── Envoyer l'état du lecteur ──
function playerState(evt, requestId) {
    if (evt === 'tofetch') {
		fetchedState = app.player.isPlaying
			? app.player.paused
				? 'pause'
				: 'play'
			: 'stop';
		const state = { evt: fetchedState, isPlaying: app.player.isPlaying, isPaused: app.player.paused }
		if (requestId) { safeSend({ event: 'playerState', requestId, state }); }
		else { safeSend({ event: 'playerState', state }); }
	}
	else if (evt) {
		const state = { evt: evt, isPlaying: app.player.isPlaying, isPaused: app.player.paused }
		safeSend({ event: 'playerState', state });
	}
}


function playerShuffleChange() {
    safeSend({ event: 'playerShuffleChange', state: app.player.shufflePlaylist });
}


function playerShuffle(setState) {
    switch (setState) {
		case 'on':		app.player.shufflePlaylist = true;							break;
		case 'off':		app.player.shufflePlaylist = false;							break;
		case 'toggle':	app.player.shufflePlaylist = !app.player.shufflePlaylist;	break;
	}
}


function playerShuffleState(requestId) {
    safeSend({ event: 'playerShuffleState', requestId, state: app.player.shufflePlaylist });
}


function playerPosition(requestId) {
    safeSend({ event: 'playerPosition', requestId, positionMs: app.player.trackPositionMS });
}


function playerVolume(requestId) {
    safeSend({ event: 'playerVolume', requestId, volume: app.player.volume });
}


function playerVolumeSet(volume) {
    if (typeof volume === 'number') {
		app.player.volume = volume;
	}
}


function playerSeekChange(positionMs) {
    safeSend({ event: 'playerSeekChange', positionMs });
}


// ── Envoyer la piste en cours de lecture ──
function playerCurrentTrack(requestId) {
    const track = app.player.getCurrentTrack();

    if (!track) return;
    const data = {
		songId:				track.id,
		title:				track.title,
		artist: 			splitSemicol(track.artist),
		albumArtist:		track.albumArtist,
		album:				track.album,
		albumId:			track.idalbum,
		genre: 				splitSemicol(track.genre),
		mood: 				splitSemicol(track.mood),
		occasion: 			splitSemicol(track.occasion),
		date:				track.date,
		year:				track.year,
		bps:				track.bps,
		bitrate:			track.bitrate,
		fileType:			track.fileType,
		frequency:			track.frequency,
		rating:				track.rating,
		path:				track.path,
		songLength:			track.songLength,
		positionInPlaylist:	app.player.playlistPos,
	};
    safeSend({ event: 'playerTrack', requestId, track: data });
}



async function playerCurrentPlaylist(requestId) {
    try {
        const list = app.player.getTracklist();
        await list.whenLoaded();
		
		let playlist;

        const tracks = [];
        list.locked(() => {
			for (let i = 0; i < list.count; i++) {
                const track = list.getValue(i);
                tracks.push({
					songId:			track.id,
					title:			track.title,
					artist: 		splitSemicol(track.artist),
					albumArtist:	track.albumArtist,
					album:			track.album,
					albumId:		track.idalbum,
					genre: 			splitSemicol(track.genre),
					mood: 			splitSemicol(track.mood),
					occasion: 		splitSemicol(track.occasion),
					date:			track.date,
					year:			track.year,
					bps:			track.bps,
					bitrate:		track.bitrate,
					fileType:		track.fileType,
					frequency:		track.frequency,
					rating:			track.rating,
					path:			track.path,
					songLength:		track.songLength,
					isPlaying:  	i === app.player.playlistPos,
                });
            }
            playlist = { playPosition: app.player.playlistPos, tracks: tracks }
        });
        safeSend({ event: 'playerPlaylist', requestId, playlist: playlist });
		
    } catch (e) {
        console.error('[playerCurrentPlaylist] failed:', e);
        safeSend({ event: 'playerPlaylist', requestId, playlist: {} });
    }
}


async function playerAddTracks(songIds, params, requestId) {
    try {
        const ids = Array.isArray(songIds) ? songIds : [songIds];

        // Créer une tracklist vide et y ajouter les tracks un par un
        const tracklist = app.utils.createTracklist();
        for (const id of ids) {
            const t = await app.getObject('track', { id });
            tracklist.add(t);
        }

        await app.player.addTracksAsync(tracklist, {
            position:      params?.position      ?? -1,    // -1 = fin de liste
            afterCurrent:  params?.afterCurrent  ?? false,
            startPlayback: params?.startPlayback ?? false,
            withClear:     params?.withClear     ?? false,
        });
        safeSend({ event: 'playerAddTracks', requestId, ok: true });

    } catch (e) {
        console.error('[playerAddTracks] failed:', e);
        safeSend({ event: 'playerAddTracks', requestId, ok: false, error: e.message });
    }
}

	
async function playerClearPlaylist() {
    try {
        const tracklist = app.utils.createTracklist();
        await app.player.addTracksAsync(tracklist, { withClear: true });
    } catch (e) {
        console.error('[playerClearPlaylist] failed:', e);
    }
}


async function playerGetOutputs(requestId) {
    const players = app.sharing.getAvailablePlayers();
    await players.whenLoaded();

    const active = app.sharing.getActivePlayer();
    const activeUuid = active?.uuid ?? '';

    const outputs = [];
    players.locked(() => {
        for (let i = 0; i < players.count; i++) {
            const p = players.getValue(i);
            outputs.push({
                name:     p.name,
                uuid:     p.uuid,
                isActive: p.uuid === activeUuid,
            });
        }
    });
    safeSend({ event: 'playerGetOutputs', requestId, outputs });
}


async function playerSetOutput(uuid) {
    await app.sharing.setActivePlayerUUID(uuid ?? '');
}

