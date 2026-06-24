/**
 * js/menus.js
 * Ce fichier gère les fonctions de création de menus
 */
 
// log('[menus.js][function] var', var);

import { domElements, getDom } from './domElements.js';
const dom = new Proxy(domElements, { get(target, prop) {return target[prop]?.();} });

import { createForm, log } from './utils.js';
import { icon } from './graphics.js';



/**
 * ajout de section de menu / type form
 */
export function menuAddSectionForm(menuContainer, sectionId, formTitle) {
	
	// construction du div form input
	const sectionFormInput = document.createElement('div');
	sectionFormInput.classList.add('menu-section-input');
	sectionFormInput.id = sectionId;
	sectionFormInput.innerHTML = '';
	
	// assemblage dans le contenant
	menuContainer.appendChild(sectionFormInput);
	
	// construction du formulaire
	const formParams = {
		containerId: sectionId,
		searchInputId: sectionId + 'Input',
		searchFormLabel: formTitle,
		iconFn: () => icon('search', 24, 24, []),
	};
	createForm(formParams);
}


export function menuAddSectionCalendar(menuContainer, sectionId, options = {}) {
	
	// construction du div form input
	const sectionCalendar = document.createElement('div');
	sectionCalendar.classList.add('menu-section-calendar');
	sectionCalendar.id = sectionId;
	
	// création de l'input caché (requis par Flatpickr)
	const dateInput = document.createElement('input');
	dateInput.type = 'hidden';
	dateInput.classList.add('hidden');
	dateInput.id = sectionId + 'Input';
	sectionCalendar.appendChild(dateInput);
	
	// assemblage dans le contenant
	menuContainer.appendChild(sectionCalendar);

	// initialisation de Flatpickr après que le DOM soit prêt
	if (typeof flatpickr !== 'undefined') {
		flatpickr(dateInput, {
			inline: true, // affiche le calendrier directement (pas d'input)
			mode: options.mode || 'single', // 'single', 'multiple', 'range'
			dateFormat: options.dateFormat || 'Y-m-d',
			locale: options.locale || 'en',
			minDate: options.minDate || null,
			maxDate: options.maxDate || null,
			defaultDate: options.defaultDate || null,
			disableMobile: false,
			onReady: function(selectedDates, dateStr, instance) {
				try {
					if (instance && instance.calendarContainer) {
						instance.calendarContainer.classList.add('custom');
					}
					if (instance && instance.input) instance.input.style.display = 'none';
					if (instance && instance.altInput) instance.altInput.style.display = 'none';
				} catch (e) { /* silent */ }
				if (typeof options.onReady === 'function') options.onReady({ dates: selectedDates, dateStr, instance });
			},
			onClose: function(selectedDates, dateStr, instance) {
				if (typeof options.onDateChange === 'function') {
					options.onDateChange({ dates: selectedDates, dateStr });
				}
			}
		});
	} else {
		console.warn('[menuAddSectionCalendar] Flatpickr n\'est pas chargé');
	}
}


/**
 * ajout de section de menu / type toggle
 */
export function menuAddSectionToggle
	({
		menuContainer,
		sectionId,
		dataType,
		toggleDefinition,
		onClickCallback
	})
	{
	
	// construction du div toggle
	const sectionToggle = document.createElement('div');
	sectionToggle.classList.add('menu-section-toggle');
	sectionToggle.id = sectionId;
	
	// construction du toggle
	toggleDefinition?.forEach(elmt => {
		
		const elmtLabel = elmt.label, elmtId = elmt.id;
		const toggleClassCriteria = 'toggle-dynlist-criteria-' + dataType
			
		// construction du div contenant (ligne)
		const menuItemDiv = document.createElement('div');
		menuItemDiv.classList.add('menu-item');
		menuItemDiv.classList.add(toggleClassCriteria);
		menuItemDiv.dataset.type = dataType;
		menuItemDiv.dataset.id = elmtId;
		menuItemDiv.dataset.label = elmtLabel;

		// construction du div gauche (icon check)
		const leftDiv = document.createElement('div');		
		leftDiv.classList.add('menu-check');
		
		const toggleClassCheck = 'toggle-dynlist-check-' + dataType
		leftDiv.appendChild(icon('check', 18, 18, ['icon-check', toggleClassCheck, 'hidden']));

		// construction du div droit (labels)
		const rightDiv = document.createElement('div');
		rightDiv.classList.add('menu-label');
		rightDiv.innerHTML = elmtLabel;

		// assemblage dans le contenant
		menuItemDiv.appendChild(leftDiv);
		menuItemDiv.appendChild(rightDiv);

		// gestion du clic toggle
		menuItemDiv.addEventListener('click', () => {
			
			// Sélectionne tous les boutons du même groupe (par classe)
			const groupItems = document.querySelectorAll(`.${toggleClassCriteria}`);
			const groupChecks = document.querySelectorAll(`.${toggleClassCheck}`);

			// Désactive tous les items
			groupItems.forEach(b => b.classList.remove('active'));
			groupChecks.forEach(b => b.classList.add('hidden'));

			// Active l'item cliqué
			menuItemDiv.classList.add('active');
			
			// marque le check de l'item cliqué
			const svg = leftDiv.querySelector('.icon-check');
			svg.classList.remove('hidden');

			// déclenche l'action en callbak
			if (typeof onClickCallback === 'function') {
				onClickCallback({
					type: dataType,
					id: elmtId,
					label: elmtLabel,
				});
			}	
		});
		
		// assemblage dans le contenant (ajout du contenu du menu)
		sectionToggle.appendChild(menuItemDiv);
	});
	
	// clic le toggle par défaut
	sectionToggle.querySelector('[data-id="oneOf"]').click();
	
	// assemblage dans le contenant
	menuContainer.appendChild(sectionToggle);
}


/**
 * ajout de section de menu / type form
 */
export function menuAddSectionList(container, sectionId) {
	// construction du div form list (vide)
	const sectionList = document.createElement('div');
	sectionList.classList.add('menu-section-list');
	sectionList.id = sectionId;
	
	// assemblage dans le contenant
	container.appendChild(sectionList);	
}


/**
 * mise à jour de section de menu / type list
 */
export async function menuBuildSectionList( {containerId, dataType, content, selectType, onClickCallback} ) {
	const sectionContainer = await getDom(containerId);
	
	// effacement du contenu existant
	sectionContainer.innerHTML = '';
	
	// construction du contenu
	content?.forEach(elmt => {
		
		const elmtLabel = elmt.label, elmtId = elmt.id;
		
		// construction du div contenant (ligne)
		const menuItemDiv = document.createElement('div');
		menuItemDiv.id = containerId + 'Item' + elmtId;
		menuItemDiv.classList.add('menu-item');
		menuItemDiv.dataset.type = dataType;
		menuItemDiv.dataset.id = elmtId;
		menuItemDiv.dataset.label = elmtLabel;

		// construction du div gauche (icon check)
		const leftDiv = document.createElement('div');
		leftDiv.classList.add('menu-check');
		leftDiv.appendChild(icon('check', 18, 18, ['icon-check', 'hidden']));

		// construction du div droit (labels)
		const rightDiv = document.createElement('div');
		rightDiv.classList.add('menu-label');
		rightDiv.innerHTML = elmtLabel;

		// assemblage dans le contenant
		menuItemDiv.appendChild(leftDiv);
		menuItemDiv.appendChild(rightDiv);
		
		// assemblage dans le contenant (ajout du contenu du menu)
		sectionContainer.appendChild(menuItemDiv);
	});
	
	// écouteur de clic sur élément du menu
	sectionContainer.addEventListener('click', async (e) => {
		const menuItemClicked = e.target.closest('.menu-item');
		if (menuItemClicked && sectionContainer.contains(menuItemClicked)) {
			
			// cas d'une selection mono
			if (selectType == 'mono') {
				// décoche les autres éléments
				const menuItems = document.querySelectorAll(`#${containerId} .menu-item[data-type="${dataType}"]`);
				menuItems?.forEach(menuItem => { menuItem.classList.remove('selected');	});
				// cache les autres check svg
				const svgItems = document.querySelectorAll(`#${containerId} .icon-check`);
				svgItems?.forEach(svgItem => { svgItem.classList.add('hidden');	});
			}
			
			// tag class selected
			menuItemClicked.classList.toggle('selected');
			
			// affichage icon check
			const svg = menuItemClicked.querySelector('.icon-check');
			svg.classList.toggle('hidden');
			
			// déclenche l'action en callbak
			if (typeof onClickCallback === 'function') {
				onClickCallback({
					type: dataType,
					id: menuItemClicked.dataset.id,
					label: menuItemClicked.dataset.label,
				});
			}			
		}
	});
}


/**
 * filtre la section de menu / type list
 */
export async function menuFilterSectionList(sectionContainerId, sectionDataType, sectionContentFiltered = null) {
	
	// filtrage de l'affichage
	if (sectionContentFiltered) {
		const filteredIds = new Set(sectionContentFiltered.map(item => item.id));
		const menuItems = document.querySelectorAll(`#${sectionContainerId} .menu-item[data-type="${sectionDataType}"]`);
		menuItems?.forEach(menuItem => {
			if (filteredIds.has(menuItem.dataset.id))	{ menuItem.classList.remove('hidden'); }
			else										{ menuItem.classList.add('hidden'); }
		});
	}
	// si filtre vide
	else {
		const menuItemsHidden = document.querySelectorAll(`#${sectionContainerId} .menu-item.hidden`);
		menuItemsHidden?.forEach(menuItem => { menuItem.classList.remove('hidden'); });
	}
}


// contrôleur global de menus: gère l'ouverture/fermeture centralisée des dropdowns
export const menuController = (function () {
	const registry = new Map(); // key -> { trigger, dropdown }
	
	function register({ key, trigger, dropdown, maxHeight, onClose }) {	
		if (!key || !trigger || !dropdown) return;
		if (registry.has(key)) return; // déjà enregistré

		registry.set(key, { trigger, dropdown, onClose });

		// toggle via trigger
		const handler = (e) => {
			e.preventDefault();
			e.stopPropagation();
			const isOpen = dropdown.classList.contains('open');			
			if (isOpen) close(key);
			else open(key, maxHeight);
		};
		// mémorise pour pouvoir retirer plus tard
		trigger._menuControllerHandler = handler;
		trigger.addEventListener('click', handler);

		// assure les attributs ARIA initial
		trigger.setAttribute('aria-controls', dropdown.id || '');
		trigger.setAttribute('aria-expanded', dropdown.classList.contains('open') ? 'true' : 'false');
	}
	
	function open(key, maxHeight) {
		closeAll(key);
		const entry = registry.get(key);
		if (!entry) return;
		entry.dropdown.classList.add('open');
		entry.trigger.setAttribute('aria-expanded', 'true');
		entry.dropdown.style.maxHeight = maxHeight;
	}

	function close(key) {
		const entry = registry.get(key);
		if (!entry) return;
		entry.dropdown.classList.remove('open');
		entry.trigger.setAttribute('aria-expanded', 'false');

		// Appeler le callback de fermeture si défini
        if (entry.onClose && typeof entry.onClose === 'function') {
            entry.onClose({ key, dropdown: entry.dropdown, trigger: entry.trigger });
        }

	}

	function closeAll(exceptKey = null) {
		for (const [k, entry] of registry.entries()) {
			if (k === exceptKey) continue;
			
			// Vérifier si le menu était ouvert avant de le fermer
			const wasOpen = entry.dropdown.classList.contains('open');
			
			entry.dropdown.classList.remove('open');
			entry.trigger.setAttribute('aria-expanded', 'false');
			
			// Appeler le callback de fermeture si défini et seulement si le menu était ouvert
			if (wasOpen && entry.onClose && typeof entry.onClose === 'function') {
				entry.onClose({ key: k, dropdown: entry.dropdown, trigger: entry.trigger });
			}
		}
	}

	function unregister(key) {
		const entry = registry.get(key);
		if (!entry) return;
		entry.trigger.removeEventListener('click', entry.trigger._menuControllerHandler);
		delete entry.trigger._menuControllerHandler;
		registry.delete(key);
	}

	// handler global: clic hors des menus -> fermeture
	document.addEventListener('click', (e) => {
		const path = e.composedPath ? e.composedPath() : (e.path || []);
		const clickedInsideAny = [...registry.values()].some(({ dropdown, trigger }) => path.includes(dropdown) || path.includes(trigger));
		if (!clickedInsideAny) closeAll();
	});

	// handler global: touche Échap -> fermeture
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' || e.key === 'Esc') closeAll();
	});

	return { register, open, close, closeAll, unregister };
})();


