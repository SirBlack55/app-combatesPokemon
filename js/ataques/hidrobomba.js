// Hidrobomba (hydro-pump): cañón de agua.
CUSTOM['hydro-pump'] = {
    mv: { cu: 'hydro-pump' }, fallback: () => ({ n: 'Hidrobomba', key: 'hydro-pump', p: 110, cd: 8.4, c: 1, r: 300, u: 1, t: 'water', cat: 'spe', acc: 80, sty: 'orb', cu: 'hydro-pump' }),
    start(m, tg, p) { m.sc = { id: 'hydro-pump', t: 0 }; bn = { s: p.n, c: '#7dd3fc', l: 1.5 }; cz = .05; ents.push({ k: 'u', cu: 'hydro-pump', o: m, tg, cat: p.cat, dm: p.p / 7, t: 0, tk: 0, n: 0, life: 1.95, delay: 0 }) },
    run(m, dt, s) { const tg = m.tg; if (tg) m.a = turn(m.a, Math.atan2(tg.y - m.y, tg.x - m.x), dt * 10); m.sqz = s.t < .55 ? .45 * s.t / .55 : Math.max(0, .45 - (s.t - .55) * 3); return s.t >= 1.85 },
    eup(e, dt) {
        const o = e.o, t = e.tg; e.t += dt; e.life = 1.95 - e.t; if (o.dead) { e.life = 0; return } if (t.dead && e.t < 1.6) e.t = 1.6; const Q = hpos(e); if (!Q) return;
        if (e.t < .55) { for (let i = 0; i < 3 && ps.length < 900; i++) { const a = R(0, 6.28), r = R(40, 75); ps.push({ x: Q.Ox + Math.cos(a) * r, y: Q.Oy + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, l: .25, m: .25, c: i % 2 ? '#bae6fd' : '#38bdf8', s: R(3, 6), g: 1 }) } }
        else if (e.t < 1.6) {
            if (!e.fs) { e.fs = 1; o.kx -= Q.ux * 70; o.ky -= Q.uy * 70; shk = Math.max(shk, 6); ring(Q.Ox, Q.Oy, '#bae6fd', 60, .4); sfl = .25; sfc = '#7dd3fc' }
            for (let i = 0; i < 5 && ps.length < 900; i++) { const s = R(.1, 1), sd = i % 2 ? 1 : -1, w = (8 + (Q.Wm - 8) * s) * .5; ps.push({ x: Q.Ox + Q.ux * Q.L * s + Q.nx * sd * w, y: Q.Oy + Q.uy * Q.L * s + Q.ny * sd * w, vx: Q.nx * sd * R(60, 160) + Q.ux * R(80, 200), vy: Q.ny * sd * R(60, 160) + Q.uy * R(80, 200), l: .4, m: .4, c: i % 3 ? '#fff' : '#7dd3fc', s: R(3, 6), g: 1 }) }
            for (let i = 0; i < 4 && ps.length < 900; i++)ps.push({ x: Q.Tx + R(-Q.Wm * .6, Q.Wm * .6), y: Q.Ty + R(0, 36), vx: R(-120, 120), vy: -R(80, 200), gy: 320, l: .6, m: .6, c: i % 2 ? '#fff' : '#7dd3fc', s: R(4, 8), g: 1 });
            e.tk += dt; if (e.tk >= .15) { e.tk = 0; e.n++; hit(t, e.dm, 'water', o, { cat: e.cat, f: e.n == 1 }); ring(Q.Tx, Q.Ty + 30, '#7dd3fc', 50, .4, 3); shk = Math.max(shk, 5) }
        }
        else if (!e.end) { e.end = 1; imp(Q.Tx, Q.Ty, 'water', 2); ring(Q.Tx, Q.Ty + 20, '#bae6fd', 110, .7, 5); shk = Math.max(shk, 9) }
    },
    edraw(e) {
        const o = e.o, t = e.tg; if (!o || !t) return; const Q = hpos(e); if (!Q) return; const { Ox, Oy, ux, uy, nx, ny, L } = Q; cx.save(); cx.globalCompositeOperation = 'lighter';
        if (e.t < .55) { const r = 6 + e.t / .55 * 20, g = cx.createRadialGradient(Ox, Oy, 1, Ox, Oy, r); g.addColorStop(0, '#fff'); g.addColorStop(.5, '#38bdf8'); g.addColorStop(1, 'rgba(14,165,233,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(Ox, Oy, r, 0, 7); cx.fill(); cx.restore(); return }
        cx.globalCompositeOperation = 'source-over';
        const reach = Math.min(1, (e.t - .55) / .09), fade = Math.min(1, Math.max(0, 1 - (e.t - 1.6) / .3)), W_ = s => (8 + (Q.Wm - 8) * s) * fade * (1 + .07 * Math.sin(s * 18 - T * 30)), pt = (s, f, wb) => { const w = W_(s), o2 = f * w * .5 + Math.sin(s * 14 - T * 34 + f * 2.4) * w * wb; return [Ox + ux * L * s + nx * o2, Oy + uy * L * s + ny * o2] };
        for (const [k, col] of [[1, 'rgba(14,165,233,.55)'], [.72, 'rgba(56,189,248,.8)'], [.38, 'rgba(186,230,253,.95)']]) { cx.fillStyle = col; cx.beginPath(); for (let i = 0; i <= 16; i++) { const s = reach * i / 16, w = W_(s) * k * .5; cx.lineTo(Ox + ux * L * s + nx * w, Oy + uy * L * s + ny * w) } for (let i = 16; i >= 0; i--) { const s = reach * i / 16, w = W_(s) * k * .5; cx.lineTo(Ox + ux * L * s - nx * w, Oy + uy * L * s - ny * w) } cx.closePath(); cx.fill(); if (k == 1) { cx.strokeStyle = 'rgba(3,105,161,.55)'; cx.lineWidth = 2; cx.stroke() } { const ex = Ox + ux * L * reach, ey = Oy + uy * L * reach, w2 = W_(reach) * k * .5; cx.save(); cx.translate(ex, ey); cx.rotate(Math.atan2(uy, ux)); cx.beginPath(); cx.ellipse(0, 0, w2 * .3, w2, 0, 0, 7); cx.fill(); cx.restore() } }
        cx.lineCap = 'round'; for (let f = -2; f <= 2; f++) { cx.strokeStyle = f % 2 ? 'rgba(255,255,255,.85)' : 'rgba(125,211,252,.9)'; cx.lineWidth = 2.4; cx.beginPath(); for (let i = 0; i <= 20; i++) { const [x, y] = pt(reach * i / 20, f / 2, .16); i ? cx.lineTo(x, y) : cx.moveTo(x, y) } cx.stroke() }
        cx.strokeStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 6; k++) { const s = ((T * 2.4 + k / 6) % 1) * reach, w = W_(s) * .5, bx = Ox + ux * L * s, by = Oy + uy * L * s; cx.lineWidth = 3 * (.4 + s); cx.beginPath(); cx.moveTo(bx - nx * w, by - ny * w); cx.quadraticCurveTo(bx + ux * w * .9, by + uy * w * .9, bx + nx * w, by + ny * w); cx.stroke() }
        cx.globalCompositeOperation = 'lighter'; const rr = 20 * fade + 5, g = cx.createRadialGradient(Ox, Oy, 1, Ox, Oy, rr); g.addColorStop(0, '#fff'); g.addColorStop(.5, '#38bdf8'); g.addColorStop(1, 'rgba(14,165,233,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(Ox, Oy, rr, 0, 7); cx.fill(); cx.restore()
    }
};
