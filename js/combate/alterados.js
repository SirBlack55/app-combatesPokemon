// Estados alterados: quemadura, parálisis, veneno, sueño, congelación (uno a la vez, "mayores")
// y los volátiles (varios a la vez): confusión, drenadoras, atrapado, enamorado, provocado, pantallas, sustituto...
// Guardado en el luchador: m.ail = {k, l (s que quedan), t, n}  ·  m.vol = {clave:{l, t, by, ...}}
// En combate en tiempo real todo dura segundos (no turnos). Ajusta los números aquí.
const EST={
 brn:{n:'Quemado',c:'#f97316',tag:'QUE',l:20,dot:.015},        // 1,5 % de PS por segundo · ataque x0,5
 par:{n:'Paralizado',c:'#facc15',tag:'PAR',l:20},               // velocidad x0,5 · 25 % de no poder atacar
 psn:{n:'Envenenado',c:'#a855f7',tag:'VEN',l:20,dot:.02},       // 2 % de PS por segundo
 tox:{n:'Muy envenenado',c:'#7e22ce',tag:'TOX',l:20},           // empieza flojo y sube (ver TOX_*)
 slp:{n:'Dormido',c:'#94a3b8',tag:'DOR',l:4},                   // no hace nada
 frz:{n:'Congelado',c:'#7dd3fc',tag:'CON',l:3},                 // no hace nada · un ataque de fuego lo descongela
};
// fijo:1 = duración exacta (sin azar) · dot = % de PS por segundo · heal = % de PS curado por segundo
const VOL={
 cnf:{n:'Confuso',c:'#f472b6',tag:'CNF',l:4},                   // 33 % de golpearse a sí mismo al atacar
 seed:{n:'Drenadoras',c:'#4ade80',tag:'DRE',l:10,dot:.04},      // 4 % de PS por segundo que cura al que las puso
 trap:{n:'Atrapado',c:'#fb923c',tag:'ATR',l:5,dot:.03},         // 3 % de PS por segundo y velocidad x0,6
 net:{n:'Sin escape',c:'#94a3b8',tag:'ESC',l:8},                // velocidad x0,6
 yawn:{n:'Con sueño',c:'#cbd5e1',tag:'SUE',l:3},                // al acabar se queda dormido
 inf:{n:'Enamorado',c:'#fb7185',tag:'ENA',l:5},                 // 50 % de no atacar
 nmare:{n:'Pesadilla',c:'#6d28d9',tag:'PES',l:10,dot:.05},      // 5 % de PS por segundo, solo mientras duerme
 torment:{n:'Atormentado',c:'#a3a3a3',tag:'TOR',l:6},           // no repite ataque
 disable:{n:'Anulado',c:'#a3a3a3',tag:'ANU',l:5},               // un ataque inutilizado
 taunt:{n:'Provocado',c:'#f87171',tag:'PRO',l:4},               // sin ataques de estado
 encore:{n:'Otra vez',c:'#e879f9',tag:'REP',l:3},               // repite su último ataque
 hblock:{n:'Cura bloqueada',c:'#fda4af',tag:'BLQ',l:5},
 perish:{n:'Canto Mortal',c:'#9ca3af',tag:'MUE',l:6,fijo:1},    // se debilita al acabar
 regen:{n:'Raíces',c:'#4ade80',tag:'RAI',l:20,heal:.03},
 safe:{n:'Velo Sagrado',c:'#bae6fd',tag:'VEL',l:10},            // no recibe estados alterados
 mist:{n:'Neblina',c:'#e0f2fe',tag:'NEB',l:8},                  // no le bajan las estadísticas
 lucky:{n:'Amuleto',c:'#fde68a',tag:'AMU',l:8},                 // sin golpes críticos
 mcoat:{n:'Capa Mágica',c:'#f0abfc',tag:'CAP',l:2.5,fijo:1},    // rebota un ataque de estado
 dbond:{n:'Vínculo',c:'#818cf8',tag:'VIN',l:3,fijo:1},
 wish:{n:'Deseo',c:'#fde047',tag:'DES',l:3,fijo:1},             // cura 50 % al acabar
 reflect:{n:'Reflejo',c:'#f9a8d4',tag:'REF',l:10},              // daño físico x0,6
 lscreen:{n:'Pantalla Luz',c:'#fcd34d',tag:'PAN',l:10},         // daño especial x0,6
 aveil:{n:'Velo Aurora',c:'#a5f3fc',tag:'AUR',l:10},            // todo el daño x0,6
 tail:{n:'Viento Afín',c:'#bae6fd',tag:'VIE',l:8},              // velocidad x2
 levit:{n:'Levitando',c:'#a5b4fc',tag:'LEV',l:5},                // inmune a Tierra
 octo:{n:'Octobrazo',c:'#f472b6',tag:'OCT',l:8,tick:{def:-1,spd:-1}},   // velocidad x0,6 y baja Def y Def. Esp. cada segundo
 ident:{n:'Identificado',c:'#fde68a',tag:'IDE',l:20},            // pierde las inmunidades de tipo
 sil:{n:'Silenciado',c:'#94a3b8',tag:'SIL',l:3},                 // sin ataques de sonido
 furia:{n:'Furia',c:'#f97316',tag:'FUR',l:12,fijo:1},            // repite su ataque (Atropello, Pataleta...)
 curse:{n:'Maldito',c:'#6b21a8',tag:'MAL',l:12,dot:.06},     // 6 % de PS por segundo (Maldición de un Fantasma)
 focus:{n:'Concentrado',c:'#fb923c',tag:'FOC',l:20},            // críticos 33 %
 sub:{n:'Sustituto',c:'#fbbf24',tag:'SUS',l:60,fijo:1},         // m.vol.sub.hp = vida del señuelo
};
const TOX_SUBE=.004,TOX_TOPE=.035;
// Tipos inmunes a cada estado
const INMUNE={brn:['fire'],par:['elec'],psn:['poison','steel'],tox:['poison','steel'],frz:['ice'],seed:['leaf'],trap:['ghost']};

// Multiplicador de una estadística por estados, viento, Sala Trampa y clima
function estMul(m,k){
 let f=1;
 if(m.ail){if(m.ail.k=='brn'&&k=='atk')f*=.5;if(m.ail.k=='par'&&k=='spe')f*=.5}
 if(k=='spe'){if(m.vol&&m.vol.tail)f*=2;if(salaK('trick'))f*=10000/(m.st.spe*m.st.spe)}
 const cl=campo.cl&&campo.cl.k;
 if(k=='spd'&&cl=='sand'&&m.types.includes('rock'))f*=1.5;
 if(k=='def'&&cl=='hail'&&m.types.includes('ice'))f*=1.5;
  return f*ganchoMul('statMul',m,k)*statGlobal(m,k);   // habilidades y objetos (Poder Puro, Agallas, Nado Rápido...)
}

function puedeEst(m,k,por){
 if(!m||m.dead)return false;
 if(gancho('sinEstado',m,k,por))return false;   // Flexibilidad, Insomnio, Inmunidad...
 const mayor=!!EST[k];
 if(mayor){if(m.ail)return false}else if(m.vol&&m.vol[k])return false;
 if(INMUNE[k]&&m.types.some(t=>INMUNE[k].includes(t)))return false;
 if(k=='nmare'&&!(m.ail&&m.ail.k=='slp'))return false;
 if(k=='disable'&&(m.pi==null||!m.mv||!m.mv[m.pi]))return false;
 const ajeno=por&&por!==m,te=campo.te&&campo.te.k;
 if(ajeno&&(mayor||k=='cnf')){
  if(m.vol&&m.vol.safe)return false;
  if(te=='mist')return false;
  if(te=='elec'&&(k=='slp'))return false;
 }
 if(te=='elec'&&k=='yawn')return false;
 return true;
}
// Pone un estado. por = quien lo provoca. aviso = mostrar "No afecta" si falla. Devuelve true si se aplicó.
function aplicarEst(m,k,por,aviso){
 const E=EST[k]||VOL[k];
 if(!puedeEst(m,k,por)){if(aviso)txt.push({x:m.x,y:m.y-56,s:'No afecta',c:'#e2e8f0',l:1.1,sm:1});return false}
 const l=(E.fijo?E.l:E.l*RS(.75,1.25))*ganchoMul('durEst',m,k);   // Madrugar
 if(EST[k]){m.ail={k,l,t:0,n:0};if(k=='slp'||k=='frz'){m.plan=null;m.lw=0;m.lunge=0}}
 else{(m.vol=m.vol||{})[k]={l,t:0,by:por};if(k=='disable')m.vol[k].i=m.pi}
 txt.push({x:m.x,y:m.y-56,s:'¡'+E.n+'!',c:E.c,l:1.4,sm:1});ring(m.x,m.y,E.c,45,.6);burst(m.x,m.y-10,E.c,10,110,true);
 if(por&&por!==m)gancho('alEstado',m,k,por);   // Sincronía
 return true;
}
function dotDano(m,f,c){
 if(gancho('sinIndirecto',m))return 0;   // Muro Mágico
 const d=Math.max(1,Math.round(m.max*f));m.hp-=d;
 txt.push({x:m.x+R(-8,8),y:m.y-34,s:'-'+d,c,l:.7,sm:1});burst(m.x,m.y-10,c,3,60,true);
 if(m.hp<=0)debilitar(m,null);
 return d;
}
const curaPS=(m,f,c)=>{const r=Math.min(Math.round(m.max*f),m.max-m.hp);if(r>0){m.hp+=r;txt.push({x:m.x,y:m.y-40,s:'+'+r,c:c||'#4ade80',l:.8,sm:1})}return r};
// Cada paso de simulación (lo llama upM)
function tickEst(m,dt){
 if(m.prot&&(m.prot.l-=dt)<=0)m.prot=null;
 const a=m.ail;
 if(a){const E=EST[a.k];a.l-=dt;a.t+=dt;
  if(a.t>=1){a.t-=1;a.n++;
   if((a.k=='psn'||a.k=='tox')&&gancho('sinDotVeneno',m)){}else if(a.k=='tox')dotDano(m,Math.min(TOX_TOPE,TOX_SUBE*a.n),E.c);else if(E.dot)dotDano(m,E.dot,E.c)}
  if(!m.dead&&a.l<=0){m.ail=null;txt.push({x:m.x,y:m.y-56,s:a.k=='slp'?'¡Despertó!':a.k=='frz'?'¡Se descongeló!':'¡Se recuperó!',c:'#bbf7d0',l:1.2,sm:1})}
 }
 if(m.dead||!m.vol)return;
 for(const k of Object.keys(m.vol)){
  const s=m.vol[k],V=VOL[k];s.l-=dt;s.t+=dt;
  if(s.t>=1&&(V.dot||V.heal||V.tick)){s.t-=1;
   if(V.tick)stg(m,V.tick);
   if(V.dot&&(k!='nmare'||(m.ail&&m.ail.k=='slp'))){const d=dotDano(m,V.dot,V.c);
    if(k=='seed'&&s.by&&!s.by.dead&&d>0){if(gancho('drenajeToxico',m))dotDano(s.by,d/s.by.max,'#a3e635');else curaPS(s.by,d/s.by.max)}}
   if(m.dead)return;
   if(V.heal&&!m.vol.hblock)curaPS(m,V.heal);
  }
  if(m.dead)return;
  if(s.l<=0){delete m.vol[k];
   if(k=='yawn')aplicarEst(m,'slp',s.by);
   else if(k=='perish')debilitar(m,null);
   else if(k=='wish'&&!m.vol.hblock)curaPS(m,.5,'#fde047');
   if(m.dead)return}
 }
}
// ¿Falla el ataque por parálisis, confusión o enamoramiento? (lo llama atk tras gastar el enfriamiento)
function fallaEst(m){
 if(m.ail&&m.ail.k=='par'&&rnd()<.25){txt.push({x:m.x,y:m.y-56,s:'¡Paralizado! No puede moverse',c:'#facc15',l:1.2,sm:1});m.freeze=.5;m.plan=null;return true}
 if(m.vol&&m.vol.inf&&rnd()<.5){txt.push({x:m.x,y:m.y-56,s:'¡Está enamorado!',c:'#fb7185',l:1.2,sm:1});m.freeze=.5;m.plan=null;return true}
 if(m.vol&&m.vol.cnf&&rnd()<.33){txt.push({x:m.x,y:m.y-56,s:'¡Se hirió en su confusión!',c:'#f472b6',l:1.2,sm:1});dotDano(m,.06,'#f472b6');m.flash=.18;m.freeze=.5;m.plan=null;return true}
 return false;
}
function descongelar(tg,t){
 if(tg.ail&&tg.ail.k=='frz'&&t=='fire'){tg.ail=null;txt.push({x:tg.x,y:tg.y-56,s:'¡Se descongeló!',c:'#fde68a',l:1.2,sm:1})}
}
function amedrentar(tg){
 if(tg.dead||tg.sc||tg.lunge>0||gancho('sinAmedrentar',tg))return;   // Foco Interno
 tg.freeze=Math.max(tg.freeze||0,.6);tg.plan=null;tg.lw=0;
 txt.push({x:tg.x,y:tg.y-56,s:'¡Retrocede!',c:'#e2e8f0',l:1,sm:1});
 gancho('alAmedrentar',tg);   // Impasible
}
// Efectos secundarios de un ataque con daño (s = mv.sec, d = daño hecho, primero = golpe principal del ataque)
function secundarios(s,o,tg,d,primero){
 if(s.dr&&!o.dead){
  if(s.dr>0){if(gancho('drenajeToxico',tg))dotDano(o,d*s.dr/100/o.max,'#a3e635');else curaPS(o,d*s.dr/100/o.max)}   // Viscosidad Lodosa invierte el drenaje
  else if(!gancho('sinRetroceso',o)){dotDano(o,Math.max(1,Math.round(d*-s.dr/100))/o.max,'#f87171');txt.push({x:o.x,y:o.y-56,s:'¡Retroceso!',c:'#f87171',l:1,sm:1})}
 }
 if(!primero)return;
 if(s.x)switch(s.x){   // efectos extra por nombre (SEC_X)
  case'spin':campo.haz[o.side]={};if(o.vol){delete o.vol.trap;delete o.vol.seed}break;
  case'rompe':if(tg.vol){delete tg.vol.reflect;delete tg.vol.lscreen;delete tg.vol.aveil}break;
  case'smog':for(const q in tg.stg)tg.stg[q]=0;break;
  case'baja':if(tg.vol)delete tg.vol.levit;break;
  case'cura':if(tg.ail&&tg.ail.k=='brn')tg.ail=null;break;
  case'terreno':campo.te=null;break;
 }
 if(s.ss&&rnd()*100<s.ps&&!o.dead)stg(o,s.ss);
 if(tg.hp<=0||tg.dead){if(s.sw=='yo'&&!o.dead)forzarCambio(o);return}
 if(s.a&&rnd()*100<s.pa)aplicarEst(tg,s.a,o);
 if(s.f&&rnd()*100<s.f)amedrentar(tg);
 if(s.so&&rnd()*100<s.ps)stg(tg,s.so,true);
 if(s.sw=='rival')forzarCambio(tg);else if(s.sw=='yo'&&!o.dead)forzarCambio(o);
}
// Etiquetas pequeñas junto a la barra de vida (dibujo.js) y en el panel de cada equipo (hud.js)
function etiquetas(m,y){
 if(m.prot&&!m.prot.vis){   // barrera sin animación propia: burbuja sencilla mientras dure
  cx.save();cx.globalAlpha=.35+.15*Math.sin(T*18);cx.strokeStyle=cx.fillStyle=(typeof PROT_COL!=='undefined'&&PROT_COL[m.prot.k])||'#93c5fd';cx.lineWidth=3;
  cx.beginPath();cx.ellipse(m.x,m.y-28,34,38,0,0,7);cx.stroke();cx.globalAlpha*=.25;cx.fill();cx.restore();
 }
 const l=[];if(m.ail)l.push(EST[m.ail.k]);for(const k in m.vol||{})l.push(VOL[k]);
 let x=m.x+24;cx.font='bold 8px system-ui';cx.textAlign='center';
 for(const E of l){cx.fillStyle=E.c;cx.fillRect(x,y-1,22,9);cx.fillStyle='#0f172a';cx.fillText(E.tag,x+11,y+6.5);x+=24}
}
function estadoHud(m){
 const l=[];if(m.ail)l.push(EST[m.ail.k]);for(const k in m.vol||{})l.push(VOL[k]);
 return l.map(E=>`<span class="ch" style="background:${E.c};color:#0f172a">${E.n}</span>`).join('');
}