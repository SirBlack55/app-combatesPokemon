// OBJETOS EQUIPADOS · TANDA 2: ataques que usan, roban, cambian o destruyen objetos. Va justo DESPUÉS de objetos-combate.js.
//  Estado: Truco, Trapicheo, Ofrenda, Embargo, Reciclaje, Sala Mágica, Gas Corrosivo, Hora del Té, Atiborramiento (clave ob en EFX).
//  Daño:   Ladrón, Antojo, Desarme, Calcinación, Picadura, Picoteo, Lanzamiento, Don Natural, Poltergeist, Acróbata.
// Regla de la carta: TODO lo que pase con un objeto en combate es temporal. La carta solo pierde su PROPIO objeto si es un
// consumible que su propio Pokémon se come o gasta (también al lanzarlo con Lanzamiento). Para saberlo, cada luchador guarda
// m.objDueno = luchador al que pertenece el objeto que lleva ahora (se lo ha podido robar o dar otro).
// Ganchos nuevos (ver ganchos.js): objFijo(m) true = no le pueden quitar ni cambiar el objeto (Viscosidad) · alPerderObj(m) tras quedarse sin objeto (para Liviano, tanda 3).
const OBJ_CFG3={embargo:5,salaMagica:15,desarme:1.5};
const avisoO=(m,s,c)=>txt.push({x:m.x,y:m.y-56,s,c:c||'#fde68a',l:1.3,sm:1});
const nomObj=k=>(OBJ_EQ[k]&&OBJ_EQ[k].n)||String(k).replace(/-/g,' ');
const esBaya=k=>!!k&&/-berry$/.test(k);
const esConsumible=k=>!!(OBJ_EQ[k]&&OBJ_EQ[k].g==='Consumible');

// ---- Dueño de los objetos y gasto ----
{const s0=spawn;spawn=function(side,u){s0(side,u);const m=mons[mons.length-1];if(m)m.objDueno=m.obj?m:null}}
const objPropio=m=>m.objDueno===m||m.objDueno===undefined;
gastarObj=function(m){
 const k=m.obj,d=m.objDueno===undefined?m:m.objDueno,propio=objPropio(m);
 m.objGastadoK=k;m.objGastadoD=d;m.obj=null;m.objDueno=null;
 if(propio&&m.u){m.u.obj=null;m.u.objGastado=1}
 if(k)gancho('alPerderObj',m);
 return k;
};
// Reinicia lo que depende del objeto que lleva (Elegidos, joyas, bayas de tipo, orbes)
function limpiaObj(m){m.elegI=null;m.gemaUsada=0;m.baya=0;m.orbT=0;m.orbOk=0}
// ¿Se le puede quitar el objeto? (Viscosidad lo impide; Rompemoldes lo ignora porque objFijo es rompible)
const objQuitable=m=>!!(m&&m.obj&&!m.dead&&!gancho('objFijo',m));
// Quita el objeto (temporal: no toca la carta). Devuelve {k, d} o null
function quitarObj(m){if(!m.obj)return null;const r={k:m.obj,d:m.objDueno===undefined?m:m.objDueno};m.obj=null;m.objDueno=null;limpiaObj(m);gancho('alPerderObj',m);return r}
function darObj(m,k,d){m.obj=k;m.objDueno=d||null;limpiaObj(m)}

// ---- Sala Mágica y Embargo: los objetos dejan de funcionar ----
NOM_CAMPO.magic='🎩 Sala Mágica';
VOL.embargo={n:'Embargo',c:'#a8a29e',tag:'EMB',l:OBJ_CFG3.embargo};
const salaMagica=()=>!!(campo.mr>0);
const objAnulado=m=>salaMagica()||!!(m.vol&&m.vol.embargo)||!!(m.hab&&!m.habOff&&HAB[m.hab]&&HAB[m.hab].sinObjeto);
{const f0=fuentesH;fuentesH=function(m){const r=f0(m);if(!m.obj||!(salaMagica()||(m.vol&&m.vol.embargo)))return r;const O=OBJ_EQ[m.obj];return O?r.filter(x=>x!==O):r}}
{const t0=tickCampo;tickCampo=function(dt){t0(dt);if(campo.mr>0&&(campo.mr-=dt)<=0){campo.mr=0;log('La Sala Mágica desaparece')}}}
{const d0=dibujaCampo;dibujaCampo=function(){d0();if(!salaMagica())return;
 const c=campo,n=['cl','te','sa'].filter(k=>c[k]).length+(c.dep.water?1:0)+(c.dep.mud?1:0),s=NOM_CAMPO.magic+' '+Math.ceil(c.mr)+'s';
 cx.save();cx.font='bold 11px system-ui';cx.textAlign='left';cx.lineWidth=3;cx.strokeStyle='rgba(0,0,0,.7)';cx.fillStyle='#fff';cx.strokeText(s,8,16+n*14);cx.fillText(s,8,16+n*14);cx.restore()}}

// ---- Efecto de cada baya al comérsela fuera de su condición (Picadura, Picoteo, Lanzamiento, Hora del Té, Atiborramiento) ----
function efectoBaya(m,k){
 if(!m||m.dead||!esBaya(k))return false;
 const cur=f=>{if(!(m.vol&&m.vol.hblock))curaPS(m,f,'#fde047')};
 if(B_CURA[k])cur(B_CURA[k][3]);
 else if(k==='sitrus-berry')cur(OBJ_CFG.zidra.cura);
 else if(k==='enigma-berry')cur(.25);
 else if(k==='starf-berry')stg(m,{[['atk','def','spa','spd','spe'][Math.floor(rnd()*5)]]:2});
 else if(k==='lansat-berry')m.lansat=1;
 else if(k==='kee-berry')stg(m,{def:1});
 else if(k==='maranga-berry')stg(m,{spd:1});
 else{const s=B_STAT.find(x=>x[0]===k),e=B_EST.find(x=>x[0]===k);
  if(s)stg(m,s[2]);
  else if(e){if(m.ail&&e[2].includes(m.ail.k))m.ail=null;for(const v of e[3])if(m.vol)delete m.vol[v]}}
 avisoO(m,'¡'+nomObj(k)+'!','#fde047');gancho('alComerBaya',m);   // Mofletes
 return true;
}
// El dueño se come su propia baya (Hora del Té, Atiborramiento): se gasta de verdad
function comerPropia(m){const k=m.obj;if(!esBaya(k)||objAnulado(m))return false;gastarObj(m);return efectoBaya(m,k)}

// ---- Don Natural: tipo y potencia según la baya ----
const DON_NATURAL={};
for(const[k,,t]of B_TIPO)DON_NATURAL[k]=[t,80];
Object.assign(DON_NATURAL,{'cheri-berry':['fire',80],'chesto-berry':['water',80],'pecha-berry':['elec',80],'rawst-berry':['leaf',80],'aspear-berry':['ice',80],
 'persim-berry':['ground',80],'lum-berry':['flying',80],'sitrus-berry':['psychic',80],'oran-berry':['poison',80],'figy-berry':['bug',80],'wiki-berry':['rock',80],
 'mago-berry':['ghost',80],'aguav-berry':['dragon',80],'iapapa-berry':['dark',80],'liechi-berry':['leaf',100],'ganlon-berry':['ice',100],'salac-berry':['fighting',100],
 'petaya-berry':['poison',100],'apicot-berry':['ground',100],'lansat-berry':['flying',100],'starf-berry':['psychic',100],'enigma-berry':['bug',100],
 'jaboca-berry':['dragon',100],'rowap-berry':['dark',100],'kee-berry':['fairy',100],'maranga-berry':['dark',100]});
// ---- Lanzamiento: potencia según el objeto (como en los juegos; los que no salen aquí, 30; las bayas, 10) ----
const LANZAR={'iron-ball':130,'hard-stone':100,'thick-club':90,'assault-vest':80,'razor-claw':80,'weakness-policy':80,'safety-goggles':80,
 'poison-barb':70,'dragon-fang':70,'rocky-helmet':60,'adamant-orb':60,'lustrous-orb':60,'griseous-orb':60,'sharp-beak':50,
 'choice-band':10,'choice-specs':10,'choice-scarf':10,'leftovers':10,'focus-sash':10,'focus-band':10,'silk-scarf':10,'silver-powder':10,'wide-lens':10,
 'bright-powder':10,'expert-belt':10,'muscle-band':10,'wise-glasses':10,'white-herb':10,'air-balloon':10,'covert-cloak':10,'fairy-feather':10,
 'lax-incense':10,'sea-incense':10,'odd-incense':10,'rock-incense':10,'rose-incense':10,'wave-incense':10};
const potLanzar=k=>esBaya(k)?10:LANZAR[k]||30;
// Lo que le pasa al rival al recibir el objeto lanzado
function efectoLanzado(o,tg,k){
 if(!tg||tg.dead)return;
 if(esBaya(k)){efectoBaya(tg,k);return}
 const E={'flame-orb':'brn','toxic-orb':'tox','light-ball':'par','poison-barb':'psn'}[k];
 if(E){aplicarEst(tg,E,o);return}
 if(k==='kings-rock'||k==='razor-fang'){amedrentar(tg);return}
 if(k==='white-herb'&&Object.values(tg.stg).some(x=>x<0)){for(const q in tg.stg)if(tg.stg[q]<0)tg.stg[q]=0;avisoO(tg,'¡Hierba Blanca!','#bbf7d0')}
}

// ---- Ataques de ESTADO (clave ob en EFX) ----
X('trick switcheroo','Intercambia su objeto con el del rival',{ob:'truco',of:1});
X('bestow','Le da su objeto al rival (si no lleva ninguno)',{ob:'ofrenda',of:1});
X('embargo','El objeto del rival deja de funcionar '+OBJ_CFG3.embargo+' s',{ob:'embargo',of:1});
X('recycle','Recupera el último objeto que gastó',{ob:'reciclaje'});
X('magic-room','Sala Mágica '+OBJ_CFG3.salaMagica+' s: ningún objeto funciona',{ob:'sala'});
X('corrosive-gas','Destruye el objeto del rival (solo en este combate)',{ob:'gas',of:1});
X('teatime','Los dos se comen su baya',{ob:'te'});
X('stuff-cheeks','Se come su baya y +2 Defensa',{ob:'atiborrar'});
const OB_ST={
 truco(m,tg){
  if(!tg||tg.dead||(tg.vol&&tg.vol.sub)||(!m.obj&&!tg.obj)||(m.obj&&!objQuitable(m))||(tg.obj&&!objQuitable(tg)))return fallo(m);
  const a=quitarObj(m),b=quitarObj(tg);
  if(b)darObj(m,b.k,b.d);if(a)darObj(tg,a.k,a.d);
  avisoO(m,'¡Intercambio de objetos!');
  if(b)txt.push({x:m.x,y:m.y-70,s:'Recibe '+nomObj(b.k),c:'#fde68a',l:1.4,sm:1});
  if(a)txt.push({x:tg.x,y:tg.y-70,s:'Recibe '+nomObj(a.k),c:'#fde68a',l:1.4,sm:1});
 },
 ofrenda(m,tg){
  if(!tg||tg.dead||!m.obj||tg.obj||!objQuitable(m))return fallo(m);
  const a=quitarObj(m);darObj(tg,a.k,a.d);avisoO(tg,'¡Recibe '+nomObj(a.k)+'!');
 },
 embargo(m,tg){
  if(!tg||tg.dead||(tg.vol&&tg.vol.sub))return fallo(m);
  if(tg.vol&&tg.vol.mcoat){delete tg.vol.mcoat;avisoO(tg,'¡Capa Mágica!','#f0abfc');aplicarEst(m,'embargo',tg,true);return}
  aplicarEst(tg,'embargo',m,true);
 },
 reciclaje(m){
  const k=m.objGastadoK;if(m.obj||!k)return fallo(m);
  const d=m.objGastadoD===undefined?m:m.objGastadoD;
  darObj(m,k,d);m.objGastadoK=null;
  if(d===m&&m.u){m.u.obj=k;m.u.objGastado=0}   // vuelve a ser suyo: si no lo gasta otra vez, la carta lo conserva
  avisoO(m,'¡Recupera '+nomObj(k)+'!');
 },
 sala(m){
  if(salaMagica()){campo.mr=0;avisoO(m,'¡La Sala Mágica desaparece!','#e9d5ff');return}   // como en los juegos: usarla otra vez la quita
  campo.mr=OBJ_CFG3.salaMagica;avisoO(m,NOM_CAMPO.magic+'!','#e9d5ff');log(NOM_CAMPO.magic);
 },
 gas(m,tg){
  if(!tg||tg.dead||(tg.vol&&tg.vol.sub)||!objQuitable(tg))return fallo(m);
  const r=quitarObj(tg);avisoO(tg,'¡'+nomObj(r.k)+' corroído!','#c084fc');
 },
 te(m,tg){
  let ok=false;for(const x of[m,tg])if(x&&!x.dead&&esBaya(x.obj))ok=comerPropia(x)||ok;
  if(!ok)fallo(m,'¡Pero no pasó nada!');
 },
 atiborrar(m){
  if(!esBaya(m.obj)||objAnulado(m))return fallo(m);
  comerPropia(m);stg(m,{def:2});
 },
};
{const a0=applySt;applySt=function(m,tg,p){a0(m,tg,p);const ef=p.ef||{};if(ef.ob&&OB_ST[ef.ob])OB_ST[ef.ob](m,tg,p)}}
// Pesos de la IA para esos ataques
const malo=(m,o)=>{const k=m.obj;return!!k&&(!!(OBJ_EQ[k]&&OBJ_EQ[k].elegido)||k==='flame-orb'||k==='toxic-orb'||(k==='black-sludge'&&o&&!o.types.includes('poison')))};
const OB_PESO={
 truco:(m,o)=>!o||(!m.obj&&!o.obj)||(m.obj&&!objQuitable(m))||(o.obj&&!objQuitable(o))?0:malo(m,o)&&!malo(o,m)?1.6:!m.obj&&o.obj?.6:0,
 ofrenda:(m,o)=>o&&m.obj&&!o.obj&&malo(m,o)?1.2:0,
 embargo:(m,o)=>o&&o.obj&&!(o.vol&&o.vol.embargo)&&!salaMagica()?.7:0,
 reciclaje:m=>!m.obj&&m.objGastadoK?1.4:0,
 sala:(m,o)=>!salaMagica()&&o&&o.obj&&!(m.obj&&!malo(m,o))?.5:0,
 gas:(m,o)=>o&&o.obj&&objQuitable(o)?.8:0,
 te:m=>esBaya(m.obj)&&m.hp/m.max<.6?.8:0,
 atiborrar:m=>esBaya(m.obj)&&!objAnulado(m)&&m.stg.def<4?1.2:0,
};
{const w0=wtEfx;wtEfx=function(m,e,o){if(e.ob)return OB_PESO[e.ob]?OB_PESO[e.ob](m,o):0;return w0(m,e,o)}}

// ---- Ataques con DAÑO ----
// Efecto tras golpear (va en mv.sec.x a través de SEC_X; lo aplica el envoltorio de secundarios)
Object.assign(SEC_X,{thief:'robar',covet:'robar','knock-off':'desarmar',incinerate:'calcinar','bug-bite':'picar',pluck:'picar',fling:'lanzar'});
const OB_SEC={
 robar(o,tg){if(o.obj||!objQuitable(tg))return;const r=quitarObj(tg);darObj(o,r.k,r.d);avisoO(o,'¡Robó '+nomObj(r.k)+'!')},
 desarmar(o,tg){if(!objQuitable(tg))return;const r=quitarObj(tg);avisoO(tg,'¡Pierde '+nomObj(r.k)+'!','#fca5a5')},
 calcinar(o,tg){if(!tg.obj||!(esBaya(tg.obj)||/^gem-/.test(tg.obj)))return;const r=quitarObj(tg);avisoO(tg,'¡'+nomObj(r.k)+' calcinada!','#fb923c')},
 picar(o,tg){if(!esBaya(tg.obj)||o.dead)return;const r=quitarObj(tg);efectoBaya(o,r.k)},
 lanzar(o,tg){const k=o.lanzado;o.lanzado=null;if(k)efectoLanzado(o,tg,k)},
};
{const s0=secundarios;secundarios=function(s,o,tg,d,primero){s0(s,o,tg,d,primero);if(primero&&s&&OB_SEC[s.x]&&!o.dead)OB_SEC[s.x](o,tg,d)}}
// Potencia: Desarme x1,5 si el rival lleva un objeto que se puede quitar · Acróbata x2 sin objeto
Object.assign(ESP,{'knock-off':{k:'pot',f:'desarme',p:65},'acrobatics':{k:'pot',f:'acrob',p:55},
 'fling':{p:30,sty:'orb'},'natural-gift':{p:80},'poltergeist':{p:110}});
{const p0=potEsp;potEsp=function(f,o,t,fx){
 if(f==='desarme')return objQuitable(t)?Math.round(65*OBJ_CFG3.desarme):65;
 if(f==='acrob')return o.obj&&!objAnulado(o)?55:110;
 return p0(f,o,t,fx)}}
// Antes de lanzar: requisitos y cambios del ataque (Lanzamiento, Don Natural, Poltergeist). false = falla
const OB_PRE={
 fling(m,p){const k=m.obj;if(!k||objAnulado(m)||!objQuitable(m))return false;
  if(esConsumible(k))gastarObj(m);else{const r=quitarObj(m);m.objGastadoK=r.k;m.objGastadoD=r.d}   // un consumible lanzado se gasta; el resto solo se pierde en este combate
  m.lanzado=k;avisoO(m,'¡Lanza '+nomObj(k)+'!');return{...p,p:potLanzar(k),fx:undefined}},
 'natural-gift'(m,p){const k=m.obj,D=DON_NATURAL[k];if(!D||objAnulado(m))return false;
  const r=rivalDe(m);if(r&&gancho('bloqBaya',r))return false;   // Nerviosismo
  gastarObj(m);return{...p,t:D[0],p:D[1],fx:undefined}},
 poltergeist(m,p){const t=m.tg;return t&&t.obj?p:false},
};
{const a0=atk;atk=function(m){
 const p=m.plan,f=p&&OB_PRE[p.key];
 if(f){const r=f(m,p);m.plan=r===false?{...p,cat:'sta',ef:{nada:1,d:p.n},cu:null,dt:null,rep:null}:r}   // si falla: gasta el turno con "¡Pero no pasó nada!"
 return a0(m)}}
// Pesos de la IA para los ataques con daño que dependen de objetos (multiplican el peso normal)
const OB_IA={
 fling:m=>m.obj&&!objAnulado(m)&&objQuitable(m)?(malo(m,m.tg)?2:1):0,
 'natural-gift':m=>DON_NATURAL[m.obj]&&!objAnulado(m)?1:0,
 poltergeist:m=>m.tg&&m.tg.obj?1:0,
 thief:m=>!m.obj&&m.tg&&objQuitable(m.tg)?1.4:1,covet:m=>!m.obj&&m.tg&&objQuitable(m.tg)?1.4:1,
 'knock-off':m=>m.tg&&objQuitable(m.tg)?1.3:1,
 'bug-bite':m=>m.tg&&esBaya(m.tg.obj)?1.3:1,pluck:m=>m.tg&&esBaya(m.tg.obj)?1.3:1,incinerate:m=>m.tg&&esBaya(m.tg.obj)?1.2:1,
 acrobatics:m=>m.obj?.8:1.2,
};
{const w0=wt;wt=function(m,v,i){const r=w0(m,v,i);if(!r)return r;const q=OB_IA[v.key];return q?r*q(m):r}}

// ---- Viscosidad (habilidad de objetos que necesitan estos ataques; el resto de esa familia va en la tanda 3) ----
HAB['sticky-hold']={n:'Viscosidad',g:'Objetos',d:'No le pueden quitar ni cambiar el objeto (Truco, Ladrón, Desarme, Gas Corrosivo...).',rompible:1,objFijo(){return true}};

// Los kits del gacha se guardan YA convertidos en el navegador: se borran una vez para que Truco, Ladrón, Desarme... salgan con su efecto nuevo
try{if(typeof localStorage!=='undefined'&&!localStorage.getItem('objetos-tanda2')){localStorage.removeItem('kits-cartas-v4');localStorage.setItem('objetos-tanda2','1')}}catch(e){}
