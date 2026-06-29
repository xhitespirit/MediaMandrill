/**
 * js/utils.js
 * Ce fichier contient des fonctions utilitaires générales
 */

// log('[utils.js][function] var', var);

import { domElements, getDom } from './domElements.js';
const dom = new Proxy(domElements, { get(target, prop) {return target[prop]?.();} });

import { icon } from './graphics.js';
import { currentLocale } from './i18n.js';
 


/**
 * fonction de logging
 * @...args - messages à logger
 */
export function log(...args) {
    const ts = new Date().toISOString();
    console.log(ts, ...args);
}


/**
 * fonction de chargement des images en lazy
 */
export function initImagesLazyLoader() {
	
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;				
                img.src = img.dataset.src;
				img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    // observe toutes les images déjà présentes
    document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));

    // et observe les futures images ajoutées dynamiquement
    const mutationObserver = new MutationObserver(() => {
        document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
}


/**
 * Formate une durée en secondes en une chaîne de caractères "minutes:secondes".
 * @param {number} seconds - La durée en secondes.
 * @returns {string} La durée formatée (mm:ss).
 */
export function formatDuration(ms) {
	
	const seconds = Math.round(parseInt(ms, 10) / 1000);
    if (typeof seconds !== 'number' || isNaN(seconds)) {
        return 'N/A';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}


/**
 * Retourne une version "debounced" d'une fonction: elle ne s'exécute
 * qu'après une période d'inactivité `wait` en ms.
 * @param {Function} fn
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(fn, wait = 200) {
	let timeout = null;
	return function (...args) {
		const context = this;
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			timeout = null;
			try { fn.apply(context, args); } catch (e) { console.error('[debounce] callback error:', e); }
		}, wait);
	};
}


/**
 * Construction de l'alphabar
 */
export function setupAlphaBar(targetId, cardSelector) {

	const bar = getDom(targetId + 'AlphaBar');
	if (!bar) return;

	function updateAlphaBarState() {
		const cards = document.querySelectorAll(`#${targetId} ${cardSelector}`);
		bar.querySelectorAll('li').forEach(li => {
			const letter = li.textContent.trim().toUpperCase();
			let hasMatch = false;
			if (letter === '#') {
				hasMatch = [...cards].some(card => {
				const text = card.textContent.trim().toUpperCase();
				return !text[0] || text[0] < 'A' || text[0] > 'Z';
				});
			} else {
				hasMatch = [...cards].some(card => card.textContent.trim().toUpperCase().startsWith(letter));
			}

			li.classList.toggle('disabled', !hasMatch);
			li.style.pointerEvents = hasMatch ? '' : 'none';
			li.style.opacity = hasMatch ? '' : '0.4';
		});
	}

	updateAlphaBarState();

	bar.querySelectorAll('li').forEach(li => {
		li.addEventListener('click', () => {
			if (li.classList.contains('disabled')) return;
			const letter = li.textContent.trim().toUpperCase();
			const cards = document.querySelectorAll(`#${targetId} ${cardSelector}`);
			let target = null;

			if (letter === '#') {
				target = [...cards].find(card => {
				const text = card.textContent.trim().toUpperCase();
				return !text[0] || text[0] < 'A' || text[0] > 'Z';
				});
			} else {
				target = [...cards].find(card => card.textContent.trim().toUpperCase().startsWith(letter));
			}

			if (target) {
				target.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		});
	});
}


/**
 * tri d'objet
 */
export function sortByMultipleFields(array, fields, orders) {

    if (!Array.isArray(array)) {
        throw new Error('Le premier argument doit être un tableau');
    }
    if (!Array.isArray(fields) || !Array.isArray(orders)) {
        throw new Error('Les champs et les ordres doivent être des tableaux');
    }
    if (fields.length !== orders.length) {
        throw new Error('Les tableaux de champs et d’ordres doivent avoir la même longueur');
    }

    // Champs à traiter comme des nombres
    const numericFields = ['discNumber', 'trackNumber'];

    const compare = (valA, valB, order, field) => {

        // Convertir en nombre si nécessaire
        if (numericFields.includes(field)) {
            valA = valA != null ? Number(valA) : null;
            valB = valB != null ? Number(valB) : null;
        }

        if (valA == null && valB == null) return 0;
        if (valA == null) return order === 'asc' ? -1 : 1;
        if (valB == null) return order === 'asc' ? 1 : -1;

        // Comparaison numérique
        if (typeof valA === 'number' && typeof valB === 'number') {
            return order === 'asc' ? valA - valB : valB - valA;
        }

        // Comparaison texte
        return order === 'asc'
            ? String(valA).localeCompare(String(valB), undefined, { sensitivity: 'base' })
            : String(valB).localeCompare(String(valA), undefined, { sensitivity: 'base' });
    };

    const sorted = [...array].sort((a, b) => {
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const result = compare(a[field], b[field], orders[i], field);
            if (result !== 0) return result;
        }
        return 0;
    });

    return sorted;
}


/**
 * dans element: supprime toutes les classes commancant par prefix, puis ajoute la classe newClass
 */
export function replaceClassByPrefix(element, prefix, newClass) {
	// Supprime toutes les classes qui commencent par le préfixe
	element.className = [...element.classList]
		.filter(cls => !cls.startsWith(prefix))
		.join(' ');
	// Ajoute la nouvelle classe
	element.classList.add(newClass);
}


/**
 * créée un toggle
 * btn: le bouton à ajouter au toggle
 * groupClass: la classe regroupant tous les boutons du même toggle
 * actionFn: la fonction déclenchée par le clic sur le bouton 
 */
export function createToggle(btn, groupClass, actionFn) {
	btn.addEventListener('click', () => {
		// Sélectionne tous les boutons du même groupe (par classe)
		const groupButtons = document.querySelectorAll(`.${groupClass}`);
		// Désactive tous les boutons
		groupButtons.forEach(b => b.classList.remove('active'));
		// Active le bouton cliqué
		btn.classList.add('active');
		// Exécute l'action associée
		if (typeof actionFn === 'function') {
			actionFn();
		}
	});
}


/**
 * a appeler pour debug: log dans la console l'état du DOM pour l'élément elmt
 */
export function logDomElement(elmt, stamp) {
	if (!elmt) {
		console.warn(`[logDomElement](${stamp}) Aucun élément trouvé pour "${elmt}"`);
		return;
	}
	console.group(`[logDomElement](${stamp}) ${elmt}`);
	log('Objet DOM complet :');
	console.dir(elmt);
	log('HTML brut :');
	log(elmt.outerHTML);
	console.groupEnd();
}


/**
 * fonction qui applatit str (mise en minuscule et suppression des accents)
 */
export function cleanString(str) {
	return str
		.normalize('NFD')                     // Décompose les lettres accentuées
		.replace(/[\u0300-\u036f]/g, '')      // Supprime les diacritiques (accents)
		.toLowerCase();                       // Rend la comparaison insensible à la casse
}


// Utilitaire pour générer les stars de notation
export function renderStars(rating) {
    let stars = '';
    const maxStars = 5;
    let fullStars = 0;

    if (typeof rating !== 'undefined' && rating !== null && !isNaN(rating)) { fullStars = Math.floor(rating / 20); }	
    for (let i = 0; i < maxStars; i++) {
		if (i < fullStars)	{ stars += `<span class="star star-full" data-type="rating" data-star="${(i+1)*20}">&#9733;</span>`;	}
		else				{ stars += `<span class="star star-empty" data-type="rating" data-star="${(i+1)*20}">&#9734;</span>`; }
	}	
	return stars;
}


// Utilitaire pour mélanger les éléments
export function shuffleArray(array, maxItems = null) {
	const shuffled = [...array]; // copie pour ne pas modifier l'original
	
	// mélange
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	
	// limite
	if (typeof maxItems === 'number' && maxItems > 0) {
		return shuffled.slice(0, maxItems);
	}
	
	return shuffled;
}


/**
 * Affiche une boîte de message personnalisée complète.
 * @param {string} message - Le message à afficher.
 */
export function showMessageBox(messageBoxId, title, content) {
	
	let messageBox = null;
	
	function handleClickOutside(e) {
		if (messageBox && !e.composedPath().includes(messageBox)) { unmount(); }
	}

	function handleKeydownEsc(e) {
		if (e.key === 'Escape') { unmount(); }
	}

	function mount() {
		
		document.querySelectorAll('.message-box').forEach(el => el.remove());
		
		messageBox = document.createElement('div');
		messageBox.className = 'message-box';
		messageBox.id = messageBoxId;
			
		const messageBoxHeader = document.createElement('div');
		messageBoxHeader.className = 'message-box-header';
		messageBox.appendChild(messageBoxHeader);
		
		const messageBoxHeaderLeft = document.createElement('div');
		messageBoxHeaderLeft.classList.add('message-box-header');
		messageBoxHeaderLeft.classList.add('left');
		messageBoxHeaderLeft.innerHTML = title;
		messageBoxHeader.appendChild(messageBoxHeaderLeft);
		
		const messageBoxHeaderRight = document.createElement('div');
		messageBoxHeaderRight.classList.add('message-box-header');
		messageBoxHeaderRight.classList.add('right');
		messageBoxHeaderRight.innerHTML = `<button type="button" class="button-close button-close-24">${icon('close').outerHTML}</button>`;
		messageBoxHeader.appendChild(messageBoxHeaderRight);

		const messageBoxContent = document.createElement('div');
		messageBoxContent.className = 'message-box-content';
		messageBoxContent.innerHTML =  content;
		messageBox.appendChild(messageBoxContent);

		document.body.appendChild(messageBox);

		// bouton X de fermeture
		messageBox.querySelector('.button-close').addEventListener('click', unmount);
		
		// ajout des écouteurs pour fermeture
		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleKeydownEsc);
	}
	
	function unmount() {
		if (messageBox) {
			messageBox.remove();
			messageBox = null;
		}
		document.removeEventListener('click', handleClickOutside);
		document.removeEventListener('keydown', handleKeydownEsc);
	}

	return { mount, unmount };
}


/**
 * crée un formulaire
 * @param {string} message - Le message à afficher.
 */
export async function createForm(params) {

	// params = {
		// containerId: params.containerId
		// classList: params.classList
		// searchInputId: params.searchInputId,
		// searchFormLabel: params.searchFormLabel,
		// iconFn: params.iconFn,
	// }

	const formContainer = await getDom(params.containerId);
	
	const classList = params.classList;
	const searchInputId = params.searchInputId;
	const searchFormLabel = params.searchFormLabel;

	// construction du div form input
	const searchForm = document.createElement('form');
	searchForm.classList.add('search-form');
	if (classList?.length > 0) { searchForm.classList.add(...classList); }
	searchForm.setAttribute('autocomplete', 'off');
	
	// affichage de l'icone gauche
	if (typeof params.iconFn === 'function') {
		searchForm.innerHTML = `
			<button type="submit" id="${searchInputId + 'Icon'}" class="search-form-icon no-default-hover" tabindex="-1" aria-label="">
				${params.iconFn().outerHTML}
			</button>
			<input type="text" id="${searchInputId}" class="search-input" placeholder="${searchFormLabel}" aria-label="${searchFormLabel}" />
			<button type="button" class="search-form-icon no-default-hover hidden" id="searchIconClear${searchInputId}" aria-label="Effacer">
				${icon('close', 24, 24, []).outerHTML}
			</button>
		`;
	} else { // si pas d'icone, texte centré
		searchForm.innerHTML = `
			<input type="text" id="${searchInputId}" class="search-input center" placeholder="${searchFormLabel}" aria-label="${searchFormLabel}" />
			<button type="button" class="search-form-icon no-default-hover hidden" id="searchIconClear${searchInputId}" aria-label="Effacer">
				${icon('close', 24, 24, []).outerHTML}
			</button>
		`;
	}
	
	// assemblage dans le contenant
	formContainer.appendChild(searchForm);

	// gestion de l'affichage bouton x
	const searchInput = getDom(searchInputId);	
	searchInput.addEventListener('input', function () {
		const pattern = searchInput.value.trim();
		if (pattern.length > 0) { searchIconClear.classList.remove('hidden'); }
		else 					{ searchIconClear.classList.add('hidden'); }
	});
	
	// supprimer le contenu de l'input si clic sur x
	const searchIconClear = getDom('searchIconClear' + searchInputId);
	searchIconClear.addEventListener('click', () => {
		searchInput.value = '';
		searchInput.dispatchEvent(new Event('input', { bubbles: true })); // simule un event input
		searchInput.focus();
	});
};


/**
 * affiche le fanart
 */
export async function updateFanart(containerId, artistName) {
	
	const container = getDom(containerId);
	if (container) {
		
		// suppression du précédent si présent / fade-out
		async function clearFanart(container) {
			container.classList.remove('loaded');
			await wait (500); // attente de 500ms, comme dans le CSS
			container.style.removeProperty('--fanart-url');
		}
		await clearFanart(container);

		// définition du nouveau si artistName est fourni
		if (artistName) {
			const audioDb = await getInfoFromTheAudioDB({ searchType: 'artist', artistName: artistName });
			const fanarts = audioDb?.fanarts ? audioDb.fanarts : null;
			
			// affichage du nouveau si existe
			if (fanarts?.length > 0) {
				const fanartUrl = fanarts[Math.floor(Math.random() * fanarts.length)];
				const img = new Image();
				img.onload = () => {
					container.style.setProperty('--fanart-url', `url('${fanartUrl}')`);
					container.classList.add('loaded'); // fade-in
				};
				img.src = fanartUrl;
			}
		}
	}
	
	function wait(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}


/**
 * retourne si affichage sur desktop ou sur mobile (<480px)
 */
export function getDisplaySize() {
	let display;
	if (window.innerWidth <= 480)									{ display = 'm'; } // mobile
	else if (window.innerWidth > 480 && window.innerWidth <= 768)	{ display = 't'; } // tablette
	else 															{ display = 'd'; } // desktop
	return display;
}


/**
 * ecrit les tags audio
 */
export function setTrackTag(songId, tagName, tagValue) {
	
	fetch(`/library/track/${songId}/tag/set`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ tagName: tagName, tagValue: tagValue })
	});
	
	// met à jour le cache des tracks
	// setTimeout(() => { updateCache() }, 5000);	
}


/**
 * formatte la date en YYYY-MM-DD
 */
export function popDate(dateStr) {
    const [year, month, day] = [
        dateStr.slice(0, 4),
        dateStr.slice(4, 6),
        dateStr.slice(6, 8)
    ];
    return `${year}-${month}-${day}`;
}


/**
 * indicateur de chargement
 */
export function loadIndicator(disp) {
	switch (disp) {
		case 'on':
			if ( getDom('loader') ) { break;}
			
			const indicator = getDom('navButtonBurger');
			const loader = document.createElement('div');
			loader.id = 'loader'
			loader.className = 'loader';
			indicator.appendChild(loader);
			break;
			
		case 'off':
			try { getDom('loader').remove(); }
			finally { break; }
	}
}


/**
 * récupère des infos depuis TheAudioDB
 */
export async function getInfoFromTheAudioDB(params) {
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
			biography: artist[`strBiography${currentLocale.toUpperCase()}`] || artist.strBiographyEN || artist.strBiography || null,
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
			description: album[`strDescription${currentLocale.toUpperCase()}`] || album.strDescriptionEN || album.strDescription || null,
			genre: album.strGenre,
			mood: album.strMood,
			style: album.strStyle,
			year: album.intYearReleased,
		};
		return result;
	}
}


/**
 * crée un marquee (texte défilant) si le texte dépasse la taille de son élément
 */
export async function setMarquee(el) {
	
	// vérifie si el existe et si le texte dépasse
	if (!el || !(el instanceof Element) || !isOverflowing(el)) return;

	// si déjà initialisé, sortir
	if (el.querySelector('.marquee-inner')) return;

	// construction de la structure
	const inner = document.createElement('span');
	inner.className = 'marquee-inner';
	inner.style.display = 'inline-block';
	inner.style.whiteSpace = 'nowrap';
	inner.style.willChange = 'transform';

	const item = document.createElement('span');
	item.className = 'marquee-item';
	item.style.display = 'inline-block';

	// déplacer le contenu existant dans item
	while (el.firstChild) item.appendChild(el.firstChild);
	inner.appendChild(item);

	const spacer = document.createElement('span');
	spacer.className = 'marquee-spacer';
	spacer.style.display = 'inline-block';
	spacer.style.width = '2rem';
	inner.appendChild(spacer);

	const clone = item.cloneNode(true);
	clone.className = 'marquee-clone';
	inner.appendChild(clone);

	el.appendChild(inner);

    // forcer reflow avant mesures
    el.offsetWidth;

    const firstWidth = item.scrollWidth;
    const containerWidth = el.clientWidth;
    const spacerWidth = Math.max(parseFloat(getComputedStyle(spacer).width) || 32, Math.round(containerWidth * 0.35));
    spacer.style.width = spacerWidth + 'px';

    const distance = firstWidth + spacerWidth;
    const negDistance = -distance;
    const scrollDurationMs = Math.max(8000, Math.ceil(distance / 40) * 1000);
    const PAUSE_MS = 4000;
    
    // stockage de l'animation actuelle pour pouvoir la contrôler
    let currentAnim = null;
    let pauseTimeoutId = null;

    function runOnce() {
        const anim = inner.animate(
            [
                { transform: 'translateX(0)' },
                { transform: `translateX(${negDistance}px)` }
            ],
            {
                duration: scrollDurationMs,
                easing: 'linear',
                fill: 'forwards'
            }
        );

        currentAnim = anim;

        anim.onfinish = () => {
            // reset instantané quand le clone est arrivé à l'origine
            inner.style.transform = 'translateX(0)';
            // relance après pause
            pauseTimeoutId = setTimeout(runOnce, PAUSE_MS);
        };
    }

    // gestion du hover: pause/reprise de l'animation
    el.addEventListener('mouseenter', () => {
        if (currentAnim) {
            currentAnim.pause();
        }
        if (pauseTimeoutId) {
            clearTimeout(pauseTimeoutId);
        }
    });

    el.addEventListener('mouseleave', () => {
        if (currentAnim && currentAnim.playState === 'paused') {
            currentAnim.play();
        }
        // relance après pause initiale si l'animation est terminée
        if (currentAnim && currentAnim.playState === 'finished') {
            inner.style.transform = 'translateX(0)';
            pauseTimeoutId = setTimeout(runOnce, PAUSE_MS);
        }
    });

    // première exécution après pause initiale
    setTimeout(runOnce, PAUSE_MS);
}


/**
 * utilitaire pour déterminer si le contenu d'un élément dépasse de sa largeur
 */
function isOverflowing(el) {
    if (!el || !(el instanceof Element)) return false;
    return el.scrollWidth > el.clientWidth;
}


/**
 * utilitaire d'observation des éléments de classe marquee
 */
let marqueeObserver = null;
export function observeMarqueesOnPage(pageRoot) {
    if (marqueeObserver) {
        marqueeObserver.disconnect();
        marqueeObserver = null;
    }
    if (!pageRoot) return;

    marqueeObserver = new MutationObserver(mutations => {
        const marqueesToUpdate = new Set();

        for (const mutation of mutations) {
			
            if (mutation.type === 'childList') {				
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;
                    if (node.matches('.marquee')) {
						marqueesToUpdate.add(node);
					}
                    node.querySelectorAll('.marquee').forEach(el => {
						marqueesToUpdate.add(el);
					});
                });

                const marqueeParent = mutation.target instanceof Element && mutation.target.closest('.marquee');
                if (marqueeParent) {
					marqueesToUpdate.add(marqueeParent);
				}
            }

            if (mutation.type === 'characterData') {
                const marqueeParent = mutation.target.parentElement?.closest('.marquee');
                if (marqueeParent) {
					marqueesToUpdate.add(marqueeParent);
				}
            }
        }
        marqueesToUpdate.forEach(setMarquee);
    });

    marqueeObserver.observe(pageRoot, {
        childList: true,
        characterData: true,
        subtree: true
    });
}

