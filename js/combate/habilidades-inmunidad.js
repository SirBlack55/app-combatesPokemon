// HABILIDADES · familia INMUNIDAD: absorben o anulan ataques (gancho absorbe/bloqMove/aguanta) y el daño del clima. Se registran en HAB.
// Absorber = el ataque no hace daño y la habilidad aplica su efecto UNA vez por ataque (no en cada golpe de los de varios golpes).
// Valores (como los juegos): curar 25 % de los PS, +1 a la estadística (Cuerpo Horneado +2), Llamarada +50 % al fuego mientras siga en combate.
const ABS_CURA=.25,CLIMA_PS=.02;   // Piel Seca: % de PS por segundo con lluvia (cura) o sol (hiere)
const L_POLVO=['cotton-spore','poison-powder','powder','rage-powder','sleep-powder','spore','stun-spore','magic-powder'];
const L_BOLA=['acid-spray','aura-sphere','barrage','beak-blast','bullet-seed','egg-bomb','electro-ball','energy-ball','focus-blast','gyro-ball','ice-ball','magnet-bomb','mist-ball','mud-bomb','octazooka','pollen-puff','pyro-ball','rock-blast','rock-wrecker','searing-shot','seed-bomb','shadow-ball','sludge-bomb','syrup-bomb','weather-ball','zap-cannon'];
const L_VIENTO=['air-cutter','bleakwind-storm','blizzard','fairy-wind','gust','heat-wave','hurricane','icy-wind','petal-blizzard','sandsear-storm','springtide-storm','twister','whirlwind','wildbolt-storm'];
const msgAbs=(m,s,c)=>txt.push({x:m.x,y:m.y-56,s,c:c||'#4ade80',l:1.2,sm:1});
const curaAbs=m=>{if(m.hp<m.max&&!(m.vol&&m.vol.hblock))curaPS(m,ABS_CURA);msgAbs(m,'¡Absorbe!')};
const subeAbs=(s,nom)=>m=>{stg(m,s);msgAbs(m,'¡'+nom+'!','#fde047')};
// Absorbe un TIPO de ataque
const hAbsorbe=(nom,tipo,d,efecto,extra)=>({n:nom,g:'Inmunidad',d,rompible:1,absorbe(m,o,t,e,prim){if(t!==tipo)return false;if(prim)efecto(m,o);return true},...extra});
// Anula una LISTA de ataques (daño y estado); efecto opcional al recibirlos
const hLista2=(nom,lista,d,efecto,extra)=>({n:nom,g:'Inmunidad',d,rompible:1,
 absorbe(m,o,t,e,prim){if(!lista.includes((o.last||{}).key))return false;if(prim){if(efecto)efecto(m,o);else msgAbs(m,'No afecta','#e2e8f0')}return true},
 bloqMove(m,o,p){return lista.includes(p.key)},...extra});
Object.assign(HAB,{
 'water-absorb':hAbsorbe('Absorbe Agua','water','Los ataques de Agua no le hacen daño: le curan el 25 % de sus PS.',curaAbs),
 'volt-absorb':hAbsorbe('Absorbe Elec','elec','Los ataques Eléctricos no le hacen daño: le curan el 25 % de sus PS.',curaAbs),
 'earth-eater':hAbsorbe('Geofagia','ground','Los ataques de Tierra no le hacen daño: le curan el 25 % de sus PS.',curaAbs),
 'dry-skin':hAbsorbe('Piel Seca','water','Los ataques de Agua le curan el 25 %, los de Fuego le hacen +25 %; con lluvia se cura y con sol se hiere.',curaAbs,
  {danoRec(tg,o,t){return t==='fire'?1.25:1},
   seg(m){if(campo.cl&&campo.cl.k==='rain'&&m.hp<m.max&&!(m.vol&&m.vol.hblock))curaPS(m,CLIMA_PS);else if(campo.cl&&campo.cl.k==='sun')dotDano(m,CLIMA_PS,'#fb923c')}}),
 'motor-drive':hAbsorbe('Electromotor','elec','Los ataques Eléctricos no le hacen daño: sube su Velocidad.',subeAbs({spe:1},'Electromotor')),
 'sap-sipper':hAbsorbe('Herbívoro','leaf','Los ataques de Planta no le hacen daño: sube su Ataque.',subeAbs({atk:1},'Herbívoro')),
 'lightning-rod':hAbsorbe('Pararrayos','elec','Los ataques Eléctricos no le hacen daño: sube su At. Esp.',subeAbs({spa:1},'Pararrayos')),
 'storm-drain':hAbsorbe('Colector','water','Los ataques de Agua no le hacen daño: sube su At. Esp.',subeAbs({spa:1},'Colector')),
 'well-baked-body':hAbsorbe('Cuerpo Horneado','fire','Los ataques de Fuego no le hacen daño: sube mucho su Defensa.',subeAbs({def:2},'Cuerpo Horneado')),
 'flash-fire':hAbsorbe('Absorbe Fuego','fire','Los ataques de Fuego no le hacen daño y, tras absorber uno, sus ataques de Fuego hacen +50 %.',m=>{m.ffOn=1;msgAbs(m,'¡Llamarada!','#fb923c')},
  {danoMul(o,tg,t){return o.ffOn&&t==='fire'?1.5:1}}),
 'wind-rider':hLista2('Surcavientos',L_VIENTO,'Inmune a los ataques de viento: sube su Ataque.',subeAbs({atk:1},'Surcavientos')),
 'soundproof':hLista2('Insonorizar',(typeof SONIDO!=='undefined'?SONIDO:[]),'Inmune a los ataques de sonido.'),
 'bulletproof':hLista2('Antibalas',L_BOLA,'Inmune a los ataques de bola y bomba.'),
 'overcoat':hLista2('Funda',L_POLVO,'Inmune a los ataques de polvo y al daño de la arena y el granizo.',null,{sinClimaDano(){return true}}),
 'good-as-gold':{n:'Cuerpo Áureo',g:'Inmunidad',rompible:1,d:'Los ataques de estado de los rivales no le afectan.',bloqMove(){return true}},
 'wonder-guard':{n:'Superguarda',g:'Inmunidad',d:'Solo le hacen daño los ataques superefectivos.',rompible:1,
  absorbe(m,o,t,e,prim){if(efTipo(t,m)>1)return false;if(prim)msgAbs(m,'No afecta','#e2e8f0');return true}},
 'sturdy':{n:'Robustez',g:'Inmunidad',d:'Inmune a los ataques de KO de un golpe; con todos los PS, sobrevive con 1 PS a un golpe mortal.',rompible:1,
  absorbe(m,o,t,e,prim){const f=(e?e.fx:o.plan&&o.plan.fx);if(!(f&&f.k==='ohko'))return false;if(prim)msgAbs(m,'No afecta','#e2e8f0');return true},
  aguanta(m,o,d){return m.hp+d>=m.max}},
});
// No sufren el daño de la tormenta de arena / el granizo (se suma a Funda)
for(const k of ['sand-rush','sand-force','sand-veil'])if(HAB[k])HAB[k].sinClimaDano=(m,cl)=>cl==='sand';
for(const k of ['slush-rush','snow-cloak'])if(HAB[k])HAB[k].sinClimaDano=(m,cl)=>cl==='hail';