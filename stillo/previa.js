var PREVIA_DADOS={"prod":[{"id_produto_variacao":2,"nome_produto":"Alinhamento e balanceamento","codigo":"102","estoque_gerenciado":0,"descricao_combinacao":null,"preco":120,"estoque":0,"nome_completo":"[102] Alinhamento e balanceamento"},{"id_produto_variacao":6,"nome_produto":"Amortecedor dianteiro","codigo":"301","estoque_gerenciado":1,"descricao_combinacao":null,"preco":329.9,"estoque":2,"nome_completo":"[301] Amortecedor dianteiro"},{"id_produto_variacao":9,"nome_produto":"Bateria 60Ah","codigo":"601","estoque_gerenciado":1,"descricao_combinacao":null,"preco":549.9,"estoque":2,"nome_completo":"[601] Bateria 60Ah"},{"id_produto_variacao":3,"nome_produto":"Diagnóstico com scanner","codigo":"103","estoque_gerenciado":0,"descricao_combinacao":null,"preco":90,"estoque":0,"nome_completo":"[103] Diagnóstico com scanner"},{"id_produto_variacao":8,"nome_produto":"Filtro de óleo","codigo":"502","estoque_gerenciado":1,"descricao_combinacao":null,"preco":39.9,"estoque":13,"nome_completo":"[502] Filtro de óleo"},{"id_produto_variacao":7,"nome_produto":"Óleo sintético 5W30 (1 L)","codigo":"501","estoque_gerenciado":1,"descricao_combinacao":null,"preco":54.9,"estoque":18,"nome_completo":"[501] Óleo sintético 5W30 (1 L)"},{"id_produto_variacao":5,"nome_produto":"Pastilha de freio dianteira","codigo":"201","estoque_gerenciado":1,"descricao_combinacao":null,"preco":189.9,"estoque":6,"nome_completo":"[201] Pastilha de freio dianteira"},{"id_produto_variacao":4,"nome_produto":"Revisão preventiva","codigo":"104","estoque_gerenciado":0,"descricao_combinacao":null,"preco":350,"estoque":0,"nome_completo":"[104] Revisão preventiva"},{"id_produto_variacao":1,"nome_produto":"Troca de óleo (mão de obra)","codigo":"101","estoque_gerenciado":0,"descricao_combinacao":null,"preco":60,"estoque":0,"nome_completo":"[101] Troca de óleo (mão de obra)"}],"cli":[{"id_cliente":24,"nome":"Aline Costa","whatsapp":"5545999110006"},{"id_cliente":20,"nome":"Fernanda Lima","whatsapp":"5545999110002"},{"id_cliente":21,"nome":"João Pereira","whatsapp":"5545999110003"},{"id_cliente":19,"nome":"Marcos Oliveira","whatsapp":"5545999110001"},{"id_cliente":22,"nome":"Patrícia Souza","whatsapp":"5545999110004"},{"id_cliente":23,"nome":"Ricardo Alves","whatsapp":"5545999110005"}],"car":{"itens":[{"id_item":161,"nome_produto":"Troca de óleo (mão de obra)","descricao_combinacao":null,"quantidade":1,"preco_unit":60,"subtotal":60},{"id_item":162,"nome_produto":"Óleo sintético 5W30 (1 L)","descricao_combinacao":null,"quantidade":4,"preco_unit":54.9,"subtotal":219.6},{"id_item":163,"nome_produto":"Filtro de óleo","descricao_combinacao":null,"quantidade":1,"preco_unit":39.9,"subtotal":39.9}],"total":319.5}};
/* Prévia estática do sistema Stillo (gimfreires.tech/stillo).
   As telas são cópias do sistema rodando com dados de demonstração. Aqui o
   caixa funciona de verdade no navegador (busca, adiciona, remove), e o que
   gravaria no banco mostra um aviso em vez de quebrar. */
(function () {
  var D = PREVIA_DADOS;
  var CHAVE = 'stillo-previa-carrinho';
  function lerCarrinho() {
    try { var s = sessionStorage.getItem(CHAVE); if (s) return JSON.parse(s); } catch (e) {}
    return JSON.parse(JSON.stringify(D.car));
  }
  function gravar(c) { try { sessionStorage.setItem(CHAVE, JSON.stringify(c)); } catch (e) {} }
  function total(c) { c.total = Math.round(c.itens.reduce(function (t, i) { return t + i.subtotal; }, 0) * 100) / 100; return c; }
  function json(o) { return Promise.resolve(new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } })); }
  function params(body) { var p = {}; if (typeof body === 'string') body.split('&').forEach(function (kv) { var a = kv.split('='); if (a[0]) p[decodeURIComponent(a[0])] = decodeURIComponent((a[1] || '').replace(/\+/g, ' ')); }); return p; }
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  var AVISO = 'Esta é uma prévia: aqui nada é gravado. No sistema instalado essa ação funciona na hora.';
  var fetchOriginal = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (url, opt) {
    var u = String(url && url.url ? url.url : url);
    var corpo = params(opt && opt.body);
    var q = u.indexOf('?') > -1 ? params(u.split('?')[1].replace(/&/g, '&')) : {};
    if (u.indexOf('/caixa/ajax/') === 0) {
      var c = lerCarrinho();
      if (u.indexOf('iniciar_venda') > -1) return json({ success: true, id_venda: 107 });
      if (u.indexOf('ver_carrinho') > -1) return json(total(c));
      if (u.indexOf('buscar_produtos') > -1) {
        var t = norm(q.termo);
        return json({ produtos: D.prod.filter(function (p) { return norm(p.nome_completo).indexOf(t) > -1 || p.codigo === q.termo; }) });
      }
      if (u.indexOf('buscar_clientes') > -1) {
        var tc = norm(q.termo);
        return json({ clientes: D.cli.filter(function (x) { return norm(x.nome).indexOf(tc) > -1 || x.whatsapp.indexOf(tc) > -1; }) });
      }
      if (u.indexOf('adicionar_item_avulso') > -1) {
        var v = parseFloat(String(corpo.preco || corpo.valor || '0').replace(/\./g, '').replace(',', '.')) || 0;
        c.itens.push({ id_item: Date.now(), nome_produto: corpo.descricao || 'Item avulso', descricao_combinacao: null, quantidade: 1, preco_unit: v, subtotal: v });
        gravar(total(c)); return json({ success: true });
      }
      if (u.indexOf('adicionar_item') > -1) {
        var p = D.prod.filter(function (x) { return String(x.id_produto_variacao) === String(corpo.id_produto_variacao); })[0];
        if (!p) return json({ success: false, message: 'Produto não encontrado.' });
        var l = c.itens.filter(function (i) { return i.nome_produto === p.nome_produto && !i.descricao_combinacao; })[0];
        var qtd = parseInt(corpo.quantidade || '1', 10) || 1;
        if (p.estoque_gerenciado && (l ? l.quantidade : 0) + qtd > p.estoque) return json({ success: false, message: 'Estoque insuficiente (disponível: ' + p.estoque + ').' });
        if (l) { l.quantidade += qtd; l.subtotal = Math.round(l.quantidade * l.preco_unit * 100) / 100; }
        else c.itens.push({ id_item: Date.now(), nome_produto: p.nome_produto, descricao_combinacao: p.descricao_combinacao, quantidade: qtd, preco_unit: p.preco, subtotal: p.preco * qtd });
        gravar(total(c)); return json({ success: true });
      }
      if (u.indexOf('remover_item') > -1) {
        c.itens = c.itens.filter(function (i) { return String(i.id_item) !== String(corpo.id_item); });
        gravar(total(c)); return json({ success: true });
      }
      if (u.indexOf('vincular_cliente') > -1) return json({ success: true });
      return json({ success: false, message: AVISO, redirect: null });
    }
    if (u.charAt(0) === '/') return json({ success: false, message: AVISO, produtos: [], itens: [], novidades: false });
    return fetchOriginal ? fetchOriginal(url, opt) : Promise.reject(new Error('sem fetch'));
  };

  var cx;
  function aviso(txt) {
    if (!document.body) return;
    if (!cx) {
      cx = document.createElement('div');
      cx.setAttribute('role', 'status');
      cx.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:10000;max-width:min(520px,calc(100vw - 32px));background:#0B0B0D;color:#F2F2F2;border:1px solid #E10A0A;border-radius:14px;padding:12px 16px;font:500 14px/1.4 Manrope,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);transition:opacity .2s';
      document.body.appendChild(cx);
    }
    cx.textContent = txt || AVISO; cx.style.opacity = '1';
    clearTimeout(cx._t); cx._t = setTimeout(function () { cx.style.opacity = '0'; }, 3200);
  }
  document.addEventListener('submit', function (e) { e.preventDefault(); e.stopImmediatePropagation(); aviso(); }, true);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-previa]');
    if (a) { e.preventDefault(); aviso('Essa tela não entrou na prévia. No sistema instalado ela abre normalmente.'); }
  }, true);
  window.alert = function (m) { aviso(m); };
  window.confirm = function () { aviso(); return false; };
  if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register = function () { return Promise.reject(); }; } catch (e) {} }
})();
