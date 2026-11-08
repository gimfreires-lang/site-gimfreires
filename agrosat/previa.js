/* Prévia estática do sistema Agrosat (gimfreires.tech/agrosat).
   As telas são cópias do sistema rodando com dados de demonstração. Botões que
   gravariam no banco mostram um aviso em vez de quebrar. */
(function () {
  var AVISO = 'Na prévia nada é gravado. No sistema instalado esse botão salva normalmente.';
  var css = '.faixa-previa{position:sticky;top:0;z-index:9999;background:#0F3D2E;color:#E8F3EC;font:600 13px/1.4 Manrope,system-ui,sans-serif;text-align:center;padding:7px 16px}' +
    '.faixa-previa a{color:#9BE3B7}' +
    '@media print{.faixa-previa{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var cx;
  function aviso(txt) {
    if (!document.body) return;
    if (!cx) {
      cx = document.createElement('div');
      cx.setAttribute('role', 'status');
      cx.style.cssText = 'position:fixed;left:50%;top:48px;transform:translateX(-50%);z-index:10000;max-width:min(520px,calc(100vw - 32px));background:#0F3D2E;color:#fff;border-radius:12px;padding:12px 16px;font:500 14px/1.4 Manrope,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:opacity .2s';
      document.body.appendChild(cx);
    }
    cx.textContent = txt || AVISO; cx.style.opacity = '1';
    clearTimeout(cx._t); cx._t = setTimeout(function () { cx.style.opacity = '0'; }, 3200);
  }
  document.addEventListener('submit', function (e) {
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.target.querySelector('input[name="senha"]') && !e.target.querySelector('input[name="confirmar_senha"]')) { location.href = 'painel.html'; return; }
    aviso();
  }, true);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-previa]');
    if (a) { e.preventDefault(); aviso('Essa tela não entrou na prévia. No sistema instalado ela abre normalmente.'); }
  }, true);
  window.alert = function (m) { aviso(m); };
  window.confirm = function () { aviso(); return false; };
})();
