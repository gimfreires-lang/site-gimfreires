// Fretes Flávia Reolon — comportamentos simples das telas internas.
document.addEventListener('DOMContentLoaded', () => {
    // Menu lateral no celular
    const lateral = document.getElementById('lateral');
    const botao = document.getElementById('botao-menu');
    const sombra = document.getElementById('sombra-menu');
    const alternar = (abrir) => {
        if (!lateral) return;
        lateral.classList.toggle('aberta', abrir);
        botao && botao.setAttribute('aria-expanded', String(abrir));
        if (sombra) sombra.hidden = !abrir;
    };
    botao && botao.addEventListener('click', () => alternar(!lateral.classList.contains('aberta')));
    sombra && sombra.addEventListener('click', () => alternar(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') alternar(false); });

    // Linha de tabela clicável (sem atrapalhar links e botões dentro dela)
    document.querySelectorAll('tr[data-href]').forEach((tr) => {
        tr.addEventListener('click', (e) => {
            if (e.target.closest('a, button, input, form')) return;
            window.location = tr.dataset.href;
        });
    });

    // Confirmação antes de excluir
    document.querySelectorAll('[data-confirmar]').forEach((el) => {
        const evento = el.tagName === 'FORM' ? 'submit' : 'click';
        el.addEventListener(evento, (e) => {
            if (!confirm(el.dataset.confirmar)) e.preventDefault();
        });
    });

    // Máscara de moeda: digita só números, mostra 1.234,56
    const formatar = (v) => (v / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.querySelectorAll('.js-moeda').forEach((input) => {
        input.addEventListener('input', () => {
            const digitos = input.value.replace(/\D/g, '');
            input.value = digitos ? formatar(parseInt(digitos, 10)) : '';
            atualizarResumo();
        });
    });

    // Máscara de telefone: (43) 99999-9999 / (43) 3333-3333
    document.querySelectorAll('.js-telefone').forEach((input) => {
        input.addEventListener('input', () => {
            const d = input.value.replace(/\D/g, '').slice(0, 11);
            if (d.length <= 2) input.value = d;
            else if (d.length <= 6) input.value = `(${d.slice(0, 2)}) ${d.slice(2)}`;
            else if (d.length <= 10) input.value = `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
            else input.value = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
        });
    });

    // Margem e saldo do motorista no formulário de frete
    const paraNumero = (s) => parseFloat((s || '0').replace(/\./g, '').replace(',', '.')) || 0;
    const moeda = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    function atualizarResumo() {
        const form = document.getElementById('form-frete');
        if (!form) return;
        const frete = paraNumero(form.valor_frete.value);
        const motorista = paraNumero(form.valor_motorista.value);
        const adiant = paraNumero(form.adiantamento.value);
        const margem = document.getElementById('calc-margem');
        margem.textContent = moeda(frete - motorista) + (frete > 0 ? ` (${((frete - motorista) / frete * 100).toFixed(1).replace('.', ',')}%)` : '');
        margem.className = frete - motorista < 0 ? 'negativo' : '';
        document.getElementById('calc-saldo').textContent = moeda(motorista - adiant);
    }
    atualizarResumo();
});
