// OBJETOS EQUIPADOS · TANDA 1: bayas y objetos de combate (se añaden a OBJ_EQ de objetos.js). Va justo DESPUÉS de objetos.js.
// Todo lo que pasa en combate es temporal; solo los consumibles gastados se pierden de la carta (gastarObj → u.objGastado).
// Ajustes de ritmo en OBJ_CFG2. Pendiente de otras tandas: Truco/Ladrón/Desarme (tanda 2), Mago/Ladrón de Bolsillo (tanda 3).
const OBJ_CFG2={tipo:1.2,gema:1.5,musc:1.1,elegido:1.5,expert:1.2,cinta:.1,concha:.125,lodo:.0156,lodoMal:.0312,casco:.1667,
 baya:{oran:{u:.5,f:.15},cura:{u:.25,f:.333},reduce:.5,stat:{u:.25},devuelve:.125},orbe:{retraso:3}};
const _o=(m,x)=>Object.assign(OBJ_EQ,x);

// Comer una baya: respeta Nerviosismo del rival, gasta el objeto y avisa a Mofletes.
function comerBaya(m,nombre,fn){
 if(m.dead||m.hp<=0||!m.obj)return false;
 const r=rivalDe(m);if(r&&gancho('bloqBaya',r))return false;
 gastarObj(m);fn&&fn(m);gancho('alComerBaya',m);
 txt.push({x:m.x,y:m.y-56,s:'¡'+nombre+'!',c:'#fde047',l:1.2,sm:1});return true;
}
const bajoPS=(m,u)=>m.hp<=m.max*u&&m.hp>0;
const sinCura=m=>m.vol&&m.vol.hblock;

// ---- Bayas de curación y de estado ----
const B_CURA={'oran-berry':['Baya Aranja','🫐',OBJ_CFG2.baya.oran.u,OBJ_CFG2.baya.oran.f],
 'figy-berry':['Baya Higog','🍈',OBJ_CFG2.baya.cura.u,OBJ_CFG2.baya.cura.f],'wiki-berry':['Baya Wiki','🍈',OBJ_CFG2.baya.cura.u,OBJ_CFG2.baya.cura.f],
 'mago-berry':['Baya Mago','🍈',OBJ_CFG2.baya.cura.u,OBJ_CFG2.baya.cura.f],'aguav-berry':['Baya Guaya','🍈',OBJ_CFG2.baya.cura.u,OBJ_CFG2.baya.cura.f],
 'iapapa-berry':['Baya Pabaya','🍈',OBJ_CFG2.baya.cura.u,OBJ_CFG2.baya.cura.f]};
for(const[k,[n,i,u,f]]of Object.entries(B_CURA)){
 const ck=m=>{if(!sinCura(m)&&m.hp<m.max&&bajoPS(m,u))comerBaya(m,n,x=>curaPS(x,f,'#fde047'))};
 OBJ_EQ[k]={n,i,g:'Consumible',d:`Al bajar del ${Math.round(u*100)} % de PS cura el ${Math.round(f*100)} % (un solo uso).`,golpeado:ck,seg:ck};
}
// Estado que cura cada baya: [clave, nombre, estados mayores, volátiles]
const B_EST=[['cheri-berry','Baya Zreza',['par'],[]],['chesto-berry','Baya Atania',['slp'],[]],['pecha-berry','Baya Meloc',['psn','tox'],[]],
 ['rawst-berry','Baya Safre',['brn'],[]],['aspear-berry','Baya Perasi',['frz'],[]],['persim-berry','Baya Caquic',[],['cnf']],
 ['lum-berry','Baya Ziuela',['par','slp','psn','tox','brn','frz'],['cnf']]];
for(const[k,n,ma,vo]of B_EST){
 const ck=m=>{if(m.dead||!m.obj)return;const a=m.ail&&ma.includes(m.ail.k),v=vo.find(x=>m.vol&&m.vol[x]);
  if(a||v)comerBaya(m,n,x=>{if(a)x.ail=null;if(v)delete x.vol[v]})};
 OBJ_EQ[k]={n,i:'🍓',g:'Consumible',d:'Cura '+(ma.length>1&&vo.length?'cualquier estado alterado':ma.length?'un estado alterado concreto':'la confusión')+' al instante (un solo uso).',seg:ck,alEstado:ck,golpeado:ck};
}
// ---- Bayas que suben una estadística al bajar del 25 % de PS ----
const B_STAT=[['liechi-berry','Baya Lichi',{atk:1}],['ganlon-berry','Baya Gonlan',{def:1}],['salac-berry','Baya Aslac',{spe:1}],
 ['petaya-berry','Baya Yapati',{spa:1}],['apicot-berry','Baya Aricoque',{spd:1}]];
for(const[k,n,s]of B_STAT){
 const ck=m=>{if(bajoPS(m,OBJ_CFG2.baya.stat.u))comerBaya(m,n,x=>stg(x,s))};
 OBJ_EQ[k]={n,i:'🍒',g:'Consumible',d:'Al bajar del 25 % de PS sube '+Object.keys(s).map(q=>({atk:'el Ataque',def:'la Defensa',spe:'la Velocidad',spa:'el At. Esp.',spd:'la Def. Esp.'}[q])).join('')+' (un solo uso).',golpeado:ck,seg:ck};
}
const _starf=m=>{if(bajoPS(m,OBJ_CFG2.baya.stat.u))comerBaya(m,'Baya Arabol',x=>{const k=['atk','def','spa','spd','spe'][Math.floor(rnd()*5)];stg(x,{[k]:2})})};
const _lansat=m=>{if(bajoPS(m,OBJ_CFG2.baya.stat.u))comerBaya(m,'Baya Zonlan',x=>{x.lansat=1})};
_o(0,{
 'starf-berry':{n:'Baya Arabol',i:'🍒',g:'Consumible',d:'Al bajar del 25 % de PS sube mucho una estadística al azar (un solo uso).',golpeado:_starf,seg:_starf},
 'lansat-berry':{n:'Baya Zonlan',i:'🍒',g:'Consumible',d:'Al bajar del 25 % de PS aumenta su probabilidad de crítico (un solo uso).',golpeado:_lansat,seg:_lansat,critEt(m){return m.lansat?2:0}},
 'enigma-berry':{n:'Baya Enigma',i:'🍇',g:'Consumible',d:'Si le golpea un ataque súper eficaz, cura el 25 % de sus PS (un solo uso).',
  golpeado(m,o){if(!sinCura(m)&&m.hp<m.max&&efTipo((o.last&&o.last.t)||'normal',m)>1)comerBaya(m,'Baya Enigma',x=>curaPS(x,.25,'#fde047'))}},
 'kee-berry':{n:'Baya Biglia',i:'🍇',g:'Consumible',d:'Si recibe un golpe físico sube su Defensa (un solo uso).',
  golpeado(m,o,d,prim){if(prim&&o.last&&o.last.cat==='phy')comerBaya(m,'Baya Biglia',x=>stg(x,{def:1}))}},
 'maranga-berry':{n:'Baya Maranga',i:'🍇',g:'Consumible',d:'Si recibe un golpe especial sube su Def. Esp. (un solo uso).',
  golpeado(m,o,d,prim){if(prim&&o.last&&o.last.cat==='spe')comerBaya(m,'Baya Maranga',x=>stg(x,{spd:1}))}},
 'jaboca-berry':{n:'Baya Jaboca',i:'🍇',g:'Consumible',d:'Si recibe un golpe físico, el atacante pierde el 12,5 % de sus PS (un solo uso).',
  golpeado(m,o,d,prim){if(prim&&o.last&&o.last.cat==='phy'&&!o.dead)comerBaya(m,'Baya Jaboca',()=>dotDano(o,OBJ_CFG2.baya.devuelve,'#f87171'))}},
 'rowap-berry':{n:'Baya Magua',i:'🍇',g:'Consumible',d:'Si recibe un golpe especial, el atacante pierde el 12,5 % de sus PS (un solo uso).',
  golpeado(m,o,d,prim){if(prim&&o.last&&o.last.cat==='spe'&&!o.dead)comerBaya(m,'Baya Magua',()=>dotDano(o,OBJ_CFG2.baya.devuelve,'#f87171'))}},
});
// ---- Bayas que reducen a la mitad un golpe súper eficaz de su tipo (Chilan: cualquier golpe Normal) ----
const B_TIPO=[['occa-berry','Baya Caoca','fire'],['passho-berry','Baya Pasio','water'],['wacan-berry','Baya Gualot','elec'],['rindo-berry','Baya Tamar','leaf'],
 ['yache-berry','Baya Rimoya','ice'],['chople-berry','Baya Pomaro','fighting'],['kebia-berry','Baya Kebia','poison'],['shuca-berry','Baya Acardo','ground'],
 ['coba-berry','Baya Kouba','flying'],['payapa-berry','Baya Payapa','psychic'],['tanga-berry','Baya Yecana','bug'],['charti-berry','Baya Alcho','rock'],
 ['kasib-berry','Baya Drasi','ghost'],['haban-berry','Baya Anjiro','dragon'],['colbur-berry','Baya Dillo','dark'],['babiri-berry','Baya Baribá','steel'],
 ['roseli-berry','Baya Hibis','fairy'],['chilan-berry','Baya Chilan','normal']];
for(const[k,n,t]of B_TIPO){
 OBJ_EQ[k]={n,i:'🫐',g:'Consumible',d:t==='normal'?'Reduce a la mitad el primer golpe Normal que recibe (un solo uso).':'Reduce a la mitad el primer golpe súper eficaz de ese tipo (un solo uso).',
  danoRec(m,o,tt){if(tt!==t||(t!=='normal'&&efTipo(tt,m)<=1)||(m.baya&&m.baya===1))return 1;
   const r=rivalDe(m);if(r&&gancho('bloqBaya',r))return 1;
   m.baya=1;comerBaya(m,n);return OBJ_CFG2.baya.reduce}};
}

// ---- Potenciadores de tipo (+20 %) ----
const O_TIPO=[['charcoal','Carbón','⚫','fire'],['mystic-water','Agua Mística','💧','water'],['magnet','Imán','🧲','elec'],['miracle-seed','Semilla Milagro','🌱','leaf'],
 ['never-melt-ice','Antiderretir','🧊','ice'],['black-belt','Cinturón Negro','🥋','fighting'],['poison-barb','Flecha Venenosa','☠️','poison'],['soft-sand','Arena Fina','🏖️','ground'],
 ['sharp-beak','Pico Afilado','🐦','flying'],['twisted-spoon','Cuchara Torcida','🥄','psychic'],['silver-powder','Polvo Plata','✨','bug'],['hard-stone','Piedra Dura','🪨','rock'],
 ['spell-tag','Hechizo','📜','ghost'],['black-glasses','Gafas de Sol','🕶️','dark'],['metal-coat','Revestimiento Metálico','⚙️','steel'],['silk-scarf','Pañuelo Seda','🧣','normal'],
 ['dragon-fang','Colmillo Dragón','🐉','dragon'],['fairy-feather','Pluma Hada','🪶','fairy'],['sea-incense','Incienso Marino','🪔','water'],['odd-incense','Incienso Raro','🪔','psychic'],
 ['rock-incense','Incienso Roca','🪔','rock'],['rose-incense','Incienso Floral','🪔','leaf'],['wave-incense','Incienso Aqua','🪔','water']];
const NT={fire:'Fuego',water:'Agua',elec:'Eléctrico',leaf:'Planta',ice:'Hielo',fighting:'Lucha',poison:'Veneno',ground:'Tierra',flying:'Volador',psychic:'Psíquico',bug:'Bicho',rock:'Roca',ghost:'Fantasma',dark:'Siniestro',steel:'Acero',normal:'Normal',dragon:'Dragón',fairy:'Hada'};
for(const[k,n,i,t]of O_TIPO)OBJ_EQ[k]={n,i,g:'Daño',d:`+20 % de daño en sus ataques de tipo ${NT[t]}.`,danoMul(m,tg,tt){return tt===t?OBJ_CFG2.tipo:1}};
// Joyas: +50 % en el primer ataque de su tipo, y se gastan
for(const t of Object.keys(NT))OBJ_EQ['gem-'+t]={n:'Joya '+NT[t],i:'💎',g:'Consumible',d:`+50 % de daño en su primer ataque de tipo ${NT[t]} (un solo uso).`,
 danoMul(m,tg,tt){if(tt!==t||m.gemaUsada)return 1;m.gemaUsada=1;gastarObj(m);return OBJ_CFG2.gema}};

// ---- Objetos de combate ----
const ELEG={'choice-band':['Cinta Elegida','🎀','phy','Ataque'],'choice-specs':['Gafas Elegidas','👓','spe','At. Esp.']};
for(const[k,[n,i,c,s]]of Object.entries(ELEG))OBJ_EQ[k]={n,i,g:'Daño',d:`+50 % de ${s}, pero se queda con el primer ataque que use durante todo el combate.`,elegido(){return 1},
 danoMul(m,tg,t,cat){return cat===c?OBJ_CFG2.elegido:1}};
OBJ_EQ['choice-scarf']={n:'Pañuelo Elegido',i:'🧣',g:'Velocidad',d:'+50 % de Velocidad, pero se queda con el primer ataque que use durante todo el combate.',elegido(){return 1},
 statMul(m,k){return k==='spe'?OBJ_CFG2.elegido:1}};
{const p0=plan;plan=function(m){   // Elegidos: tras el primer ataque solo usa ese; si está recargando, espera
  const L=gancho('elegido',m);
  if(L&&m.elegI!=null&&m.mv[m.elegI]){const v=m.mv[m.elegI];if(m.mc[m.elegI]>0){m.plan=null;return}if(wt(m,v,m.elegI)>0){m.plan=v;m.pi=m.elegI;return}}
  p0(m);if(L&&m.elegI==null&&m.plan)m.elegI=m.pi}}

_o(0,{
 'focus-sash':{n:'Banda Focus',i:'🎗️',g:'Consumible',d:'Si le van a debilitar desde los PS completos, se queda con 1 PS (un solo uso).',
  aguanta(m,o,d){if(m.hpAnt>=m.max-.5){gastarObj(m);return true}}},
 'focus-band':{n:'Cinta Focus',i:'🪢',g:'Defensa',d:'10 % de probabilidad de aguantar con 1 PS un golpe que le debilitaría.',aguanta(m){return rnd()<OBJ_CFG2.cinta}},
 'shell-bell':{n:'Campana Concha',i:'🔔',g:'Periódico',d:'Recupera el 12,5 % del daño que inflige.',
  daDano(m,tg,d,prim){if(prim&&m.hp<m.max&&!sinCura(m))curaPS(m,Math.min(1,d*OBJ_CFG2.concha/m.max),'#86efac')}},
 'black-sludge':{n:'Lodo Negro',i:'🟣',g:'Periódico',d:'Un Pokémon Veneno recupera PS cada segundo; el resto pierde PS.',
  seg(m){if(m.types.includes('poison')){if(m.hp<m.max&&!sinCura(m))curaPS(m,OBJ_CFG2.lodo,'#86efac')}else dotDano(m,OBJ_CFG2.lodoMal,'#c084fc')}},
 'rocky-helmet':{n:'Casco Dentado',i:'⛑️',g:'Contacto',d:'Quien le golpea con un ataque de contacto pierde el 16,7 % de sus PS.',
  golpeado(m,o,d,prim){if(prim&&!o.dead&&contactoReal(o))dotDano(o,OBJ_CFG2.casco,'#f87171')}},
 'protective-pads':{n:'Paracontacto',i:'🛡️',g:'Contacto',d:'Sus ataques no cuentan como de contacto.',sinContacto(){return true}},
 'safety-goggles':{n:'Gafas Protectoras',i:'🥽',g:'Inmunidad',d:'Inmune a los ataques de polvo y al daño de la arena y el granizo.',sinPolvo(){return true},sinClimaDano(){return true}},
 'weakness-policy':{n:'Seguro Debilidad',i:'📄',g:'Consumible',d:'Si le golpea un ataque súper eficaz, sube mucho su Ataque y At. Esp. (un solo uso).',
  golpeado(m,o){if(efTipo((o.last&&o.last.t)||'normal',m)>1){gastarObj(m);stg(m,{atk:2,spa:2})}}},
 'expert-belt':{n:'Cinta Experto',i:'🥉',g:'Daño',d:'+20 % de daño en los ataques súper eficaces.',danoMul(m,tg,t){return efTipo(t,tg)>1?OBJ_CFG2.expert:1}},
 'muscle-band':{n:'Cinta Fuerte',i:'💪',g:'Daño',d:'+10 % de daño en ataques físicos.',danoMul(m,tg,t,cat){return cat==='phy'?OBJ_CFG2.musc:1}},
 'wise-glasses':{n:'Gafas Especiales',i:'🤓',g:'Daño',d:'+10 % de daño en ataques especiales.',danoMul(m,tg,t,cat){return cat==='spe'?OBJ_CFG2.musc:1}},
 'assault-vest':{n:'Chaleco Asalto',i:'🦺',g:'Defensa',d:'+50 % de Def. Esp., pero no puede usar ataques de estado.',statMul(m,k){return k==='spd'?1.5:1},cancelaAtaque(m,p){return p.cat==='sta'}},
 'light-ball':{n:'Bola Luminosa',i:'🔆',g:'Especie',d:'Duplica el Ataque y el At. Esp. de Pikachu.',statMul(m,k){return m.t==='p25'&&(k==='atk'||k==='spa')?2:1}},
 'thick-club':{n:'Hueso Grueso',i:'🦴',g:'Especie',d:'Duplica el Ataque de Cubone y Marowak.',statMul(m,k){return(m.t==='p104'||m.t==='p105')&&k==='atk'?2:1}},
 'adamant-orb':{n:'Esfera Adamante',i:'🔶',g:'Especie',d:'Dialga: +20 % a sus ataques Dragón y Acero.',danoMul(m,tg,t){return m.t==='p483'&&(t==='dragon'||t==='steel')?1.2:1}},
 'lustrous-orb':{n:'Esfera Lustrosa',i:'⚪',g:'Especie',d:'Palkia: +20 % a sus ataques Dragón y Agua.',danoMul(m,tg,t){return m.t==='p484'&&(t==='dragon'||t==='water')?1.2:1}},
 'griseous-orb':{n:'Griseosfera',i:'🟡',g:'Especie',d:'Giratina: +20 % a sus ataques Dragón y Fantasma.',danoMul(m,tg,t){return m.t==='p487'&&(t==='dragon'||t==='ghost')?1.2:1}},
 'scope-lens':{n:'Periscopio',i:'🔭',g:'Crítico',d:'Aumenta la probabilidad de crítico.',critEt(){return 1}},
 'razor-claw':{n:'Garra Afilada',i:'🦞',g:'Crítico',d:'Aumenta la probabilidad de crítico.',critEt(){return 1}},
 'wide-lens':{n:'Lupa',i:'🔍',g:'Precisión',d:'+10 % de precisión en sus ataques.',accMul(){return 1.1}},
 'bright-powder':{n:'Polvo Brillo',i:'💫',g:'Precisión',d:'Los ataques rivales fallan un poco más.',accRec(){return .9}},
 'lax-incense':{n:'Incienso Suave',i:'🪔',g:'Precisión',d:'Los ataques rivales fallan un poco más.',accRec(){return .9}},
 'air-balloon':{n:'Globo Helio',i:'🎈',g:'Inmunidad',d:'Inmune a los ataques de Tierra hasta que recibe un golpe.',inmune(m,t){return t==='ground'},
  golpeado(m,o,d){if(d>0){gastarObj(m);txt.push({x:m.x,y:m.y-56,s:'¡Globo reventado!',c:'#fda4af',l:1.2,sm:1})}}},
 'white-herb':{n:'Hierba Blanca',i:'🌿',g:'Consumible',d:'Restaura las estadísticas que le hayan bajado (un solo uso).',
  seg(m){if(Object.values(m.stg).some(x=>x<0)){gastarObj(m);for(const k in m.stg)if(m.stg[k]<0)m.stg[k]=0;txt.push({x:m.x,y:m.y-56,s:'¡Hierba Blanca!',c:'#bbf7d0',l:1.2,sm:1})}}},
 'absorb-bulb':{n:'Bulbo',i:'🧅',g:'Consumible',d:'Si le golpea un ataque de Agua sube su At. Esp. (un solo uso).',golpeado(m,o){if(o.last&&o.last.t==='water'){gastarObj(m);stg(m,{spa:1})}}},
 'cell-battery':{n:'Pila',i:'🔋',g:'Consumible',d:'Si le golpea un ataque Eléctrico sube su Ataque (un solo uso).',golpeado(m,o){if(o.last&&o.last.t==='elec'){gastarObj(m);stg(m,{atk:1})}}},
 'luminous-moss':{n:'Musgo Brillante',i:'🍀',g:'Consumible',d:'Si le golpea un ataque de Agua sube su Def. Esp. (un solo uso).',golpeado(m,o){if(o.last&&o.last.t==='water'){gastarObj(m);stg(m,{spd:1})}}},
 'snowball':{n:'Bola de Nieve',i:'⛄',g:'Consumible',d:'Si le golpea un ataque de Hielo sube su Ataque (un solo uso).',golpeado(m,o){if(o.last&&o.last.t==='ice'){gastarObj(m);stg(m,{atk:1})}}},
 'clear-amulet':{n:'Amuleto Puro',i:'🧿',g:'Estadísticas',d:'Los rivales no pueden bajarle las estadísticas.',cambioStat(m,v,k,aj){return aj&&v<0?0:undefined}},
 'covert-cloak':{n:'Capa Furtiva',i:'🧥',g:'Precisión y crítico',d:'Los efectos secundarios de los ataques recibidos no le afectan.',secRec(tg,s){if(!s||!(s.a||s.f||s.so))return undefined;const{a,pa,f,so,...r}=s;return Object.keys(r).length?r:null}},
 'flame-orb':{n:'Orbe Llama',i:'🔥',g:'Estado',d:'A los pocos segundos de empezar el combate se quema (útil con Agallas).',
  seg(m){m.orbT=(m.orbT||0)+1;if(m.orbT>=OBJ_CFG2.orbe.retraso&&!m.orbOk&&!m.ail){m.orbOk=1;aplicarEst(m,'brn',m)}}},
 'toxic-orb':{n:'Orbe Tóxico',i:'☣️',g:'Estado',d:'A los pocos segundos de empezar el combate se envenena gravemente.',
  seg(m){m.orbT=(m.orbT||0)+1;if(m.orbT>=OBJ_CFG2.orbe.retraso&&!m.orbOk&&!m.ail){m.orbOk=1;aplicarEst(m,'tox',m)}}},
});