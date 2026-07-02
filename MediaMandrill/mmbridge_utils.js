/**
 * mmbridge_utils.js
 * utilitaires
 */

// console.log('[mmbridge_utils.js][function] var', var);

'use strict';



async function mmInfo(requestId) {
    try {
		const filePath = app.filesystem.getScriptsPath() + 'MediaMandrill\\info.json';
		const text = await app.filesystem.loadTextFromFileAsync(filePath);
		const info = JSON.parse(text);		
		safeSend({ event: 'mmInfo', requestId, result: info });
    } catch (e) {
        console.error('[mmInfo] failed:', e);
		safeSend({ event: 'mmInfo', requestId, result: null });
    }
}
