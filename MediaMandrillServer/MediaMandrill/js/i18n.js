/**
 * i18n.js
 * Ce fichier contient les fonctions de gestion linguistique
 */

// log('[i18n.js][function] var', var);

import { log } from './utils.js';
import { defaultLang } from './config.js';


const cache = {};
let messages = {};

export let currentLocale;



export async function initI18n({ defaultLocale = defaultLang } = {}) {
	
	const savedLocale = localStorage.getItem('lang');
	if (savedLocale)	{ currentLocale = savedLocale }
	else 				{ 
							currentLocale = defaultLocale;
							localStorage.setItem('lang', currentLocale);
						}
	log('[i18n] locale:', currentLocale);
	await loadLocale(currentLocale);
	translateDOM();
}


async function loadLocale(lang) {
	if (cache[lang]) { messages = cache[lang]; return; }
	try {
		const res = await fetch(`resources/locales/${lang}.json`);
		if (!res.ok) throw new Error('HTTP ' + res.status);
		messages = await res.json();
		cache[lang] = messages;
	} catch (e) {
		console.warn('[i18n loadLocale] cannot load', lang, e);
		messages = {};
	}
}


export async function setLocale(lang) {
	currentLocale = lang;
	localStorage.setItem('lang', lang);
	await loadLocale(lang);
	translateDOM();
}


export function tLng(key, params = {}) {
	let s = messages[key];
	if (s === undefined) {
		console.warn(`i18n: missing key "${key}" for locale "${currentLocale}"`);
		s = key;
	}
	Object.keys(params).forEach(k => { s = s.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), params[k]); });
	return s;
}


export function tLngPl(baseKey, count) {
    const key = count > 1 ? baseKey + ".more" : baseKey + ".one";
    let text = tLng(key);
    return text.replace("{{count}}", count);
}


export function translateDOM() {
	// elements using data-i18n for textContent or attribute
	document.querySelectorAll('[data-i18n]').forEach(el => {
		const key = el.dataset.i18n;
		const attr = el.dataset.i18nAttr || 'text';
		const val = tLng(key);
		if (attr === 'text') el.textContent = val; else el.setAttribute(attr, val);
	});

	// placeholders
	document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
		const key = el.dataset.i18nPlaceholder;
		el.placeholder = t(key);
	});

	// aria-label helper: elements that want aria-label translation can use data-i18n-aria
	document.querySelectorAll('[data-i18n-aria]').forEach(el => {
		const key = el.dataset.i18nAria;
		el.setAttribute('aria-label', tLng(key));
	});
}


export function getCurrentLocale() {
	return currentLocale;
}
