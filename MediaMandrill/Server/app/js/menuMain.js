/**
 * js/menuMain.js
 * Ce fichier gère le menu principal (burger)
 */

// log('[menuMain.js][function] var', var);

import { log } from './utils.js';

import { domElements, getDom } from './domElements.js';
const dom = new Proxy(domElements, { get(target, prop) {return target[prop]?.();} });

import { setLocale, tLng } from './i18n.js';
import { menuController, menuBuildSectionList } from './menus.js';
import { setPlayerOutput } from './player.js';
import { initViews } from './views.js';
import { updateCache, cacheStats, fetchLibraryStats, fetchLibraryHash } from './dataFetching.js';
import { certCA } from './config.js';
// import { testFunction } from './test.js';


let castFirstRun = true;



/**
 * fonction d'initialisation du menu principal (burger)
 */
export async function initMainMenu() {
	
	await menuSectionCast(); // await -> pour éviter que le menu s'ouvre suite au .click sur getDom('burgerMenuPlayersItemlocalplayer').click(); (fonction menuSectionCast)
	menuSectionMM();

	// création menu hamburger
	if (dom.burgerMenuTrigger && dom.burgerMenuDropdown) {
		menuController.register({ key: 'burgerMenu', trigger: dom.navButtonBurger, dropdown: dom.burgerMenuDropdown, maxHeight: `500px` });
	}
	
	// met à jour les stats au clic
	dom.navButtonBurger.addEventListener('click', async () => { await menuSectionStats(); });
}


async function menuSectionCast() {
	
	// Action: choix du lecteur
	const players = await fetch('/player/output/get').then(r => r.json());
	const activeUuid = players.find(d => d.isActive)?.uuid || '';
	
	const transformed = players.map(d => ({
		id: d.uuid,
		label: d.name
	}));
	
	await menuBuildSectionList({
		containerId: 'burgerMenuPlayers',
		dataType: 'players',
		content: transformed,
		selectType: 'mono',
		onClickCallback: (click) => { selOp(click.id); },
	});

	// Selectionne le lecteur en cours
	await getDom(`burgerMenuPlayersItem${activeUuid}`).click();
	
	// gestion de la selection
	function selOp(id) {
		if (castFirstRun)	{ castFirstRun = false;	} // pour éviter de selectionner le lecteur actuf au démarrage, qui provoque une coupure de son
		else 				{ setPlayerOutput(id); }
	}	
}


async function menuSectionMM() {
	// Français
	dom.burgerMenuLangFr.addEventListener('click', async () => {
		await setLocale('fr');
		location.reload();
	});

	// English
	dom.burgerMenuLangEn.addEventListener('click', async () => {
		await setLocale('en');
		location.reload();
	});
	
	// cache refresh
	dom.burgerMenuRefreshCache.addEventListener('click', async () => {
		await updateCache('force');
	});

	// views refresh
	dom.burgerMenuRefreshViews.addEventListener('click', (e) => { 
		e.stopPropagation(); // parce que initViews déclenche un click sur les boutons par défaut -> stopPropagation pour éviter de faire réouvrir le menu Burger (action toggle)
		initViews();	
	});

	// CA certificate
	dom.burgerMenuCertificate.addEventListener('click', () => {
		const a = document.createElement('a');
		a.href = `/${certCA}`;
		a.download = `${certCA}`;
		a.click();
	});

	// // testfunction
	// dom.burgerMenuTestFunction.addEventListener('click', () => { testFunction(); });
}


async function menuSectionStats() {
	const mmStats = await fetchLibraryStats();
	const mmHash = await fetchLibraryHash();
	const cacheStatus = cacheStats.hash == mmHash ? tLng('burger.stats.cache.uptodate') : tLng('burger.stats.cache.expired');
	
	dom.burgerMenuStats.innerHTML = `
		<table>
			<tr>
				<td class="cell">${tLng('burger.stats.tracks')}</td>
				<td class="cell right">${mmStats.tracks}</td>
			</tr>
			<tr>
				<td class="cell">${tLng('burger.stats.albums')}</td>
				<td class="cell right">${mmStats.albums}</td>
			</tr>
			<tr>
				<td class="cell">${tLng('burger.stats.artists')}</td>
				<td class="cell right">${mmStats.artists}</td>
			</tr>
			<tr>
				<td class="cell">${tLng('burger.stats.authors')}</td>
				<td class="cell right">${mmStats.authors}</td>
			</tr>
			<tr>
				<td class="cell">${tLng('burger.stats.genres')}</td>
				<td class="cell right">${mmStats.genres}</td>
			</tr>
			<tr>
				<td class="cell">${tLng('burger.stats.playlists')}</td>
				<td class="cell right">${mmStats.playlists}</td>
			</tr>
			<tr>
				<td class="cell"></td>
				<td class="cell right"></td>
			</tr>
			<tr>
				<td class="cell">Cache</td>
				<td class="cell right">${cacheStatus}</td>
			</tr>
		</table>
	`;
}
