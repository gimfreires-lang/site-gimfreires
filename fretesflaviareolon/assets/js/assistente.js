// Chat do Assistente IA
document.addEventListener('DOMContentLoaded', () => {
    const lista = document.getElementById('chat-mensagens');
    const form = document.getElementById('chat-form');
    if (!lista || !form) return;
    const campo = document.getElementById('chat-pergunta');
    const enviar = document.getElementById('chat-enviar');
    const sugestoes = document.getElementById('chat-sugestoes');
    const csrf = (form.querySelector('[name=csrf]') || {}).value || '';
    const avatar = 'assets/img/simbolo.svg';

    // Markdown simples e seguro: escapa HTML e só aceita links http(s) ou do próprio sistema.
    const escapar = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const linkSeguro = (url) => /^(https?:\/\/|[a-z0-9-]+\.html)/i.test(url) ? url : null;
    function inline(t) {
        t = escapar(t);
        t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) => {
            const u = linkSeguro(url.replace(/&amp;/g, '&'));
            if (!u) return txt;
            const ext = /^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : '';
            const whats = /wa\.me\//.test(u) ? ' class="link-whats"' : '';
            return `<a href="${escapar(u)}"${ext}${whats}>${txt}</a>`;
        });
        t = t.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (m, a, u) => `${a}<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
        t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        t = t.replace(/(^|[\s(])_([^_]+)_(?=[\s).,!?]|$)/g, '$1<em>$2</em>');
        t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
        return t;
    }
    function markdown(texto) {
        const linhas = texto.replace(/\r/g, '').split('\n');
        let html = '', lista = null, para = [];
        const fecharPara = () => { if (para.length) { html += `<p>${para.map(inline).join('<br>')}</p>`; para = []; } };
        const fecharLista = () => { if (lista) { html += `</${lista}>`; lista = null; } };
        for (const l of linhas) {
            let m;
            if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { fecharPara(); if (lista !== 'ul') { fecharLista(); html += '<ul>'; lista = 'ul'; } html += `<li>${inline(m[1])}</li>`; }
            else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { fecharPara(); if (lista !== 'ol') { fecharLista(); html += '<ol>'; lista = 'ol'; } html += `<li>${inline(m[1])}</li>`; }
            else if ((m = l.match(/^#{1,4}\s+(.*)/))) { fecharPara(); fecharLista(); html += `<p><strong>${inline(m[1])}</strong></p>`; }
            else if (l.trim() === '') { fecharPara(); fecharLista(); }
            else { fecharLista(); para.push(l); }
        }
        fecharPara(); fecharLista();
        return html;
    }

    function adicionar(quem, conteudo, opcoes = {}) {
        const div = document.createElement('div');
        div.className = `chat-msg chat-${quem}` + (opcoes.classe ? ' ' + opcoes.classe : '');
        if (quem === 'ia') div.innerHTML = `<img src="${avatar}" alt="" class="chat-avatar">`;
        const balao = document.createElement('div');
        balao.className = 'chat-balao';
        if (opcoes.html) balao.innerHTML = conteudo;
        else if (quem === 'ia') balao.innerHTML = markdown(conteudo);
        else balao.textContent = conteudo;
        div.appendChild(balao);
        lista.appendChild(div);
        lista.scrollTop = lista.scrollHeight;
        return div;
    }

    // Conversa que veio do servidor
    document.querySelectorAll('.chat-balao[data-markdown="1"]').forEach((b) => { b.innerHTML = markdown(b.textContent); });
    lista.scrollTop = lista.scrollHeight;

    async function perguntar(texto) {
        if (sugestoes) sugestoes.hidden = true;
        adicionar('eu', texto);
        adicionar('ia', 'Esta é só uma prévia, então aqui eu não respondo ao vivo. A conversa acima mostra como eu respondo. No sistema instalado, com a chave da API, eu respondo na hora.');
        campo.value = '';
        return;
        if (sugestoes) sugestoes.hidden = true;
        adicionar('eu', texto);
        const pensando = adicionar('ia', '<span class="digitando"><i></i><i></i><i></i></span> <small>consultando o sistema…</small>', { html: true, classe: 'chat-pensando' });
        campo.value = '';
        campo.style.height = '';
        campo.disabled = enviar.disabled = true;
        try {
            const corpo = new URLSearchParams({ pergunta: texto, csrf });
            const r = await fetch('/assistente/api.php', { method: 'POST', body: corpo, headers: { 'Accept': 'application/json' } });
            const dados = await r.json().catch(() => ({ erro: 'Resposta inválida do servidor.' }));
            pensando.remove();
            if (dados.erro) { adicionar('ia', dados.erro, { classe: 'chat-erro' }); return; }
            const msg = adicionar('ia', dados.resposta);
            (dados.acoes || []).forEach((a) => {
                const link = document.createElement('a');
                link.href = a.url; link.className = 'chat-acao'; link.textContent = '✓ ' + a.texto + ' · abrir';
                msg.querySelector('.chat-balao').appendChild(link);
            });
        } catch (e) {
            pensando.remove();
            adicionar('ia', 'Sem conexão com o servidor. Confira a internet e tente de novo.', { classe: 'chat-erro' });
        } finally {
            campo.disabled = enviar.disabled = false;
            campo.focus();
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const t = campo.value.trim();
        if (t) perguntar(t);
    });
    campo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });
    campo.addEventListener('input', () => { campo.style.height = 'auto'; campo.style.height = Math.min(campo.scrollHeight, 160) + 'px'; });
    sugestoes && sugestoes.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => perguntar(b.textContent)));

    document.getElementById('chat-limpar').addEventListener('click', async () => {
        lista.querySelectorAll('.chat-msg:not(.chat-boas-vindas)').forEach((m) => m.remove());
        if (sugestoes) sugestoes.hidden = false;
        campo.focus();
    });
});
