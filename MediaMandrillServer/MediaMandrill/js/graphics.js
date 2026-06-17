/**
 * js/graphics.js
 * Ce fichier contient les fonctions d'éléments graphiques
 */

// log('[graphics.js][function] var', var);

import { log } from './utils.js';
import { domElements, getDom } from './domElements.js';
const dom = new Proxy(domElements, { get(target, prop) {return target[prop]?.();} });



// --- initialisation boutons généraux------------------------------------------------------------------
export function initGlobalButtons() {
	
	// boutons nav bar
	if (dom.navButtonBurger)			{dom.navButtonBurger.appendChild(icon('menu', 24, 24, [])); }
	if (dom.navButtonSearch)			{dom.navButtonSearch.appendChild(icon('search', 24, 24, [])); }
	
	// boutons back
	if (dom.artistDetailsBtnBack)		{dom.artistDetailsBtnBack.appendChild(icon('arrowBack', 24, 24, [])); }
	if (dom.albumDetailsBtnBack)		{dom.albumDetailsBtnBack.appendChild(icon('arrowBack', 24, 24, [])); }
	if (dom.genreDetailsBtnBack)		{dom.genreDetailsBtnBack.appendChild(icon('arrowBack', 24, 24, [])); }
	if (dom.playlistDetailsBtnBack)		{dom.playlistDetailsBtnBack.appendChild(icon('arrowBack', 24, 24, [])); }
	
	// boutons close
	if (dom.searchViewBtnClose)			{dom.searchViewBtnClose.appendChild(icon('close', 24, 24, [])); }
	if (dom.npBtnClose)					{dom.npBtnClose.appendChild(icon('close', 24, 24, [])); }
	
	// boutons parent
	if (dom.artistDetailsBtnParent)		{dom.artistDetailsBtnParent.appendChild(icon('arrowParent', 24, 24, [])); }
	if (dom.albumDetailsBtnParent)		{dom.albumDetailsBtnParent.appendChild(icon('arrowParent', 24, 24, [])); }
	if (dom.genreDetailsBtnParent)		{dom.genreDetailsBtnParent.appendChild(icon('arrowParent', 24, 24, [])); }
	if (dom.playlistDetailsBtnParent)	{dom.playlistDetailsBtnParent.appendChild(icon('arrowParent', 24, 24, [])); }
	
	// boutons up
	if (dom.searchViewBtnUp)			{dom.searchViewBtnUp.appendChild(icon('chevronUp', 24, 24, [])); }
	if (dom.artistsViewBtnUp)			{dom.artistsViewBtnUp.appendChild(icon('chevronUp', 24, 24, [])); }
	if (dom.authorsViewBtnUp)			{dom.authorsViewBtnUp.appendChild(icon('chevronUp', 24, 24, [])); }
	if (dom.albumsViewBtnUp)			{dom.albumsViewBtnUp.appendChild(icon('chevronUp', 24, 24, [])); }
	if (dom.genresViewBtnUp)			{dom.genresViewBtnUp.appendChild(icon('chevronUp', 24, 24, [])); }
	if (dom.playlistsViewBtnUp)			{dom.playlistsViewBtnUp.appendChild(icon('chevronUp', 24, 24, [])); }
	if (dom.artistDetailsBtnUp)			{dom.artistDetailsBtnUp.appendChild(icon('chevronUp', 24, 24, [])); }
	if (dom.genreDetailsBtnUp)			{dom.genreDetailsBtnUp.appendChild(icon('chevronUp', 24, 24, [])); }
	if (dom.playlistDetailsBtnUp)		{dom.playlistDetailsBtnUp.appendChild(icon('chevronUp', 24, 24, [])); }
}


export function icon(name, width = 24, height = 24, classList = []) {
    const img = document.createElement("img");
    img.src = `resources/icons/${name}.svg`;
    img.width = width;
    img.height = height;
    if (classList.length) img.classList.add(...classList);
    return img;
}
