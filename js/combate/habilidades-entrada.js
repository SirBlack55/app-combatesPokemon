// HABILIDADES · familia ENTRADA y CAMPO: clima y terreno, auras, avisos y reglas del campo. Se registran en HAB (habilidades.js).
// Decisiones: el clima y el terreno que pone una habilidad duran DUR_CAMPO_HAB s (como los ataques); Presión = el rival recarga un 25 % más lento.
// Rompemoldes: las habilidades marcadas rompible:1 no cuentan cuando el atacante tiene una habilidad con rompe:1 (se aplica al final de este archivo).
const DUR_CAMPO_HAB=15,PRESION_CD=1.25;
const NO_CALCO=['trace','imposter','neutralizing-gas','illusion','disguise','forecast','flower-gift','multitype','stance-change','schooling','zen-mode','power-construct','receiver','power-of-alchemy','as-one-glastrier','as-one-spectrier','commander','protosynthesis','quark-drive','embody-aspect-teal','embody-aspect-hearthflame','embody-aspect-wellspring','embody-aspect-cornerstone'];
const aviso=(m,s,c)=>txt.push({x:m.x,y:m.y-56,s,c:c||'#fbbf24',l:1.3,sm:1});
function campoHab(tipo,k,m){   // pone clima o terreno (o renueva su tiempo si ya estaba)
 if(tipo==='cl'&&climaExtremoActivo())return;
 const o=campo[tipo];campo[tipo]={k,l:DUR_CAMPO_HAB};
 if(!o||o.k!==k){aviso(m,NOM_CAMPO[k]+'!','#fde047');log(NOM_CAMPO[k])}
}
const teEs=k=>!!(campo.te&&campo.te.k===k);
const mejorStat=m=>['atk','def','spa','spd','spe'].reduce((a,k)=>m.st[k]>m.st[a]?k:a,'atk');
const hClima=(k,nom,d)=>({n:nom,g:'Clima y terreno',d,entra(m){campoHab('cl',k,m)}});
const hTerreno=(k,nom,d)=>({n:nom,g:'Clima y terreno',d,entra(m){campoHab('te',k,m)}});
// Habilidades que solo avisan al entrar (su efecto es una regla del motor: ver ganchos.js)
const hAviso=(nom,g,d,txt_,extra)=>({n:nom,g,d,entra(m){aviso(m,txt_)},...extra});
Object.assign(HAB,{
 // ---------- Clima y terreno ----------
 'drought':hClima('sun','Sequía','Al entrar, hace salir el sol durante '+DUR_CAMPO_HAB+' s.'),
 'drizzle':hClima('rain','Llovizna','Al entrar, hace llover durante '+DUR_CAMPO_HAB+' s.'),
 'sand-stream':hClima('sand','Chorro Arena','Al entrar, levanta una tormenta de arena durante '+DUR_CAMPO_HAB+' s.'),
 'snow-warning':hClima('hail','Nevada','Al entrar, hace nevar (granizo) durante '+DUR_CAMPO_HAB+' s.'),
 'electric-surge':hTerreno('elec','Electrogénesis','Al entrar, crea un campo eléctrico durante '+DUR_CAMPO_HAB+' s.'),
 'grassy-surge':hTerreno('leaf','Herbogénesis','Al entrar, crea un campo de hierba durante '+DUR_CAMPO_HAB+' s.'),
 'misty-surge':hTerreno('mist','Nebulogénesis','Al entrar, crea un campo de niebla durante '+DUR_CAMPO_HAB+' s.'),
 'psychic-surge':hTerreno('psy','Psicogénesis','Al entrar, crea un campo psíquico durante '+DUR_CAMPO_HAB+' s.'),
 'orichalcum-pulse':{n:'Latido Oricalco',g:'Clima y terreno',d:'Al entrar, hace salir el sol; con sol, su Ataque sube un 33 %.',entra(m){campoHab('cl','sun',m)},statMul(m,k){return k==='atk'&&campo.cl&&campo.cl.k==='sun'?1.33:1}},
 'hadron-engine':{n:'Motor Hadrónico',g:'Clima y terreno',d:'Al entrar, crea un campo eléctrico; con él, su At. Esp. sube un 33 %.',entra(m){campoHab('te','elec',m)},statMul(m,k){return k==='spa'&&teEs('elec')?1.33:1}},
 'cloud-nine':{n:'Cielo Despejado',g:'Clima y terreno',d:'Mientras esté en combate, el clima no tiene efecto.',anulaClima(){return true}},
 'air-lock':{n:'Bucle Aire',g:'Clima y terreno',d:'Mientras esté en combate, el clima no tiene efecto.',anulaClima(){return true}},
 'protosynthesis':{n:'Paleosíntesis',g:'Clima y terreno',d:'Con sol, su mejor estadística sube un 30 % (la Velocidad, un 50 %).',statMul(m,k){return k===mejorStat(m)&&campo.cl&&campo.cl.k==='sun'?(k==='spe'?1.5:1.3):1}},
 'quark-drive':{n:'Carga Cuark',g:'Clima y terreno',d:'Con campo eléctrico, su mejor estadística sube un 30 % (la Velocidad, un 50 %).',statMul(m,k){return k===mejorStat(m)&&teEs('elec')?(k==='spe'?1.5:1.3):1}},

 // ---------- Efectos al entrar ----------
 'download':{n:'Descarga',g:'Al entrar',d:'Al entrar, sube el Ataque si la Defensa del rival es menor que su Def. Esp.; si no, el At. Esp.',
  entra(m){const o=rivalDe(m);if(!o)return'espera';aviso(m,'¡Descarga!');stg(m,stat(o,'def')<stat(o,'spd')?{atk:1}:{spa:1})}},
 'intrepid-sword':{n:'Espada Indómita',g:'Al entrar',d:'Al entrar, sube el Ataque.',entra(m){aviso(m,'¡Espada Indómita!');stg(m,{atk:1})}},
 'dauntless-shield':{n:'Escudo Recio',g:'Al entrar',d:'Al entrar, sube la Defensa.',entra(m){aviso(m,'¡Escudo Recio!');stg(m,{def:1})}},
 'supersweet-syrup':{n:'Jarabe Dulce',g:'Al entrar',d:'Al entrar, baja la Evasión del rival.',
  entra(m){const o=rivalDe(m);if(!o)return'espera';aviso(m,'¡Jarabe Dulce!');stg(o,{eva:-1},true)}},
 'screen-cleaner':{n:'Antipantalla',g:'Al entrar',d:'Al entrar, elimina Reflejo, Pantalla de Luz y Velo Aurora de los dos lados.',
  entra(m){aviso(m,'¡Antipantalla!');for(const x of mons)if(x.vol){delete x.vol.reflect;delete x.vol.lscreen;delete x.vol.aveil}}},
 'trace':{n:'Calco',g:'Al entrar',d:'Al entrar, copia la habilidad del rival.',
  entra(m){const o=rivalDe(m);if(!o)return'espera';if(!o.hab||NO_CALCO.includes(o.hab))return;
   m.hab=o.hab;aviso(m,'¡Calco: '+((HAB[m.hab]&&HAB[m.hab].n)||m.hab)+'!');const H=HAB[m.hab];if(H&&H.entra&&!H.entra.call(H,m))return}},
 'frisk':{n:'Inspección',g:'Al entrar',d:'Al entrar, muestra el objeto del rival.',
  entra(m){const o=rivalDe(m);if(!o)return'espera';aviso(m,'Inspección: '+(o.obj&&OBJ_EQ[o.obj]?OBJ_EQ[o.obj].n:'sin objeto'),'#e2e8f0')}},
 'forewarn':{n:'Alerta',g:'Al entrar',d:'Al entrar, muestra el ataque más potente del rival.',
  entra(m){const o=rivalDe(m);if(!o)return'espera';const v=o.mv.filter(x=>x.cat!=='sta').sort((a,b)=>b.p-a.p)[0];aviso(m,'Alerta: '+(v?v.n:'ninguno'),'#e2e8f0')}},
 'anticipation':{n:'Anticipación',g:'Al entrar',d:'Al entrar, avisa si el rival tiene un ataque superefectivo contra él.',
  entra(m){const o=rivalDe(m);if(!o)return'espera';if(o.mv.some(v=>v.cat!=='sta'&&efTipo(v.t,m)>1))aviso(m,'¡Se estremece!','#f87171')}},

 // ---------- Reglas del campo ----------
 'pressure':hAviso('Presión','Reglas del campo','El rival recarga sus ataques un '+Math.round((PRESION_CD-1)*100)+' % más despacio.','¡Presión!',{cdRec(){return PRESION_CD}}),
 'unnerve':hAviso('Nerviosismo','Reglas del campo','El rival no puede comer bayas.','¡Nerviosismo!',{bloqBaya(){return true}}),
 'mold-breaker':hAviso('Rompemoldes','Reglas del campo','Sus ataques ignoran las habilidades defensivas del rival (Levitación, Multiescamas...).','¡Rompemoldes!',{rompe:1}),
 'teravolt':hAviso('Voltaje Cruel','Reglas del campo','Sus ataques ignoran las habilidades defensivas del rival.','¡Aura de rayos!',{rompe:1}),
 'turboblaze':hAviso('Turbollama','Reglas del campo','Sus ataques ignoran las habilidades defensivas del rival.','¡Aura de llamas!',{rompe:1}),
 'neutralizing-gas':hAviso('Gas Reactivo','Reglas del campo','Mientras esté en combate, las habilidades de los demás no funcionan.','¡Gas reactivo!'),
 'dark-aura':hAviso('Aura Oscura','Reglas del campo','Los ataques de tipo Siniestro de todos hacen un 33 % más.','¡Aura oscura!',{auraMul(m,o,tg,t){return t==='dark'?(hayHab('aura-break')?.75:1.33):1}}),
 'fairy-aura':hAviso('Aura Feérica','Reglas del campo','Los ataques de tipo Hada de todos hacen un 33 % más.','¡Aura feérica!',{auraMul(m,o,tg,t){return t==='fairy'?(hayHab('aura-break')?.75:1.33):1}}),
 'aura-break':hAviso('Rompeaura','Reglas del campo','Las auras Oscura y Feérica reducen el daño en vez de aumentarlo.','¡Rompeaura!'),
 'sword-of-ruin':hAviso('Espada Debacle','Reglas del campo','La Defensa de los demás luchadores baja un 25 %.','¡Espada Debacle!',{statGlobal(o,m,k){return k==='def'?.75:1}}),
 'tablets-of-ruin':hAviso('Tablilla Debacle','Reglas del campo','El Ataque de los demás luchadores baja un 25 %.','¡Tablilla Debacle!',{statGlobal(o,m,k){return k==='atk'?.75:1}}),
 'vessel-of-ruin':hAviso('Vasija Debacle','Reglas del campo','El At. Esp. de los demás luchadores baja un 25 %.','¡Vasija Debacle!',{statGlobal(o,m,k){return k==='spa'?.75:1}}),
 'beads-of-ruin':hAviso('Abalorio Debacle','Reglas del campo','La Def. Esp. de los demás luchadores baja un 25 %.','¡Abalorio Debacle!',{statGlobal(o,m,k){return k==='spd'?.75:1}}),
});
// Habilidades que Rompemoldes ignora (las defensivas de la familia daño y Levitación)
for(const k of ['levitate','thick-fat','heatproof','water-bubble','multiscale','shadow-shield','filter','solid-rock','prism-armor','fluffy','ice-scales','fur-coat','marvel-scale','battle-armor','shell-armor','shield-dust','sand-veil','snow-cloak','punk-rock'])if(HAB[k])HAB[k].rompible=1;