// OBJETOS EQUIPADOS · TANDA 4: el resto de objetos de combate (piedras de clima, Refleluz, Bola Férrea, Roca del Rey, Hierba Mental,
// Hierba Única, Garra Rápida, Cola Plúmbea, Metrónomo, Lupa Zoom, Púas Pegajosas, tablas de Arceus como potenciadores de tipo...).
// Va DESPUÉS de habilidades-objetos.js. Ajustes de ritmo en OBJ_CFG4.
// Además: los objetos de especie (Bola Luminosa, Hueso Grueso, esferas...) reconocen ya a la especie también en el gacha (antes miraban la clave 'p25').
const OBJ_CFG4={roca:10,refleluz:1.6,garra:1.6,raiz:1.3,amedrenta:.1,cola:1.25,garraRapida:{p:.2,cd:.5},metronomo:{sube:.2,max:1},
 zoom:1.2,pegajosas:.031,zumo:{u:.5,f:.2},tabla:1.2};
const avisoX=(m,s,c)=>txt.push({x:m.x,y:m.y-56,s,c:c||'#fde68a',l:1.3,sm:1});
// Número de especie de un luchador (simulador: clave 'p25' · gacha/eventos: se saca del sprite)
function especieDe(m){if(!m)return 0;const t=m.t;let r=/^p(\d+)$/.exec(t);if(r)return+r[1];const I=TY[t]&&TY[t].img;r=I&&/\/(\d+)\.(png|gif)/.exec(I);return r?+r[1]:0}
const deEspecie=(m,...ids)=>ids.includes(especieDe(m));

// ---- Clima y pantallas más largos ----
{const p0=ponerCampo;ponerCampo=function(tipo,k,m){p0(tipo,k,m);alarga(tipo,k,m)}}
{const c0=campoHab;campoHab=function(tipo,k,m){c0(tipo,k,m);alarga(tipo,k,m)}}
function alarga(tipo,k,m){const c=tipo==='cl'?campo._cl:campo[tipo];if(!m||!c||c.k!==k||!isFinite(c.l)||c.extra)return;
 const e=ganchoSum('extraCampo',m,tipo,k);if(e>0){c.l+=e;c.extra=1}}
const ROCA={'damp-rock':['Roca Lluvia','🌧️','rain','la lluvia'],'heat-rock':['Roca Calor','☀️','sun','el sol'],'icy-rock':['Roca Helada','🧊','hail','el granizo y la nieve'],'smooth-rock':['Roca Lisa','🏜️','sand','la tormenta de arena']};
for(const[k,[n,i,cl,txt_]]of Object.entries(ROCA))OBJ_EQ[k]={n,i,g:'Campo',d:`Si pone ${txt_}, dura ${OBJ_CFG4.roca} s más.`,extraCampo(m,tipo,kk){return tipo==='cl'&&kk===cl?OBJ_CFG4.roca:0}};
// Púas de agarre: el que lo atrapa (Garra Garfio) alarga Atrapado · Destino: comparte el enamoramiento
{const a0=aplicarEst;aplicarEst=function(m,k,por,aviso){const r=a0(m,k,por,aviso);
 if(r&&por&&por!==m&&k==='trap'&&m.vol&&m.vol.trap&&gancho('atrapaLargo',por))m.vol.trap.l*=OBJ_CFG4.garra;
 return r}}

Object.assign(OBJ_EQ,{
 'light-clay':{n:'Refleluz',i:'🟫',g:'Campo',d:'Reflejo, Pantalla de Luz y Velo Aurora le duran un 60 % más.',durEst(m,k){return['reflect','lscreen','aveil'].includes(k)?OBJ_CFG4.refleluz:1}},
 'grip-claw':{n:'Garra Garfio',i:'🪝',g:'Estado',d:'Cuando atrapa al rival, Atrapado le dura un 60 % más.',atrapaLargo(){return true}},
 'destiny-knot':{n:'Lazo Destino',i:'🎀',g:'Estado',d:'Si le enamoran, quien lo hizo también se enamora.',alEstado(m,k,por){if(k==='inf'&&por&&por!==m&&!por.dead)aplicarEst(por,'inf',m)}},
 'big-root':{n:'Raíz Grande',i:'🌱',g:'Periódico',d:'Los ataques que drenan PS le curan un 30 % más.',raizGrande(){return true}},
 'shed-shell':{n:'Muda Concha',i:'🐚',g:'Inmunidad',d:'No le afecta "Sin escape" (Mal de Ojo, Bloqueo, Telaraña...).',sinEstado(m,k){return k==='net'}},
 'iron-ball':{n:'Bola Férrea',i:'⚫',g:'Velocidad',d:'Velocidad a la mitad y los ataques de Tierra le alcanzan aunque vuele o levite.',statMul(m,k){return k==='spe'?.5:1},bolaFerrea(){return true}},
 'kings-rock':{n:'Roca del Rey',i:'👑',g:'Daño',d:'Sus ataques pueden amedrentar al rival (10 %).',daDano(o,tg,d,prim){if(prim&&!tg.dead&&rnd()<OBJ_CFG4.amedrenta)amedrentar(tg)}},
 'razor-fang':{n:'Colmillo Agudo',i:'🦷',g:'Daño',d:'Sus ataques pueden amedrentar al rival (10 %).',daDano(o,tg,d,prim){if(prim&&!tg.dead&&rnd()<OBJ_CFG4.amedrenta)amedrentar(tg)}},
 'lagging-tail':{n:'Cola Plúmbea',i:'🐌',g:'Velocidad',d:'Tarda un 25 % más en volver a atacar.',cdMul(){return OBJ_CFG4.cola}},
 'full-incense':{n:'Incienso Lento',i:'🪔',g:'Velocidad',d:'Tarda un 25 % más en volver a atacar.',cdMul(){return OBJ_CFG4.cola}},
 'quick-claw':{n:'Garra Rápida',i:'🐾',g:'Velocidad',d:'20 % de probabilidad de poder atacar otra vez mucho antes.',cdMul(m){if(rnd()<OBJ_CFG4.garraRapida.p){avisoX(m,'¡Garra Rápida!');return OBJ_CFG4.garraRapida.cd}return 1}},
 'metronome':{n:'Metrónomo',i:'⏱️',g:'Daño',d:'Si repite el mismo ataque seguido, hace un 20 % más cada vez (hasta +100 %).',danoMul(o){return 1+Math.min(OBJ_CFG4.metronomo.max,OBJ_CFG4.metronomo.sube*(o.metroN||0))}},
 'zoom-lens':{n:'Telescopio',i:'🔎',g:'Precisión',d:'+20 % de precisión si el rival ya ha atacado.',accMul(o,tg){return tg&&tg.cd>.5?OBJ_CFG4.zoom:1}},
 'mental-herb':{n:'Hierba Mental',i:'🌿',g:'Consumible',d:'Cura Enamorado, Mofa, Otra Vez, Tormento, Anulación y Cura Bloqueada al instante (un solo uso).',
  seg(m){mental(m)},alEstado(m){mental(m)}},
 'power-herb':{n:'Hierba Única',i:'🌾',g:'Consumible',d:'Su primer ataque de dos turnos (Rayo Solar, Excavar...) sale sin cargar (un solo uso).',hierbaUnica(){return true}},
 'sticky-barb':{n:'Toxiestrella',i:'🌵',g:'Periódico',d:'Le hiere cada segundo; si le golpean con contacto, se le pega al atacante.',
  seg(m){dotDano(m,OBJ_CFG4.pegajosas,'#a3e635')},
  golpeado(m,o,d,prim){if(prim&&!o.dead&&!o.obj&&contactoReal(o)){const r=quitarObj(m);darObj(o,r.k,r.d);avisoX(o,'¡Se le pega la '+nomObj(r.k)+'!','#a3e635')}}},
 'berry-juice':{n:'Zumo de Baya',i:'🧃',g:'Consumible',d:'Al bajar de la mitad de PS cura el '+Math.round(OBJ_CFG4.zumo.f*100)+' % (un solo uso).',
  golpeado(m){zumo(m)},seg(m){zumo(m)}},
 // ---- de especie ----
 'deep-sea-tooth':{n:'Diente Marino',i:'🦷',g:'Especie',d:'Duplica el At. Esp. de Clamperl.',statMul(m,k){return k==='spa'&&deEspecie(m,366)?2:1}},
 'deep-sea-scale':{n:'Escama Marina',i:'🐟',g:'Especie',d:'Duplica la Def. Esp. de Clamperl.',statMul(m,k){return k==='spd'&&deEspecie(m,366)?2:1}},
 'metal-powder':{n:'Polvo Metálico',i:'⚙️',g:'Especie',d:'Duplica la Defensa de Ditto (si no se ha transformado).',statMul(m,k){return k==='def'&&deEspecie(m,132)&&!m.tfDone?2:1}},
 'quick-powder':{n:'Polvo Veloz',i:'💨',g:'Especie',d:'Duplica la Velocidad de Ditto (si no se ha transformado).',statMul(m,k){return k==='spe'&&deEspecie(m,132)&&!m.tfDone?2:1}},
 'lucky-punch':{n:'Puño Suerte',i:'🥊',g:'Especie',d:'Chansey: golpes críticos mucho más probables.',critEt(m){return deEspecie(m,113)?2:0}},
 'stick':{n:'Puerro',i:'🥬',g:'Especie',d:"Farfetch'd y Sirfetch'd: golpes críticos mucho más probables.",critEt(m){return deEspecie(m,83,865)?2:0}},
 'soul-dew':{n:'Rocío Bondad',i:'💧',g:'Especie',d:'Latias y Latios: +20 % a sus ataques Psíquico y Dragón.',danoMul(m,tg,t){return deEspecie(m,380,381)&&(t==='psychic'||t==='dragon')?1.2:1}},
});
// Los de especie que ya existían, con la especie bien reconocida en el gacha
OBJ_EQ['light-ball'].statMul=(m,k)=>deEspecie(m,25)&&(k==='atk'||k==='spa')?2:1;
OBJ_EQ['thick-club'].statMul=(m,k)=>deEspecie(m,104,105)&&k==='atk'?2:1;
OBJ_EQ['adamant-orb'].danoMul=(m,tg,t)=>deEspecie(m,483)&&(t==='dragon'||t==='steel')?1.2:1;
OBJ_EQ['lustrous-orb'].danoMul=(m,tg,t)=>deEspecie(m,484)&&(t==='dragon'||t==='water')?1.2:1;
OBJ_EQ['griseous-orb'].danoMul=(m,tg,t)=>deEspecie(m,487)&&(t==='dragon'||t==='ghost')?1.2:1;

// ---- Tablas de Arceus: de momento, potenciadores de tipo (+20 %). Cuando haya formas, Arceus cambiará de tipo con ellas ----
const TABLAS={'draco-plate':['Tabla Draco','dragon'],'dread-plate':['Tabla Oscura','dark'],'earth-plate':['Tabla Terrax','ground'],'fist-plate':['Tabla Fuerte','fighting'],
 'flame-plate':['Tabla Llama','fire'],'icicle-plate':['Tabla Helada','ice'],'insect-plate':['Tabla Bicho','bug'],'iron-plate':['Tabla Acero','steel'],
 'meadow-plate':['Tabla Pradal','leaf'],'mind-plate':['Tabla Mental','psychic'],'pixie-plate':['Tabla Duende','fairy'],'sky-plate':['Tabla Cielo','flying'],
 'splash-plate':['Tabla Linfa','water'],'spooky-plate':['Tabla Terror','ghost'],'stone-plate':['Tabla Pétrea','rock'],'toxic-plate':['Tabla Tóxica','poison'],'zap-plate':['Tabla Trueno','elec']};
for(const[k,[n,t]]of Object.entries(TABLAS))OBJ_EQ[k]={n,i:'🪧',g:'Daño',d:`+20 % de daño en sus ataques de tipo ${NT[t]}.`,danoMul(m,tg,tt){return tt===t?OBJ_CFG4.tabla:1}};

// ---- Lógica de apoyo ----
function mental(m){const V=m.vol;if(!V||!m.obj)return;const ks=['inf','taunt','encore','torment','disable','hblock'].filter(k=>V[k]);if(!ks.length)return;
 gastarObj(m);for(const k of ks)delete V[k];avisoX(m,'¡Hierba Mental!','#bbf7d0')}
function zumo(m){if(m.dead||!m.obj||m.hp<=0||m.hp>m.max*OBJ_CFG4.zumo.u||m.hp>=m.max||(m.vol&&m.vol.hblock))return;
 gastarObj(m);curaPS(m,OBJ_CFG4.zumo.f,'#fde047');avisoX(m,'¡Zumo de Baya!','#fde047')}
// Bola Férrea: Tierra le alcanza aunque sea Volador, levite o lleve Levitación/Globo
{const e0=efTipo;efTipo=function(t,tg){if(t!=='ground'||!gancho('bolaFerrea',tg))return e0(t,tg);
 return tEff('ground',tg.types.filter(x=>x!=='flying'))}}
// Raíz Grande: drenaje de los ataques +30 %
{const s0=secundarios;secundarios=function(s,o,tg,d,primero){if(s&&s.dr>0&&o&&gancho('raizGrande',o))s={...s,dr:s.dr*OBJ_CFG4.raiz};return s0(s,o,tg,d,primero)}}
// Al lanzar un ataque: Metrónomo (cuenta repeticiones), Hierba Única (sin cargar) y Garra Rápida / Cola Plúmbea (recarga)
{const a0=atk;atk=function(m){
 const p=m.plan;
 if(p&&p.cat!=='sta'){const id=p.key||p.n;m.metroN=m.metroK===id?(m.metroN||0)+1:0;m.metroK=id}
 if(p&&p.dt&&m.dtDone!==p&&gancho('hierbaUnica',m)){const c=campo.cl&&campo.cl.k;
  if(!((p.dt.sun&&c==='sun')||(p.dt.rain&&c==='rain'))){gastarObj(m);m.dtDone=p;avisoX(m,'¡Hierba Única!','#bbf7d0')}}
 const r=a0(m);
 {const k=ganchoMul('cdMul',m);if(k!==1&&m.cd>0)m.cd*=k}
 return r}}
