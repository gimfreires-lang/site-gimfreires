/* assets/js/topografia.js — cálculos do escritório no navegador (mesmas regras de includes/topografia.php)
   e comportamento das telas: calculadora de orçamento, ferramentas, máscaras. */
(function () {
    'use strict';

    const Topo = {};

    /** Mesmas regras de numeroDoForm() no PHP: "1.234,56", "1234.56", "1.500" (= 1500). */
    Topo.lerNumero = function (v) {
        let s = String(v == null ? '' : v).replace(/R\$|\s|\u00A0/g, '');
        if (s === '') return 0;
        if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
        else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
        const n = parseFloat(s);
        return isNaN(n) ? 0 : n;
    };
    Topo.esc = function (t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    };
    Topo.num = function (v, casas) {
        casas = casas == null ? 2 : casas;
        return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
    };
    Topo.moeda = function (v) { return 'R$ ' + Topo.num(v, 2); };

    /* ---------- Orçamento ---------- */
    Topo.calcularOrcamento = function (p) {
        const diarias = p.dias * p.equipe * p.diaria;
        const deslocamento = p.km * p.valorKm;
        const equipamentos = p.dias * p.equipDia;
        const escritorio = p.horas * p.valorHora;
        const taxas = p.taxas;
        const custos = diarias + deslocamento + equipamentos + escritorio + taxas;
        const honorarios = p.base + p.area * p.porHa;
        const imp = Math.min(0.9, Math.max(0, p.impostos / 100));
        const bruto = (custos + honorarios) * (1 + p.margem / 100) / (1 - imp);
        const valor = Math.max(0, Math.round((bruto - Math.max(0, p.desconto)) * 100) / 100);
        const impostos = Math.round(valor * imp * 100) / 100;
        const lucro = valor - impostos - custos;
        return { diarias: diarias, deslocamento: deslocamento, equipamentos: equipamentos, escritorio: escritorio, taxas: taxas,
            custos: custos, honorarios: honorarios, impostos: impostos, valor: valor, lucro: lucro, margemReal: valor > 0 ? lucro / valor * 100 : 0 };
    };

    /* ---------- Geometria ---------- */
    Topo.lerVertices = function (texto) {
        const out = [];
        String(texto || '').split(/\r?\n/).forEach(function (linha) {
            linha = linha.trim();
            if (!linha || linha[0] === '#') return;
            let p;
            if (/[;\t]/.test(linha)) p = linha.split(/[;\t]/);
            else if (linha.indexOf(',') >= 0 && linha.indexOf('.') >= 0) p = linha.split(',');
            else p = linha.split(/\s+/);
            p = p.map(function (x) { return x.trim(); });
            if (p.length < 3) return;
            const num = function (t) { return t.indexOf(',') >= 0 ? Topo.lerNumero(t) : (parseFloat(t) || 0); };
            const e = num(p[1]);
            const n = num(p[2]);
            if (!e || !n) return;
            if (e >= 1000000 && n > 100000 && n < 1000000) { out.push({ nome: p[0], e: n, n: e }); return; } // PNEZD
            out.push({ nome: p[0], e: e, n: n });
        });
        // Último vértice repetindo o primeiro (polígono "fechado" na exportação): descarta.
        if (out.length >= 4) {
            const a = out[0], b = out[out.length - 1];
            if (Math.abs(a.e - b.e) < 0.0005 && Math.abs(a.n - b.n) < 0.0005) out.pop();
        }
        return out;
    };
    Topo.azimute = function (e1, n1, e2, n2) {
        let az = Math.atan2(e2 - e1, n2 - n1) * 180 / Math.PI;
        return az < 0 ? az + 360 : az;
    };
    Topo.poligono = function (v) {
        let soma = 0, per = 0;
        const lados = [];
        for (let i = 0; i < v.length; i++) {
            const a = v[i], b = v[(i + 1) % v.length];
            soma += a.e * b.n - b.e * a.n;
            const d = Math.hypot(b.e - a.e, b.n - a.n);
            per += d;
            lados.push({ de: a.nome, para: b.nome, dist: d, az: Topo.azimute(a.e, a.n, b.e, b.n) });
        }
        return { area: Math.abs(soma) / 2, perimetro: per, lados: lados, sentido: soma < 0 ? 'horário' : 'anti-horário' };
    };
    Topo.gms = function (graus, casas) {
        casas = casas == null ? 2 : casas;
        const sinal = graus < 0 ? '-' : '';
        let g = Math.abs(graus);
        let gg = Math.floor(g);
        let mm = Math.floor((g - gg) * 60);
        let ss = ((g - gg) * 60 - mm) * 60;
        if (Number(ss.toFixed(casas)) >= 60) { ss = 0; mm++; }
        if (mm >= 60) { mm = 0; gg++; }
        if (gg === 360 && mm === 0 && !sinal) gg = 0;
        const sTxt = ss.toFixed(casas).replace('.', ',');
        return sinal + gg + '°' + String(mm).padStart(2, '0') + "'" + sTxt.padStart(casas ? casas + 3 : 2, '0') + '"';
    };
    /** Aceita 81.17, 81,17, 81°10'25", 81 10 25 ou -19°55'15,2" */
    Topo.lerAngulo = function (txt) {
        txt = String(txt || '').trim();
        if (!txt) return NaN;
        const neg = /^-/.test(txt) || /[SWO]$/i.test(txt);
        const partes = txt.replace(/^-/, '').replace(/[NSEWLO]$/i, '').split(/[°º'"′″\s]+/).filter(Boolean).map(Topo.lerNumero);
        if (partes.length === 1 && !/[°º'"]/.test(txt)) return (neg ? -1 : 1) * partes[0];
        const v = (partes[0] || 0) + (partes[1] || 0) / 60 + (partes[2] || 0) / 3600;
        return neg ? -v : v;
    };
    Topo.rumo = function (az) {
        az = ((az % 360) + 360) % 360;
        if (az <= 90) return Topo.gms(az, 0) + ' NE';
        if (az <= 180) return Topo.gms(180 - az, 0) + ' SE';
        if (az <= 270) return Topo.gms(az - 180, 0) + ' SW';
        return Topo.gms(360 - az, 0) + ' NW';
    };
    Topo.croqui = function (svg, v) {
        const W = 320, H = 220, M = 24;
        if (v.length < 3) { svg.innerHTML = ''; return; }
        const es = v.map(function (p) { return p.e; }), ns = v.map(function (p) { return p.n; });
        const minE = Math.min.apply(null, es), maxE = Math.max.apply(null, es), minN = Math.min.apply(null, ns), maxN = Math.max.apply(null, ns);
        const k = Math.min((W - 2 * M) / Math.max(0.001, maxE - minE), (H - 2 * M) / Math.max(0.001, maxN - minN));
        const ox = (W - (maxE - minE) * k) / 2, oy = (H - (maxN - minN) * k) / 2;
        const pts = v.map(function (p) { return [(p.e - minE) * k + ox, H - ((p.n - minN) * k + oy), p.nome]; });
        let h = '<polygon class="croqui-area" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
        pts.forEach(function (p) {
            h += '<circle class="croqui-ponto" r="3" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '"/>';
            h += '<text class="croqui-rotulo" x="' + (p[0] + 5).toFixed(1) + '" y="' + (p[1] - 5).toFixed(1) + '">' + Topo.esc(p[2]) + '</text>';
        });
        h += '<g class="croqui-norte" transform="translate(' + (W - 16) + ',18)"><path d="M0,-10 L5,6 L0,2 L-5,6 Z"/><text y="18" text-anchor="middle">N</text></g>';
        svg.innerHTML = h;
    };

    /* ---------- UTM ⇄ geográficas (SIRGAS 2000 / GRS80) — mesmas fórmulas de includes/cad.php ---------- */
    const A = 6378137.0, F = 1 / 298.257222101, K0 = 0.9996, E2 = F * (2 - F), EP2 = E2 / (1 - E2);
    Topo.fuso = function (t) {
        const m = /(\d{1,2})\s*([NnSs])?/.exec(String(t || ''));
        if (!m || +m[1] < 1 || +m[1] > 60) return null;
        return { z: +m[1], hem: (m[2] || 'S').toUpperCase() === 'N' ? 'N' : 'S' };
    };
    Topo.utmParaGeo = function (e, n, z, hem) {
        const x = e - 500000, y = hem === 'S' ? n - 10000000 : n;
        const mu = (y / K0) / (A * (1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * Math.pow(E2, 3) / 256));
        const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
        const p1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu)
            + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu) + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu);
        const s = Math.sin(p1), c = Math.cos(p1), t = Math.tan(p1);
        const n1 = A / Math.sqrt(1 - E2 * s * s), t1 = t * t, c1 = EP2 * c * c, r1 = A * (1 - E2) / Math.pow(1 - E2 * s * s, 1.5), d = x / (n1 * K0);
        const lat = p1 - (n1 * t / r1) * (d * d / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * EP2) * Math.pow(d, 4) / 24
            + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * EP2 - 3 * c1 * c1) * Math.pow(d, 6) / 720);
        const lon = (d - (1 + 2 * t1 + c1) * Math.pow(d, 3) / 6 + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * EP2 + 24 * t1 * t1) * Math.pow(d, 5) / 120) / c;
        return { lat: lat * 180 / Math.PI, lon: (-183 + 6 * z) + lon * 180 / Math.PI };
    };
    Topo.geoParaUtm = function (lat, lon) {
        const z = Math.floor((lon + 180) / 6) + 1, phi = lat * Math.PI / 180, lam = (lon - (-183 + 6 * z)) * Math.PI / 180;
        const s = Math.sin(phi), c = Math.cos(phi), t = Math.tan(phi) * Math.tan(phi);
        const n = A / Math.sqrt(1 - E2 * s * s), cc = EP2 * c * c, aa = c * lam;
        const m = A * ((1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * Math.pow(E2, 3) / 256) * phi - (3 * E2 / 8 + 3 * E2 * E2 / 32 + 45 * Math.pow(E2, 3) / 1024) * Math.sin(2 * phi)
            + (15 * E2 * E2 / 256 + 45 * Math.pow(E2, 3) / 1024) * Math.sin(4 * phi) - (35 * Math.pow(E2, 3) / 3072) * Math.sin(6 * phi));
        const e = K0 * n * (aa + (1 - t + cc) * Math.pow(aa, 3) / 6 + (5 - 18 * t + t * t + 72 * cc - 58 * EP2) * Math.pow(aa, 5) / 120) + 500000;
        let no = K0 * (m + n * Math.tan(phi) * (aa * aa / 2 + (5 - t + 9 * cc + 4 * cc * cc) * Math.pow(aa, 4) / 24 + (61 - 58 * t + t * t + 600 * cc - 330 * EP2) * Math.pow(aa, 6) / 720));
        if (lat < 0) no += 10000000;
        return { e: e, n: no, z: z, hem: lat < 0 ? 'S' : 'N' };
    };
    Topo.gmsGeo = function (g, tipo) {
        const letra = tipo === 'lat' ? (g < 0 ? 'S' : 'N') : (g < 0 ? 'O' : 'L');
        return Topo.gms(Math.abs(g), 3) + ' ' + letra;
    };

    window.Topo = Topo;

    /* ---------- Máscaras simples ---------- */
    function mascaraDoc(el) {
        el.addEventListener('input', function () {
            const d = el.value.replace(/\D/g, '').slice(0, 14);
            if (d.length <= 11) el.value = d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            else el.value = d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
        });
    }
    function mascaraTel(el) {
        el.addEventListener('input', function () {
            let d = el.value.replace(/\D/g, '');
            if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2);
            d = d.slice(0, 11);
            if (d.length > 10) el.value = d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
            else if (d.length > 6) el.value = d.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
            else if (d.length > 2) el.value = d.replace(/^(\d{2})(\d*)/, '($1) $2');
            else el.value = d;
        });
    }

    /* ---------- Ferramentas ---------- */
    function iniciarFerramentas() {
        const abas = document.querySelector('[data-abas]');
        if (!abas) return;
        abas.querySelectorAll('button').forEach(function (b) {
            b.addEventListener('click', function () {
                abas.querySelectorAll('button').forEach(function (x) { x.classList.toggle('ativa', x === b); });
                document.querySelectorAll('.aba-painel').forEach(function (p) { p.hidden = p.id !== 'aba-' + b.dataset.aba; });
                try { localStorage.setItem('topo-aba', b.dataset.aba); } catch (e) { /* sem storage */ }
            });
        });
        try { const salva = localStorage.getItem('topo-aba'); const btn = salva && abas.querySelector('[data-aba="' + salva + '"]'); if (btn) btn.click(); } catch (e) { /* sem storage */ }

        const $ = function (id) { return document.getElementById(id); };

        // Área
        const atualizarArea = function () {
            const v = Topo.lerVertices($('ferr-vertices').value);
            Topo.croqui($('ferr-croqui'), v);
            if (v.length < 3) { $('ferr-resumo').innerHTML = '<div><span>Vértices</span><strong>' + v.length + '</strong><small>mínimo 3</small></div>'; $('ferr-lados').innerHTML = ''; return; }
            const r = Topo.poligono(v);
            $('ferr-resumo').innerHTML = '<div><span>Área</span><strong>' + Topo.num(r.area / 10000, 4) + ' ha</strong><small>' + Topo.num(r.area, 2) + ' m²</small></div>' +
                '<div><span>Perímetro</span><strong>' + Topo.num(r.perimetro, 2) + ' m</strong></div><div><span>Vértices</span><strong>' + v.length + '</strong><small>sentido ' + r.sentido + '</small></div>';
            $('ferr-lados').innerHTML = '<tr><th>De</th><th>Para</th><th>Azimute</th><th>Rumo</th><th class="num">Distância (m)</th></tr>' + r.lados.map(function (l) {
                return '<tr><td>' + Topo.esc(l.de) + '</td><td>' + Topo.esc(l.para) + '</td><td class="mono">' + Topo.gms(l.az) + '</td><td class="mono">' + Topo.rumo(l.az) + '</td><td class="num">' + Topo.num(l.dist, 3) + '</td></tr>';
            }).join('');
        };
        $('ferr-vertices').addEventListener('input', atualizarArea);
        atualizarArea();

        // Irradiação
        const atualizarIrr = function () {
            const e = Topo.lerNumero($('irr-e').value), n = Topo.lerNumero($('irr-n').value);
            const az = Topo.lerAngulo($('irr-az').value) * Math.PI / 180, d = Topo.lerNumero($('irr-d').value);
            if (isNaN(az)) { $('irr-res').textContent = 'Azimute inválido.'; return; }
            $('irr-res').innerHTML = 'E = <strong>' + Topo.num(e + d * Math.sin(az), 3) + '</strong> m &nbsp; N = <strong>' + Topo.num(n + d * Math.cos(az), 3) + '</strong> m';
        };
        ['irr-e', 'irr-n', 'irr-az', 'irr-d'].forEach(function (id) { $(id).addEventListener('input', atualizarIrr); });
        atualizarIrr();

        // Ângulos
        $('ang-dec').addEventListener('input', function () { const v = Topo.lerNumero(this.value); $('ang-gms').value = isNaN(v) ? '' : Topo.gms(v, 2); });
        $('ang-gms').addEventListener('input', function () { const v = Topo.lerAngulo(this.value); $('ang-dec').value = isNaN(v) ? '' : Topo.num(v, 6).replace(/\./g, ''); });
        $('ang-dec').dispatchEvent(new Event('input'));
        const atualizarAz = function () {
            const v = Topo.lerAngulo($('az-entrada').value);
            if (isNaN(v)) { $('az-rumo').value = ''; $('az-contra').value = ''; return; }
            $('az-rumo').value = Topo.rumo(v);
            $('az-contra').value = Topo.gms((v + 180) % 360, 0);
        };
        $('az-entrada').addEventListener('input', atualizarAz);
        atualizarAz();

        // Unidades
        // Fatores em hectares (alqueire mineiro/goiano 48.400 m², paulista 24.200 m², baiano 96.800 m²,
        // do norte 27.225 m²; tarefa baiana 4.356 m², nordestina (AL/SE) 3.025 m²; acre 4.046,86 m²).
        const unidades = [['hectares', 1, 4], ['m²', 0.0001, 2], ['km²', 100, 6], ['alqueires mineiros/goianos', 4.84, 4], ['alqueires paulistas', 2.42, 4], ['alqueires baianos', 9.68, 4], ['alqueires do norte', 2.7225, 4], ['tarefas baianas', 0.4356, 3], ['tarefas nordestinas (AL/SE)', 0.3025, 3], ['acres', 0.404686, 4]];
        const atualizarUn = function () {
            const ha = Topo.lerNumero($('un-valor').value) * parseFloat($('un-de').value);
            $('un-tabela').innerHTML = unidades.map(function (u) { return '<tr><td>' + u[0] + '</td><td class="num"><strong>' + Topo.num(ha / u[1], u[2]) + '</strong></td></tr>'; }).join('');
        };
        $('un-valor').addEventListener('input', atualizarUn);
        $('un-de').addEventListener('change', atualizarUn);
        atualizarUn();

        // Declividade
        const atualizarDec = function () {
            const dn = Topo.lerNumero($('dec-c2').value) - Topo.lerNumero($('dec-c1').value), dh = Topo.lerNumero($('dec-dh').value);
            if (!dh) { $('dec-res').textContent = ''; return; }
            const pct = dn / dh * 100, ang = Math.atan(dn / dh) * 180 / Math.PI;
            const a = Math.abs(pct);
            const classe = a <= 3 ? 'plano' : a <= 8 ? 'suave ondulado' : a <= 20 ? 'ondulado' : a <= 45 ? 'forte ondulado' : a <= 75 ? 'montanhoso' : 'escarpado';
            $('dec-res').innerHTML = 'Desnível <strong>' + Topo.num(dn, 3) + ' m</strong> · declividade <strong>' + Topo.num(pct, 2) + '%</strong> · ' + Topo.gms(ang, 0) +
                ' · distância inclinada ' + Topo.num(Math.hypot(dh, dn), 3) + ' m · relevo ' + classe;
        };
        ['dec-c1', 'dec-c2', 'dec-dh'].forEach(function (id) { $(id).addEventListener('input', atualizarDec); });
        atualizarDec();

        // Nivelamento geométrico (método da altura do instrumento)
        const atualizarNiv = function () {
            let cota = Topo.lerNumero($('niv-rn').value), ai = null, somaRe = 0, somaVante = 0;
            const cotaInicial = cota;
            let html = '<tr><th>Ponto</th><th class="num">Ré</th><th class="num">Vante</th><th class="num">Alt. instrumento</th><th class="num">Cota (m)</th></tr>';
            const linhas = $('niv-leituras').value.split(/\r?\n/).map(function (l) { return l.split(/[;\t]/).map(function (x) { return x.trim(); }); }).filter(function (p) { return p[0]; });
            linhas.forEach(function (p, i) {
                const re = p[1] ? Topo.lerNumero(p[1]) : null, vante = p[2] ? Topo.lerNumero(p[2]) : null;
                if (vante !== null && ai !== null) { cota = ai - vante; somaVante += vante; }
                if (re !== null) { ai = cota + re; somaRe += re; }
                html += '<tr><td>' + Topo.esc(p[0]) + '</td><td class="num">' + (re !== null ? Topo.num(re, 3) : '') + '</td><td class="num">' + (vante !== null ? Topo.num(vante, 3) : '') + '</td><td class="num">' + (re !== null ? Topo.num(ai, 3) : '') + '</td><td class="num"><strong>' + Topo.num(i === 0 ? cotaInicial : cota, 3) + '</strong></td></tr>';
            });
            $('niv-tabela').innerHTML = html;
            const fechou = linhas.length > 1 && linhas[0][0] === linhas[linhas.length - 1][0];
            const erro = (cota - cotaInicial) * 1000;
            const tol = Topo.lerNumero($('niv-tol').value) * Math.sqrt(Math.max(0, Topo.lerNumero($('niv-km').value)));
            $('niv-res').innerHTML = 'Σré − Σvante = <strong>' + Topo.num(somaRe - somaVante, 3) + ' m</strong>' +
                (fechou ? ' · erro de fechamento <strong>' + Topo.num(erro, 1) + ' mm</strong> · tolerância ' + Topo.num(tol, 1) + ' mm → ' + (Math.abs(erro) <= tol ? '<span class="texto-sucesso">dentro da tolerância</span>' : '<span class="texto-erro">fora da tolerância — refazer</span>') : ' · (repita o ponto inicial no fim para calcular o fechamento)');
        };
        ['niv-rn', 'niv-tol', 'niv-km', 'niv-leituras'].forEach(function (id) { $(id).addEventListener('input', atualizarNiv); });
        atualizarNiv();
    }

    function iniciarUtm() {
        const $ = function (id) { return document.getElementById(id); };
        if (!$('utm-e')) return;
        const paraGeo = function () {
            const f = Topo.fuso($('utm-fuso').value), e = Topo.lerNumero($('utm-e').value), n = Topo.lerNumero($('utm-n').value);
            if (!f || !e || !n) { $('utm-res').textContent = 'Informe Este, Norte e o fuso (ex.: 23S).'; return; }
            const r = Topo.utmParaGeo(e, n, f.z, f.hem);
            $('utm-res').innerHTML = 'Latitude <strong>' + Topo.gmsGeo(r.lat, 'lat') + '</strong> (' + r.lat.toFixed(8) + ')<br>Longitude <strong>' + Topo.gmsGeo(r.lon, 'lon') + '</strong> (' + r.lon.toFixed(8) + ')';
        };
        const paraUtm = function () {
            const sinal = function (txt) { return /[SWO]\s*$/i.test(txt.trim()) ? -1 : 1; };
            const la = Topo.lerAngulo($('geo-lat').value), lo = Topo.lerAngulo($('geo-lon').value);
            if (isNaN(la) || isNaN(lo)) { $('geo-res').textContent = 'Coordenadas inválidas.'; return; }
            const lat = la < 0 ? la : la * sinal($('geo-lat').value), lon = lo < 0 ? lo : lo * sinal($('geo-lon').value);
            const r = Topo.geoParaUtm(lat, lon);
            $('geo-res').innerHTML = 'E <strong>' + Topo.num(r.e, 3) + '</strong> m &nbsp; N <strong>' + Topo.num(r.n, 3) + '</strong> m &nbsp; fuso <strong>' + r.z + r.hem + '</strong> (MC ' + Math.abs(-183 + 6 * r.z) + '° W)';
        };
        ['utm-e', 'utm-n', 'utm-fuso'].forEach(function (id) { $(id).addEventListener('input', paraGeo); });
        ['geo-lat', 'geo-lon'].forEach(function (id) { $(id).addEventListener('input', paraUtm); });
        paraGeo(); paraUtm();
    }

    document.addEventListener('DOMContentLoaded', function () {
        iniciarUtm();
        document.querySelectorAll('.js-mascara-doc').forEach(mascaraDoc);
        document.querySelectorAll('.js-mascara-tel').forEach(mascaraTel);
        iniciarFerramentas();
    });
})();
