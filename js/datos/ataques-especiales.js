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
X('metronome assist nature-power me-first sleep-talk transform conversion-2 gravity','Depende de otros ataques o formas: aún sin implementar',{nada:1});