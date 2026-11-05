/* Prévia: substitui o Firebase App. Nada é enviado para a internet. */
export function initializeApp(config) { return { name: '[previa]', options: config || {} }; }
export function getApp() { return { name: '[previa]' }; }
export function getApps() { return []; }
