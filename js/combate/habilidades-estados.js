// HABILIDADES · familia ESTADOS Y ESTADÍSTICAS: inmunidad a estados alterados, protección y cambio de estadísticas, daño indirecto y objetos. Se registran en HAB.
// Ganchos: sinEstado, alEstado, durEst, cambioStat, statBajada, reflejaStat, ignoraStg, ignoraEva, ignoraGhost, sinIndirecto, sinRetroceso, drenajeToxico, sinAmedrentar, alAmedrentar (ver ganchos.js).
// Rompemoldes ignora (rompible:1) las que protegen contra estados o filtran cambios de estadísticas; Muro Mágico, Cabeza Roca y similares no son ignorables.
const MAYORES=['par','brn','psn','tox','slp','frz'];
const VOLS_CONTROL=['taunt','torment','encore','disable','hblock','inf'];
let H_SYNC=0;
const avisoE=(m,s,c)=>txt.push({x:m.x,y:m.y-56,s,c:c||'#e2e8f0',l:1.2,sm:1});
// Inmune a una lista de estados (rompible por Rompemoldes)
const hInmuneEst=(nom,lista,d,extra)=>({n:nom,g:'Estados',d,rompible:1,sinEstado(m,k){return lista.includes(k)},...extra});
// Evita la bajada ajena de las estadísticas indicadas (null = todas)
const hProtegeStat=(nom,stats,d)=>({n:nom,g:'Estadísticas',d,rompible:1,cambioStat(m,v,k,aj){return aj&&v<0&&(!stats||stats.includes(k))?0:undefined}});
// No le afecta la bajada de Ataque de Intimidación
const sinIntimidaFn=(m,v,k,aj)=>aj==='intimidate'&&k==='atk'&&v<0?0:undefined;
const hSinIntimida=(nom,g,d,extra)=>({n:nom,g,d,cambioStat:sinIntimidaFn,...extra});
Object.assign(HAB,{
 // ---------- Inmunidad a estados alterados ----------
 'immunity':hInmuneEst('Inmunidad',['psn','tox'],'No puede ser envenenado.'),
 'pastel-veil':hInmuneEst('Velo Pastel',['psn','tox'],'No puede ser envenenado.'),
 'limber':hInmuneEst('Flexibilidad',['par'],'No puede ser paralizado.'),
 'insomnia':hInmuneEst('Insomnio',['slp','yawn'],'No puede dormirse.'),
 'vital-spirit':hInmuneEst('Espíritu Vital',['slp','yawn'],'No puede dormirse.'),
 'sweet-veil':hInmuneEst('Velo Dulce',['slp','yawn'],'No puede dormirse.'),
 'magma-armor':hInmuneEst('Escudo Magma',['frz'],'No puede ser congelado.'),
 'water-veil':hInmuneEst('Velo Agua',['brn'],'No puede ser quemado.'),
 'own-tempo':hInmuneEst('Ritmo Propio',['cnf'],'No puede confundirse y no le afecta Intimidación.',{cambioStat:sinIntimidaFn}),
 'oblivious':hInmuneEst('Despiste',['inf','taunt'],'No puede enamorarse ni ser provocado, y no le afecta Intimidación.',{cambioStat:sinIntimidaFn}),
 'aroma-veil':hInmuneEst('Velo Aroma',VOLS_CONTROL,'Inmune a Mofa, Tormento, Otra Vez, Anulación, Anticura y Atracción.'),
 'leaf-guard':hInmuneEst('Defensa Hoja',[...MAYORES,'yawn'],'Con sol, no puede sufrir estados alterados.',{sinEstado(m,k){return campo.cl&&campo.cl.k==='sun'&&(MAYORES.includes(k)||k==='yawn')}}),
 'purifying-salt':hInmuneEst('Sal Purificadora',[...MAYORES,'yawn'],'No puede sufrir estados alterados y recibe la mitad de daño de ataques Fantasma.',{danoRec(tg,o,t){return t==='ghost'?.5:1}}),
 'synchronize':{n:'Sincronía',g:'Estados',d:'Si le paralizan, queman o envenenan, el atacante sufre lo mismo.',
  alEstado(m,k,por){if(H_SYNC||!['par','brn','psn','tox'].includes(k)||!por||por.dead)return;H_SYNC=1;try{avisoE(m,'¡Sincronía!','#e9d5ff');aplicarEst(por,k,m)}finally{H_SYNC=0}}},
 'early-bird':{n:'Madrugar',g:'Estados',d:'Duerme la mitad de tiempo.',durEst(m,k){return k==='slp'?.5:1}},
 'steadfast':{n:'Impasible',g:'Estados',d:'Si se amedrenta, sube su Velocidad.',alAmedrentar(m){stg(m,{spe:1})}},
 'inner-focus':hSinIntimida('Foco Interno','Estados','No se amedrenta y no le afecta Intimidación.',{sinAmedrentar(){return true}}),
 'wonder-skin':{n:'Piel Milagro',g:'Estados',d:'Los ataques de estado contra él aciertan la mitad de las veces.',rompible:1,accRec(tg,o,p){return p.cat==='sta'?.5:1}},

 // ---------- Cambios de estadísticas ----------
 'clear-body':hProtegeStat('Cuerpo Puro',null,'Los rivales no pueden bajarle las estadísticas.'),
 'white-smoke':hProtegeStat('Humo Blanco',null,'Los rivales no pueden bajarle las estadísticas.'),
 'full-metal-body':hProtegeStat('Guardametal',null,'Los rivales no pueden bajarle las estadísticas.'),
 'hyper-cutter':hProtegeStat('Corte Fuerte',['atk'],'Los rivales no pueden bajarle el Ataque.'),
 'big-pecks':hProtegeStat('Sacapecho',['def'],'Los rivales no pueden bajarle la Defensa.'),
 'keen-eye':{...hProtegeStat('Vista Lince',['acc'],'Los rivales no pueden bajarle la Precisión y sus ataques ignoran la Evasión del rival.'),ignoraEva(){return true}},
 'minds-eye':{...hProtegeStat('Ojo Mental',['acc'],'No pierden Precisión, ignora la Evasión del rival y sus ataques Normal y Lucha golpean a los Fantasma.'),ignoraEva(){return true},ignoraGhost(){return true}},
 'scrappy':hSinIntimida('Intrépido','Estadísticas','Sus ataques Normal y Lucha golpean a los Fantasma y no le afecta Intimidación.',{ignoraGhost(){return true}}),
 'guard-dog':{n:'Perro Guardián',g:'Estadísticas',d:'Intimidación le sube el Ataque en vez de bajárselo.',cambioStat(m,v,k,aj){return aj==='intimidate'&&k==='atk'?-v:undefined}},
 'contrary':{n:'Respondón',g:'Estadísticas',d:'Los cambios de sus estadísticas se invierten.',cambioStat(m,v){return -v}},
 'simple':{n:'Simple',g:'Estadísticas',d:'Los cambios de sus estadísticas se duplican.',cambioStat(m,v){return v*2}},
 'defiant':{n:'Competitivo',g:'Estadísticas',d:'Si un rival le baja una estadística, su Ataque sube mucho.',statBajada(m){stg(m,{atk:2})}},
 'competitive':{n:'Tenacidad',g:'Estadísticas',d:'Si un rival le baja una estadística, su At. Esp. sube mucho.',statBajada(m){stg(m,{spa:2})}},
 'mirror-armor':{n:'Coraza Reflejo',g:'Estadísticas',d:'Devuelve al rival las bajadas de estadísticas que le provoca.',reflejaStat(){return true}},
 'unaware':{n:'Ignorante',g:'Estadísticas',d:'Ignora los cambios de estadísticas del rival al atacar y al defenderse.',ignoraStg(o,m,k){return true}},

 // ---------- Daño indirecto, retroceso y objetos ----------
 'magic-guard':{n:'Muro Mágico',g:'Daño indirecto',d:'No sufre daño indirecto: veneno, quemadura, clima, trampas, retroceso, Vidasfera...',sinIndirecto(){return true}},
 'rock-head':{n:'Cabeza Roca',g:'Daño indirecto',d:'No sufre retroceso de sus ataques.',sinRetroceso(){return true}},
 'liquid-ooze':{n:'Viscosidad Lodosa',g:'Daño indirecto',d:'Quien le drene PS, en vez de curarse, los pierde.',drenajeToxico(){return true}},
 'unburden':{n:'Liviano',g:'Objetos',d:'Si gasta su objeto, su Velocidad se duplica.',statMul(m,k){return k==='spe'&&m.objGastadoK&&!m.obj?2:1}},
 'klutz':{n:'Zoquete',g:'Objetos',d:'Sus objetos equipados no funcionan.',sinObjeto:1},
});
// Otras habilidades que ya existían y también protegen de un estado
HAB['thermal-exchange'].sinEstado=(m,k)=>k==='brn';HAB['thermal-exchange'].rompible=1;
HAB['water-bubble'].sinEstado=(m,k)=>k==='brn';
// Las que protegen o filtran se ignoran con Rompemoldes
for(const k of ['contrary','simple','unaware','mirror-armor'])HAB[k].rompible=1;