// CAMBIOS DE POKÉMON en combate (paso 1 del nuevo motor). Va DESPUÉS de objetos-extra.js.
//  · Un Pokémon que se retira (por decisión propia, Ida y Vuelta, Rugido...) NO cae: vuelve al banquillo y puede volver a entrar
//    con sus PS, su estado alterado, su objeto y la recarga de sus ataques (que sigue corriendo mientras descansa).
//    Al salir se pierden los cambios de estadísticas y los estados volátiles, y vuelven su habilidad, tipos y forma originales (como en los juegos).
//  · Cada Pokémon tiene un CONTROLADOR: m.ctrl = 'ia' (por defecto) o 'jugador' (lo usará el modo manual; la casilla del equipo lo lleva en u.ctrl).
//  · Quién entra lo decide siguienteDe(s): el que haya pedido el jugador o, si no, la IA elige el que mejor le va contra el rival.
//  · La IA cambia por su cuenta si está en desventaja de tipos y en el banquillo hay alguien claramente mejor.
// API para el modo manual: puedeCambiar(m) → true | 'motivo' · cambiarA(m,u) → true/false.
// Ganchos nuevos: alSalir(m) al retirarse vivo (Regeneración, Cura Natural) · anclado(m) true = no le pueden obligar a cambiar (Ventosas)
//   · atrapa(dueño,m) true = el dueño no deja escapar al rival m (Sombra Trampa, Trampa Arena, Imán).
const CAMBIO_CFG={espera:3,minCampo:4,iaCada:1,iaProb:.35,iaVentaja:1.2,vigilante:2};
const eleccion=[null,null],relevo=[null,null],esperaCambio=[0,0];

// ---- ¿Puede retirarse por su cuenta? ----
function atrapado(m){
 if(m.types.includes('ghost'))return false;   // los Fantasma siempre pueden escapar
 if(m.obj==='shed-shell'&&!objAnulado(m))return false;
 if(m.vol&&(m.vol.net||m.vol.trap||m.vol.octo))return'Está atrapado';
 const r=rivalDe(m);if(r&&gancho('atrapa',r,m))return'No puede escapar';
 return false;
}
function puedeCambiar(m){
 if(!m||m.dead||over)return'No está en combate';
 if(m.enter>0)return'Está entrando';
 if(m.sc||m.lw>0||m.lunge>0)return'Está atacando';
 if(esperaCambio[m.side]>0)return'Espera '+Math.ceil(esperaCambio[m.side])+' s';
 if(!libres(m.side).length)return'No queda nadie en el banquillo';
 const a=atrapado(m);if(a)return a;
 return true;
}
const libres=s=>(team[s]||[]).filter(u=>!u.used&&!u.dead);
function cambiarA(m,u){
 if(puedeCambiar(m)!==true)return false;
 if(u&&!libres(m.side).includes(u))return false;
 eleccion[m.side]=u||null;
 const ok=retirar(m);if(ok)esperaCambio[m.side]=CAMBIO_CFG.espera;
 return ok;
}

// ---- Retirarse (lo usan los cambios voluntarios y los forzados) ----
function retirar(m){
 const s=m.side,u=m.u;
 if(m.dead||over||!libres(s).some(x=>x!==u))return false;
 gancho('alSalir',m);   // Regeneración, Cura Natural
 u.vida={hp:m.hp,ail:m.ail?{...m.ail,n:0}:null,obj:m.obj,objPropio:!!m.obj&&objPropio(m),
  objGK:m.objGastadoK||null,objGDyo:m.objGastadoD===m,mc:[...m.mc],liv:m.liviano||0};
 u.salioT=T;u.banquillo=1;   // sigue "usado" hasta que entre el siguiente (así no vuelve a salir él mismo)
 m.dead=true;m.fade=.5;m.vol=null;m.ail=null;m.plan=null;send[s]=.3;
 burst(m.x,m.y,'#fff',16,160,true);log(`${tn(m.t)} se retira del combate`);ui();
 return true;
}
// Forzados: Rugido, Remolino, Cola Dragón, Llave Giro (el rival) · Ida y Vuelta, Voltiocambio, Teletransporte, Relevo... (uno mismo)
forzarCambio=function(m){
 const porRival=H_ATQ&&H_ATQ.side!==m.side;
 if(porRival&&gancho('anclado',m)){txt.push({x:m.x,y:m.y-56,s:'¡No se mueve!',c:'#e2e8f0',l:1.2,sm:1});return false}
 return retirar(m);
};

// ---- Quién entra ----
// Afinidad de un Pokémon contra un rival: lo que le pega - lo que recibe + algo por su vida
function afinidad(types,mvs,frac,r){
 if(!r)return frac;
 const dano=v=>v&&v.cat!=='sta'&&v.p>0;
 let of=0;for(const v of mvs)if(dano(v))of=Math.max(of,tEff(v.t,r.types)*(types.includes(v.t)?1.5:1));
 let de=0;for(const v of r.mv||[])if(dano(v))de=Math.max(de,tEff(v.t,types)*(r.types.includes(v.t)?1.5:1));
 return of-de+frac;
}
const movsDe=u=>(u.s||[]).map(i=>mkmv(u.t,TY[u.t].pool[i])).filter(Boolean);
const fracDe=u=>u.vida?Math.max(0,u.vida.hp)/MH(u.t):1;
const afinU=(u,r)=>afinidad(TY[u.t].types||[u.t],movsDe(u),fracDe(u),r);
function siguienteDe(s){
 const L=libres(s);if(!L.length)return null;
 if(eleccion[s]&&L.includes(eleccion[s]))return eleccion[s];
 const r=mons.find(o=>o.side!==s&&!o.dead);
 if(!r||L.length===1)return L[0];
 return L.map(u=>[u,afinU(u,r)]).sort((a,b)=>b[1]-a[1])[0][0];
}

// ---- Al entrar: recupera lo que tenía al retirarse y lo que deja Relevo ----
{const s0=spawn;spawn=function(side,u){
 for(const x of team[side]||[])if(x.banquillo&&x!==u){x.banquillo=0;x.used=false}
 s0(side,u);
 const m=mons[mons.length-1];if(!m)return;
 m.entT=T;m.ctrl=u.ctrl||'ia';eleccion[side]=null;
 const v=u.vida;
 if(v){m.hp=Math.max(1,Math.min(m.max,v.hp));m.ail=v.ail;
  m.obj=v.obj;m.objDueno=v.obj?(v.objPropio?m:null):null;
  m.objGastadoK=v.objGK;m.objGastadoD=v.objGDyo?m:null;m.liviano=v.liv;
  const pasa=T-(u.salioT||T);if(v.mc&&v.mc.length===m.mc.length)m.mc=v.mc.map(x=>Math.max(0,x-pasa));
  u.vida=null}
 const r=relevo[side];if(r){m.stg={...m.stg,...r.stg};if(r.sub)(m.vol=m.vol||{}).sub={...r.sub};relevo[side]=null;txt.push({x:m.x,y:m.y-56,s:'¡Relevo!',c:'#fde68a',l:1.2,sm:1})}
 ui();
}}
// Relevo: pasa los cambios de estadísticas y el sustituto al que entra
{const a0=applySt;applySt=function(m,tg,p){
 if(p&&p.key==='baton-pass')relevo[m.side]={stg:{...m.stg},sub:m.vol&&m.vol.sub?{...m.vol.sub}:null};
 a0(m,tg,p);
 if(p&&p.key==='baton-pass'&&!m.dead)relevo[m.side]=null}}   // no pudo cambiar

// ---- La IA decide si cambia ----
function iaCambio(m){
 if(m.ctrl==='jugador'||m.lab||puedeCambiar(m)!==true)return;
 if(T-(m.entT||0)<CAMBIO_CFG.minCampo)return;
 const r=m.tg&&!m.tg.dead?m.tg:rivalDe(m);if(!r)return;
 const yo=afinidad(m.types,m.mv,m.hp/m.max,r)+(m.hab==='regenerator'&&m.hp/m.max<.5?.5:0)+(m.hab==='natural-cure'&&m.ail?.5:0);
 let mejor=null,mv=-99;for(const u of libres(m.side)){const a=afinU(u,r);if(a>mv){mv=a;mejor=u}}
 if(mejor&&mv-yo>=CAMBIO_CFG.iaVentaja&&rnd()<CAMBIO_CFG.iaProb)cambiarA(m,mejor);
}
{const u0=upM;upM=function(m,dt){u0(m,dt);if(m.dead||m.enter>0||over)return;m.iaCT=(m.iaCT||0)-dt;if(m.iaCT<=0){m.iaCT=CAMBIO_CFG.iaCada;iaCambio(m)}}}
// Cada combate empieza limpio (se nota porque el campo es nuevo)
let campoCambios=null;
{const t0=tickCampo;tickCampo=function(dt){
 if(campo!==campoCambios){campoCambios=campo;eleccion[0]=eleccion[1]=relevo[0]=relevo[1]=null;esperaCambio[0]=esperaCambio[1]=0}
 t0(dt);for(const s of[0,1])if(esperaCambio[s]>0)esperaCambio[s]-=dt}}

// ---- Habilidades que dependen de los cambios ----
const pisaSuelo=m=>!m.types.includes('flying')&&!gancho('inmune',m,'ground')&&!(m.vol&&m.vol.levit);
Object.assign(HAB,{
 'regenerator':{n:'Regeneración',g:'Cambios',d:'Al retirarse del combate recupera un tercio de sus PS.',alSalir(m){if(m.hp>0&&m.hp<m.max)m.hp=Math.min(m.max,m.hp+Math.round(m.max/3))}},
 'natural-cure':{n:'Cura Natural',g:'Cambios',d:'Al retirarse del combate se cura de su estado alterado.',alSalir(m){m.ail=null}},
 'shadow-tag':{n:'Sombra Trampa',g:'Cambios',d:'El rival no puede retirarse por su cuenta (salvo Fantasma o si también tiene Sombra Trampa).',atrapa(o,m){return m.hab!=='shadow-tag'}},
 'arena-trap':{n:'Trampa Arena',g:'Cambios',d:'El rival no puede retirarse por su cuenta si pisa el suelo.',atrapa(o,m){return pisaSuelo(m)}},
 'magnet-pull':{n:'Imán',g:'Cambios',d:'Un rival de tipo Acero no puede retirarse por su cuenta.',atrapa(o,m){return m.types.includes('steel')}},
 'suction-cups':{n:'Ventosas',g:'Cambios',d:'No le pueden obligar a cambiar (Rugido, Remolino, Cola Dragón...).',rompible:1,anclado(){return true}},
 'stakeout':{n:'Vigilante',g:'Cambios',d:'Hace el doble de daño a un rival que acaba de entrar (2 s).',danoMul(o,tg){return tg&&tg.entT!=null&&T-tg.entT<CAMBIO_CFG.vigilante?2:1}},
});
