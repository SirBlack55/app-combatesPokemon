// ATAQUES que ya se pueden hacer gracias a los cambios de Pokémon, los objetos y las habilidades. Va DESPUÉS de habilidades-sueltas.js.
//  Llaman a otro ataque: Metrónomo, Ayuda, Adaptación, Yo Primero, Sonámbulo (este, mientras duerme).
//  Banquillo: Autotomía (deja un sustituto al que entra), Deseo Cura y Danza Lunar (el que entra sale curado), Persecución (pega doble al que se retira).
//  Control: Robo, Sellar, Rabia, Polvo Explosivo, Electrificación, Cortina Plasma, Gravedad, Cerrojo Feérico, Conversión 2.
//  Protección propia: Anticipo (para los de prioridad), Truco Defensa (para los de estado), Escudo Tatami (solo nada más entrar).
//  Daño: Llama Fusión / Rayo Fusión (doble si el otro se usó justo antes), Furia (sube Ataque al recibir golpes), Canon,
//        y los que se estrellan si fallan (Patada Salto Alta, Patada Salto, Plancha Voltaica, Patada Hacha).
// Siguen sin hacer nada a propósito: Salpicadura, Celebración, Manos Juntas, Paga Extra · los de 2 contra 2 (Refuerzo, Señuelo, Polvo Ira,
//  Foco, Cede Paso, Cambio de Banda, Mandato, Último Lugar, Motivación, Decoración, Niebla Aromática, Vasta Guardia) · Maxibarrera (con Dinamax).
const REST_CFG={electrif:3,cortina:5,gravedad:15,cerrojo:5,sellar:15,robo:3,polvo:3,ira:4,fusion:2.5,tatami:2.5,choque:.5};
const avisoA=(m,s,c)=>txt.push({x:m.x,y:m.y-56,s,c:c||'#fde68a',l:1.3,sm:1});
Object.assign(VOL,{
 robo:{n:'Robo',c:'#a3e635',tag:'ROB',l:REST_CFG.robo},sellar:{n:'Sellado',c:'#94a3b8',tag:'SEL',l:REST_CFG.sellar},
 rabia:{n:'Rabia',c:'#f87171',tag:'RAB',l:8},polvo:{n:'Polvo Explosivo',c:'#fb923c',tag:'POL',l:REST_CFG.polvo},
 electrif:{n:'Electrificado',c:'#facc15',tag:'ELE',l:REST_CFG.electrif},ira:{n:'Furia',c:'#f97316',tag:'IRA',l:REST_CFG.ira},
 qg:{n:'Anticipo',c:'#93c5fd',tag:'ANT',l:1.5},cs:{n:'Truco Defensa',c:'#c4b5fd',tag:'TRD',l:1.5}});
NOM_CAMPO.gravedad='🪐 Gravedad';NOM_CAMPO.ion='⚡ Cortina Plasma';NOM_CAMPO.cerrojo='🔒 Cerrojo Feérico';
const deseo=[0,0];

// ---- Entradas en EFX (ex = efecto de este archivo · ll = llama a otro ataque) ----
X('metronome','Usa un ataque cualquiera al azar',{ll:'metronomo'});
X('assist','Usa un ataque al azar de un compañero de equipo',{ll:'ayuda'});
X('nature-power','Usa un ataque según el terreno (Tri Ataque si no hay)',{ll:'naturaleza'});
X('me-first','Copia el ataque que el rival iba a usar, un 50 % más fuerte',{ll:'yoprimero'});
X('sleep-talk','Mientras duerme, usa otro de sus ataques al azar',{ll:'sonambulo'});
X('shed-tail','Gasta la mitad de sus PS: se retira y deja un sustituto al que entra',{ex:'autotomia'});
X('healing-wish','Se debilita; el que entre sale con los PS al máximo y sin estados',{ex:'deseo'});
X('lunar-dance','Se debilita; el que entre sale curado del todo (también la recarga de sus ataques)',{ex:'deseo'});
X('snatch','Durante '+REST_CFG.robo+' s roba el próximo ataque de mejora del rival',{ex:'robo'});
X('imprison','El rival no puede usar los ataques que él también conoce ('+REST_CFG.sellar+' s)',{ex:'sellar',of:1});
X('grudge','Si le debilitan, el ataque que lo hizo queda inservible el resto del combate',{ex:'rabia'});
X('powder','Si el rival usa un ataque de Fuego en '+REST_CFG.polvo+' s, le explota en la cara',{ex:'polvo',of:1});
X('electrify','El próximo ataque del rival pasa a ser Eléctrico',{ex:'electrif',of:1});
X('ion-deluge','Cortina Plasma '+REST_CFG.cortina+' s: los ataques Normal pasan a ser Eléctricos',{ex:'cortina'});
X('gravity','Gravedad '+REST_CFG.gravedad+' s: nadie vuela ni levita, más precisión y sin ataques de salto',{ex:'gravedad'});
X('fairy-lock','Cerrojo Feérico '+REST_CFG.cerrojo+' s: nadie puede cambiar de Pokémon',{ex:'cerrojo'});
X('conversion-2','Pasa a un tipo que resiste el último ataque del rival',{ex:'conv2'});
X('quick-guard','Bloquea los ataques con prioridad 1,5 s',{ex:'rapida'});
X('crafty-shield','Bloquea los ataques de estado del rival 1,5 s',{ex:'truco'});
X('mat-block','Solo nada más entrar: bloquea los ataques con daño 1,5 s',{ex:'tatami'});
X('after-you ally-switch spotlight follow-me rage-powder helping-hand instruct quash coaching decorate aromatic-mist wide-guard','Solo tiene sentido en combates 2 contra 2',{nada:1});
X('max-guard','Solo con Dinamax',{nada:1});
// Ataques con daño: que el conversor sepa que están tratados
const CHOQUE=['high-jump-kick','jump-kick','supercell-slam','axe-kick'];
Object.assign(ESP,{'pursuit':{p:40},'round':{p:60},'rage':{p:20},'fusion-flare':{k:'pot',f:'fusion',p:100},'fusion-bolt':{k:'pot',f:'fusion',p:100}});
for(const k of CHOQUE)ESP[k]=ESP[k]||{p:100};
SEC_X.rage='ira';

// ---- Buscar ataques convertidos (para los que llaman a otro) ----
const NO_LLAMAR=new Set(['metronome','assist','nature-power','me-first','sleep-talk','copycat','mirror-move','struggle','transform','sketch','mimic','protect','detect','endure','counter','mirror-coat','metal-burst','focus-punch','snatch','helping-hand','follow-me','rage-powder','trick','switcheroo','bestow','thief','covet','belch','chatter']);
let cacheMov=null,cacheN=-1;
function todosMovs(){const ks=Object.keys(TY);if(cacheMov&&cacheN===ks.length)return cacheMov;
 const M=new Map();for(const t of ks)for(const raw of TY[t].pool||[]){let v=null;try{v=mkmv(t,raw)}catch(e){}if(v&&v.key&&!M.has(v.key))M.set(v.key,v)}
 cacheMov=[...M.values()];cacheN=ks.length;return cacheMov}
const llamable=v=>v&&v.key&&!NO_LLAMAR.has(v.key)&&!(v.ef&&(v.ef.ll||v.ef.nada))&&!/--/.test(v.key);
const buscaMov=k=>todosMovs().find(v=>v.key===k)||null;
const azar=L=>L.length?L[Math.floor(rnd()*L.length)]:null;
const NATURALEZA={elec:['thunderbolt','Rayo','elec',90],leaf:['energy-ball','Energibola','leaf',90],mist:['moonblast','Fuerza Lunar','fairy',95],psy:['psychic','Psíquico','psychic',90]};
function eligeLlamada(m,p,ll){
 const tg=m.tg;
 if(ll==='metronomo')return azar(todosMovs().filter(llamable));
 if(ll==='ayuda')return azar((team[m.side]||[]).filter(u=>u!==m.u).flatMap(u=>movsDe(u)).filter(llamable));
 if(ll==='naturaleza'){const te=campo.te&&campo.te.k,N=NATURALEZA[te]||['tri-attack','Triataque','normal',80];
  return buscaMov(N[0])||{...p,n:N[1],key:N[0],t:N[2],p:N[3],cat:'spe',ef:null,sty:'orb',r:260,c:1,acc:100,tk:0}}
 if(ll==='yoprimero'){const q=tg&&tg.plan;return q&&q.cat!=='sta'&&llamable(q)&&tg.cd>0?{...q,p:q.p*1.5}:null}
 if(ll==='sonambulo'){if(!(m.ail&&m.ail.k==='slp'))return null;return azar(m.mv.filter(v=>v!==p&&llamable(v)&&!v.dt&&!v.tk))}
 return null;
}

// ---- Al lanzar ----
const FUS={};let choqueT=-1;
const SALTO=['fly','bounce','sky-drop','high-jump-kick','jump-kick','splash','magnet-rise','telekinesis','flying-press','floaty-fall','supercell-slam','axe-kick'];
{const a0=atk;atk=function(m){
 let p=m.plan;if(!p)return a0(m);
 const nada=s=>{m.plan={...p,cat:'sta',ef:{nada:1},cu:null,dt:null,rep:null,tk:0};if(s)avisoA(m,s,'#e2e8f0')};
 const ll=p.ef&&p.ef.ll;
 if(ll){const q=eligeLlamada(m,p,ll);if(!q)nada();else{avisoA(m,p.n+' → '+q.n);m.plan={...q,cd:p.cd}}}
 else if(campo.grav>0&&SALTO.includes(p.key))nada('¡La Gravedad lo impide!');
 else if(m.vol&&m.vol.polvo&&p.t==='fire'&&p.cat!=='sta'){delete m.vol.polvo;dotDano(m,.25,'#fb923c');burst(m.x,m.y,'#fb923c',18,180,true);nada('¡El polvo explota!')}
 else if(p.cat!=='sta'){
  if(m.vol&&m.vol.electrif){delete m.vol.electrif;m.plan={...p,t:'elec',cv:1}}
  else if(campo.ion>0&&p.t==='normal')m.plan={...p,t:'elec',cv:1}}
 p=m.plan;
 const r=a0(m);
 if(p.key==='fusion-flare'||p.key==='fusion-bolt')FUS[p.key]=T;
 if(CHOQUE.includes(p.key)&&m.failT===T)choque(m);
 return r}}
function choque(m){if(m.dead||choqueT===T)return;choqueT=T;avisoA(m,'¡Se estrelló!','#f87171');dotDano(m,REST_CFG.choque,'#f87171')}
// Fusión: doble si el otro de la pareja se lanzó hace poco
{const p0=potEsp;potEsp=function(f,o,t,fx){
 if(f==='fusion'){const k=o.last&&o.last.key,otro=k==='fusion-flare'?'fusion-bolt':'fusion-flare';return FUS[otro]!=null&&T-FUS[otro]<REST_CFG.fusion?200:100}
 return p0(f,o,t,fx)}}
// Golpes: Anticipo, Furia, y estrellarse si el rival se protegió
{const h0=hit;hit=function(tg,dm,t,o,e){
 if(tg&&o&&tg!==o&&tg.vol&&tg.vol.qg&&o.last&&o.last.pr){if(!e||e.f)avisoA(tg,'¡Anticipo!','#93c5fd');o.failT=T;return}
 const hp=tg?tg.hp:0;const r=h0(tg,dm,t,o,e);
 if(tg&&!tg.dead&&tg.vol&&tg.vol.ira&&tg.hp<hp){stg(tg,{atk:1});tg.vol.ira.l=REST_CFG.ira}
 if(o&&o.failT===T&&o.last&&CHOQUE.includes(o.last.key)&&(!e||e.f))choque(o);
 return r}}
{const s0=secundarios;secundarios=function(s,o,tg,d,primero){s0(s,o,tg,d,primero);if(primero&&s&&s.x==='ira'&&!o.dead)aplicarEst(o,'ira',o,true)}}
// Truco Defensa (bloquea estados) · Robo (roba las mejoras propias del rival)
{const s0=stOfensivo;stOfensivo=function(m,tg,ef){if(tg&&tg!==m&&tg.vol&&tg.vol.cs){fallo(tg,'¡Truco Defensa!');return}return s0(m,tg,ef)}}
const mejoraPropia=ef=>!!ef&&(!!(ef.s&&Object.values(ef.s).some(v=>v>0))||!!ef.h||!!ef.sb);
{const a0=applySt;applySt=function(m,tg,p){
 const ef=(p&&p.ef)||{};
 if(mejoraPropia(ef)&&!ef.ex){const r=mons.find(x=>x.side!==m.side&&!x.dead&&x.vol&&x.vol.robo);
  if(r){delete r.vol.robo;avisoA(r,'¡Robo!','#a3e635');return conAtq(r,()=>a0(r,m,p))}}
 a0(m,tg,p);
 if(ef.ex&&EX[ef.ex])EX[ef.ex](m,tg,p)}}
const EX={
 autotomia(m){const c=Math.ceil(m.max/2);if(m.hp<=c||!libres(m.side).length||(campo.cerrojo>0))return fallo(m);
  m.hp-=c;relevo[m.side]={stg:{},sub:{l:60,t:0,hp:Math.round(m.max/4)}};if(!forzarCambio(m))relevo[m.side]=null},
 deseo(m,tg,p){if(!libres(m.side).length)return fallo(m);deseo[m.side]=p.key==='lunar-dance'?2:1;avisoA(m,'¡'+p.n+'!','#f9a8d4');debilitar(m,null)},
 robo(m){aplicarEst(m,'robo',m,true)},
 sellar(m,tg){if(!tg||tg.dead)return fallo(m);if(aplicarEst(tg,'sellar',m,true)&&tg.vol&&tg.vol.sellar)tg.vol.sellar.keys=m.mv.map(v=>v.key)},
 rabia(m){aplicarEst(m,'rabia',m,true)},
 polvo(m,tg){if(tg&&!tg.dead)aplicarEst(tg,'polvo',m,true)},
 electrif(m,tg){if(tg&&!tg.dead)aplicarEst(tg,'electrif',m,true)},
 cortina(m){campo.ion=REST_CFG.cortina;avisoA(m,NOM_CAMPO.ion+'!','#facc15')},
 gravedad(m){if(campo.grav>0)return fallo(m);campo.grav=REST_CFG.gravedad;avisoA(m,NOM_CAMPO.gravedad+'!','#c4b5fd');
  for(const x of mons)if(!x.dead&&x.vol&&x.vol.levit)delete x.vol.levit},
 cerrojo(m){campo.cerrojo=REST_CFG.cerrojo;avisoA(m,NOM_CAMPO.cerrojo+'!','#f9a8d4')},
 conv2(m,tg){const t=tg&&tg.last&&tg.last.t;if(!t)return fallo(m);const L=[...new Set(Object.values(TN))].filter(x=>tEff(t,[x])<1&&!m.types.includes(x));if(!L.length)return fallo(m);
  const n=azar(L);m.types=[n];avisoA(m,'¡Ahora es de tipo '+NT[n]+'!')},
 rapida(m){aplicarEst(m,'qg',m,true)},
 truco(m){aplicarEst(m,'cs',m,true)},
 tatami(m){if(T-(m.entT||0)>REST_CFG.tatami)return fallo(m);protege(m,'protect')},
};
// Pesos de la IA
const EX_PESO={
 autotomia:m=>m.hp>m.max*.6&&libres(m.side).length&&!(campo.cerrojo>0)?.5:0,
 deseo:m=>m.hp<m.max*.25&&libres(m.side).some(u=>u.vida&&u.vida.hp<MH(u.t)*.5)?1:0,
 robo:()=>.2,sellar:(m,o)=>o&&!(o.vol&&o.vol.sellar)&&o.mv.some(v=>m.mv.some(w=>w.key===v.key))?.6:0,
 rabia:m=>m.hp<m.max*.3?.6:0,polvo:(m,o)=>o&&o.mv.some(v=>v.t==='fire'&&v.cat!=='sta')&&!(o.vol&&o.vol.polvo)?.8:0,
 electrif:(m,o)=>o&&o.types.includes('ground')?0:.2,cortina:()=>.1,
 gravedad:(m,o)=>!(campo.grav>0)&&o&&(o.types.includes('flying')||o.hab==='levitate')&&m.mv.some(v=>v.t==='ground'&&v.cat!=='sta')?1.2:0,
 cerrojo:()=>.1,conv2:(m,o)=>o&&o.last&&o.last.cat!=='sta'?.4:0,
 rapida:(m,o)=>o&&o.mv.some(v=>v.pr)?.3:0,truco:(m,o)=>o&&o.mv.some(v=>v.cat==='sta')?.3:0,
 tatami:m=>T-(m.entT||0)<REST_CFG.tatami?.6:0,
};
{const w0=wtEfx;wtEfx=function(m,e,o){if(e.ex)return EX_PESO[e.ex]?EX_PESO[e.ex](m,o):0;if(e.ll)return e.ll==='sonambulo'?0:e.ll==='yoprimero'?(o&&o.plan&&o.plan.cat!=='sta'?.6:0):.6;return w0(m,e,o)}}
// Sellar: la IA y el jugador no pueden usar los ataques sellados
{const w0=wt;wt=function(m,v,i){const S=m.vol&&m.vol.sellar;if(S&&S.keys&&S.keys.includes(v.key))return 0;return w0(m,v,i)}}
// (en manual.js: el jugador tampoco puede usar los sellados)

// ---- Sonámbulo: mientras duerme, lo usa solo (la IA) ----
{const u0=upM;upM=function(m,dt){u0(m,dt);
 if(m.dead||m.ctrl==='jugador'||!(m.ail&&m.ail.k==='slp')||m.cd>0||m.lw>0||m.lunge>0)return;
 const i=m.mv.findIndex(v=>v.key==='sleep-talk');if(i<0||m.mc[i]>0)return;
 if(!m.tg||m.tg.dead)m.tg=rivalDe(m);if(!m.tg)return;
 m.pi=i;m.plan=m.mv[i];atk(m)}}
// ---- Persecución: golpe doble al que se retira por su cuenta ----
{const c0=cambiarA;cambiarA=function(m,u){
 if(puedeCambiar(m)===true)for(const r of mons){
  if(r.side===m.side||r.dead||r.enter>0||r.lw>0||r.lunge>0||r.sc||r.cd>0||(r.ail&&(r.ail.k==='slp'||r.ail.k==='frz')))continue;
  const i=r.mv.findIndex(v=>v.key==='pursuit');if(i<0||r.mc[i]>0)continue;
  const v=r.mv[i];r.mc[i]=v.cd;r.cd=1;r.last=v;r.pi=i;avisoA(r,'¡Persecución!','#a78bfa');vfx(m.x,m.y,v.sty,v.t);const pl=r.plan;r.plan=v;hit(m,v.p*2,v.t,r,null);r.plan=pl;
  if(m.dead)return false}
 return c0(m,u)}}
// ---- Deseo Cura / Danza Lunar: el que entra sale curado ----
{const s0=spawn;spawn=function(side,u){s0(side,u);const m=mons[mons.length-1];if(!m||!deseo[side])return;
 m.hp=m.max;m.ail=null;if(deseo[side]===2)m.mc=m.mc.map(()=>0);deseo[side]=0;avisoA(m,'¡Recuperado del todo!','#f9a8d4')}}
// ---- Rabia: el ataque que lo debilita queda inservible ----
{const d0=debilitar;debilitar=function(m,por){
 const g=!m.dead&&m.vol&&m.vol.rabia&&por&&por!==m&&por.last;d0(m,por);
 if(g){const i=por.mv.findIndex(v=>v.key===por.last.key);if(i>=0){por.mc[i]=999;avisoA(por,'¡'+por.mv[i].n+' quedó inservible!','#f87171')}}}}
// ---- Gravedad (Tierra alcanza a todos, +precisión) · Cerrojo Feérico (nadie cambia) · reloj de los campos nuevos ----
{const e0=efTipo;efTipo=function(t,tg){if(t==='ground'&&campo.grav>0&&tg&&(tg.types.includes('flying')||gancho('inmune',tg,'ground')||(tg.vol&&tg.vol.levit))){
 return tEff('ground',tg.types.filter(x=>x!=='flying'))}return e0(t,tg)}}
{const a0=accEf;accEf=function(m,tg,p){const r=a0(m,tg,p);return campo.grav>0&&r<1e9?r*5/3:r}}
{const p0=puedeCambiar;puedeCambiar=function(m){if(campo.cerrojo>0&&m&&!m.dead)return'Cerrojo Feérico';return p0(m)}}
{const r0=retirar;retirar=function(m){if(campo.cerrojo>0)return false;return r0(m)}}
{const t0=tickCampo;tickCampo=function(dt){t0(dt);
 if(campo.grav>0&&(campo.grav-=dt)<=0){campo.grav=0;log('La gravedad vuelve a la normalidad')}
 if(campo.ion>0)campo.ion-=dt;if(campo.cerrojo>0)campo.cerrojo-=dt;
 if(campo!==ultCampoR){ultCampoR=campo;deseo[0]=deseo[1]=0}}}
let ultCampoR=null;
{const d0=dibujaCampo;dibujaCampo=function(){d0();
 const c=campo,L=[c.grav>0&&NOM_CAMPO.gravedad+' '+Math.ceil(c.grav)+'s',c.ion>0&&NOM_CAMPO.ion,c.cerrojo>0&&NOM_CAMPO.cerrojo].filter(Boolean);if(!L.length)return;
 const n=['cl','te','sa'].filter(k=>c[k]).length+(c.dep.water?1:0)+(c.dep.mud?1:0)+(c.mr>0?1:0);
 cx.save();cx.font='bold 11px system-ui';cx.textAlign='left';cx.lineWidth=3;cx.strokeStyle='rgba(0,0,0,.7)';cx.fillStyle='#fff';
 L.forEach((s,i)=>{const y=16+(n+i)*14;cx.strokeText(s,8,y);cx.fillText(s,8,y)});cx.restore()}}
