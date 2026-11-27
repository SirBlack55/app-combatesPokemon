// Ataques con efectos especiales que el conversor antes descartaba (tanda 1).
// ESP[id del ataque] = { k:tipo de efecto, p:potencia "de referencia", ... }. Lo lee conv0 (conversor.js) y el ataque lleva mv.fx.
//  · p     → potencia usada para el enfriamiento y los kits del gacha cuando la PokéAPI no da potencia (o para fijarla).
//  · sty   → fuerza el estilo de animación (si no, el conversor lo deduce del nombre).
//  · Sin k → solo sirve para dar potencia fija a un ataque que la PokéAPI deja en blanco.
// Tipos de efecto (k):
//  fijo      daño = pct del PS máximo del rival (si hay max, al azar entre pct y max) · ig:1 ignora inmunidades de tipo
//  mitad     quita la mitad de los PS ACTUALES del rival
//  igualar   baja al rival hasta los PS actuales del atacante (Esfuerzo)
//  ohko      KO de un golpe (OHKO_FRAC = fracción de PS máximos que quita; 1 = mata siempre). La precisión baja (30) viene de la PokéAPI
//  pot       potencia variable: f = fórmula en potEsp (especiales.js)
//  contra    postura de contraataque: devuelve m × el daño recibido de la categoría cat ('phy' | 'spe' | 'any') durante t segundos
//  kamik     el atacante se debilita al golpear
//  gambito   daño = PS actuales del atacante y se debilita (Sacrificio)
const OHKO_FRAC=1;
const ESP={
  // daño fijo (valores de ejemplo: en los juegos dependen del nivel, aquí son % de PS para que sirvan con cualquier jefe)
  'sonic-boom':{k:'fijo',pct:.12,p:20},
  'dragon-rage':{k:'fijo',pct:.18,p:40,ig:1},
  'seismic-toss':{k:'fijo',pct:.2,p:50},
  'night-shade':{k:'fijo',pct:.2,p:50},
  'psywave':{k:'fijo',pct:.1,max:.3,p:50,sty:'orb'},
  'super-fang':{k:'mitad',p:50},
  'natures-madness':{k:'mitad',p:50},
  'ruination':{k:'mitad',p:50},
  'endeavor':{k:'igualar',p:50},
  // KO de un golpe
  'fissure':{k:'ohko',p:100},'guillotine':{k:'ohko',p:100},'horn-drill':{k:'ohko',p:100},'sheer-cold':{k:'ohko',p:100},
  // potencia variable (la PokéAPI no da potencia)
  'low-kick':{k:'pot',f:'peso',p:60},'grass-knot':{k:'pot',f:'peso',p:60},
  'heavy-slam':{k:'pot',f:'pesoRel',p:80},'heat-crash':{k:'pot',f:'pesoRel',p:80},
  'gyro-ball':{k:'pot',f:'gyro',p:80},'electro-ball':{k:'pot',f:'electro',p:80},
  'flail':{k:'pot',f:'flail',p:60},'reversal':{k:'pot',f:'flail',p:60},
  'punishment':{k:'pot',f:'castigo',p:80},
  'wring-out':{k:'pot',f:'psRival',p:80},'crush-grip':{k:'pot',f:'psRival',p:80},
  'magnitude':{k:'pot',f:'magnitud',p:70},'present':{k:'pot',f:'presente',p:80},
  // ya tenían potencia, pero escalan con los PS del atacante
  'eruption':{k:'pot',f:'psAtq',p:150},'water-spout':{k:'pot',f:'psAtq',p:150},'dragon-energy':{k:'pot',f:'psAtq',p:150},
  // potencia fija aproximada (en los juegos depende de felicidad, objeto, PP...: aún sin decidir)
  'return':{p:90},'frustration':{p:90},'fling':{p:50},'trump-card':{p:80},'natural-gift':{p:80},'beat-up':{p:60},
  // contraataques
  'counter':{k:'contra',cat:'phy',m:2,t:2,d:'Devuelve x2 el daño físico recibido (2 s)'},
  'mirror-coat':{k:'contra',cat:'spe',m:2,t:2,d:'Devuelve x2 el daño especial recibido (2 s)'},
  'metal-burst':{k:'contra',cat:'any',m:1.5,t:2,d:'Devuelve x1,5 el daño recibido (2 s)'},
  // el atacante se debilita
  'explosion':{k:'kamik',p:250},'self-destruct':{k:'kamik',p:200},'misty-explosion':{k:'kamik',p:100},
  'final-gambit':{k:'gambito',p:50},
  // dependen de estados o de otros ataques (tanda 3)
  'dream-eater':{k:'dormido',p:100},                 // solo funciona con el rival dormido
  'synchronoise':{k:'sinc',p:120},                   // solo afecta a quien comparte tipo con el atacante
  'last-resort':{k:'ultimo',p:140},                  // la IA solo lo usa tras haber usado los otros ataques
};

// ---------- Estados alterados (tanda 2) ----------
// Interruptor: efectos secundarios de los ataques con daño (quemar, paralizar, retroceso, drenar, retroceso de PS, bajar/subir stats...).
// En false, los ataques con daño vuelven a ser solo daño (los ataques de estado puros siguen funcionando).
const EFECTOS_SECUNDARIOS=true;
// Nombre de ailment en la PokéAPI → clave del juego. (Insomnio, tormento, encore, perish-song... aún no existen.)
const AIL={paralysis:'par',burn:'brn',poison:'psn',sleep:'slp',freeze:'frz',confusion:'cnf','leech-seed':'seed',trap:'trap',yawn:'yawn',
  infatuation:'inf',nightmare:'nmare',torment:'torment',disable:'disable','heal-block':'hblock'};
const AIL_TXT={par:'Paraliza',brn:'Quema',psn:'Envenena',tox:'Envenena gravemente',slp:'Duerme',frz:'Congela',cnf:'Confunde',seed:'Drenadoras',yawn:'Da sueño',trap:'Atrapa',net:'Impide escapar',inf:'Enamora',nmare:'Pesadilla',torment:'Atormenta',disable:'Anula un ataque',hblock:'Bloquea la cura'};
const TOXICOS=['toxic','poison-fang'];   // la PokéAPI los marca como "poison": aquí son veneno grave
// Ataques con daño cuyas bajadas de stats son PARA EL ATACANTE (la PokéAPI no distingue a quién se aplican)
const AUTOBAJA=['close-combat','superpower','overheat','draco-meteor','leaf-storm','psycho-boost','fleur-cannon','hammer-arm','v-create','dragon-ascent','clanging-scales','armor-cannon','make-it-rain','headlong-rush','scale-shot','ice-hammer','spin-out','hyperspace-fury','chloroblast'];
const SIN_STATS=['fell-stinger'];   // cambios de stats que se ignoran

// ---------- Ataques de campo, protección, control... (tanda 3) ----------
// Ataques con daño que cambian de Pokémon (si queda alguien en el equipo): el atacante / el rival
const CAMBIA_YO=['u-turn','volt-switch','flip-turn'],CAMBIA_RIVAL=['dragon-tail','circle-throw'];
// EFX[id del ataque] = efecto de un ataque de estado (los lee conv0). Claves:
//  pr protección · cl clima · te terreno · sa sala · dep deporte · ha trampa de entrada · sb sustituto
//  v estado volátil (of = al rival, yo = a uno mismo, both = a los dos) · a estado mayor · s/o stats propios/del rival
//  cu maldición · cur curar estados · pu copiar stats · hz reiniciar stats · pd repartir PS · ce crítico · lf/lk golpe seguro
//  cp copiar el último ataque del rival · mi aprenderlo · ty/ta/tys/cv/rt cambios de tipo · sw cambio de Pokémon · kam se debilita
//  cost coste en PS · sp rencor · nada = sin efecto aquí · d = texto · of = ataque ofensivo (usa la precisión de la PokéAPI)
const EFX={};
const X=(ns,d,o)=>{for(const n of ns.split(' '))EFX[n]={...o,d}};
X('protect detect','Bloquea todo el daño 1,5 s (falla si se repite)',{pr:'protect'});
X('endure','Aguanta cualquier golpe con 1 PS durante 1,5 s',{pr:'endure'});
X('kings-shield','Protege; quien lo toca pierde Ataque',{pr:'king'});
X('spiky-shield','Protege; quien lo toca se hiere',{pr:'spiky'});
X('baneful-bunker','Protege; quien lo toca se envenena',{pr:'bunker'});
X('obstruct','Protege; quien lo toca pierde Defensa',{pr:'obstruct'});
X('silk-trap','Protege; quien lo toca pierde Velocidad',{pr:'silk'});
X('burning-bulwark','Protege; quien lo toca se quema',{pr:'bulwark'});
X('sunny-day','Sol 15 s: potencia el fuego y debilita el agua',{cl:'sun'});
X('rain-dance','Lluvia 15 s: potencia el agua y debilita el fuego',{cl:'rain'});
X('sandstorm','Tormenta de arena 15 s: hiere salvo roca, tierra y acero',{cl:'sand'});
X('hail','Granizo 15 s: hiere salvo hielo',{cl:'hail'});
X('snowscape','Nieve 15 s: hiere salvo hielo',{cl:'hail'});
X('chilly-reception','Nieve 15 s y cambia de Pokémon',{cl:'hail',sw:'yo'});
X('electric-terrain','Campo eléctrico 15 s: potencia lo eléctrico, impide dormir',{te:'elec'});
X('grassy-terrain','Campo de hierba 15 s: potencia lo planta y cura',{te:'leaf'});
X('misty-terrain','Campo de niebla 15 s: debilita lo dragón, impide estados',{te:'mist'});
X('psychic-terrain','Campo psíquico 15 s: potencia lo psíquico',{te:'psy'});
X('trick-room','Sala Trampa 15 s: los lentos pasan a ser rápidos',{sa:'trick'});
X('wonder-room','Sala Extraña 15 s: Defensa y Def. Esp. se intercambian',{sa:'wonder'});
X('water-sport','Debilita mucho los ataques de fuego 15 s',{dep:'water'});
X('mud-sport','Debilita mucho los ataques eléctricos 15 s',{dep:'mud'});
X('spikes','Púas en el lado rival (hasta 3 capas)',{ha:'spikes'});
X('toxic-spikes','Púas tóxicas en el lado rival (hasta 2 capas)',{ha:'tspikes'});
X('stealth-rock','Rocas en el lado rival',{ha:'rocks'});
X('sticky-web','Red viscosa en el lado rival',{ha:'web'});
X('defog','Quita las trampas de los dos lados',{ha:'limpia'});
X('substitute','Gasta 25% de PS y crea un señuelo que recibe el daño',{sb:1});
X('taunt','El rival no usa ataques de estado 4 s',{v:'taunt',of:1});
X('torment','El rival no repite el mismo ataque 6 s',{v:'torment',of:1});
X('encore','El rival repite su último ataque 3 s',{v:'encore',of:1});
X('disable','Anula el último ataque del rival 5 s',{v:'disable',of:1});
X('heal-block','El rival no puede curarse 5 s',{v:'hblock',of:1});
X('attract','Enamora: 50% de no atacar durante 5 s',{v:'inf',of:1});
X('nightmare','Pesadilla: hiere al rival mientras duerma',{v:'nmare',of:1});
X('mean-look block spider-web','Impide escapar: el rival se ralentiza 8 s',{v:'net',of:1});
X('perish-song','Los dos se debilitan en 6 s',{v:'perish',both:1});
X('ingrain aqua-ring','Recupera 3% de PS por segundo',{v:'regen',yo:1});
X('safeguard','Impide estados alterados 10 s',{v:'safe',yo:1});
X('mist','Impide que le bajen las estadísticas 8 s',{v:'mist',yo:1});
X('lucky-chant','Impide golpes críticos 8 s',{v:'lucky',yo:1});
X('magic-coat','Devuelve el siguiente ataque de estado (2,5 s)',{v:'mcoat',yo:1});
X('destiny-bond','Si le derrotan en 3 s, se lleva al rival',{v:'dbond',yo:1});
X('wish','Se cura el 50% de sus PS en 3 s',{v:'wish',yo:1});
X('reflect','Reduce el daño físico recibido 10 s',{v:'reflect',yo:1});
X('light-screen','Reduce el daño especial recibido 10 s',{v:'lscreen',yo:1});
X('aurora-veil','Reduce todo el daño 10 s (solo con granizo)',{v:'aveil',yo:1,req:'hail'});
X('tailwind','Velocidad x2 durante 8 s',{v:'tail',yo:1});
X('focus-energy dragon-cheer','Golpes críticos mucho más probables 20 s',{ce:1});
X('laser-focus','El próximo golpe es crítico seguro',{lf:1});
X('lock-on mind-reader','El próximo ataque no falla',{lk:1});
X('heal-bell aromatherapy refresh','Cura los estados alterados',{cur:1});
X('psych-up','Copia las estadísticas del rival',{pu:1});
X('haze','Reinicia las estadísticas de los dos',{hz:1});
X('pain-split','Reparte los PS entre los dos',{pd:1});
X('belly-drum','Gasta 50% de PS: Ataque al máximo',{s:{atk:6},cost:.5});
X('curse','Fantasma: gasta 50% de PS y maldice al rival; otros: +Atq +Def −Vel',{cu:1});
X('memento','El rival pierde −2 Ataque y −2 At. Esp.; el atacante se debilita',{o:{atk:-2,spa:-2},kam:1,of:1});
X('spite','Alarga el enfriamiento del último ataque del rival',{sp:1,of:1});
X('mirror-move copycat','Copia el último ataque del rival',{cp:1});
X('mimic sketch','Aprende el último ataque del rival (en este combate)',{mi:1});
X('soak','Convierte al rival en tipo Agua',{ty:'water',of:1});
X('magic-powder','Convierte al rival en tipo Psíquico',{ty:'psychic',of:1});
X('forests-curse','Añade el tipo Planta al rival',{ta:'leaf',of:1});
X('trick-or-treat','Añade el tipo Fantasma al rival',{ta:'ghost',of:1});
X('conversion','Cambia al tipo de su primer ataque',{cv:1});
X('camouflage','Cambia a tipo Normal',{tys:'normal'});
X('reflect-type','Copia los tipos del rival',{rt:1});
X('roar whirlwind','Obliga al rival a ser sustituido (si le queda equipo)',{sw:'rival'});
X('teleport baton-pass','Cambia de Pokémon (si queda alguien en el equipo)',{sw:'yo'});
X('parting-shot','Rival −1 Ataque y −1 At. Esp. y cambia de Pokémon',{o:{atk:-1,spa:-1},sw:'yo',of:1});
// Sin efecto en este simulador: se pueden elegir pero no hacen nada (la IA no los usa)
X('splash celebrate hold-hands happy-hour','Pero no pasa nada',{nada:1});
X('after-you ally-switch spotlight follow-me rage-powder helping-hand instruct quash coaching decorate fairy-lock','Solo tiene sentido en combates dobles',{nada:1});
X('quick-guard wide-guard mat-block crafty-shield','Protección de grupo: no aplica en 1 contra 1',{nada:1});
X('trick switcheroo bestow embargo magic-room imprison snatch','Depende de objetos o habilidades: aún no existen',{nada:1});
X('metronome assist nature-power me-first sleep-talk conversion-2 gravity','Depende de otros ataques o formas: aún sin implementar',{nada:1});

// ---------- Tanda 4: lo que salía en la auditoría ----------
// Dos turnos: k:'carga' (se concentra ~0,9 s y luego ataca) · k:'inv' (desaparece ~0,8 s y luego ataca; v = dónde se esconde)
// c = color · s = stats que gana al cargar · sun/rain = si hay ese clima no necesita cargar
const DT={
 'solar-beam':{k:'carga',c:'#fde047',sun:1},'solar-blade':{k:'carga',c:'#fde047',sun:1},'razor-wind':{k:'carga',c:'#e0f2fe'},
 'skull-bash':{k:'carga',c:'#e5e7eb',s:{def:1}},'sky-attack':{k:'carga',c:'#fef3c7'},'freeze-shock':{k:'carga',c:'#a5f3fc'},
 'ice-burn':{k:'carga',c:'#fb923c'},'meteor-beam':{k:'carga',c:'#a8a29e',s:{spa:1}},'electro-shot':{k:'carga',c:'#fde047',s:{spa:1},rain:1},
 'dig':{k:'inv',v:'dig',c:'#a16207'},'dive':{k:'inv',v:'dive',c:'#38bdf8'},'bounce':{k:'inv',v:'sky',c:'#f9a8d4'},
 'sky-drop':{k:'inv',v:'sky',c:'#e0f2fe'},'phantom-force':{k:'inv',v:'ghost',c:'#7c3aed'},'shadow-force':{k:'inv',v:'ghost',c:'#4c1d95'},
};
// Ataques que se repiten: n=[mín,máx] usos seguidos · conf:1 = acaba confuso · (Rodar y Bola Hielo suben la potencia en cada uso)
const REP={
 'outrage':{n:[2,3],conf:1},'thrash':{n:[2,3],conf:1},'petal-dance':{n:[2,3],conf:1},'raging-fury':{n:[2,3],conf:1},
 'uproar':{n:[3,3]},'rollout':{n:[5,5]},'ice-ball':{n:[5,5]},
};
// Efectos extra de ataques con daño (los lee secundarios, alterados.js)
const SEC_X={'rapid-spin':'spin','mortal-spin':'spin','brick-break':'rompe','psychic-fangs':'rompe','raging-bull':'rompe','clear-smog':'smog',
 'smack-down':'baja','thousand-arrows':'baja','sparkling-aria':'cura','steel-roller':'terreno','ice-spinner':'terreno'};
const TRAMPA_DANO=['anchor-shot','spirit-shackle','jaw-lock','thousand-waves'];   // hacen daño y además impiden escapar
// Ataques de sonido (los bloquea Mordaza)
const SONIDO=['hyper-voice','boomburst','sing','screech','growl','roar','supersonic','snore','uproar','bug-buzz','chatter','round','echoed-voice','relic-song','disarming-voice','overdrive','sparkling-aria','clanging-scales','noble-roar','torch-song','metal-sound','grass-whistle','perish-song','confide','alluring-voice','psychic-noise','howl','snarl','clangorous-soul','throat-chop','screech'];
AIL.silence='sil';AIL_TXT.sil='Silencia';
Object.assign(ESP,{
 'spit-up':{k:'pot',f:'stk',p:100},'hard-press':{k:'pot',f:'hardpress',p:100},
 'bide':{k:'contra',cat:'any',m:2,t:2.5,d:'Aguanta 2,5 s y devuelve x2 el daño recibido'},
 'veevee-volley':{p:90},'pika-papow':{p:90},
 // potencia que depende de estados, de quién fue golpeado o del clima
 'hex':{k:'pot',f:'estado',b:65,req:'any',p:65},'infernal-parade':{k:'pot',f:'estado',b:60,req:'any',p:60},
 'venoshock':{k:'pot',f:'estado',b:65,req:'psn',p:65},'barb-barrage':{k:'pot',f:'estado',b:60,req:'psn',p:60},
 'facade':{k:'pot',f:'estado',b:70,req:'self',p:70},'smelling-salts':{k:'pot',f:'estado',b:70,req:'par',p:70},'wake-up-slap':{k:'pot',f:'estado',b:70,req:'slp',p:70},
 'brine':{k:'pot',f:'brine',p:65},
 'assurance':{k:'pot',f:'danado',b:60,qui:'rival',p:60},'revenge':{k:'pot',f:'danado',b:60,qui:'yo',p:60},'avalanche':{k:'pot',f:'danado',b:60,qui:'yo',p:60},
 'acrobatics':{k:'pot',f:'fija',v:110,p:110},'knock-off':{k:'pot',f:'fija',v:97,p:97},
 'stored-power':{k:'pot',f:'poder',p:20},'power-trip':{k:'pot',f:'poder',p:20},
 'fury-cutter':{k:'pot',f:'cutter',p:40},'echoed-voice':{k:'pot',f:'eco',p:40},'lash-out':{k:'pot',f:'lash',p:75},
 'rage-fist':{k:'pot',f:'ira',p:50},'last-respects':{k:'pot',f:'respetos',p:50},
 'rising-voltage':{k:'pot',f:'terreno',te:'elec',mul:2,p:70},'expanding-force':{k:'pot',f:'terreno',te:'psy',mul:1.5,p:80},
 'fishious-rend':{k:'pot',f:'primero',b:85,p:85},'bolt-beak':{k:'pot',f:'primero',b:85,p:85},
 'collision-course':{k:'pot',f:'eficaz',b:100,p:100},'electro-drift':{k:'pot',f:'eficaz',b:100,p:100},
 'hydro-steam':{k:'pot',f:'sol',b:80,p:80},
 'payback':{k:'pot',f:'despues',b:50,p:50},'temper-flare':{k:'pot',f:'fallo',b:75,p:75},'stomping-tantrum':{k:'pot',f:'fallo',b:75,p:75},
 'retaliate':{k:'pot',f:'aliado',b:70,p:70},
 'rollout':{k:'pot',f:'rollout',p:30},'ice-ball':{k:'pot',f:'rollout',p:30},
 // cambian de tipo y suben de potencia con el clima / el terreno
 'weather-ball':{k:'wb',tipo:'clima',p:50},'terrain-pulse':{k:'wb',tipo:'terreno',p:50},
 // usan otra estadística: od = defensa del rival que cuenta · ua = ataca con el Ataque del RIVAL · as = ataca con esta estadística propia · mx = la mayor de Atq/At. Esp.
 'psyshock':{k:'stat',od:'def',p:80},'psystrike':{k:'stat',od:'def',p:100},'secret-sword':{k:'stat',od:'def',p:85},
 'foul-play':{k:'stat',ua:1,p:95},'body-press':{k:'stat',as:'def',p:80},
 'photon-geyser':{k:'stat',mx:1,p:100},'light-that-burns-the-sky':{k:'stat',mx:1,p:200},'shell-side-arm':{k:'stat',mx:1,p:90},'tera-blast':{k:'stat',mx:1,p:80},
});
// Ataques de estado nuevos (claves nuevas: ac acupresión · sx intercambios · cc cambio de campo · ts tipo+stats · stk/swl reserva · rv revivir)
X('acupressure','+2 a una estadística al azar',{ac:1});
X('heart-swap','Intercambia los cambios de estadísticas con el rival',{sx:'heart',of:1});
X('guard-swap','Intercambia los cambios de Defensa y Def. Esp. con el rival',{sx:'guard',of:1});
X('power-swap','Intercambia los cambios de Ataque y At. Esp. con el rival',{sx:'power',of:1});
X('speed-swap','Intercambia la Velocidad con el rival',{sx:'speed',of:1});
X('power-trick','Intercambia su Ataque y su Defensa',{sx:'ptrick'});
X('power-shift','Intercambia Ataque↔Defensa y At. Esp.↔Def. Esp.',{sx:'pshift'});
X('power-split','Reparte Ataque y At. Esp. con el rival',{sx:'psplit',of:1});
X('guard-split','Reparte Defensa y Def. Esp. con el rival',{sx:'gsplit',of:1});
X('topsy-turvy','Invierte los cambios de estadísticas del rival',{sx:'topsy',of:1});
X('psycho-shift','Pasa su estado alterado al rival',{sx:'trans',of:1});
X('court-change','Intercambia las trampas de los dos lados',{cc:1});
X('flower-shield','+1 Defensa a todos los de tipo Planta',{ts:{t:'leaf',s:{def:1}}});
X('rototiller','+1 Ataque y At. Esp. a todos los de tipo Planta',{ts:{t:'leaf',s:{atk:1,spa:1}}});
X('magnet-rise','Levita 5 s: inmune a Tierra',{v:'levit',yo:1});
X('telekinesis','Levita al rival 3 s: sin esquivar y con Tierra inofensivo',{v:'levit',of:1});
X('octolock','Atrapa al rival: baja Def y Def. Esp. cada segundo',{v:'octo',of:1});
X('miracle-eye foresight odor-sleuth','Quita las inmunidades de tipo del rival',{v:'ident',of:1});
X('take-heart','Cura estados y +1 At. Esp. y Def. Esp.',{cur:1,s:{spa:1,spd:1}});
X('victory-dance','+1 Ataque, Defensa y Velocidad',{s:{atk:1,def:1,spe:1}});
X('shelter','+2 Defensa',{s:{def:2}});
X('lunar-blessing','Cura 25% de PS y los estados',{h:.25,cur:1});
X('revival-blessing','Un aliado caído vuelve al equipo',{rv:1});
X('stockpile','Acumula una reserva (hasta 3): +1 Def y Def. Esp. cada una',{stk:1});
X('swallow','Gasta la reserva y cura 25/50/100% de PS',{swl:1});
X('geomancy','+2 At. Esp., Def. Esp. y Velocidad',{s:{spa:2,spd:2,spe:2}});
X('tidy-up','+1 Ataque y Velocidad; quita las trampas',{s:{atk:1,spe:1},ha:'limpia'});
X('strength-sap','Rival −1 Ataque y se cura',{o:{atk:-1},h:.3,of:1});
X('gastro-acid','Anula la habilidad del rival',{hb:'off',of:1});
X('skill-swap','Intercambia su habilidad con la del rival',{hb:'swap',of:1});
X('role-play doodle','Copia la habilidad del rival',{hb:'copy',of:1});
X('entrainment','El rival adopta la habilidad del atacante',{hb:'give',of:1});
X('worry-seed','La habilidad del rival pasa a ser Insomnio',{hb:'set:insomnia',of:1});
X('simple-beam','La habilidad del rival pasa a ser Simple',{hb:'set:simple',of:1});
X('transform','Se transforma en el rival (tipos, estadísticas, ataques y habilidad)',{tf:1,of:1});
X('recycle corrosive-gas teatime powder electrify grudge healing-wish lunar-dance shed-tail max-guard ion-deluge aromatic-mist','Depende de objetos, habilidades o aliados: aún sin implementar',{nada:1});