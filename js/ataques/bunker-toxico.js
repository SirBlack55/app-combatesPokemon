// Búnker Tóxico (baneful-bunker): el escudo de Toxapex. Una cúpula violeta se alza sobre el Pokémon, entre púas tóxicas
// que brotan de golpe, con rayos de luz morada y burbujas de veneno. Si le alcanza un ataque FÍSICO, envenena al atacante
// (la mecánica está en campo.js: protege / protegido). Esto es solo la animación.
// Reacciona a cada golpe bloqueado (o.pbT = cuándo, o.pbA = desde qué ángulo) y al veneno (o.pxT = cuándo envenenó).
CUSTOM['baneful-bunker'] = {
    mv: { cu: 'baneful-bunker' },
    fallback: () => ({ n: 'Búnker Tóxico', key: 'baneful-bunker', p: 0, cd: 12.6, c: 1, r: 999, u: 0, t: 'poison', cat: 'sta', ef: EFX['baneful-bunker'], acc: 0, cu: 'baneful-bunker' }),

    visual(m, tg, p, antes) {
        if (!m.prot || m.prot === antes) return;    // no se activó (p. ej. por usarlo seguido)
        const gy = m.y + 12;
        ents.push({
            k: 'u', cu: 'baneful-bunker', o: m, tg, t: 0, life: 1, pr: m.prot,
            spines: Array.from({ length: 11 }, (_, i) => ({ a: (12 + i * 15.6) * PI / 180, L: 0, ph: R(0, 6.28), k: R(.85, 1.15) })),
            orbs: Array.from({ length: 9 }, () => ({ x: R(-70, 70), y: R(-10, -110), s: R(3, 7), v: R(15, 40), ph: R(0, 6.28) })),
            rays: Array.from({ length: 13 }, (_, i) => ({ a: (i / 12) * PI + R(-.06, .06), L: R(120, 210), w: R(.05, .1), ph: R(0, 6.28) }))
        });
        ring(m.x, gy, '#c026d3', 90, .6, 6); ring(m.x, gy, '#f0abfc', 55, .4, 4);
        for (let i = 0; i < 26 && ps.length < 900; i++) {   // puas tóxicas que salen disparadas hacia arriba
            const a = R(-2.6, -.55), v = R(120, 300);
            ps.push({ x: m.x + R(-30, 30), y: gy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, gy: 380, l: R(.4, .8), m: .8, c: ['#a855f7', '#e879f9', '#fff', '#c4b5fd'][i % 4], s: R(2, 5), g: 1, sh: 'd', r: a });
        }
    },

    eup(e, dt) {
        e.t += dt;
        const o = e.o;
        e.life = (!o.dead && o.prot && o.prot === e.pr) ? 1 : 0;      // vive mientras dure la protección
        if (!e.life) return;
        // Las púas brotan una detrás de otra (las del centro, primero y más largas)
        for (const s of e.spines) {
            const c = Math.abs(s.a - PI / 2) / (PI / 2), delay = c * .12, k = Math.max(0, Math.min(1, (e.t - delay) / .16));
            s.L = (64 - 26 * c) * s.k * (1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2) * (k > 0 ? 1 : 0);   // salen con rebote
        }
        // Burbujas de veneno que suben
        for (const b of e.orbs) { b.y -= b.v * dt; if (b.y < -130) { b.y = R(-5, 10); b.x = R(-70, 70) } }
        // Chispas del escudo mientras está activo
        if (Math.random() < .5 && ps.length < 880) {
            const a = R(-2.8, -.35);
            ps.push({ x: o.x + Math.cos(a) * 60, y: o.y + 12 + Math.sin(a) * 84, vx: R(-20, 20), vy: R(-60, -20), l: .5, m: .5, c: Math.random() < .5 ? '#e879f9' : '#a855f7', s: R(2, 4), g: 1 });
        }
    },


    edraw(e) {
        const o = e.o;
        if (!o || !o.prot || o.prot !== e.pr) return;

        const T0 = T, x = o.x, gy = o.y + 12 - (o.z || 0);
        const ent = Math.min(1, e.t / .22);
        const sc = Math.max(0, 1 + 2.7 * (ent - 1) ** 3 + 1.7 * (ent - 1) ** 2);
        const fade = Math.min(1, o.prot.l / .3) * Math.min(1, e.t / .06);

        const golpe = Math.max(0, 1 - (T0 - (o.pbT == null ? -9 : o.pbT)) / .4);
        const tox = Math.max(0, 1 - (T0 - (o.pxT == null ? -9 : o.pxT)) / .6);
        const ang = o.pbA || 0;

        const rx = 66 * sc, ry = 84 * sc;
        if (rx < 2 || fade <= 0) return;

        const glow = (x, y, r, stops) => {
            const g = cx.createRadialGradient(x, y, 1, x, y, r);
            stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
            cx.fillStyle = g;
            cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill();
        };

        cx.save();
        cx.translate(x, gy);
        cx.lineJoin = 'round';
        cx.lineCap = 'round';

        // ==================================================
        // 1. CHARCO DE ENERGÍA TÓXICA
        // ==================================================
        cx.globalCompositeOperation = 'source-over';

        let g = cx.createRadialGradient(0, 0, 2, 0, 0, rx * 1.5);
        const pulse = .8 + .2 * Math.sin(T0 * 5);

        g.addColorStop(0, `rgba(192,38,211,${.35 * fade * pulse})`);
        g.addColorStop(.45, `rgba(147,51,234,${.25 * fade})`);
        g.addColorStop(1, 'rgba(88,28,135,0)');

        cx.save();
        cx.scale(1, .28);
        cx.fillStyle = g;
        cx.beginPath();
        cx.arc(0, 0, rx * 1.5, 0, 7);
        cx.fill();
        cx.restore();

        // Anillo de energía en el suelo.
        cx.strokeStyle = `rgba(232,121,249,${.55 * fade})`;
        cx.lineWidth = 2;
        cx.beginPath();
        cx.ellipse(0, 0, rx * 1.05, ry * .19, 0, 0, Math.PI * 2);
        cx.stroke();

        // ==================================================
        // 2. RAYOS DE ENERGÍA DEL FONDO
        // ==================================================
        cx.save();
        cx.globalCompositeOperation = 'lighter';

        for (const r of e.rays) {
            const grow = Math.min(1, Math.max(0, (e.t - .04) / .22));
            const L = r.L * grow * (.9 + .1 * Math.sin(T0 * 5 + r.ph));
            const a = -r.a;
            const ca = Math.cos(a), sa = Math.sin(a);
            const nx = -sa, ny = ca;
            const w = L * r.w;

            g = cx.createLinearGradient(0, -15, ca * L, -15 + sa * L);
            g.addColorStop(0, `rgba(192,38,211,${.4 * fade})`);
            g.addColorStop(.5, `rgba(168,85,247,${.2 * fade})`);
            g.addColorStop(1, 'rgba(126,34,206,0)');

            cx.fillStyle = g;
            cx.beginPath();
            cx.moveTo(nx * 2, -15 + ny * 2);
            cx.lineTo(ca * L + nx * w, -15 + sa * L + ny * w);
            cx.lineTo(ca * L - nx * w, -15 + sa * L - ny * w);
            cx.lineTo(-nx * 2, -15 - ny * 2);
            cx.closePath();
            cx.fill();
        }
        cx.restore();

        // ==================================================
        // 3. PÚAS CRISTALINAS
        // ==================================================
        const spines = [...e.spines].sort(
            (a, b) => Math.abs(b.a - PI / 2) - Math.abs(a.a - PI / 2)
        );

        for (const s of spines) {
            if (s.L < 1) continue;

            const sway = Math.sin(T0 * 2.5 + s.ph) * .025;
            const aa = s.a + sway;
            const L = s.L * (1 + golpe * .12);

            const px = Math.cos(aa) * rx * .91;
            const py = -Math.sin(aa) * ry * .84;

            const dx = Math.cos(aa);
            const dy = -Math.sin(aa) * 1.15;
            const dl = Math.hypot(dx, dy);
            const ux = dx / dl, uy = dy / dl;
            const nx = -uy, ny = ux;

            const w = Math.max(2, L * .17);
            const bend = (aa < PI / 2 ? 1 : -1) * L * .22;

            const tx = px + ux * L + nx * bend;
            const ty = py + uy * L + ny * bend;

            // Sombra de la púa.
            cx.fillStyle = `rgba(46,16,101,${.65 * fade})`;
            cx.beginPath();
            cx.moveTo(px - nx * w * 1.3 + 3, py - ny * w * 1.3 + 3);
            cx.quadraticCurveTo(
                px + ux * L * .5 + nx * bend * .3 + 3,
                py + uy * L * .5 + ny * bend * .3 + 3,
                tx + 3, ty + 3
            );
            cx.lineTo(px + nx * w * 1.3 + 3, py + ny * w * 1.3 + 3);
            cx.closePath();
            cx.fill();

            // Cuerpo de cristal.
            g = cx.createLinearGradient(px, py, tx, ty);
            g.addColorStop(0, `rgba(88,28,135,${fade})`);
            g.addColorStop(.35, `rgba(126,34,206,${fade})`);
            g.addColorStop(.72, `rgba(216,180,254,${fade})`);
            g.addColorStop(1, `rgba(250,245,255,${fade})`);

            cx.fillStyle = g;
            cx.strokeStyle = `rgba(76,29,149,${.9 * fade})`;
            cx.lineWidth = 1.4;

            cx.beginPath();
            cx.moveTo(px - nx * w, py - ny * w);
            cx.quadraticCurveTo(
                px + ux * L * .55 - nx * w * .55 + nx * bend * .35,
                py + uy * L * .55 - ny * w * .55 + ny * bend * .35,
                tx, ty
            );
            cx.quadraticCurveTo(
                px + ux * L * .55 + nx * w * .55 + nx * bend * .35,
                py + uy * L * .55 + ny * w * .55 + ny * bend * .35,
                px + nx * w, py + ny * w
            );
            cx.closePath();
            cx.fill();
            cx.stroke();

            // Reflejo de cada púa.
            cx.strokeStyle = `rgba(255,255,255,${.75 * fade})`;
            cx.lineWidth = 1.2;
            cx.beginPath();
            cx.moveTo(px, py);
            cx.lineTo(px + ux * L * .7 + nx * bend * .5, py + uy * L * .7 + ny * bend * .5);
            cx.stroke();
        }

        // ==================================================
        // 4. CÚPULA DE CRISTAL VIOLETA
        // ==================================================
        cx.globalCompositeOperation = 'source-over';

        // Sombra interior.
        g = cx.createRadialGradient(0, -ry * .3, rx * .1, 0, -ry * .3, rx * 1.3);
        g.addColorStop(0, `rgba(76,29,149,${.12 * fade})`);
        g.addColorStop(.65, `rgba(147,51,234,${.22 * fade})`);
        g.addColorStop(1, `rgba(192,38,211,${.35 * fade})`);

        cx.fillStyle = g;
        cx.beginPath();
        cx.ellipse(0, 0, rx, ry, 0, PI, 0);
        cx.closePath();
        cx.fill();

        // Brillo interior.
        g = cx.createLinearGradient(-rx, -ry, rx, ry);
        g.addColorStop(0, `rgba(255,255,255,${.08 * fade})`);
        g.addColorStop(.35, `rgba(216,180,254,${.17 * fade})`);
        g.addColorStop(.65, `rgba(147,51,234,${.08 * fade})`);
        g.addColorStop(1, `rgba(76,29,149,${.3 * fade})`);

        cx.fillStyle = g;
        cx.beginPath();
        cx.ellipse(0, 0, rx * .94, ry * .94, 0, PI, 0);
        cx.closePath();
        cx.fill();

        // Contorno exterior.
        cx.strokeStyle = `rgba(76,29,149,${.9 * fade})`;
        cx.lineWidth = 6;
        cx.beginPath();
        cx.ellipse(0, 0, rx, ry, 0, PI, 0);
        cx.stroke();

        // Borde luminoso.
        cx.strokeStyle = `rgba(232,121,249,${.95 * fade})`;
        cx.lineWidth = 3;
        cx.beginPath();
        cx.ellipse(0, 0, rx, ry, 0, PI, 0);
        cx.stroke();

        // Reflejo principal del cristal.
        cx.strokeStyle = `rgba(255,255,255,${.55 * fade})`;
        cx.lineWidth = 2.5;
        cx.beginPath();
        cx.ellipse(-rx * .12, -ry * .05, rx * .82, ry * .86, 0, PI * 1.12, PI * 1.48);
        cx.stroke();

        // Segundo reflejo.
        cx.strokeStyle = `rgba(216,180,254,${.65 * fade})`;
        cx.lineWidth = 1.5;
        cx.beginPath();
        cx.ellipse(rx * .12, -ry * .04, rx * .82, ry * .86, 0, PI * 1.55, PI * 1.85);
        cx.stroke();

        // Brillos puntuales.
        glow(-rx * .55, -ry * .58, 5, [
            `rgba(255,255,255,${.75 * fade})`,
            'rgba(255,255,255,0)'
        ]);

        // ==================================================
        // 5. REACCIÓN AL GOLPE BLOQUEADO
        // ==================================================
        if (golpe > 0) {
            const hx = Math.cos(ang) * rx * .86;
            const hy = Math.min(-ry * .15, Math.sin(ang) * ry * .8 - ry * .35);

            // Destello localizado en el punto de impacto.
            glow(hx, hy, rx * .55, [
                `rgba(255,255,255,${.9 * golpe * fade})`,
                `rgba(232,121,249,${.65 * golpe * fade})`,
                'rgba(168,85,247,0)'
            ]);

            // Ondas de choque sobre el cristal.
            cx.globalCompositeOperation = 'lighter';
            cx.strokeStyle = `rgba(255,255,255,${.85 * golpe * fade})`;
            cx.lineWidth = 2.5 * golpe;
            cx.beginPath();
            cx.arc(hx, hy, 8 + golpe * 14, 0, 7);
            cx.stroke();

            cx.strokeStyle = `rgba(232,121,249,${.8 * golpe * fade})`;
            cx.lineWidth = 3 * golpe;
            cx.beginPath();
            cx.arc(hx, hy, 15 + golpe * 19, 0, 7);
            cx.stroke();

            cx.globalCompositeOperation = 'source-over';
        }

        // ==================================================
        // 6. EFECTO DE ENVENENAMIENTO
        // ==================================================
        if (tox > 0) {
            cx.globalCompositeOperation = 'lighter';

            // Pulso verde tóxico en la base.
            const pulse = 1 + Math.sin(T0 * 16) * .1;

            glow(0, 0, rx * .55 * pulse, [
                `rgba(190,242,100,${.55 * tox * fade})`,
                `rgba(132,204,22,${.3 * tox * fade})`,
                'rgba(132,204,22,0)'
            ]);

            // Anillo venenoso.
            cx.strokeStyle = `rgba(190,242,100,${tox * fade})`;
            cx.lineWidth = 3 * tox + 1;
            cx.beginPath();
            cx.ellipse(0, 0, rx * (1 + (1 - tox) * .65), ry * .2 * (1 + (1 - tox) * .65), 0, 0, 7);
            cx.stroke();

            cx.globalCompositeOperation = 'source-over';
        }

        // ==================================================
        // 7. BURBUJAS DE VENENO
        // ==================================================
        for (const b of e.orbs) {
            const bx = b.x + Math.sin(T0 * 2 + b.ph) * 5;
            const by = b.y;
            const r = b.s * (.85 + .15 * Math.sin(T0 * 5 + b.ph));
            const al = Math.max(0, 1 - Math.abs(by + 60) / 90) * fade;

            if (al <= 0) continue;

            // Contorno translúcido.
            cx.fillStyle = `rgba(147,51,234,${al * .3})`;
            cx.strokeStyle = `rgba(216,180,254,${al * .8})`;
            cx.lineWidth = 1.3;

            cx.beginPath();
            cx.arc(bx, by, r, 0, 7);
            cx.fill();
            cx.stroke();

            // Reflejo de la burbuja.
            glow(bx - r * .35, by - r * .35, r * .4, [
                `rgba(255,255,255,${al * .9})`,
                'rgba(255,255,255,0)'
            ]);
        }

        cx.restore();
    }
}