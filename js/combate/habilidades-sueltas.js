// HABILIDADES · las sueltas que quedaban (no son de formas ni de 2 contra 2). Va DESPUÉS de cambios.js.
// Allanamiento, Humedad, Bromista, Rivalidad, Cálculo Final, Tumbos, Metal Pesado, Metal Liviano, Espejo Mágico, Corrosión,
// Alas Vendaval, Manto Frondoso, Poder Fúngico, Coránima, General Supremo, Letargo Perenne, Oportunista, Pareja de Baile,
// Primer Auxilio, Puño Invisible, Rezagado, Títere Tóxico · y Acérrimo / Hélice Caudal (solo sirven en 2 contra 2).
// "Prioridad" en tiempo real: los ataques con daño cargan antes (como los de prioridad); los de estado dejan al Pokémon libre antes.
const SUELTAS_CFG={prioSt:.6,lento:1.25,analitico:1.3,rivalidad:.25,overlord:.1,tumbos:.5};
const avisoS=(m,s,c)=>txt.push({x:m.x,y:m.y-56,s,c:c||'#fde68a',l:1.2,sm:1});
const EXPLOSIVOS=['explosion','self-destruct','misty-explosion','mind-blown'];
const DANZAS=['swords-dance','dragon-dance','quiver-dance','feather-dance','petal-dance','teeter-dance','lunar-dance','fiery-dance','revelation-dance','victory-dance','aqua-step','clangorous-soul'];
const humedad=()=>mons.some(x=>!x.dead&&!(x.enter>0)&&tieneHab(x,'damp'));
const curaAtq=p=>!!(p&&((p.ef&&p.ef.h)||(p.sec&&p.sec.dr>0)));

// ---- Género en combate (Rivalidad). Las cartas del gacha ya lo traen; si no, se sortea con la proporción de la especie ----
{const s0=spawn;spawn=function(side,u){s0(side,u);const m=mons[mons.length-1];if(!m||!u)return;
 if(!u.genero){const r=typeof GENERO_RATE!=='undefined'?GENERO_RATE[especieDe(m)]:undefined;u.genero=r==null||r<0?'N':rnd()<r/8?'F':'M'}
 m.genero=u.genero;
 m.overlord=Math.min(5,(team[side]||[]).filter(x=>x.dead).length);   // General Supremo
}}

// ---- Al lanzar: Humedad, prioridad (Bromista, Alas Vendaval, Primer Auxilio), lentitud (Rezagado, Poder Fúngico), Pareja de Baile ----
let danzaEnCurso=false;
{const a0=atk;atk=function(m){
 let p=m.plan;if(!p)return a0(m);
 const nada=s=>{m.plan={...p,cat:'sta',ef:{nada:1},cu:null,dt:null,rep:null};if(s)avisoS(m,s,'#e2e8f0')};
 if(EXPLOSIVOS.includes(p.key)&&humedad())nada('¡Humedad lo impide!');
 else if(p.cat!=='sta'&&!p.pr&&((p.t==='flying'&&tieneHab(m,'gale-wings')&&m.hp>=m.max)||(tieneHab(m,'triage')&&curaAtq(p))))m.plan={...p,pr:1};
 else if(p.cat==='sta'&&tieneHab(m,'prankster')&&m.tg&&m.tg!==m&&m.tg.types.includes('dark')&&ofensivoSt(p))nada('No afecta a los Siniestro');
 p=m.plan;
 const mic=p.cat==='sta'&&tieneHab(m,'mycelium-might'),H=HAB['mycelium-might'];
 if(mic)H.rompe=1;   // Poder Fúngico: sus ataques de estado ignoran la habilidad del rival
 let r;try{r=a0(m)}finally{if(mic)delete H.rompe}
 if(p.cat==='sta'&&(tieneHab(m,'prankster')||(tieneHab(m,'triage')&&curaAtq(p)))){m.cd*=SUELTAS_CFG.prioSt;m.freeze=Math.min(m.freeze||0,.1)}
 if(tieneHab(m,'stall')||mic)m.cd*=SUELTAS_CFG.lento;
 if(DANZAS.includes(p.key)&&!danzaEnCurso&&!(p.ef&&p.ef.nada))copiaDanza(m,p);
 return r}}
function copiaDanza(m,p){
 for(const r of mons){if(r===m||r.dead||r.enter>0||r.lw>0||r.lunge>0||r.sc||!tieneHab(r,'dancer'))continue;
  const sv={cd:r.cd,mc:[...r.mc],pi:r.pi,plan:r.plan,us:r.us&&{...r.us},tg:r.tg};
  danzaEnCurso=true;avisoS(r,'¡Pareja de Baile!','#f9a8d4');
  try{r.plan={...p};r.pi=0;if(r.side!==m.side)r.tg=m;atk(r)}finally{danzaEnCurso=false}
  r.cd=sv.cd;r.mc=sv.mc;r.us=sv.us;r.tg=sv.tg||r.tg;if(!(r.lw>0)){r.plan=sv.plan;r.pi=sv.pi}
 }
}

// ---- Allanamiento (ignora pantallas y sustituto) y Puño Invisible (el contacto atraviesa Protección) ----
{const h0=hit;hit=function(tg,dm,t,o,e){
 if(!o||!tg||o===tg||o.dead||tg.dead)return h0(tg,dm,t,o,e);
 const inf=tieneHab(o,'infiltrator')&&tg.vol,puno=tg.prot&&tg.prot.k!=='endure'&&tieneHab(o,'unseen-fist')&&contactoReal(o);
 if(!inf&&!puno)return h0(tg,dm,t,o,e);
 const sv={},pr=tg.prot;
 if(inf)for(const k of['sub','reflect','lscreen','aveil'])if(tg.vol[k]){sv[k]=tg.vol[k];delete tg.vol[k]}
 if(puno){tg.prot=null;if(!e||e.f)avisoS(o,'¡Puño Invisible!','#fca5a5')}
 try{return h0(tg,dm,t,o,e)}finally{
  if(tg.vol)for(const k in sv)if(!(k in tg.vol))tg.vol[k]=sv[k];
  if(puno&&!tg.dead&&!tg.prot)tg.prot=pr}}}
// Espejo Mágico (rebota los ataques de estado) y Allanamiento contra el sustituto en ataques de estado
let reboteEnCurso=false;
{const s0=stOfensivo;stOfensivo=function(m,tg,ef){
 if(tg&&!tg.dead&&m!==tg&&!reboteEnCurso&&(ef.o||ef.a||(ef.v&&ef.of)||ef.hb||ef.ty||ef.ta)&&gancho('rebota',tg)){
  reboteEnCurso=true;avisoS(tg,'¡Espejo Mágico!','#f0abfc');try{return s0(tg,m,ef)}finally{reboteEnCurso=false}}
 if(tg&&tg.vol&&tg.vol.sub&&tieneHab(m,'infiltrator')){const sb=tg.vol.sub;delete tg.vol.sub;try{return s0(m,tg,ef)}finally{if(tg.vol&&!tg.vol.sub)tg.vol.sub=sb}}
 return s0(m,tg,ef)}}

// ---- Estados: Corrosión (envenena a Acero y Veneno) y Títere Tóxico (el veneno también confunde) ----
{const p0=puedeEst;puedeEst=function(m,k,por){
 if((k==='psn'||k==='tox')&&por&&por!==m&&m&&tieneHab(por,'corrosion')){const ty=m.types;m.types=ty.filter(t=>t!=='poison'&&t!=='steel');try{return p0(m,k,por)}finally{m.types=ty}}
 return p0(m,k,por)}}
{const a0=aplicarEst;aplicarEst=function(m,k,por,aviso){const r=a0(m,k,por,aviso);
 if(r&&(k==='psn'||k==='tox')&&por&&por!==m&&!m.dead&&tieneHab(por,'poison-puppeteer'))aplicarEst(m,'cnf',por,true);
 return r}}
// ---- Oportunista: copia las subidas de estadísticas del rival ----
let oportunoEnCurso=false;
{const s0=stg;stg=function(x,o,...a){const r=s0(x,o,...a);
 if(!oportunoEnCurso&&x&&o){const up={};for(const q in o)if(o[q]>0)up[q]=o[q];
  if(Object.keys(up).length)for(const y of mons)if(y.side!==x.side&&!y.dead&&!(y.enter>0)&&tieneHab(y,'opportunist')){oportunoEnCurso=true;try{avisoS(y,'¡Oportunista!');s0(y,up)}finally{oportunoEnCurso=false}}}
 return r}}
// ---- Coránima: +1 At. Esp. cada vez que cae un Pokémon ----
{const d0=debilitar;debilitar=function(m,por){const vivo=!m.dead;d0(m,por);
 if(vivo&&m.dead)for(const x of mons)if(x!==m&&!x.dead&&tieneHab(x,'soul-heart'))stg(x,{spa:1})}}
// ---- Metal Pesado / Metal Liviano: cambian el "peso" de Patada Baja, Hierba Lazo, Cuerpo Pesado, Golpe Calor ----
const pesoMul=m=>m&&tieneHab(m,'heavy-metal')?2:m&&tieneHab(m,'light-metal')?.5:1;
{const p0=potEsp;potEsp=function(f,o,t,fx){
 if(f==='peso'&&pesoMul(t)!==1){const r=t.max*pesoMul(t);return r<120?20:r<170?40:r<230?60:r<300?80:r<380?100:120}
 if(f==='pesoRel'&&(pesoMul(o)!==1||pesoMul(t)!==1)){const r=(o.max*pesoMul(o))/(t.max*pesoMul(t));return r>=5?120:r>=4?100:r>=3?80:r>=2?60:40}
 if(f==='estado'&&fx&&fx.req==='any'&&t&&!t.ail&&tieneHab(t,'comatose'))return fx.b*2;   // Letargo Perenne cuenta como dormido para Infortunio
 return p0(f,o,t,fx)}}
// Resquicio no funciona si hay alguien con Humedad
if(HAB.aftermath&&HAB.aftermath.alMorir){const f=HAB.aftermath.alMorir;HAB.aftermath.alMorir=function(...a){if(!humedad())return f.apply(this,a)}}

Object.assign(HAB,{
 'infiltrator':{n:'Allanamiento',g:'Al atacar',d:'Sus ataques ignoran Reflejo, Pantalla de Luz, Velo Aurora y el sustituto.'},
 'unseen-fist':{n:'Puño Invisible',g:'Al atacar',d:'Sus ataques de contacto atraviesan Protección y similares.'},
 'damp':{n:'Humedad',g:'Reglas del campo',d:'Nadie puede usar Autodestrucción, Explosión, Cabeza Sorpresa ni Bruma Explosiva; anula Resquicio.'},
 'prankster':{n:'Bromista',g:'Al atacar',d:'Sus ataques de estado lo dejan libre antes (prioridad); no afectan a los Siniestro.'},
 'gale-wings':{n:'Alas Vendaval',g:'Al atacar',d:'Con los PS al máximo, sus ataques de tipo Volador tienen prioridad (cargan antes).'},
 'triage':{n:'Primer Auxilio',g:'Al atacar',d:'Sus ataques que curan tienen prioridad.'},
 'stall':{n:'Rezagado',g:'Al atacar',d:'Siempre actúa el último: tarda un 25 % más en volver a atacar.'},
 'mycelium-might':{n:'Poder Fúngico',g:'Al atacar',d:'Sus ataques de estado van más lentos, pero ignoran la habilidad del rival.'},
 'rivalry':{n:'Rivalidad',g:'Daño',d:'+25 % de daño contra los de su mismo género y −25 % contra el opuesto.',
  danoMul(o,tg){const a=o.genero,b=tg&&tg.genero;if(!a||!b||a==='N'||b==='N')return 1;return a===b?1+SUELTAS_CFG.rivalidad:1-SUELTAS_CFG.rivalidad}},
 'analytic':{n:'Cálculo Final',g:'Daño',d:'+30 % de daño si el rival ya ha atacado antes que él.',danoMul(o,tg){return tg&&tg.cd>.5?SUELTAS_CFG.analitico:1}},
 'supreme-overlord':{n:'General Supremo',g:'Daño',d:'+10 % de daño por cada compañero de equipo debilitado (máx. 5).',danoMul(o){return 1+SUELTAS_CFG.overlord*(o.overlord||0)}},
 'tangled-feet':{n:'Tumbos',g:'Estadísticas',d:'Si está confuso, los ataques le aciertan la mitad de veces.',rompible:1,accRec(tg){return tg.vol&&tg.vol.cnf?SUELTAS_CFG.tumbos:1}},
 'grass-pelt':{n:'Manto Frondoso',g:'Estadísticas',d:'Defensa ×1,5 con Campo de Hierba.',rompible:1,statMul(m,k){return k==='def'&&campo.te&&campo.te.k==='leaf'?1.5:1}},
 'heavy-metal':{n:'Metal Pesado',g:'Estadísticas',d:'Pesa el doble (Patada Baja, Hierba Lazo, Cuerpo Pesado...).',rompible:1},
 'light-metal':{n:'Metal Liviano',g:'Estadísticas',d:'Pesa la mitad (Patada Baja, Hierba Lazo, Cuerpo Pesado...).',rompible:1},
 'magic-bounce':{n:'Espejo Mágico',g:'Inmunidad',d:'Devuelve los ataques de estado que le lanzan (bajadas, estados, Mofa...).',rompible:1,rebota(){return true}},
 'corrosion':{n:'Corrosión',g:'Estados',d:'Puede envenenar incluso a los Pokémon de tipo Acero y Veneno.'},
 'poison-puppeteer':{n:'Títere Tóxico',g:'Estados',d:'Los rivales que envenena también quedan confusos.'},
 'comatose':{n:'Letargo Perenne',g:'Estados',d:'Siempre está medio dormido: no le afectan los estados alterados (cuenta como dormido para Infortunio).',sinEstado(m,k){return!!EST[k]||k==='yawn'}},
 'opportunist':{n:'Oportunista',g:'Estadísticas',d:'Cuando el rival sube alguna estadística, él también la sube.'},
 'dancer':{n:'Pareja de Baile',g:'Al atacar',d:'Cuando otro usa un ataque de baile (Danza Espada, Danza Dragón...), lo copia al momento.'},
 'soul-heart':{n:'Coránima',g:'Al derrotar',d:'+1 At. Esp. cada vez que cae cualquier Pokémon.'},
 'stalwart':{n:'Acérrimo',g:'Sin efecto en 1 contra 1',d:'Ignora a los que atraen los ataques (Señuelo, Pararrayos...). Sirve en 2 contra 2.'},
 'propeller-tail':{n:'Hélice Caudal',g:'Sin efecto en 1 contra 1',d:'Ignora a los que atraen los ataques (Señuelo, Pararrayos...). Sirve en 2 contra 2.'},
});
