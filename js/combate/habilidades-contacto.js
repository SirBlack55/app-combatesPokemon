// HABILIDADES · familia CONTACTO y REACCIONES: efectos al recibir o dar golpes, y al derrotar o ser derrotado. Se registran en HAB.
// Reglas: el efecto salta UNA vez por ataque (en el golpe principal, como el resto de ganchos), con probabilidad PROB_HAB si es de azar (30 %, como los juegos).
// "Contacto" = ataque cuerpo a cuerpo (esContacto) salvo que el atacante tenga Alcance Largo (sinContacto).
// Las reacciones a un golpe usan el tipo y la categoría del ataque en curso (o.last).
const PROB_HAB=.3;
const NO_CAMBIO=[...NO_CALCO,'mummy','lingering-aroma','wandering-spirit','ice-face','gulp-missile','zero-to-hero'];   // habilidades que Momia y similares no pueden cambiar
const contactoReal=o=>esContacto(o.last||{})&&!gancho('sinContacto',o);
const mvT=o=>(o.last||{}).t,mvCat=o=>(o.last||{}).cat;
const azarH=p=>rnd()<p;
const avisoH=(m,s,c)=>txt.push({x:m.x,y:m.y-56,s,c:c||'#fbbf24',l:1.2,sm:1});
// Fábricas. fn recibe (dueño, atacante, daño) · prim = golpe principal del ataque
const hContacto=(nom,d,fn)=>({n:nom,g:'Contacto',d,golpeado(m,o,dm,prim){if(prim&&!o.dead&&contactoReal(o))fn(m,o,dm)}});
const hAlGolpe=(nom,d,fn,g)=>({n:nom,g:g||'Al recibir golpe',d,golpeado(m,o,dm,prim){if(prim&&!o.dead)fn(m,o,dm)}});
const hToque=(nom,d,fn)=>({n:nom,g:'Al atacar',d,daDano(m,tg,dd,prim){if(prim&&!tg.dead&&contactoReal(m))fn(m,tg,dd)}});
const hSubeTipo=(nom,d,tipos,st)=>({n:nom,g:'Al recibir golpe',d,golpeado(m,o,dm,prim){if(prim&&tipos.includes(mvT(o)))stg(m,st)}});
// Carga eléctrica (Energía Eólica, Electromorfosis): el siguiente ataque Eléctrico hace el doble durante 1 s tras lanzarlo
const cargaH=(nom,d,cond)=>({n:nom,g:'Al recibir golpe',d,
 golpeado(m,o,dm,prim){if(prim&&!o.dead&&cond(o)&&!m.carga){m.carga=1;m.cargaFin=0;avisoH(m,'¡Cargado!','#fde047')}},
 danoMul(o,tg,t){return o.carga&&t==='elec'&&(!o.cargaFin||T<o.cargaFin)?2:1},
 daDano(m,tg,dd,prim){if(prim&&m.carga&&mvT(m)==='elec'&&!m.cargaFin)m.cargaFin=T+1},
 seg(m){if(m.cargaFin&&T>=m.cargaFin){m.carga=0;m.cargaFin=0}}});
Object.assign(HAB,{
 // ---------- Contacto: castigan al atacante ----------
 'static':hContacto('Elec. Estática','30 % de paralizar al atacante que le toca.',(m,o)=>{if(azarH(PROB_HAB))aplicarEst(o,'par',m)}),
 'flame-body':hContacto('Cuerpo Llama','30 % de quemar al atacante que le toca.',(m,o)=>{if(azarH(PROB_HAB))aplicarEst(o,'brn',m)}),
 'poison-point':hContacto('Punto Tóxico','30 % de envenenar al atacante que le toca.',(m,o)=>{if(azarH(PROB_HAB))aplicarEst(o,'psn',m)}),
 'cute-charm':hContacto('Gentileza','30 % de enamorar al atacante que le toca.',(m,o)=>{if(azarH(PROB_HAB))aplicarEst(o,'inf',m)}),
 'effect-spore':hContacto('Espora Efecto','30 % de dormir, envenenar o paralizar al atacante (no a los de tipo Planta ni a quien tenga Funda).',(m,o)=>{
  if(o.types.includes('leaf')||gancho('sinPolvo',o))return;const r=rnd();if(r<.09)aplicarEst(o,'slp',m);else if(r<.19)aplicarEst(o,'psn',m);else if(r<.3)aplicarEst(o,'par',m)}),
 'rough-skin':hContacto('Piel Tosca','El atacante que le toca pierde el 12,5 % de sus PS.',(m,o)=>dotDano(o,.125,'#f87171')),
 'iron-barbs':hContacto('Punta Acero','El atacante que le toca pierde el 12,5 % de sus PS.',(m,o)=>dotDano(o,.125,'#f87171')),
 'gooey':hContacto('Viscosidad','El atacante que le toca pierde Velocidad.',(m,o)=>stg(o,{spe:-1},true)),
 'tangling-hair':hContacto('Pelo Enredado','El atacante que le toca pierde Velocidad.',(m,o)=>stg(o,{spe:-1},true)),
 'perish-body':hContacto('Cuerpo Mortal','Al tocarle, los dos se debilitan en 6 s.',(m,o)=>{if(!(m.vol&&m.vol.perish)&&!(o.vol&&o.vol.perish)){aplicarEst(o,'perish',m);aplicarEst(m,'perish',m)}}),
 'mummy':hContacto('Momia','Al tocarle, la habilidad del atacante pasa a ser Momia.',(m,o)=>{if(!NO_CAMBIO.includes(o.hab)&&o.hab){o.hab='mummy';avisoH(o,'¡Momia!','#a3a3a3')}}),
 'lingering-aroma':hContacto('Olor Persistente','Al tocarle, la habilidad del atacante pasa a ser Olor Persistente.',(m,o)=>{if(!NO_CAMBIO.includes(o.hab)&&o.hab){o.hab='lingering-aroma';avisoH(o,'¡Olor persistente!','#a3a3a3')}}),
 'wandering-spirit':hContacto('Alma Errante','Al tocarle, intercambia su habilidad con la del atacante.',(m,o)=>{if(!NO_CAMBIO.includes(o.hab)&&o.hab){const h=o.hab;o.hab=m.hab;m.hab=h;avisoH(m,'¡Intercambio!','#e9d5ff')}}),
 'aftermath':{n:'Resquicio',g:'Contacto',d:'Si un ataque de contacto lo debilita, el atacante pierde el 25 % de sus PS.',alMorir(m,por){if(!por.dead&&contactoReal(por))dotDano(por,.25,'#f87171')}},
 'innards-out':{n:'Revés',g:'Al recibir golpe',d:'Al ser debilitado, el atacante pierde tantos PS como le quedaban.',alMorir(m,por){if(!por.dead&&m.hpAnt>0)dotDano(por,m.hpAnt/por.max,'#f87171')}},
 // ---------- Al ser golpeado (cualquier ataque) ----------
 'cursed-body':hAlGolpe('Cuerpo Maldito','30 % de anular el ataque que le golpea.',(m,o)=>{if(azarH(PROB_HAB))aplicarEst(o,'disable',m)}),
 'stamina':hAlGolpe('Firmeza','Al recibir un golpe, sube su Defensa.',m=>stg(m,{def:1})),
 'cotton-down':hAlGolpe('Pelusa','Al recibir un golpe, baja la Velocidad del atacante.',(m,o)=>stg(o,{spe:-1},true)),
 'weak-armor':hAlGolpe('Armadura Frágil','Al recibir un golpe físico, baja su Defensa y sube mucho su Velocidad.',(m,o)=>{if(mvCat(o)==='phy')stg(m,{def:-1,spe:2})}),
 'toxic-debris':hAlGolpe('Restos Tóxicos','Al recibir un golpe físico, deja púas tóxicas en el lado del atacante.',(m,o)=>{if(mvCat(o)==='phy'){const h=campo.haz[o.side];if((h.tspikes||0)<2){h.tspikes=(h.tspikes||0)+1;avisoH(m,'¡Púas tóxicas!','#c084fc')}}}),
 'color-change':hAlGolpe('Cambio Color','Cambia su tipo al del ataque que le golpea.',(m,o)=>{const t=mvT(o);if(t&&mvCat(o)!=='sta'&&!(m.types.length===1&&m.types[0]===t)){m.types=[t];avisoH(m,'¡Cambio de tipo!','#e9d5ff')}}),
 'sand-spit':hAlGolpe('Expulsarena','Al recibir un golpe, levanta una tormenta de arena.',m=>campoHab('cl','sand',m)),
 'seed-sower':hAlGolpe('Disemillar','Al recibir un golpe, crea un campo de hierba.',m=>campoHab('te','leaf',m)),
 'anger-point':hAlGolpe('Irascible','Al recibir un golpe crítico, su Ataque sube al máximo.',m=>{if(m.critT===T)stg(m,{atk:6})}),
 'berserk':{n:'Cólera',g:'Al recibir golpe',d:'Al bajar de la mitad de PS por un golpe, sube su At. Esp.',golpeado(m,o,dm,prim){if(prim&&m.hp<=m.max/2&&m.hp+dm>m.max/2)stg(m,{spa:1})}},
 'anger-shell':{n:'Coraza Ira',g:'Al recibir golpe',d:'Al bajar de la mitad de PS por un golpe, sube Ataque, At. Esp. y Velocidad y bajan sus defensas.',golpeado(m,o,dm,prim){if(prim&&m.hp<=m.max/2&&m.hp+dm>m.max/2)stg(m,{atk:1,spa:1,spe:1,def:-1,spd:-1})}},
 'water-compaction':hSubeTipo('Hidrorrefuerzo','Si le golpea un ataque de Agua, su Defensa sube mucho.',['water'],{def:2}),
 'steam-engine':hSubeTipo('Combustible','Si le golpea un ataque de Fuego o Agua, su Velocidad sube al máximo.',['fire','water'],{spe:6}),
 'thermal-exchange':hSubeTipo('Termoconversión','Si le golpea un ataque de Fuego, su Ataque sube.',['fire'],{atk:1}),
 'justified':hSubeTipo('Justiciero','Si le golpea un ataque Siniestro, su Ataque sube.',['dark'],{atk:1}),
 'rattled':hSubeTipo('Cobardía','Si le golpea un ataque Siniestro, Fantasma o Bicho, su Velocidad sube.',['dark','ghost','bug'],{spe:1}),
 'wind-power':cargaH('Energía Eólica','Si le golpea un ataque de viento, se carga: su siguiente ataque Eléctrico hace el doble.',o=>L_VIENTO.includes((o.last||{}).key)),
 'electromorphosis':cargaH('Electromorfosis','Al recibir un golpe, se carga: su siguiente ataque Eléctrico hace el doble.',()=>true),

 // ---------- Al atacar ----------
 'poison-touch':hToque('Toque Tóxico','30 % de envenenar con sus ataques de contacto.',(m,tg)=>{if(azarH(PROB_HAB))aplicarEst(tg,'psn',m)}),
 'toxic-chain':{n:'Cadena Tóxica',g:'Al atacar',d:'30 % de envenenar gravemente con sus ataques.',daDano(m,tg,dd,prim){if(prim&&!tg.dead&&azarH(PROB_HAB))aplicarEst(tg,'tox',m)}},
 'stench':{n:'Hedor',g:'Al atacar',d:'10 % de amedrentar con sus ataques.',daDano(m,tg,dd,prim){if(prim&&!tg.dead&&azarH(.1))amedrentar(tg)}},
 'serene-grace':{n:'Dicha',g:'Al atacar',d:'Duplica la probabilidad de los efectos secundarios de sus ataques.',secMod(o,s){if(!s)return undefined;const r={...s};for(const k of['pa','f','ps'])if(r[k])r[k]=Math.min(100,r[k]*2);return r}},
 'long-reach':{n:'Remoto',g:'Al atacar',d:'Sus ataques no hacen contacto.',sinContacto(){return true}},
 'merciless':{n:'Ensañamiento',g:'Al atacar',d:'Sus golpes son críticos seguros contra un rival envenenado.',critSeguro(o,tg){return!!(tg.ail&&(tg.ail.k==='psn'||tg.ail.k==='tox'))}},

 // ---------- Al derrotar a un rival ----------
 'moxie':{n:'Autoestima',g:'Al derrotar',d:'Al derrotar a un rival, sube su Ataque.',alDerrotar(o){stg(o,{atk:1})}},
 'chilling-neigh':{n:'Relincho Blanco',g:'Al derrotar',d:'Al derrotar a un rival, sube su Ataque.',alDerrotar(o){stg(o,{atk:1})}},
 'grim-neigh':{n:'Relincho Negro',g:'Al derrotar',d:'Al derrotar a un rival, sube su At. Esp.',alDerrotar(o){stg(o,{spa:1})}},
 'beast-boost':{n:'Ultraimpulso',g:'Al derrotar',d:'Al derrotar a un rival, sube su mejor estadística.',alDerrotar(o){stg(o,{[mejorStat(o)]:1})}},
});