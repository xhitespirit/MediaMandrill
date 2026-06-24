// console.log('[mmbridge_library.js][function] var', var);

'use strict';

// ─────────────────────────────────────────
// data.js — Requêtes DB et formatage
// ─────────────────────────────────────────


const REST_URL = 'http://127.0.0.1:4080';
const splitSemicol = val => {
    return val ? val.split(';').map(s => {
        return s.trim();
    }).filter(Boolean) : [];
};


// log('[mmbridge_library.js][function] var', var);
function log(...args) {
    const ts = new Date().toISOString();
    console.log(ts, ...args);
}


async function libraryStats(requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT
				(SELECT COUNT(ID) FROM Songs)  AS TracksCount,
				(SELECT COUNT(ID) FROM Albums WHERE Album <> '') AS AlbumsCount,
				(SELECT COUNT(ID) FROM Artists WHERE Tracks > 0 OR Albums > 0) AS ArtistsCount,
				(SELECT COUNT(ID) FROM Artists WHERE Authors > 0) AS AuthorsCount,
				(SELECT COUNT(IDGenre) FROM Genres) AS GenresCount,
				(SELECT COUNT(IDPlaylist) FROM Playlists) AS PlaylistsCount;`
        );
		
		const stats = {
			tracks:		r.fieldByName('TracksCount'),
			albums:		r.fieldByName('AlbumsCount'),
			artists:	r.fieldByName('ArtistsCount'),
			authors:	r.fieldByName('AuthorsCount'),
			genres:		r.fieldByName('GenresCount'),
			playlists:	r.fieldByName('PlaylistsCount'),
		};
        safeSend({ event: 'libraryStats', requestId, result: stats });
		
    } catch (e) {
        console.error('[libraryStats] failed:', e);
		safeSend({ event: 'libraryStats', requestId, result: null });
    }
}


async function libraryHash(requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT
				(SELECT SUM(FileModified) FROM Songs)  AS FileStamp,
				(SELECT SUM(TrackModified) FROM Songs) AS TrackStamp;`
        );

        const stamp = {
			fileStamp:		r.fieldByName('FileStamp'),
			trackStamp:		r.fieldByName('TrackStamp'),
		};

		const hash = `${stamp.fileStamp}-${stamp.trackStamp}`;
		safeSend({ event: 'libraryHash', requestId, result: hash });
		
    } catch (e) {
        console.error('[libraryHash] failed:', e);
		safeSend({ event: 'libraryHash', requestId, result: null });
    }
}


async function libraryTracks(requestId) {
	try {
        const r = await app.db.getQueryResultAsync(
            `WITH SongArtists AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 1
				GROUP BY IDSong
			),
			SongAuthors AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 3
				GROUP BY IDSong
			),
			SongGenres AS (
				SELECT IDSong, GROUP_CONCAT(IDGenre, ';') AS IDGenre
				FROM GenresSongs
				GROUP BY IDSong
			),
			AlbumArtists AS (
				SELECT IDAlbum, IDArtist AS IDAlbumArtist
				FROM ArtistsAlbums
				GROUP BY IDAlbum
			)
			SELECT
				s.ID, s.SongTitle,
				s.Artist, sa.IDArtist, s.AlbumArtist, aa.IDAlbumArtist,
				s.Author, sc.IDArtist AS IDAuthor,
				s.Album, s.IDAlbum,
				s.Genre, sg.IDGenre,
				s.DiscNumber, s.TrackNumber, s.Year, s.Mood, s.Occasion, s.Rating, s.SongLength,
				s.Bitrate, s.SamplingFrequency, s.BPS,
				s.SongPath, s.Extension,				
				strftime('%Y%m%d', (s.DateAdded - 25569) * 86400, 'unixepoch') AS DateAdded
				-- s.GroupDesc, s.LastTimePlayed, s.PlayCounter
			FROM
				Songs s
				LEFT JOIN SongArtists sa ON sa.IDSong = s.ID
				LEFT JOIN SongAuthors sc ON sc.IDSong = s.ID
				LEFT JOIN SongGenres sg ON sg.IDSong = s.ID
				LEFT JOIN AlbumArtists aa ON aa.IDAlbum = s.IDAlbum
			WHERE
				s.SongPath IS NOT NULL`
        );

        const tracks = [];
        while (!r.eof) {
            tracks.push({
				songId:				r.fieldByName('ID'),
				title:				r.fieldByName('SongTitle'),
				label:				r.fieldByName('SongTitle'),
				artist:				splitSemicol(r.fieldByName('Artist')),
				artistId:			splitSemicol(r.fieldByName('IDArtist')),
				album:				r.fieldByName('Album'),
				albumId:			r.fieldByName('IDAlbum'),
				albumArtist:		r.fieldByName('AlbumArtist'),
				albumArtistId:		r.fieldByName('IDAlbumArtist'),
				authorId:			splitSemicol(r.fieldByName('IDAuthor')),
				author:				splitSemicol(r.fieldByName('Author')),
				// discNumber:			r.fieldByName('DiscNumber'),
				// trackNumber:		r.fieldByName('TrackNumber'),
				// year:				r.fieldByName('Year'),
				genre:				splitSemicol(r.fieldByName('Genre')),
				genreId:			splitSemicol(r.fieldByName('IDGenre')),
				mood:				splitSemicol(r.fieldByName('Mood')),
				// occasion:			splitSemicol(r.fieldByName('Occasion')),
				rating:				r.fieldByName('Rating'),
				songLength:			r.fieldByName('SongLength'),
				// path:				r.fieldByName('SongPath'),
				dateAdded:			r.fieldByName('DateAdded'),
				// fileType:			r.fieldByName('Extension'),
				// bitrate:			r.fieldByName('Bitrate'),
				// frequency:			r.fieldByName('SamplingFrequency'),
				// bps:				r.fieldByName('BPS'),
            });
            r.next();
        }
        safeSend({ event: 'libraryTracks', requestId, result: tracks });

    } catch (e) {
        console.error('[libraryTracks] failed:', e);
		safeSend({ event: 'libraryTracks', requestId, result: null });
    }
}


async function libraryAlbums(requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
			`WITH DateAdded AS (
				SELECT IDAlbum, MIN(DateAdded) AS DateAdded
				FROM Songs
				GROUP BY IDAlbum
			)
			SELECT
				a.ID, a.Artist, a.Album, a.Year, a.Tracks,
				strftime('%Y%m%d', (da.DateAdded - 25569) * 86400, 'unixepoch') AS DateAdded
			FROM
				Albums a
				LEFT JOIN DateAdded da ON da.IDAlbum = a.ID
			WHERE Album <> ''`
        );

        const albums = [];
        while (!r.eof) {
			albums.push({
				label:			r.fieldByName('Album'),
				album:			r.fieldByName('Album'),
				albumId:		r.fieldByName('ID'),
				albumArtist:	r.fieldByName('Artist'),
				year:			r.fieldByName('Year'),
				tracksCount:	r.fieldByName('Tracks'),
				dateAdded:		r.fieldByName('DateAdded'),
			});
            r.next();
        }
        safeSend({ event: 'libraryAlbums', requestId, result: albums });

    } catch (e) {
        console.error('[libraryAlbums] failed:', e);
		safeSend({ event: 'libraryAlbums', requestId, result: null });
    }
}


async function libraryArtists(requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT ID, Artist, Tracks, Albums
			FROM Artists
			WHERE Tracks > 0 OR Albums > 0`
        );

        const artists = [];
        while (!r.eof) {
            artists.push({
				label:			r.fieldByName('Artist'),
				artist:			r.fieldByName('Artist'),
				artistId:		r.fieldByName('ID'),
				tracksCount:	r.fieldByName('Tracks'),
				albumsCount:	r.fieldByName('Albums'),
            });
            r.next();
        }
        safeSend({ event: 'libraryArtists', requestId, result: artists });

    } catch (e) {
        console.error('[libraryArtists] failed:', e);
		safeSend({ event: 'libraryArtists', requestId, result: null });
    }
}


async function libraryAlbumArtists(requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT ID, Artist, Tracks, Albums
             FROM Artists
             WHERE Albums > 0`
        );

        const artists = [];
        while (!r.eof) {
            artists.push({
				label:			r.fieldByName('Artist'),
				artist:			r.fieldByName('Artist'),
				artistId:		r.fieldByName('ID'),
				tracksCount:	r.fieldByName('Tracks'),
				albumsCount:	r.fieldByName('Albums'),
            });
            r.next();
        }
        safeSend({ event: 'libraryAlbumArtists', requestId, result: artists });

    } catch (e) {
        console.error('[libraryAlbumArtists] failed:', e);
		safeSend({ event: 'libraryAlbumArtists', requestId, result: null });
    }
}


async function libraryAuthors(requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT ID, Artist, Tracks, Albums, Authors
			FROM Artists
			WHERE Authors > 0`
        );

        const authors = [];
        while (!r.eof) {
            authors.push({
				label:			r.fieldByName('Artist'),
				artist:			r.fieldByName('Artist'),
				artistId:		r.fieldByName('ID'),
				tracksCount:	r.fieldByName('Tracks'),
				albumsCount:	r.fieldByName('Albums'),
				authCount:		r.fieldByName('Authors'),
            });
            r.next();
        }
        safeSend({ event: 'libraryAuthors', requestId, result: authors });

    } catch (e) {
        console.error('[libraryAuthors] failed:', e);
		safeSend({ event: 'libraryAuthors', requestId, result: null });
    }
}


async function libraryGenres(requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT IDGenre, GenreName, UsageCount
             FROM Genres`
        );

        const genres = [];
        while (!r.eof) {
            genres.push({
				label:			r.fieldByName('GenreName'),
				genre:			r.fieldByName('GenreName'),
				genreId:		r.fieldByName('IDGenre'),
				tracksCount:	r.fieldByName('UsageCount'),
            });
            r.next();
        }
        safeSend({ event: 'libraryGenres', requestId, result: genres });

    } catch (e) {
        console.error('[libraryGenres] failed:', e);
		safeSend({ event: 'libraryGenres', requestId, result: null });
    }
}


async function libraryMoods(requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT DISTINCT Mood
			 FROM Songs
			 WHERE Mood IS NOT NULL AND Mood <> ''`
        );

        const moods = [];
        while (!r.eof) {
            moods.push(r.fieldByName('Mood'));
            r.next();
        }

        // Les moods peuvent être multiples dans un même champ séparés par ";"
        const uniqueMoods = [...new Set(
            moods.flatMap(m => {
                return m.split(';');
            }).map(m => {
                return m.trim();
            }).filter(Boolean)
        )].sort();
		
        safeSend({ event: 'libraryMoods', requestId, result: uniqueMoods });

    } catch (e) {
        console.error('[libraryMoods] failed:', e);
		safeSend({ event: 'libraryMoods', requestId, result: null });
    }
}


async function libraryPlaylists(requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT IDPlaylist, PlaylistName, IsAutoPlaylist, GUID
             FROM Playlists`
        );

        const playlists = [];
        while (!r.eof) {
            playlists.push({
				label:				r.fieldByName('PlaylistName'),
				playlistName:		r.fieldByName('PlaylistName'),
				playlistId:			r.fieldByName('IDPlaylist'),
				isAutoPlaylist:		Number(r.fieldByName('IsAutoPlaylist')) === 1,
				GUID:				r.fieldByName('GUID'),
            });
            r.next();
        }
        safeSend({ event: 'libraryPlaylists', requestId, result: playlists });

    } catch (e) {
        console.error('[libraryPlaylists] failed:', e);
		safeSend({ event: 'libraryPlaylists', requestId, result: null });
    }
}


async function libraryTrack(songId, requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `WITH SongArtists AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 1
				GROUP BY IDSong
			),
			SongAuthors AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 3
				GROUP BY IDSong
			),
			SongGenres AS (
				SELECT IDSong, GROUP_CONCAT(IDGenre, ';') AS IDGenre
				FROM GenresSongs
				GROUP BY IDSong
			),
			AlbumArtists AS (
				SELECT IDAlbum, IDArtist AS IDAlbumArtist
				FROM ArtistsAlbums
				GROUP BY IDAlbum
			)
			SELECT
				s.ID, s.SongTitle,
				s.Artist, sa.IDArtist, s.AlbumArtist, aa.IDAlbumArtist,
				s.Author, sc.IDArtist AS IDAuthor,
				s.Album, s.IDAlbum,
				s.Genre, sg.IDGenre,
				s.DiscNumber, s.TrackNumber, s.Year, s.Mood, s.Occasion, s.Rating, s.SongLength,
				s.Bitrate, s.SamplingFrequency, s.BPS,
				s.SongPath, s.Extension,				
				strftime('%Y%m%d', (s.DateAdded - 25569) * 86400, 'unixepoch') AS DateAdded
				--s.GroupDesc, s.LastTimePlayed, s.PlayCounter
			FROM
				Songs s
				LEFT JOIN SongArtists sa ON sa.IDSong = s.ID
				LEFT JOIN SongAuthors sc ON sc.IDSong = s.ID
				LEFT JOIN SongGenres sg ON sg.IDSong = s.ID
				LEFT JOIN AlbumArtists aa ON aa.IDAlbum = s.IDAlbum
			WHERE
				s.SongPath IS NOT NULL
				AND s.ID = '${songId}'`
		);

		if (r.eof) { return safeSend({ event: 'libraryArtistId', requestId, track: null });}

        const track = {
			songId:				r.fieldByName('ID'),
			title:				r.fieldByName('SongTitle'),
			label:				r.fieldByName('SongTitle'),
			artist:				splitSemicol(r.fieldByName('Artist')),
			artistId:			splitSemicol(r.fieldByName('IDArtist')),
			albumId:			r.fieldByName('IDAlbum'),
			album:				r.fieldByName('Album'),
			albumArtist:		r.fieldByName('AlbumArtist'),
			albumArtistId:		r.fieldByName('IDAlbumArtist'),
			authorId:			splitSemicol(r.fieldByName('IDAuthor')),
			author:				splitSemicol(r.fieldByName('Author')),
			discNumber:			r.fieldByName('DiscNumber'),
			trackNumber:		r.fieldByName('TrackNumber'),
			year:				r.fieldByName('Year'),
			genre:				splitSemicol(r.fieldByName('Genre')),
			genreId:			splitSemicol(r.fieldByName('IDGenre')),
			mood:				splitSemicol(r.fieldByName('Mood')),
			occasion:			splitSemicol(r.fieldByName('Occasion')),
			rating:				r.fieldByName('Rating'),
			songLength:			r.fieldByName('SongLength'),
			path:				r.fieldByName('SongPath'),
			dateAdded:			r.fieldByName('DateAdded'),
			fileType:			r.fieldByName('Extension'),
			bitrate:			r.fieldByName('Bitrate'),
			frequency:			r.fieldByName('SamplingFrequency'),
			bps:				r.fieldByName('BPS'),
        };
        safeSend({ event: 'libraryTrack', requestId, result: track });

    } catch (e) {
		console.error('[libraryTrack] failed:', e);
		safeSend({ event: 'libraryTrack', requestId, track: null });
    }
}


async function libraryTrackThumbnail(songId, requestId) {
    try {
        const path = await getTrackThumbnailPath(songId);
        safeSend({ event: 'libraryTrackThumbnail', requestId, songId, path: path ?? null });
    } catch (e) {
        console.error('[libraryTrackThumbnail] failed:', e);
        safeSend({ event: 'libraryTrackThumbnail', requestId, songId, path: null });
    }
}


async function libraryAlbum(albumId, requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `WITH DateAdded AS (
				SELECT IDAlbum, MIN(DateAdded) AS DateAdded
				FROM Songs
				GROUP BY IDAlbum
			)
			SELECT
				a.ID, a.Artist, a.Album, a.Year, a.Tracks,
				aa.IDArtist AS ArtistID,
				COUNT(DISTINCT(DiscNumber)) AS Discs,
				strftime('%Y%m%d', (da.DateAdded - 25569) * 86400, 'unixepoch') AS DateAdded
			FROM
				Albums a
				INNER JOIN ArtistsAlbums aa ON aa.IDAlbum = a.ID
				INNER JOIN Songs s ON s.IDAlbum = a.ID
				LEFT JOIN DateAdded da ON da.IDAlbum = a.ID
			WHERE a.ID = '${albumId}'`
        );

		if (r.eof) { return safeSend({ event: 'libraryArtistId', requestId, track: null });}

		const album = {
			label:			r.fieldByName('Album'),
			album:			r.fieldByName('Album'),
			albumId:		r.fieldByName('ID'),
			albumArtist:	r.fieldByName('Artist'),
			albumArtistId:	r.fieldByName('ArtistID'),
			year:			r.fieldByName('Year'),
			tracksCount:	r.fieldByName('Tracks'),
			discsCount:		r.fieldByName('Discs'),
			dateAdded:		r.fieldByName('DateAdded'),
		};
        safeSend({ event: 'libraryAlbum', requestId, result: album });

    } catch (e) {
		console.error('[libraryAlbum] failed:', e);
		safeSend({ event: 'libraryAlbum', requestId, result: null });
    }
}


async function libraryAlbumTracks(albumId, requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `WITH SongArtists AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 1
				GROUP BY IDSong
			),
			SongAuthors AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 3
				GROUP BY IDSong
			),
			SongGenres AS (
				SELECT IDSong, GROUP_CONCAT(IDGenre, ';') AS IDGenre
				FROM GenresSongs
				GROUP BY IDSong
			),
			AlbumArtists AS (
				SELECT IDAlbum, IDArtist AS IDAlbumArtist
				FROM ArtistsAlbums
				GROUP BY IDAlbum
			)
			SELECT
				s.ID, s.SongTitle,
				s.Artist, sa.IDArtist, s.AlbumArtist, aa.IDAlbumArtist,
				s.Author, sc.IDArtist AS IDAuthor,
				s.Album, s.IDAlbum,
				s.Genre, sg.IDGenre,
				s.DiscNumber, s.TrackNumber, s.Year, s.Mood, s.Occasion, s.Rating, s.SongLength,
				s.Bitrate, s.SamplingFrequency, s.BPS,
				s.SongPath, s.Extension, s.DateAdded
				--s.GroupDesc, s.LastTimePlayed, s.PlayCounter
			FROM
				Songs s
				LEFT JOIN SongArtists sa ON sa.IDSong = s.ID
				LEFT JOIN SongAuthors sc ON sc.IDSong = s.ID
				LEFT JOIN SongGenres sg ON sg.IDSong = s.ID
				LEFT JOIN AlbumArtists aa ON aa.IDAlbum = s.IDAlbum
			WHERE
				s.SongPath IS NOT NULL
				AND s.IDAlbum = '${albumId}'
			ORDER BY s.TrackNumber`
        );

        const tracks = [];
        while (!r.eof) {
            tracks.push({
				songId:				r.fieldByName('ID'),
				title:				r.fieldByName('SongTitle'),
				label:				r.fieldByName('SongTitle'),
				artist:				splitSemicol(r.fieldByName('Artist')),
				artistId:			splitSemicol(r.fieldByName('IDArtist')),
				albumId:			r.fieldByName('IDAlbum'),
				album:				r.fieldByName('Album'),
				albumArtist:		r.fieldByName('AlbumArtist'),
				albumArtistId:		r.fieldByName('IDAlbumArtist'),
				authorId:			splitSemicol(r.fieldByName('IDAuthor')),
				author:				splitSemicol(r.fieldByName('Author')),
				discNumber:			r.fieldByName('DiscNumber'),
				trackNumber:		r.fieldByName('TrackNumber'),
				year:				r.fieldByName('Year'),
				genre:				splitSemicol(r.fieldByName('Genre')),
				genreId:			splitSemicol(r.fieldByName('IDGenre')),
				mood:				splitSemicol(r.fieldByName('Mood')),
				occasion:			splitSemicol(r.fieldByName('Occasion')),
				rating:				r.fieldByName('Rating'),
				songLength:			r.fieldByName('SongLength'),
				path:				r.fieldByName('SongPath'),
				dateAdded:			r.fieldByName('DateAdded'),
				fileType:			r.fieldByName('Extension'),
				bitrate:			r.fieldByName('Bitrate'),
				frequency:			r.fieldByName('SamplingFrequency'),
				bps:				r.fieldByName('BPS'),
            });
            r.next();
        }
        safeSend({ event: 'libraryAlbumTracks', requestId, result: tracks });

    } catch (e) {
		console.error('[libraryAlbumTracks] failed:', e);
		safeSend({ event: 'libraryAlbumTracks', requestId, result: null });
    }
}


async function libraryAlbumGenres(albumId, requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
			`SELECT
				IDAlbum,
				Album,
				GROUP_CONCAT(IDGenre, ';') AS IDGenres,
				GROUP_CONCAT(GenreName, ';') AS Genres
			FROM (
					SELECT DISTINCT
					a.ID AS IDAlbum
					,a.Album
					,sg.IDGenre
					,g.GenreName
				FROM Songs s
					INNER JOIN Albums a ON a.ID = s.IDAlbum
					INNER JOIN GenresSongs sg ON sg.IDSong = s.ID
					INNER JOIN Genres g	ON g.IDGenre = sg.IDGenre
					
				WHERE s.IDAlbum = '${albumId}'
				)
			GROUP BY IDAlbum, Album`
        );
		
		let album = null;
		if (!r.eof) {
			album = {
				artistId:  splitSemicol(r.fieldByName('IDAlbum')),
				artist:    splitSemicol(r.fieldByName('Album')),
				genreId:   r.fieldByName('IDGenres'),
				genre:     r.fieldByName('Genres'),
			};
		}
		safeSend({ event: 'libraryAlbumGenres', requestId, result: album });
	
    } catch (e) {
        console.error('[libraryAlbumGenres] failed:', e);
		safeSend({ event: 'libraryAlbumGenres', requestId, result: null });
    }
}


async function libraryAlbumThumbnail(albumId, requestId) {
    try {
        const path = await getAlbumThumbnailPath(albumId);
        safeSend({ event: 'libraryAlbumThumbnail', requestId, albumId, path: path ?? null });
    } catch (e) {
        console.error('[libraryAlbumThumbnail] failed:', e);
        safeSend({ event: 'libraryAlbumThumbnail', requestId, albumId, path: null });
    }
}


async function libraryArtist(artistId, requestId) {
    try {
		const artist = await libraryArtistDBQuery(artistId);
        safeSend({ event: 'libraryArtist', requestId, result: artist });
    } catch (e) {
        console.error('[libraryArtist] failed:', e);
		safeSend({ event: 'libraryArtist', requestId, result: null });
    }
}


async function libraryArtistDBQuery(artistId) {
    try {
        const r = await app.db.getQueryResultAsync(
			`SELECT
				ar.Artist AS artist
				,ar.ID AS artistId
				,ar.Artist AS label
				,COALESCE(
					NULLIF(ar.Tracks, 0)
					,SUM(NULLIF(DISTINCT(al.Tracks), 0))
				) AS tracksCount
				,COALESCE(
					NULLIF(ar.Albums, 0),
					NULLIF(COUNT(DISTINCT(s.IDAlbum)), 0)
				) AS albumsCount
				,NULLIF(ar.Authors, 0) AS authCount
			FROM
				Artists ar
				LEFT JOIN ArtistsAlbums aa ON aa.IDArtist = ar.ID
				LEFT JOIN Albums al ON al.ID = aa.IDAlbum
				LEFT JOIN ArtistsSongs ars ON ars.IDArtist = ar.ID
				LEFT JOIN Songs s ON s.ID = ars.IDSong
			WHERE ar.ID = ${artistId}`
        );

		if (r.eof) { return null };
		
        const artist = {
			label:			r.fieldByName('Artist'),
			artist:			r.fieldByName('Artist'),
			artistId:		r.fieldByName('artistId'),
			tracksCount:	r.fieldByName('tracksCount'),
			albumsCount:	r.fieldByName('albumsCount'),
			authCount:		r.fieldByName('authCount'),
		}
		
		return artist;

    } catch (e) {
        console.error('[libraryArtistDBQuery] failed:', e);
    }
}


async function libraryArtistTracks(artistId, requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `WITH SongArtists AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 1
				GROUP BY IDSong
			),
			SongAuthors AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 3
				GROUP BY IDSong
			),
			SongGenres AS (
				SELECT IDSong, GROUP_CONCAT(IDGenre, ';') AS IDGenre
				FROM GenresSongs
				GROUP BY IDSong
			),
			AlbumArtists AS (
				SELECT IDAlbum, IDArtist AS IDAlbumArtist
				FROM ArtistsAlbums
				GROUP BY IDAlbum
			)
			SELECT
				s.ID, s.SongTitle,
				s.Artist, sa.IDArtist, s.AlbumArtist, aa.IDAlbumArtist,
				s.Author, sc.IDArtist AS IDAuthor,
				s.Album, s.IDAlbum,
				s.Genre, sg.IDGenre,
				s.DiscNumber, s.TrackNumber, s.Year, s.Mood, s.Occasion, s.Rating, s.SongLength,
				s.Bitrate, s.SamplingFrequency, s.BPS,
				s.SongPath, s.Extension, s.DateAdded
				--s.GroupDesc, s.LastTimePlayed, s.PlayCounter
			FROM
				Songs s
				LEFT JOIN SongArtists sa ON sa.IDSong = s.ID
				LEFT JOIN SongAuthors sc ON sc.IDSong = s.ID
				LEFT JOIN SongGenres sg ON sg.IDSong = s.ID
				LEFT JOIN AlbumArtists aa ON aa.IDAlbum = s.IDAlbum
			WHERE
				s.SongPath IS NOT NULL
				AND
					(';' || sa.IDArtist || ';' LIKE '%;${artistId};%'
					OR
					';' || sc.IDArtist || ';' LIKE '%;${artistId};%')`
        );

        const tracks = [];
        while (!r.eof) {
            tracks.push({
				songId:				r.fieldByName('ID'),
				title:				r.fieldByName('SongTitle'),
				label:				r.fieldByName('SongTitle'),
				artist:				splitSemicol(r.fieldByName('Artist')),
				artistId:			splitSemicol(r.fieldByName('IDArtist')),
				albumId:			r.fieldByName('IDAlbum'),
				album:				r.fieldByName('Album'),
				albumArtist:		r.fieldByName('AlbumArtist'),
				albumArtistId:		r.fieldByName('IDAlbumArtist'),
				authorId:			splitSemicol(r.fieldByName('IDAuthor')),
				author:				splitSemicol(r.fieldByName('Author')),
				discNumber:			r.fieldByName('DiscNumber'),
				trackNumber:		r.fieldByName('TrackNumber'),
				year:				r.fieldByName('Year'),
				genre:				splitSemicol(r.fieldByName('Genre')),
				genreId:			splitSemicol(r.fieldByName('IDGenre')),
				mood:				splitSemicol(r.fieldByName('Mood')),
				occasion:			splitSemicol(r.fieldByName('Occasion')),
				rating:				r.fieldByName('Rating'),
				songLength:			r.fieldByName('SongLength'),
				path:				r.fieldByName('SongPath'),
				dateAdded:			r.fieldByName('DateAdded'),
				fileType:			r.fieldByName('Extension'),
				bitrate:			r.fieldByName('Bitrate'),
				frequency:			r.fieldByName('SamplingFrequency'),
				bps:				r.fieldByName('BPS'),
            });
            r.next();
        }
		safeSend({ event: 'libraryArtistTracks', requestId, result: tracks });

    } catch (e) {
        console.error('[libraryArtistTracks] failed:', e);
		safeSend({ event: 'libraryArtistTracks', requestId, result: null });
    }
}


async function libraryArtistGenres(artistId, requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT
				IDArtist,
				Artist,
				GROUP_CONCAT(IDGenre, ';') AS IDGenres,
				GROUP_CONCAT(GenreName, ';') AS Genres
			FROM (
				SELECT DISTINCT
					a.ID AS IDArtist,
					a.Artist,
					sg.IDGenre,
					g.GenreName
				FROM Artists a
				INNER JOIN
					ArtistsSongs sa ON sa.IDArtist = a.ID AND sa.PersonType IN (1, 3)
					INNER JOIN GenresSongs sg ON sg.IDSong = sa.IDSong
					INNER JOIN Genres g	ON g.IDGenre = sg.IDGenre
			)
			WHERE IDArtist = '${artistId}'
			GROUP BY IDArtist, Artist`
        );
		
		let artist = null;
		if (!r.eof) {
			artist = {
				artistId:  splitSemicol(r.fieldByName('IDArtist')),
				artist:    splitSemicol(r.fieldByName('Artist')),
				genreId:   r.fieldByName('IDGenres'),
				genre:     r.fieldByName('Genres'),
			};
		}
		safeSend({ event: 'libraryArtistGenres', requestId, result: artist });
	
    } catch (e) {
        console.error('[libraryArtistGenres] failed:', e);
		safeSend({ event: 'libraryArtistGenres', requestId, result: null });
    }
}


async function libraryArtistAlbums(artistId, requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT DISTINCT a.ID, a.Album, a.Artist, a.Year, a.Tracks
			FROM 
				ArtistsSongs ars
				INNER JOIN Songs s on s.ID = ars.IDSong
				INNER JOIN Albums a ON a.ID = s.IDAlbum
			WHERE
				ars.IDArtist = '${artistId}'
				AND ars.PersonType IN (1, 3) -- 1:Artist 3:Composer`
        );

        const albums = [];
        while (!r.eof) {
            albums.push({
				label:			r.fieldByName('Album'),
				album:			r.fieldByName('Album'),
				albumId:		r.fieldByName('ID'),
				albumArtist:	r.fieldByName('Artist'),
				year:			r.fieldByName('Year'),
				tracksCount:	r.fieldByName('Tracks'),
            });
            r.next();
        }
        safeSend({ event: 'libraryArtistAlbums', requestId, result: albums });

    } catch (e) {
        console.error('[libraryArtistAlbums] failed:', e);
		safeSend({ event: 'libraryArtistAlbums', requestId, result: null });
    }
}


async function libraryArtistId(artistName, requestId) {
    try {
		const safeArtistName = artistName.replace(/'/g, "''");
        const r = await app.db.getQueryResultAsync(
            `SELECT ID
			FROM Artists
			WHERE Artist LIKE '${safeArtistName}'`
        );

        if (r.eof) { return safeSend({ event: 'libraryArtistId', requestId, track: null });}

        const artistId = r.fieldByName('ID');
        safeSend({ event: 'libraryArtistId', requestId, result: artistId });

    } catch (e) {
        console.error('[libraryArtistId] failed:', e);
		safeSend({ event: 'libraryArtistId', requestId, result: null });
    }
}



async function libraryArtistThumbnail(artistId, requestId) {
    try {
        const path = await getArtistThumbnailPath(artistId);
        safeSend({ event: 'libraryArtistThumbnail', requestId, artistId, path: path ?? null });
    } catch (e) {
        console.error('[libraryArtistThumbnail] failed:', e);
        safeSend({ event: 'libraryArtistThumbnail', requestId, artistId, path: null });
    }
}


async function libraryAlbumArtistTracks(artistId, requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `WITH SongArtists AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 1
				GROUP BY IDSong
			),
			SongAuthors AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 3
				GROUP BY IDSong
			),
			SongGenres AS (
				SELECT IDSong, GROUP_CONCAT(IDGenre, ';') AS IDGenre
				FROM GenresSongs
				GROUP BY IDSong
			),
			AlbumArtists AS (
				SELECT IDAlbum, IDArtist AS IDAlbumArtist
				FROM ArtistsAlbums
				GROUP BY IDAlbum
			)
			SELECT
				s.ID, s.SongTitle,
				s.Artist, sa.IDArtist, s.AlbumArtist, aa.IDAlbumArtist,
				s.Author, sc.IDArtist AS IDAuthor,
				s.Album, s.IDAlbum,
				s.Genre, sg.IDGenre,
				s.DiscNumber, s.TrackNumber, s.Year, s.Mood, s.Occasion, s.Rating, s.SongLength,
				s.Bitrate, s.SamplingFrequency, s.BPS,
				s.SongPath, s.Extension, s.DateAdded
				--s.GroupDesc, s.LastTimePlayed, s.PlayCounter
			FROM
				Songs s
				LEFT JOIN SongArtists sa ON sa.IDSong = s.ID
				LEFT JOIN SongAuthors sc ON sc.IDSong = s.ID
				LEFT JOIN SongGenres sg ON sg.IDSong = s.ID
				LEFT JOIN AlbumArtists aa ON aa.IDAlbum = s.IDAlbum
			WHERE
				s.SongPath IS NOT NULL
				AND aa.IDAlbumArtist = '${artistId}'`
        );

        const tracks = [];
        while (!r.eof) {
            tracks.push({
				songId:				r.fieldByName('ID'),
				title:				r.fieldByName('SongTitle'),
				label:				r.fieldByName('SongTitle'),
				artist:				splitSemicol(r.fieldByName('Artist')),
				artistId:			splitSemicol(r.fieldByName('IDArtist')),
				albumId:			r.fieldByName('IDAlbum'),
				album:				r.fieldByName('Album'),
				albumArtist:		r.fieldByName('AlbumArtist'),
				albumArtistId:		r.fieldByName('IDAlbumArtist'),
				authorId:			splitSemicol(r.fieldByName('IDAuthor')),
				author:				splitSemicol(r.fieldByName('Author')),
				discNumber:			r.fieldByName('DiscNumber'),
				trackNumber:		r.fieldByName('TrackNumber'),
				year:				r.fieldByName('Year'),
				genre:				splitSemicol(r.fieldByName('Genre')),
				genreId:			splitSemicol(r.fieldByName('IDGenre')),
				mood:				splitSemicol(r.fieldByName('Mood')),
				occasion:			splitSemicol(r.fieldByName('Occasion')),
				rating:				r.fieldByName('Rating'),
				songLength:			r.fieldByName('SongLength'),
				path:				r.fieldByName('SongPath'),
				dateAdded:			r.fieldByName('DateAdded'),
				fileType:			r.fieldByName('Extension'),
				bitrate:			r.fieldByName('Bitrate'),
				frequency:			r.fieldByName('SamplingFrequency'),
				bps:				r.fieldByName('BPS'),
            });
            r.next();
        }
		safeSend({ event: 'libraryAlbumArtistTracks', requestId, result: tracks });

    } catch (e) {
        console.error('[libraryAlbumArtistTracks] failed:', e);
		safeSend({ event: 'libraryAlbumArtistTracks', requestId, result: null });
    }
}



async function libraryAlbumArtistAlbums(artistId, requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT aa.IDAlbum, a.Album, a.Artist, a.Year, a.Tracks
			FROM
				ArtistsAlbums aa
				INNER JOIN Albums a ON a.ID= aa.IDAlbum
			WHERE
				IDArtist = '${artistId}'`
        );

        const albums = [];
        while (!r.eof) {
            albums.push({
				label:			r.fieldByName('Album'),
				album:			r.fieldByName('Album'),
				albumId:		r.fieldByName('IDAlbum'),
				albumArtist:	r.fieldByName('Artist'),
				year:			r.fieldByName('Year'),
				tracksCount:	r.fieldByName('Tracks'),
            });
            r.next();
        }
        safeSend({ event: 'libraryAlbumArtistAlbums', requestId, result: albums });

    } catch (e) {
        console.error('[libraryAlbumArtistAlbums] failed:', e);
		safeSend({ event: 'libraryAlbumArtistAlbums', requestId, result: null });
    }
}





async function libraryGenre(genreId, requestId) {
    try {
		let query;
		
        // ── infos genre ──
		query = `SELECT IDGenre, GenreName, UsageCount FROM Genres WHERE IDGenre = ${genreId}`;
        const rGenre = await app.db.getQueryResultAsync(query);
		
        if (rGenre.eof) {
            return safeSend({ event: 'libraryPlaylist', requestId, result: null });
        }
		
		// ── tracks ──
		query = `WITH SongArtists AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 1
				GROUP BY IDSong
			),
			SongAuthors AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 3
				GROUP BY IDSong
			),
			SongGenres AS (
				SELECT IDSong, GROUP_CONCAT(IDGenre, ';') AS IDGenre
				FROM GenresSongs
				GROUP BY IDSong
			),
			AlbumArtists AS (
				SELECT IDAlbum, IDArtist AS IDAlbumArtist
				FROM ArtistsAlbums
				GROUP BY IDAlbum
			)
			SELECT
				s.ID, s.SongTitle,
				s.Artist, sa.IDArtist, s.AlbumArtist, aa.IDAlbumArtist,
				s.Author, sc.IDArtist AS IDAuthor,
				s.Album, s.IDAlbum,
				s.Genre, sg.IDGenre,
				s.DiscNumber, s.TrackNumber, s.Year, s.Mood, s.Occasion, s.Rating, s.SongLength,
				s.Bitrate, s.SamplingFrequency, s.BPS,
				s.SongPath, s.Extension, s.DateAdded
				-- s.GroupDesc, s.LastTimePlayed, s.PlayCounter
			FROM
				Songs s
				LEFT JOIN SongArtists sa ON sa.IDSong = s.ID
				LEFT JOIN SongAuthors sc ON sc.IDSong = s.ID
				LEFT JOIN SongGenres sg ON sg.IDSong = s.ID
				LEFT JOIN AlbumArtists aa ON aa.IDAlbum = s.IDAlbum
			WHERE
				s.SongPath IS NOT NULL
				AND ';' || sg.IDGenre || ';' LIKE '%;${genreId};%'`
				
        const r = await app.db.getQueryResultAsync(query);
        const tracks = [];
        while (!r.eof) {
            tracks.push({
				songId:				r.fieldByName('ID'),
				title:				r.fieldByName('SongTitle'),
				label:				r.fieldByName('SongTitle'),
				artist:				splitSemicol(r.fieldByName('Artist')),
				artistId:			splitSemicol(r.fieldByName('IDArtist')),
				albumId:			r.fieldByName('IDAlbum'),
				album:				r.fieldByName('Album'),
				albumArtist:		r.fieldByName('AlbumArtist'),
				albumArtistId:		r.fieldByName('IDAlbumArtist'),
				authorId:			splitSemicol(r.fieldByName('IDAuthor')),
				author:				splitSemicol(r.fieldByName('Author')),
				discNumber:			r.fieldByName('DiscNumber'),
				trackNumber:		r.fieldByName('TrackNumber'),
				year:				r.fieldByName('Year'),
				genre:				splitSemicol(r.fieldByName('Genre')),
				genreId:			splitSemicol(r.fieldByName('IDGenre')),
				mood:				splitSemicol(r.fieldByName('Mood')),
				occasion:			splitSemicol(r.fieldByName('Occasion')),
				rating:				r.fieldByName('Rating'),
				songLength:			r.fieldByName('SongLength'),
				path:				r.fieldByName('SongPath'),
				dateAdded:			r.fieldByName('DateAdded'),
				fileType:			r.fieldByName('Extension'),
				bitrate:			r.fieldByName('Bitrate'),
				frequency:			r.fieldByName('SamplingFrequency'),
				bps:				r.fieldByName('BPS'),
            });
            r.next();
        }
		safeSend({
            event: 'libraryGenre',
            requestId,
            result: {
				genreName:		rGenre.fieldByName('GenreName'),
				label:			rGenre.fieldByName('GenreName'),
				genreId:		rGenre.fieldByName('IDGenre'),
				tracksCount:	rGenre.fieldByName('UsageCount'),
				tracks:			tracks,
            }
        });

    } catch (e) {
		console.error('[libraryGenre] failed:', e);
		safeSend({ event: 'libraryGenre', requestId, result: null });
    }
}


async function libraryGenreId(genreName, requestId) {
    try {
		const safeGenreName = genreName.replace(/'/g, "''");
        const r = await app.db.getQueryResultAsync(
            `SELECT IDGenre
			FROM Genres
			WHERE GenreName LIKE '${safeGenreName}'`
        );

        if (r.eof) { return safeSend({ event: 'libraryGenreId', requestId, track: null });}

        const genreId = r.fieldByName('IDGenre');
        safeSend({ event: 'libraryGenreId', requestId, result: genreId });

    } catch (e) {
        console.error('[libraryGenreId] failed:', e);
		safeSend({ event: 'libraryGenreId', requestId, result: null });
    }
}


async function libraryGenreArtists(genreId, requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT
				IDGenre
				,GenreName
				,IDArtist
				,Artist
			FROM (
				SELECT DISTINCT
					a.ID AS IDArtist,
					a.Artist,
					sg.IDGenre,
					g.GenreName
				FROM
					Artists a
					INNER JOIN ArtistsSongs sa ON sa.IDArtist = a.ID AND sa.PersonType IN (1, 3)
					INNER JOIN GenresSongs sg ON sg.IDSong = sa.IDSong
					INNER JOIN Genres g ON g.IDGenre = sg.IDGenre
			)
			WHERE IDGenre = '${genreId}'`
        );

        const genre = [];
        while (!r.eof) {
            genre.push({
				genreId:			r.fieldByName('IDGenre'),
				genre:				r.fieldByName('GenreName'),
				artistId:			splitSemicol(r.fieldByName('IDArtist')),
				artist:				splitSemicol(r.fieldByName('Artist')),
            });
            r.next();
        }
		safeSend({ event: 'libraryGenreArtists', requestId, result: genre });

    } catch (e) {
        console.error('[libraryGenreArtists] failed:', e);
		safeSend({ event: 'libraryGenreArtists', requestId, result: null });
    }
}


async function libraryGenreAlbums(genreId, requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `SELECT
				IDGenre
				,GenreName
				,IDAlbum
				,Album
			FROM (
				SELECT DISTINCT
					a.ID AS IDAlbum,
					a.Album,
					sg.IDGenre,
					g.GenreName
				FROM
					Albums a
					INNER JOIN Songs s ON s.IDAlbum = a.ID
					INNER JOIN GenresSongs sg ON sg.IDSong = s.ID
					INNER JOIN Genres g ON g.IDGenre = sg.IDGenre
			)
			WHERE IDGenre = '${genreId}'`
        );

        const genre = [];
        while (!r.eof) {
            genre.push({
				genreId:			r.fieldByName('IDGenre'),
				genre:				r.fieldByName('GenreName'),
				albumId:			splitSemicol(r.fieldByName('IDAlbum')),
				album:				splitSemicol(r.fieldByName('Album')),
            });
            r.next();
        }
		safeSend({ event: 'libraryGenreAlbums', requestId, result: genre });

    } catch (e) {
        console.error('[libraryGenreAlbums] failed:', e);
		safeSend({ event: 'libraryGenreAlbums', requestId, result: null });
    }
}


async function libraryMoodTracks(moodName, requestId) {
    try {
        const r = await app.db.getQueryResultAsync(
            `WITH SongArtists AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 1
				GROUP BY IDSong
			),
			SongAuthors AS (
				SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
				FROM ArtistsSongs
				WHERE PersonType = 3
				GROUP BY IDSong
			),
			SongGenres AS (
				SELECT IDSong, GROUP_CONCAT(IDGenre, ';') AS IDGenre
				FROM GenresSongs
				GROUP BY IDSong
			),
			AlbumArtists AS (
				SELECT IDAlbum, IDArtist AS IDAlbumArtist
				FROM ArtistsAlbums
				GROUP BY IDAlbum
			)
			SELECT
				s.ID, s.SongTitle,
				s.Artist, sa.IDArtist, s.AlbumArtist, aa.IDAlbumArtist,
				s.Author, sc.IDArtist AS IDAuthor,
				s.Album, s.IDAlbum,
				s.Genre, sg.IDGenre,
				s.DiscNumber, s.TrackNumber, s.Year, s.Mood, s.Occasion, s.Rating, s.SongLength,
				s.Bitrate, s.SamplingFrequency, s.BPS,
				s.SongPath, s.Extension, s.DateAdded
				--s.GroupDesc, s.LastTimePlayed, s.PlayCounter
			FROM
				Songs s
				LEFT JOIN SongArtists sa ON sa.IDSong = s.ID
				LEFT JOIN SongAuthors sc ON sc.IDSong = s.ID
				LEFT JOIN SongGenres sg ON sg.IDSong = s.ID
				LEFT JOIN AlbumArtists aa ON aa.IDAlbum = s.IDAlbum
			WHERE
				s.SongPath IS NOT NULL
				AND s.Mood LIKE '%${moodName}%'`
        );

        const tracks = [];
        while (!r.eof) {
            tracks.push({
				songId:				r.fieldByName('ID'),
				title:				r.fieldByName('SongTitle'),
				label:				r.fieldByName('SongTitle'),
				artist:				splitSemicol(r.fieldByName('Artist')),
				artistId:			splitSemicol(r.fieldByName('IDArtist')),
				albumId:			r.fieldByName('IDAlbum'),
				album:				r.fieldByName('Album'),
				albumArtist:		r.fieldByName('AlbumArtist'),
				albumArtistId:		r.fieldByName('IDAlbumArtist'),
				authorId:			splitSemicol(r.fieldByName('IDAuthor')),
				author:				splitSemicol(r.fieldByName('Author')),
				discNumber:			r.fieldByName('DiscNumber'),
				trackNumber:		r.fieldByName('TrackNumber'),
				year:				r.fieldByName('Year'),
				genre:				splitSemicol(r.fieldByName('Genre')),
				genreId:			splitSemicol(r.fieldByName('IDGenre')),
				mood:				splitSemicol(r.fieldByName('Mood')),
				occasion:			splitSemicol(r.fieldByName('Occasion')),
				rating:				r.fieldByName('Rating'),
				songLength:			r.fieldByName('SongLength'),
				path:				r.fieldByName('SongPath'),
				dateAdded:			r.fieldByName('DateAdded'),
				fileType:			r.fieldByName('Extension'),
				bitrate:			r.fieldByName('Bitrate'),
				frequency:			r.fieldByName('SamplingFrequency'),
				bps:				r.fieldByName('BPS'),
            });
            r.next();
        }
        safeSend({ event: 'libraryMoodTracks', requestId, result: tracks });

    } catch (e) {
		console.error('[libraryMoodTracks] failed:', e);
		safeSend({ event: 'libraryMoodTracks', requestId, result: null });
    }
}


async function libraryPlaylist(playlistId, requestId) {
    try {
		let query;

        // ── infos playlist ──
		query = `SELECT PlaylistName, IDPlaylist, IsAutoPlaylist FROM Playlists WHERE IDPlaylist = ${playlistId}`
        const rPl = await app.db.getQueryResultAsync(query);

        if (rPl.eof) {
            return safeSend({ event: 'libraryPlaylist', requestId, result: null });
        }

		const isAutoPlaylist = Number(rPl.fieldByName('IsAutoPlaylist')) === 1;
        let filter;
		
		if (isAutoPlaylist) {
			// ── playlist dynamique (récupération de la requête SQL stockée) ──
            query = await app.db.getAutoPlaylistQueryAsync(playlistId);
			filter = query
				.replace(/SELECT\s+Songs\.\*\s+FROM\s+Songs\s+WHERE\s+/i, "")
				.replace(/\bSongs\./g, "s.")
				.replace(/(\.\s*)Id\b/g, "$1ID");
		}
		else {
			// ── playlist statique ──
			filter = `ps.IDPlaylist = ${playlistId}`;
		}
		
		query = `
		WITH SongArtists AS (
			SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
			FROM ArtistsSongs
			WHERE PersonType = 1
			GROUP BY IDSong
		),
		SongAuthors AS (
			SELECT IDSong, GROUP_CONCAT(IDArtist, ';') AS IDArtist
			FROM ArtistsSongs
			WHERE PersonType = 3
			GROUP BY IDSong
		),
		SongGenres AS (
			SELECT IDSong, GROUP_CONCAT(IDGenre, ';') AS IDGenre
			FROM GenresSongs
			GROUP BY IDSong
		),
		AlbumArtists AS (
			SELECT IDAlbum, IDArtist AS IDAlbumArtist
			FROM ArtistsAlbums
			GROUP BY IDAlbum
		)
		SELECT
			s.ID, s.SongTitle,
			s.Artist, sa.IDArtist, s.AlbumArtist, aa.IDAlbumArtist,
			s.Author, sc.IDArtist AS IDAuthor,
			s.Album, s.IDAlbum,
			s.Genre, sg.IDGenre,
			s.DiscNumber, s.TrackNumber, s.Year, s.Mood, s.Occasion, s.Rating, s.SongLength,
			s.Bitrate, s.SamplingFrequency, s.BPS,
			s.SongPath, s.Extension, s.DateAdded
			--s.GroupDesc, s.LastTimePlayed, s.PlayCounter
		FROM
			Songs s
			LEFT JOIN SongArtists sa ON sa.IDSong = s.ID
			LEFT JOIN SongAuthors sc ON sc.IDSong = s.ID
			LEFT JOIN SongGenres sg ON sg.IDSong = s.ID
			LEFT JOIN AlbumArtists aa ON aa.IDAlbum = s.IDAlbum
			INNER JOIN PlaylistSongs ps ON ps.IDSong = s.ID
		WHERE		
			s.SongPath IS NOT NULL
			AND (${filter})`;

        // ── tracks ──
		const r = await app.db.getQueryResultAsync(query);
		const tracks = [];
		while (!r.eof) {
			tracks.push({
				songId:				r.fieldByName('ID'),
				title:				r.fieldByName('SongTitle'),
				label:				r.fieldByName('SongTitle'),
				artist:				splitSemicol(r.fieldByName('Artist')),
				artistId:			splitSemicol(r.fieldByName('IDArtist')),
				albumId:			r.fieldByName('IDAlbum'),
				album:				r.fieldByName('Album'),
				albumArtist:		r.fieldByName('AlbumArtist'),
				albumArtistId:		r.fieldByName('IDAlbumArtist'),
				authorId:			splitSemicol(r.fieldByName('IDAuthor')),
				author:				splitSemicol(r.fieldByName('Author')),
				discNumber:			r.fieldByName('DiscNumber'),
				trackNumber:		r.fieldByName('TrackNumber'),
				year:				r.fieldByName('Year'),
				genre:				splitSemicol(r.fieldByName('Genre')),
				genreId:			splitSemicol(r.fieldByName('IDGenre')),
				mood:				splitSemicol(r.fieldByName('Mood')),
				occasion:			splitSemicol(r.fieldByName('Occasion')),
				rating:				r.fieldByName('Rating'),
				songLength:			r.fieldByName('SongLength'),
				path:				r.fieldByName('SongPath'),
				dateAdded:			r.fieldByName('DateAdded'),
				fileType:			r.fieldByName('Extension'),
				bitrate:			r.fieldByName('Bitrate'),
				frequency:			r.fieldByName('SamplingFrequency'),
				bps:				r.fieldByName('BPS'),
			});
			r.next();
		}

        safeSend({
            event: 'libraryPlaylist',
            requestId,
            result: {
				playlistName:	rPl.fieldByName('PlaylistName'),
				label:			rPl.fieldByName('PlaylistName'),
				playlistId:		rPl.fieldByName('IDPlaylist'),
                isAutoPlaylist:	isAutoPlaylist,
				tracksCount: tracks.length,
                tracks: tracks
            }
        });

    } catch (e) {
        console.error('[libraryPlaylist] failed:', e);
        safeSend({ event: 'libraryPlaylist', requestId, result: null });
    }
}


// ── Récupérer le chemin de la pochette d'une piste ──
async function getTrackThumbnailPath(songId) {
    try {
        const track = await app.getObject('track', { id: songId });
        if (typeof track.getThumbAsync === 'function') {
            const path = await new Promise(resolve => {
                track.getThumbAsync(500, 500, p => {
                    return resolve(p || null);
                });
            });
            return isValidMMPath(path) ? path : null;
        }

		return null;
    } catch (e) {
        console.error('[getTrackThumbnailPath] failed:', e);
        return null;
    }
}


// ── Récupérer le chemin de la pochette d'un album ──
async function getAlbumThumbnailPath(albumId) {
    try {
        const album = await app.getObject('album', { id: albumId });
        if (typeof album.getThumbAsync === 'function') {
            const path = await new Promise(resolve => {
                album.getThumbAsync(500, 500, p => {
                    return resolve(p || null);
                });
            });
            return isValidMMPath(path) ? path : null;
        }

        return null;

    } catch (e) {
        console.error('[getAlbumThumbnailPath] failed:', e);
        return null;
    }
}


// ── Récupérer le chemin de la thumb d'un artist ──
async function getArtistThumbnailPath(artistId) {
    try {
        const artist = await app.getObject('artist', { id: artistId });
        if (typeof artist.getThumbAsync === 'function') {
            const path = await new Promise(resolve => {
                artist.getThumbAsync(500, 500, p => {
                    return resolve(p || null);
                });
            });
            if (isValidMMPath(path)) {
                return path;
            }
        }
        
		// fallback AudioDB
		const fallbackPath = await getArtistThumbnailPathFallback(artistId);
		return fallbackPath;
		
    } catch (e) {
        console.error('[getArtistThumbnailPath] failed:', e);
        return null;
    }
}

async function getArtistThumbnailPathFallback(artistId) {
    try {

        // Fallback: récupérer le nom de l'artiste puis le thumbnail
        const artistInfo = await libraryArtistDBQuery(artistId);
        const artistName = artistInfo && artistInfo.artist;
        if (!artistName) { return null; }
		
		// TheAudioDb
		const audioDB = await getInfoFromTheAudioDB( {searchType: 'artist', artistName: artistName} )
		const thumbnailUrl = audioDB && audioDB.thumbnail;
		
		// fanart.tv
		// const fanartTv = await getInfoFromFanartTv(artistName)
		// const thumbnailUrl = fanartTv && fanartTv.thumbnails[0];

		if (!thumbnailUrl) { return null; }

        const baseFolder = (typeof app.filesystem.getDataFolder === 'function') ? app.filesystem.getDataFolder() : null;
		if (!baseFolder) { return null; }
		
        const safeArtistName = sanitizeFilename(artistName);
        const artistFirstLetter = safeArtistName ? safeArtistName[0] : '_';
        const downloadFolder = `${baseFolder}\\ArtistImages\\${artistFirstLetter}`;
        const ext = getExtensionFromUrl(thumbnailUrl) || 'jpg';
        const localPath = `${downloadFolder}\\${safeArtistName}.${ext}`;

        if (typeof app.filesystem.fileExistsAsync === 'function') {
			const exists = await app.filesystem.fileExistsAsync(localPath);
			if (exists) { return localPath; }
        }

        // créer dossier si supporté
        if (typeof app.filesystem.createFolderAsync === 'function') {
            try {
                await app.filesystem.createFolderAsync(downloadFolder, false);
            } catch (e) {
                // ignore si déjà existant ou indisponible
            }
        }

        // utilise l'API app.utils.saveImageAsync
        if (app.utils && typeof app.utils.saveImageAsync === 'function') {
            try {
                const cachedPath = await app.utils.saveImageAsync(thumbnailUrl);
                if (cachedPath && cachedPath !== -1) {
                    if (cachedPath === localPath) {
                        return localPath;
                    }

                    // Copy cached file to target MMImages folder
                    try {
                        if (typeof app.filesystem.copyFileAsync === 'function') {
                            await app.filesystem.copyFileAsync(cachedPath, localPath);
                            try {
                                await app.filesystem.deleteFileAsync(cachedPath);
                            } catch (e) {
                                console.warn('[mmbridge_library][getArtistThumbnailPathFallback] deleteFileAsync failed:', e);
                            }
                            return localPath;
                        }

						console.warn('[mmbridge_library][getArtistThumbnailPathFallback] copyFileAsync et fileContent pas disponibles; retourne null');
                        return null;
                    } catch (e) {
                        console.error('[mmbridge_library][getArtistThumbnailPathFallback] copy file from cache failed:', e);
                        return null;
                    }
                }
                console.warn('[getArtistThumbnailPathFallback] saveImageAsync returned empty/-1:', cachedPath);
            } catch (e) {
                console.error('[getArtistThumbnailPathFallback] saveImageAsync failed:', e);
            }
        }

    } catch (e) {
        console.error('[getArtistThumbnailPathFallback] failed:', e);
        return null;
    }
}


function isValidMMPath(path) {
    if (typeof path !== 'string' || path.trim() === '') { return false; }

    // Invalidation explicite des chemins temporaires MM
    if (path.startsWith('file:///temp/')) { return false; }
    // Chemins absolus Windows
    if (/^[a-zA-Z]:[\\/]/.test(path)) { return true; }
    // Chemins absolus Unix
    if (path.startsWith('/')) { return true; }
    // URL fichier absolue
    if (path.startsWith('file:///')) { return true; }

    return false;
}


function sanitizeFilename(name) {
    if (typeof name !== 'string' || !name.trim()) {
        return 'artist';
    }
    return name
        .replaceAll('/', '-')
        .replace(/[<>:"|?*\x00-\x1F]/g, '')
        .trim()
        .toLowerCase();
}


function getExtensionFromUrl(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }
    const m = url.match(/\.([a-zA-Z0-9]{2,6})(?:[?#]|$)/);
    if (m && m[1]) {
        const ext = m[1].toLowerCase();
        return ext === 'jpeg' ? 'jpg' : ext;
    }
    return null;
}


async function setTrackTag(songId, tagName, tagValue) {
    let track = await app.getObject('track', { id: parseInt(songId, 10) });
    track[tagName] = tagValue;
    await track.commitAsync();
}


/**
 * récupère des infos depuis TheAudioDB
 */
async function getInfoFromTheAudioDB(params) {
    // params = {
    // searchType: 'artist',
    // artistName: 'artist_name',
    // albumName: 'album_name'
    // }

    const searchType = params.searchType;
    const artistName = encodeURIComponent(params.artistName);
    const albumName = encodeURIComponent(params.albumName);

    let url = null;

    if (searchType === 'artist')		{ url = `https://www.theaudiodb.com/api/v1/json/123/search.php?s=${artistName}`; }
	else if (searchType === 'album')	{ url = `https://www.theaudiodb.com/api/v1/json/123/searchalbum.php?s=${artistName}&a=${albumName}` }

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("TheAudioDB API error: " + res.status);
    }

    const json = await res.json();

    // artist
    if (searchType === 'artist') {
		
		if (!json.artists ) { return null; }
		const artist = json.artists[0];

		// Récupération dynamique des fanarts disponibles
		const fanarts = [];
		for (let i = 1; i <= 4; i++) {
			const key = i === 1 ? "strArtistFanart" : `strArtistFanart${i}`;
			if (artist[key]) {
				fanarts.push(artist[key]);
			}
		}
		const result = {
			name: artist.strArtist,
			biography: artist.strBiographyFR || artist.strBiographyEN || artist.strBiography || null,
			genre: artist.strGenre,
			style: artist.strStyle,
			country: artist.strCountry,
			formedYear: artist.intFormedYear,
			thumbnail: artist.strArtistThumb,
			logo: artist.strArtistLogo,
			banner: artist.strArtistBanner,
			fanarts: fanarts, // tableau contenant 1 à 4 fanarts
			facebook: artist.strFacebook,
			website: artist.strWebsite
		};
		return result;
	}
	
	// album
	else if (searchType === 'album') {

		if (!json.album ) { return null; }
		const album = json.album[0];
		const result = {
			name: album.strAlbum,
			artist: album.strArtist,
			cdArt: album.strAlbumCDart,
			coverArt: album.strAlbumThumb,
			coverArtHQ: album.strAlbumThumbHQ,
			description: album.strDescriptionFR || album.strDescriptionEN || null,
			genre: album.strGenre,
			mood: album.strMood,
			style: album.strStyle,
			year: album.intYearReleased,
		};
		return result;
	}
}

