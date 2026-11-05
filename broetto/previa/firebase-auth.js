/* Prévia: login de demonstração. Já entra logado; "Sair" mostra a tela de login,
   e qualquer e-mail e senha entram de novo. */
const CHAVE = 'broetto-previa-saiu';
const USUARIO = { uid: 'previa', email: 'broetto@previa.gimfreires.tech', displayName: 'Broetto' };
const ouvintes = new Set();
const auth = { currentUser: null };
function atual() { try { return sessionStorage.getItem(CHAVE) === '1' ? null : USUARIO; } catch (e) { return USUARIO; } }
function avisar() { auth.currentUser = atual(); ouvintes.forEach((cb) => cb(auth.currentUser)); }
export function getAuth() { auth.currentUser = atual(); return auth; }
export function onAuthStateChanged(a, cb) { ouvintes.add(cb); setTimeout(() => cb(atual()), 0); return () => ouvintes.delete(cb); }
export async function signInWithEmailAndPassword() { try { sessionStorage.removeItem(CHAVE); } catch (e) {} avisar(); return { user: USUARIO }; }
export async function signOut() { try { sessionStorage.setItem(CHAVE, '1'); } catch (e) {} avisar(); }
export async function setPersistence() {}
export const browserLocalPersistence = {};
export const browserSessionPersistence = {};
