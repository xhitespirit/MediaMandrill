/**
 * app.js
 * fichier principal de l'application MediaMandril
 */


// log('[app.js][function] var', var);


// imports
import { initI18n } from './i18n.js';
import { initMainMenu } from './menuMain.js';
import { initGlobalButtons } from './graphics.js';
import { initPlayerEvents, initPlayerControls } from './player.js';
import { initViews } from './views.js'; 
import { initSearch } from './search.js'; 
import { initDynamicList } from './dynlist.js';
import { initGlobalClicks } from './events.js';
import { initBrowsing } from './router.js';
import { initImagesLazyLoader, log } from './utils.js';



// initialisation langage
await initI18n();

// initialisation lecteur
initPlayerEvents();
initPlayerControls();

// initialisation interface
initMainMenu();
initGlobalButtons();
initGlobalClicks();
initBrowsing();

// initialisation retardée vues (
setTimeout(() => { delayViews(); }, 200);



function delayViews() {
	initViews();
	initDynamicList();
	initSearch();
	initImagesLazyLoader();
}