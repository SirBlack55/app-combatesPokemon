// FORMAS en combate: la pieza que cambia de forma a un Pokémon en mitad del combate (sprite, tipos y estadísticas).
// La usarán también Mega, Tera y Dinamax. Va DESPUÉS de ataques-restantes.js.
//  · Los datos de cada forma se descargan de la PokéAPI al entrar el Pokémon (antes de que haga falta) y se guardan en memoria.
//  · Estadísticas: se aplica la proporción forma/forma base a las de la carta, así se respetan nivel, IVs y naturaleza del gacha. Los PS no cambian.
//  · Al retirarse vuelve a su forma normal (salvo Palafin Heroico, que se queda así todo el combate).
// Habilidades: Modo Daruma, Cambio Táctico, Escudo Limitado, Banco, Disfraz, Cara de Hielo, Tragamisil, Mutapetito, Cambio Heroico,
// Predicción, Don Floral, Multitipo (tablas), Sistema Alfa (discos), Ilusión, Teracambio · y Canto Arcaico (Meloetta). Comandar: 2 contra 2.
const FORMA_CFG={dano:.5,banco:.25,disfraz:1/8,trago:.25};
const FORMAS={},FORMA_OK={};
const avisoF=(m,s,c)=>txt.push({x:m.x,y:m.y-60,s,c:c||'#e9d5ff',l:1.4,sm:1});
const TNR=Object.fromEntries(Object.entries(TN).map(([a,b])=>[b,a]));   // tipo del juego → tipo de la PokéAPI
// ---- Datos ----
function cargaForma(nombre,esForm){
 nombre=String(nombre);if(FORMA_OK[nombre])return Promise.resolve(FORMA_OK[nombre]);if(FORMAS[nombre])return FORMAS[nombre];
 if(typeof jf!=='function')return Promise.resolve(null);
 return FORMAS[nombre]=jf(API+(esForm?'pokemon-form/':'pokemon/')+nombre).then(p=>{
  const sm={};(p.stats||[]).forEach(x=>sm[x.stat.name]=x.base_stat);
  const S=p.sprites||{},fi=new Image(),bi=new Image();if(S.front_default)fi.src=S.front_default;if(S.back_default)bi.src=S.back_default;
  return FORMA_OK[nombre]={nombre:p.name,types:(p.types||[]).map(x=>TN[x.type.name]||'normal'),
   base:p.stats?{atk:sm.attack,def:sm.defense,spa:sm['special-attack'],spd:sm['special-defense'],spe:sm.speed}:null,fi,bi,img:S.front_default,
   hab:((p.abilities||[]).slice().sort((a,b)=>a.slot-b.slot)[0]||{ability:{}}).ability.name||null}})   // habilidad de la forma (Megas)
  .catch(()=>{delete FORMAS[nombre];return null});
}
const baseF=m=>FORMA_OK[String(idPoke(m))];   // datos del Pokémon concreto (con su forma)
// ---- Cambiar / volver ----
// op: form (es una pokemon-form: solo sprite y tipos) · tipos (fuerza los tipos) · texto · silencio
function cambiaForma(m,nombre,op={}){
 if(!m||m.dead)return false;
 const F=FORMA_OK[nombre],B=baseF(m);
 if(!F||(!op.form&&!B)){cargaForma(nombre,op.form);cargaForma(idPoke(m));m.formaPend=[nombre,op];
  if(op.tipos){guardaOrig(m);m.types=[...op.tipos]}   // los tipos cambian ya aunque el sprite tarde
  return false}
 m.formaPend=null;guardaOrig(m);
 if(F.base&&B&&B.base)for(const k of['atk','def','spa','spd','spe'])m.st[k]=Math.max(1,Math.round(m.st0[k]*F.base[k]/B.base[k]));
 if(op.tipos)m.types=[...op.tipos];else if(F.types&&F.types.length)m.types=[...F.types];
 const key='forma-'+nombre;if(!TY[key])TY[key]={...TY[m.t],fi:F.fi&&F.fi.src?F.fi:TY[m.t].fi,bi:F.bi&&F.bi.src?F.bi:TY[m.t].bi,img:F.img||TY[m.t].img,types:F.types};
 if(!m.ilusion)m.sprT=key;m.forma=nombre;
 if(!op.silencio){avisoF(m,'¡'+(op.texto||'Cambia de forma')+'!');burst(m.x,m.y,'#e9d5ff',16,160,true)}
 if(typeof ui==='function')ui();
 return true;
}
function guardaOrig(m){if(!m.st0){m.st0={...m.st};m.types0=[...m.types]}}
function vuelveForma(m,op={}){if(!m||!m.forma&&!m.formaPend)return;
 if(m.st0){m.st={...m.st0};m.types=[...m.types0]}
 if(!m.ilusion)m.sprT=null;m.forma=null;m.formaPend=null;
 if(!op.silencio){avisoF(m,'¡'+(op.texto||'Vuelve a su forma')+'!');burst(m.x,m.y,'#e9d5ff',10,120,true)}
 if(typeof ui==='function')ui()}
const enForma=(m,n)=>m.forma===n||(m.formaPend&&m.formaPend[0]===n);
// Reintenta un cambio que esperaba a que llegaran los datos
{const u0=upM;upM=function(m,dt){u0(m,dt);const P=m.formaPend;if(P&&FORMA_OK[P[0]]&&(P[1].form||baseF(m)))cambiaForma(m,P[0],P[1])}}

// ---- Nombres de las formas según la habilidad ----
const nomB=m=>(baseF(m)||{}).nombre||'';
const formaTipo=(base,t)=>base+'-'+(TNR[t]||'normal');
const MEMORIAS={};for(const t of new Set(Object.values(TN)))if(t!=='normal')MEMORIAS[(TNR[t]||t)+'-memory']=t;
const tablaTipo=m=>{const k=m.obj;if(!k||objAnulado(m))return null;if(typeof TABLAS!=='undefined'&&TABLAS[k])return TABLAS[k][1];return null};
const discoTipo=m=>{const k=m.obj;return k&&!objAnulado(m)&&MEMORIAS[k]||null};
const PRECARGA={   // formas que conviene tener descargadas al entrar
 'zen-mode':m=>[[nomB(m).replace('-standard','-zen')]],
 'stance-change':()=>[['aegislash-blade'],['aegislash-shield']],
 'shields-down':m=>[[nomB(m).replace('-meteor','')]],
 'schooling':()=>[['wishiwashi-school']],
 'disguise':()=>[['mimikyu-busted']],
 'ice-face':()=>[['eiscue-noice']],
 'gulp-missile':()=>[['cramorant-gulping'],['cramorant-gorging']],
 'hunger-switch':()=>[['morpeko-hangry']],
 'zero-to-hero':()=>[['palafin-hero']],
 'forecast':()=>[['castform-sunny'],['castform-rainy'],['castform-snowy']],
 'flower-gift':()=>[['cherrim-sunshine',1]],
 'multitype':m=>{const t=tablaTipo(m);return t?[[formaTipo('arceus',t),1]]:[]},
 'rks-system':m=>{const t=discoTipo(m);return t?[[formaTipo('silvally',t),1]]:[]},
 'tera-shift':()=>[['terapagos-terastal']],
};
function precarga(m){const id=idPoke(m);if(!id)return;
 cargaForma(id).then(()=>{const f=PRECARGA[m.hab];if(f)for(const[n,e]of f(m))if(n)cargaForma(n,!!e);
  if(m.mv&&m.mv.some(v=>v.key==='relic-song'))cargaForma('meloetta-pirouette')})}
// Al entrar: precarga, Ilusión, Palafin Heroico, Teracambio, Multitipo y Sistema Alfa
{const s0=spawn;spawn=function(side,u){s0(side,u);const m=mons[mons.length-1];if(!m||m.lab)return;
 precarga(m);
 if(tieneHab(m,'illusion')){const L=(team[side]||[]).filter(x=>x!==u&&!x.dead);const d=L[L.length-1];if(d&&TY[d.t]){m.ilusion=d.t;m.sprT=d.t}}
 if(tieneHab(m,'zero-to-hero')&&u.heroe)cambiaForma(m,'palafin-hero',{texto:'¡Forma Heroica!',silencio:0});
 if(tieneHab(m,'tera-shift'))cambiaForma(m,'terapagos-terastal',{texto:'Forma Teracristal'});
 tipoPorObjeto(m)}}
function tipoPorObjeto(m){
 if(tieneHab(m,'multitype')){const t=tablaTipo(m)||'normal';if(m.types[0]!==t||m.types.length>1){t==='normal'?vuelveForma(m,{silencio:1}):cambiaForma(m,formaTipo('arceus',t),{form:1,tipos:[t],silencio:1})}}
 if(tieneHab(m,'rks-system')){const t=discoTipo(m)||'normal';if(m.types[0]!==t||m.types.length>1){t==='normal'?vuelveForma(m,{silencio:1}):cambiaForma(m,formaTipo('silvally',t),{form:1,tipos:[t],silencio:1})}}
}

// ---- Al lanzar: Cambio Táctico, Tragamisil, Canto Arcaico · Juicio, Multiataque y Rueda Aural cambian de tipo ----
{const a0=atk;atk=function(m){const p=m.plan;
 if(p&&tieneHab(m,'stance-change')){
  if(p.key==='kings-shield'&&enForma(m,'aegislash-blade'))vuelveForma(m,{texto:'Forma Escudo'});
  else if(p.cat!=='sta'&&!enForma(m,'aegislash-blade'))cambiaForma(m,'aegislash-blade',{texto:'Forma Filo'})}
 if(p&&p.cat!=='sta'){let t=null;
  if(p.key==='judgment'&&tieneHab(m,'multitype'))t=tablaTipo(m);
  if(p.key==='multi-attack'&&tieneHab(m,'rks-system'))t=discoTipo(m);
  if(p.key==='aura-wheel')t=m.hambre?'dark':'elec';
  if(t&&t!==p.t)m.plan={...p,t,cv:1}}
 const r=a0(m);
 if(p&&tieneHab(m,'gulp-missile')&&(p.key==='surf'||p.key==='dive')&&!m.trago){m.trago=m.hp>m.max/2?'gulping':'gorging';cambiaForma(m,'cramorant-'+m.trago,{texto:m.trago==='gulping'?'Atrapa un Arrokuda':'Atrapa un Pikachu'})}
 if(p&&p.key==='relic-song'&&especieDe(m)===648&&!m.dead){enForma(m,'meloetta-pirouette')?vuelveForma(m,{texto:'Forma Lírica'}):cambiaForma(m,'meloetta-pirouette',{texto:'Forma Danza'})}
 return r}}

// ---- Discos de Silvally (objetos) ----
const NOM_DISCO={bug:'Bicho',dark:'Siniestro',dragon:'Dragón',elec:'Eléctrico',fairy:'Hada',fighting:'Lucha',fire:'Fuego',flying:'Volador',ghost:'Fantasma',
 leaf:'Planta',ground:'Tierra',ice:'Hielo',poison:'Veneno',psychic:'Psíquico',rock:'Roca',steel:'Acero',water:'Agua'};
for(const[k,t]of Object.entries(MEMORIAS))OBJ_EQ[k]={n:'Disco '+(NOM_DISCO[t]||t),i:'💿',g:'Especie',d:`Silvally (Sistema Alfa) pasa a ser de tipo ${NT[t]}, igual que Multiataque.`};

Object.assign(HAB,{
 'zen-mode':{n:'Modo Daruma',g:'Formas',d:'Con la mitad de PS o menos pasa al Modo Daruma (cambian sus tipos y estadísticas).',
  seg(m){const z=nomB(m).replace('-standard','-zen');if(!z)return;const bajo=m.hp<=m.max*FORMA_CFG.dano;
   if(bajo&&!enForma(m,z))cambiaForma(m,z,{texto:'Modo Daruma'});else if(!bajo&&enForma(m,z))vuelveForma(m)}},
 'stance-change':{n:'Cambio Táctico',g:'Formas',d:'Al atacar pasa a Forma Filo (mucho ataque); con Escudo Real vuelve a Forma Escudo (mucha defensa).'},
 'shields-down':{n:'Escudo Limitado',g:'Formas',d:'Con más de la mitad de PS es un Meteorito: inmune a los estados. Por debajo rompe la coraza y se vuelve muy ofensivo.',
  sinEstado(m,k){return!!EST[k]&&!m.forma},
  seg(m){const n=nomB(m).replace('-meteor','');if(!n||n===nomB(m))return;const bajo=m.hp<=m.max*FORMA_CFG.dano;
   if(bajo&&!enForma(m,n))cambiaForma(m,n,{texto:'Rompe la coraza'});else if(!bajo&&enForma(m,n))vuelveForma(m,{texto:'Forma Meteorito'})}},
 'schooling':{n:'Banco',g:'Formas',d:'Con al menos un 25 % de PS forma un banco enorme y muy fuerte; por debajo se dispersa.',
  seg(m){const ok=m.hp>=m.max*FORMA_CFG.banco;if(ok&&!enForma(m,'wishiwashi-school'))cambiaForma(m,'wishiwashi-school',{texto:'Forma Banco'});else if(!ok&&enForma(m,'wishiwashi-school'))vuelveForma(m,{texto:'Se dispersa'})}},
 'disguise':{n:'Disfraz',g:'Formas',d:'El disfraz absorbe el primer golpe (pierde 1/8 de sus PS) y se rompe.',rompible:1,
  absorbe(m,o,t,e,prim){if(m.disfrazRoto)return false;if(!prim)return true;m.disfrazRoto=1;avisoF(m,'¡El disfraz se rompe!','#fde68a');dotDano(m,FORMA_CFG.disfraz,'#fde68a');
   cambiaForma(m,'mimikyu-busted',{silencio:1});return true}},
 'ice-face':{n:'Cara de Hielo',g:'Formas',d:'La cabeza de hielo absorbe el primer golpe físico; con granizo o nieve el hielo vuelve a crecer.',rompible:1,
  absorbe(m,o,t,e,prim){const cat=(e&&e.cat)||(o.plan&&o.plan.cat)||(o.last&&o.last.cat);if(m.sinHielo||cat!=='phy')return false;if(!prim)return true;
   m.sinHielo=1;avisoF(m,'¡Se rompe el hielo!','#bae6fd');cambiaForma(m,'eiscue-noice',{silencio:1});return true},
  seg(m){if(m.sinHielo&&climaK('hail')){m.sinHielo=0;vuelveForma(m,{texto:'Cara de Hielo'})}}},
 'gulp-missile':{n:'Tragamisil',g:'Formas',d:'Tras Surf o Buceo atrapa una presa; si le golpean, la escupe (−25 % PS al atacante y le baja la Defensa o lo paraliza).',
  golpeado(m,o,d,prim){if(!m.trago||!prim||o.dead)return;const k=m.trago;m.trago=null;avisoF(m,'¡Tragamisil!','#7dd3fc');dotDano(o,FORMA_CFG.trago,'#7dd3fc');
   if(!o.dead){k==='gulping'?stg(o,{def:-1},true):aplicarEst(o,'par',m,true)}vuelveForma(m,{silencio:1})}},
 'hunger-switch':{n:'Mutapetito',g:'Formas',d:'Cada '+TURNO+' s alterna entre Forma Saciada y Forma Voraz; Rueda Aural pasa de Eléctrico a Siniestro.',
  seg(m){cadaTurno(m,'hHambre',m=>{m.hambre=!m.hambre;m.hambre?cambiaForma(m,'morpeko-hangry',{texto:'Forma Voraz'}):vuelveForma(m,{texto:'Forma Saciada'})})}},
 'zero-to-hero':{n:'Cambio Heroico',g:'Formas',d:'Tras retirarse una vez, vuelve en Forma Heroica para el resto del combate.',alSalir(m){if(m.u)m.u.heroe=1}},
 'forecast':{n:'Predicción',g:'Formas',d:'Cambia a tipo Fuego con sol, Agua con lluvia y Hielo con granizo o nieve.',
  seg(m){const c=campo.cl&&campo.cl.k,F={sun:['castform-sunny','fire'],rain:['castform-rainy','water'],hail:['castform-snowy','ice']}[c];
   if(F&&!enForma(m,F[0]))cambiaForma(m,F[0],{tipos:[F[1]],texto:'Predicción'});else if(!F&&m.forma)vuelveForma(m)}},
 'flower-gift':{n:'Don Floral',g:'Formas',d:'Con sol florece: Ataque y Def. Esp. ×1,5.',
  statMul(m,k){return(k==='atk'||k==='spd')&&climaK('sun')?1.5:1},
  seg(m){const s=climaK('sun');if(s&&!enForma(m,'cherrim-sunshine'))cambiaForma(m,'cherrim-sunshine',{form:1,texto:'Florece'});else if(!s&&m.forma)vuelveForma(m,{silencio:1})}},
 'multitype':{n:'Multitipo',g:'Formas',d:'Su tipo (y el de Juicio) es el de la tabla que lleva equipada.',seg(m){tipoPorObjeto(m)}},
 'rks-system':{n:'Sistema Alfa',g:'Formas',d:'Su tipo (y el de Multiataque) es el del disco que lleva equipado.',seg(m){tipoPorObjeto(m)}},
 'illusion':{n:'Ilusión',g:'Formas',d:'Entra con el aspecto del último Pokémon de su equipo; el primer golpe deshace la ilusión.',
  golpeado(m,o,d,prim){if(!m.ilusion)return;m.ilusion=null;m.sprT=m.forma?'forma-'+m.forma:null;avisoF(m,'¡Se deshace la ilusión!','#c4b5fd');burst(m.x,m.y,'#a78bfa',14,150,true)}},
 'tera-shift':{n:'Teracambio',g:'Formas',d:'Al entrar adopta la Forma Teracristal (más fuerte).'},
 'commander':{n:'Comandar',g:'Sin efecto en 1 contra 1',d:'Se mete en la boca de un Dondozo aliado para controlarlo. Sirve en 2 contra 2.'},
});
