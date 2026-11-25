// HABILIDADES · familia DAÑO: potenciadores y reductores (daño, estadísticas, precisión, críticos y efectos secundarios).
// Se registran en HAB (habilidades.js). Para añadir una: un bloque más en el Object.assign de abajo.
// Convenciones: el ataque en curso es o.last (ver ganchos.js); "contacto" = ataque cuerpo a cuerpo (tk:1 o est 'contacto');
// los tipos usan los códigos del juego (elec, leaf...); "al límite de PS" = PS ≤ 1/3 del máximo.
const L_PUNO=['mach-punch','bullet-punch','comet-punch','dizzy-punch','drain-punch','dynamic-punch','fire-punch','focus-punch','hammer-arm','ice-hammer','ice-punch','mega-punch','meteor-mash','plasma-fists','power-up-punch','shadow-punch','sky-uppercut','thunder-punch','sucker-punch','jet-punch','rage-fist'];
const L_MORD=['bite','crunch','fire-fang','ice-fang','thunder-fang','poison-fang','psychic-fangs','hyper-fang','jaw-lock','fishious-rend'];
const L_PULSO=['aura-sphere','dark-pulse','dragon-pulse','heal-pulse','origin-pulse','water-pulse','terrain-pulse'];
const L_CORTE=['air-cutter','air-slash','aerial-ace','aqua-cutter','behemoth-blade','bitter-blade','ceaseless-edge','cross-poison','cut','fury-cutter','kowtow-cleave','leaf-blade','night-slash','population-bomb','psyblade','psycho-cut','razor-leaf','razor-shell','sacred-sword','secret-sword','slash','solar-blade','stone-axe','tachyon-cutter','x-scissor','mighty-cleave'];
const mvDe=o=>o.last||{};
const esContacto=mv=>mv.tk===1||mv.est==='contacto';
const esSonidoMv=mv=>typeof SONIDO!=='undefined'&&SONIDO.includes(mv.key);
const secEfecto=s=>!!(s&&(s.a||s.f||s.so||s.ss));
const climaEs=k=>!!(campo.cl&&campo.cl.k===k);
// Fábricas de patrones repetidos
const hLista=(lista,x)=>({danoMul(o){return lista.includes(mvDe(o).key)?x:1}});                    // x al daño de los ataques de una lista
const hTipo=(t,x)=>({danoMul(o,tg,tt){return tt===t?x:1}});                                         // x al daño de un tipo
const hLimite=t=>({danoMul(o,tg,tt){return tt===t&&o.hp<=o.max/3?1.5:1}});                          // x1,5 a un tipo con pocos PS
const hRecTipo=(t,x)=>({danoRec(tg,o,tt){return tt===t?x:1}});                                      // x al daño recibido de un tipo
const hVelClima=c=>({statMul(m,k){return k==='spe'&&climaEs(c)?2:1}});                               // velocidad x2 con un clima
Object.assign(HAB,{
 // ---------- Potenciadores del daño que hace ----------
 'technician':{n:'Técnico',g:'Daño',d:'Los ataques de poder 60 o menos hacen +50 % de daño.',danoMul(o){const p=mvDe(o).p;return p>0&&p<=60?1.5:1}},
 'adaptability':{n:'Adaptable',g:'Daño',d:'El bonus por ataque del propio tipo pasa de x1,5 a x2.',danoMul(o,tg,t){return o.types.includes(t)?2/1.5:1}},
 'sheer-force':{n:'Potencia Bruta',g:'Daño',d:'+30 % de daño en ataques con efecto secundario, pero pierden ese efecto.',
  danoMul(o){return secEfecto(mvDe(o).sec)?1.3:1},
  secMod(o,s){if(!secEfecto(s))return undefined;const{a,pa,f,so,ss,ps,...r}=s;return Object.keys(r).length?r:null}},
 'iron-fist':{n:'Puño Férreo',g:'Daño',d:'+20 % de daño en los ataques de puño.',...hLista(L_PUNO,1.2)},
 'strong-jaw':{n:'Mandíbula Fuerte',g:'Daño',d:'+50 % de daño en los mordiscos.',...hLista(L_MORD,1.5)},
 'mega-launcher':{n:'Megadisparador',g:'Daño',d:'+50 % de daño en los ataques de pulso.',...hLista(L_PULSO,1.5)},
 'sharpness':{n:'Cortante',g:'Daño',d:'+50 % de daño en los ataques cortantes.',...hLista(L_CORTE,1.5)},
 'tough-claws':{n:'Garra Dura',g:'Daño',d:'+30 % de daño en los ataques de contacto.',danoMul(o){return esContacto(mvDe(o))?1.3:1}},
 'reckless':{n:'Audaz',g:'Daño',d:'+20 % de daño en los ataques con retroceso.',danoMul(o){const s=mvDe(o).sec;return s&&s.dr<0?1.2:1}},
 'punk-rock':{n:'Punk Rock',g:'Daño',d:'+30 % de daño en ataques de sonido y recibe la mitad de los de sonido.',
  danoMul(o){return esSonidoMv(mvDe(o))?1.3:1},danoRec(tg,o){return esSonidoMv(mvDe(o))?.5:1}},
 'tinted-lens':{n:'Cromolente',g:'Daño',d:'Los ataques poco eficaces hacen el doble.',danoMul(o,tg,t){return efTipo(t,tg)<1?2:1}},
 'neuroforce':{n:'Neuroforza',g:'Daño',d:'+25 % de daño en los ataques superefectivos.',danoMul(o,tg,t){return efTipo(t,tg)>1?1.25:1}},
 'overgrow':{n:'Espesura',g:'Daño',d:'+50 % a los ataques Planta con pocos PS.',...hLimite('leaf')},
 'blaze':{n:'Mar Llamas',g:'Daño',d:'+50 % a los ataques Fuego con pocos PS.',...hLimite('fire')},
 'torrent':{n:'Torrente',g:'Daño',d:'+50 % a los ataques Agua con pocos PS.',...hLimite('water')},
 'swarm':{n:'Enjambre',g:'Daño',d:'+50 % a los ataques Bicho con pocos PS.',...hLimite('bug')},
 'rocky-payload':{n:'Transportarrocas',g:'Daño',d:'+50 % a los ataques de tipo Roca.',...hTipo('rock',1.5)},
 'steelworker':{n:'Acero Templado',g:'Daño',d:'+50 % a los ataques de tipo Acero.',...hTipo('steel',1.5)},
 'transistor':{n:'Transistor',g:'Daño',d:'+50 % a los ataques de tipo Eléctrico.',...hTipo('elec',1.5)},
 'dragons-maw':{n:'Mandíbula Dragón',g:'Daño',d:'+50 % a los ataques de tipo Dragón.',...hTipo('dragon',1.5)},
 'sand-force':{n:'Poder Arena',g:'Daño',d:'Con tormenta de arena, +30 % a los ataques de Roca, Tierra y Acero.',danoMul(o,tg,t){return climaEs('sand')&&['rock','ground','steel'].includes(t)?1.3:1}},
 'water-bubble':{n:'Pompa',g:'Daño',d:'Sus ataques de Agua hacen el doble y recibe la mitad de los de Fuego.',...hTipo('water',2),...hRecTipo('fire',.5)},

 // ---------- Estadísticas ----------
 'huge-power':{n:'Potencia',g:'Estadísticas',d:'El Ataque se duplica.',statMul(m,k){return k==='atk'?2:1}},
 'pure-power':{n:'Energía Pura',g:'Estadísticas',d:'El Ataque se duplica.',statMul(m,k){return k==='atk'?2:1}},
 'guts':{n:'Agallas',g:'Estadísticas',d:'Con un estado alterado, el Ataque sube un 50 % (y la quemadura no lo reduce).',statMul(m,k){return k==='atk'&&m.ail?(m.ail.k==='brn'?3:1.5):1}},
 'hustle':{n:'Entusiasmo',g:'Estadísticas',d:'+50 % de Ataque, pero los ataques físicos aciertan un 20 % menos.',statMul(m,k){return k==='atk'?1.5:1},accMul(o,tg,p){return p.cat==='phy'?.8:1}},
 'marvel-scale':{n:'Escama Especial',g:'Estadísticas',d:'Con un estado alterado, la Defensa sube un 50 %.',statMul(m,k){return k==='def'&&m.ail?1.5:1}},
 'fur-coat':{n:'Pelaje Recio',g:'Estadísticas',d:'La Defensa se duplica.',statMul(m,k){return k==='def'?2:1}},
 'quick-feet':{n:'Pies Rápidos',g:'Estadísticas',d:'Con un estado alterado, la Velocidad sube un 50 % (y la parálisis no la reduce).',statMul(m,k){return k==='spe'&&m.ail?(m.ail.k==='par'?3:1.5):1}},
 'flare-boost':{n:'Ígnea',g:'Estadísticas',d:'Quemado, el At. Esp. sube un 50 %.',statMul(m,k){return k==='spa'&&m.ail&&m.ail.k==='brn'?1.5:1}},
 'toxic-boost':{n:'Ímpetu Tóxico',g:'Estadísticas',d:'Envenenado, el Ataque sube un 50 %.',statMul(m,k){return k==='atk'&&m.ail&&(m.ail.k==='psn'||m.ail.k==='tox')?1.5:1}},
 'defeatist':{n:'Derrotista',g:'Estadísticas',d:'Con la mitad de PS o menos, Ataque y At. Esp. se reducen a la mitad.',statMul(m,k){return(k==='atk'||k==='spa')&&m.hp<=m.max/2?.5:1}},
 'slow-start':{n:'Inicio Lento',g:'Estadísticas',d:'Durante los primeros 15 s, Ataque y Velocidad a la mitad.',seg(m){m.hAge=(m.hAge||0)+1},statMul(m,k){return(k==='atk'||k==='spe')&&(m.hAge||0)<15?.5:1}},
 'swift-swim':{n:'Nado Rápido',g:'Estadísticas',d:'Con lluvia, la Velocidad se duplica.',...hVelClima('rain')},
 'chlorophyll':{n:'Clorofila',g:'Estadísticas',d:'Con sol, la Velocidad se duplica.',...hVelClima('sun')},
 'sand-rush':{n:'Ímpetu Arena',g:'Estadísticas',d:'Con tormenta de arena, la Velocidad se duplica.',...hVelClima('sand')},
 'slush-rush':{n:'Quitanieves',g:'Estadísticas',d:'Con granizo o nieve, la Velocidad se duplica.',...hVelClima('hail')},

 // ---------- Reductores del daño que recibe ----------
 'thick-fat':{n:'Sebo',g:'Resistencia',d:'Recibe la mitad de daño de ataques de Fuego y Hielo.',danoRec(tg,o,t){return t==='fire'||t==='ice'?.5:1}},
 'heatproof':{n:'Ignífugo',g:'Resistencia',d:'Recibe la mitad de daño de los ataques de Fuego.',...hRecTipo('fire',.5)},
 'multiscale':{n:'Multiescamas',g:'Resistencia',d:'Con todos los PS, recibe la mitad de daño.',danoRec(tg){return tg.hp>=tg.max?.5:1}},
 'shadow-shield':{n:'Escudo Espectro',g:'Resistencia',d:'Con todos los PS, recibe la mitad de daño.',danoRec(tg){return tg.hp>=tg.max?.5:1}},
 'filter':{n:'Filtro',g:'Resistencia',d:'Recibe un 25 % menos de los ataques superefectivos.',danoRec(tg,o,t){return efTipo(t,tg)>1?.75:1}},
 'solid-rock':{n:'Roca Sólida',g:'Resistencia',d:'Recibe un 25 % menos de los ataques superefectivos.',danoRec(tg,o,t){return efTipo(t,tg)>1?.75:1}},
 'prism-armor':{n:'Armadura Prisma',g:'Resistencia',d:'Recibe un 25 % menos de los ataques superefectivos.',danoRec(tg,o,t){return efTipo(t,tg)>1?.75:1}},
 'fluffy':{n:'Peluche',g:'Resistencia',d:'Recibe la mitad de los ataques de contacto, pero el doble de los de Fuego.',
  danoRec(tg,o,t){return(esContacto(mvDe(o))?.5:1)*(t==='fire'?2:1)}},
 'ice-scales':{n:'Escama Hielo',g:'Resistencia',d:'Recibe la mitad de daño de los ataques especiales.',danoRec(tg,o,t,cat){return cat==='spe'?.5:1}},
 'sand-veil':{n:'Velo Arena',g:'Resistencia',d:'Con tormenta de arena, los ataques contra él aciertan un 20 % menos.',accRec(){return climaEs('sand')?.8:1}},
 'snow-cloak':{n:'Manto Níveo',g:'Resistencia',d:'Con granizo o nieve, los ataques contra él aciertan un 20 % menos.',accRec(){return climaEs('hail')?.8:1}},

 // ---------- Precisión, críticos y efectos secundarios ----------
 'compound-eyes':{n:'Ojo Compuesto',g:'Precisión y crítico',d:'Sus ataques aciertan un 30 % más.',accMul(){return 1.3}},
 'no-guard':{n:'Indefenso',g:'Precisión y crítico',d:'Sus ataques y los que recibe nunca fallan.',noFalla(){return true}},
 'battle-armor':{n:'Armadura Batalla',g:'Precisión y crítico',d:'No recibe golpes críticos.',sinCrit(){return true}},
 'shell-armor':{n:'Caparazón',g:'Precisión y crítico',d:'No recibe golpes críticos.',sinCrit(){return true}},
 'super-luck':{n:'Afortunado',g:'Precisión y crítico',d:'Sus golpes críticos son más probables.',critEt(){return 1}},
 'sniper':{n:'Francotirador',g:'Precisión y crítico',d:'Sus golpes críticos hacen +50 % de daño.',critMul(){return 1.5}},
 'shield-dust':{n:'Polvo Escudo',g:'Precisión y crítico',d:'Los efectos secundarios de los ataques recibidos no le afectan.',
  secRec(tg,s){if(!s||!(s.a||s.f||s.so))return undefined;const{a,pa,f,so,...r}=s;return Object.keys(r).length?r:null}},
});