// HABILIDADES · familia RARAS: manipulación de habilidades (con sus ataques), Transformación, cambio de tipo, clima extremo y otras.
// Se registran en HAB. Aquí viven también cambioHabilidad() (Gastroácido, Intercambio de Habilidad, Imitación, Doodle, Entrainment, Abono Atrapado, Simple Rayo)
// y transformar() (Transformación e Impostor); los ataques están en EFX (datos/ataques-especiales.js) con las claves hb y tf, y estados.js los aplica.
// Límite conocido: los ataques con animación propia (CUSTOM: Hiperrayo, Gigaimpacto...) no cambian de tipo con Aerilato y similares.
// Aproximación: Amor Filial (Parental Bond) hace +25 % de daño en vez de un segundo golpe.
const avisoR=(m,s,c)=>txt.push({x:m.x,y:m.y-56,s,c:c||'#e9d5ff',l:1.3,sm:1});
// Poner una habilidad nueva a un luchador: se anula el "apagado" y su efecto de entrada vuelve a saltar
function ponerHab(x,h){x.hab=h;x.habOff=0;x.hkE=0;x.hbN=0}
const cambiable=h=>!h||!NO_CAMBIO.includes(h);
function cambioHabilidad(m,tg,k){
 let ok=false;
 if(k==='off'){if(tg.hab&&!tg.habOff&&cambiable(tg.hab)){tg.habOff=1;ok=true;avisoR(tg,'¡Habilidad anulada!','#fca5a5')}}
 else if(k==='swap'){if(m.hab&&tg.hab&&cambiable(m.hab)&&cambiable(tg.hab)){const a=m.hab,b=tg.hab;ponerHab(m,b);ponerHab(tg,a);ok=true;avisoR(m,'¡Intercambio de habilidad!')}}
 else if(k==='copy'){if(tg.hab&&cambiable(tg.hab)&&cambiable(m.hab)&&tg.hab!==m.hab){ponerHab(m,tg.hab);ok=true;avisoR(m,'¡Copia la habilidad!')}}
 else if(k==='give'){if(m.hab&&cambiable(m.hab)&&cambiable(tg.hab)&&tg.hab!==m.hab){ponerHab(tg,m.hab);ok=true;avisoR(tg,'¡Nueva habilidad!')}}
 else if(k.startsWith('set:')){const h=k.slice(4);if(cambiable(tg.hab)&&tg.hab!==h){ponerHab(tg,h);ok=true;avisoR(tg,'¡Nueva habilidad!')}}
 if(!ok)fallo(m);
 return ok;
}
// Transformación: tipos, estadísticas (menos PS), cambios de estadísticas, ataques, habilidad y aspecto del rival
function transformar(m,o){
 if(m.tfDone||!o||o.dead){fallo(m);return false}
 m.tfDone=1;m.types=[...o.types];
 for(const k of['atk','def','spa','spd','spe'])m.st[k]=o.st[k];
 m.stg={...o.stg};m.spd=o.spd;
 m.mv=o.mv.map(v=>({...v}));m.mc=m.mv.map(v=>v.u?3:0);m.us={};m.pi=null;m.plan=null;
 if(o.hab&&cambiable(o.hab))ponerHab(m,o.hab);
 m.sprT=o.sprT||o.t;
 avisoR(m,'¡Transformación!','#e9d5ff');ring(m.x,m.y,'#e9d5ff',55,.6);
 return true;
}
const hAte=(nom,t,d)=>({n:nom,g:'Cambio de tipo',d,tipoAtq(m,tt,p){return tt==='normal'&&p.cat!=='sta'&&!p.cu?t:tt},danoMul(o){return mvDe(o).cv?1.2:1}});
const hExtremo=(nom,k,d)=>({n:nom,g:'Clima extremo',d,entra(m){campo.cl={k,l:Infinity,x:1,por:m};avisoR(m,'¡'+nom+'!','#fde047');log(nom)}});
const hPrioridad=(nom)=>({n:nom,g:'Inmunidad',d:'Los ataques con prioridad del rival no le afectan.',rompible:1,
 absorbe(m,o,t,e,prim){if(!((o.last||{}).pr>0))return false;if(prim)avisoR(m,'No afecta','#e2e8f0');return true}});
const hNada=(nom,d)=>({n:nom,g:'Sin efecto en 1 contra 1',d:d||'Solo tiene efecto en combates dobles o fuera del combate: aquí no hace nada.',nada:1});
Object.assign(HAB,{
 // ---------- Transformación ----------
 'imposter':{n:'Impostor',g:'Transformación',d:'Al entrar, se transforma en el rival.',entra(m){const o=rivalDe(m);if(!o)return'espera';transformar(m,o)}},

 // ---------- Cambio de tipo del ataque ----------
 'aerilate':hAte('Piel Celeste','flying','Sus ataques Normal pasan a ser Volador y hacen +20 %.'),
 'pixilate':hAte('Piel Feérica','fairy','Sus ataques Normal pasan a ser Hada y hacen +20 %.'),
 'refrigerate':hAte('Piel Helada','ice','Sus ataques Normal pasan a ser Hielo y hacen +20 %.'),
 'galvanize':hAte('Piel Eléctrica','elec','Sus ataques Normal pasan a ser Eléctrico y hacen +20 %.'),
 'normalize':{n:'Normalidad',g:'Cambio de tipo',d:'Todos sus ataques pasan a ser de tipo Normal y hacen +20 %.',tipoAtq(m,tt,p){return tt!=='normal'&&p.cat!=='sta'&&!p.cu?'normal':tt},danoMul(o){return mvDe(o).cv?1.2:1}},
 'liquid-voice':{n:'Voz Fluida',g:'Cambio de tipo',d:'Sus ataques de sonido pasan a ser de tipo Agua.',tipoAtq(m,tt,p){return esSonidoMv(p)&&!p.cu?'water':tt}},
 'protean':{n:'Mutatipo',g:'Cambio de tipo',d:'Cambia su tipo al del ataque que va a usar.',tipoAtq(m,tt){if(!(m.types.length===1&&m.types[0]===tt)){m.types=[tt];avisoR(m,'¡Mutatipo!')}return tt}},
 'libero':{n:'Líbero',g:'Cambio de tipo',d:'Cambia su tipo al del ataque que va a usar.',tipoAtq(m,tt){if(!(m.types.length===1&&m.types[0]===tt)){m.types=[tt];avisoR(m,'¡Líbero!')}return tt}},
 'mimicry':{n:'Mimetismo',g:'Cambio de tipo',d:'Su tipo cambia según el terreno (eléctrico, hierba, niebla, psíquico).',
  entra(m){m.mimOrig=[...m.types]},
  seg(m){if(!m.mimOrig)m.mimOrig=[...m.types];const t={elec:'elec',leaf:'leaf',mist:'fairy',psy:'psychic'}[campo.te&&campo.te.k];const nuevo=t?[t]:[...m.mimOrig];if(nuevo.join()!==m.types.join()){m.types=nuevo;avisoR(m,'¡Mimetismo!')}}},

 // ---------- Clima extremo ----------
 'desolate-land':hExtremo('Tierra del Ocaso','sun','Sol abrasador mientras esté en combate: el Fuego hace +50 %, los ataques de Agua se evaporan y nada lo cambia.'),
 'primordial-sea':hExtremo('Mar del Albor','rain','Lluvia torrencial mientras esté en combate: el Agua hace +50 %, los ataques de Fuego se apagan y nada lo cambia.'),
 'delta-stream':hExtremo('Ráfaga Delta','delta','Viento fuerte mientras esté en combate: el tipo Volador pierde sus debilidades y nada cambia el clima.'),

 // ---------- Otras ----------
 'skill-link':{n:'Encadenado',g:'Daño',d:'Sus ataques de varios golpes dan siempre el máximo de golpes.',hitsMax(){return true}},
 'parental-bond':{n:'Amor Filial',g:'Daño',d:'Sus ataques de un solo golpe hacen +25 % de daño (aproximación del segundo golpe).',danoMul(o){const v=mvDe(o);return v.p>0&&!v.hits&&!v.rep?1.25:1}},
 'victory-star':{n:'Estrella Victoria',g:'Precisión y crítico',d:'Sus ataques aciertan un 10 % más.',accMul(){return 1.1}},
 'queenly-majesty':hPrioridad('Regia Presencia'),'dazzling':hPrioridad('Cuerpo Vívido'),'armor-tail':hPrioridad('Cola Armadura'),
});
// Habilidades sin efecto en un combate 1 contra 1 (dobles o fuera de combate): se registran para que cuenten como disponibles
for(const [k,n] of Object.entries({'run-away':'Fuga','honey-gather':'Recogemiel','ball-fetch':'Recogebolas','illuminate':'Iluminación','friend-guard':'Guardia Amiga','healer':'Sanador','telepathy':'Telepatía','plus':'Más','minus':'Menos','power-spot':'Fuente Energía','battery':'Batería','flower-veil':'Velo Flor','steely-spirit':'Alma Acerada','symbiosis':'Simbiosis','receiver':'Receptor','power-of-alchemy':'Reacción Química','costar':'Unión','hospitality':'Hospitalidad','curious-medicine':'Medicina Extraña'}))HAB[k]=hNada(n);