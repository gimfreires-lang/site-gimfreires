/* Prévia: upload de fotos desativado (mostra um aviso). */
export function getStorage() { return {}; }
export function ref(s, path) { return { path }; }
export async function uploadBytes() { alert('Esta é uma prévia: o envio de fotos funciona só no sistema instalado.'); throw new Error('previa'); }
export async function getDownloadURL() { return ''; }
