// HABILIDADES · familia PERIÓDICA: efectos que en los juegos ocurren cada turno. Se registran en HAB.
// Equivalencia de ritmo (la misma que Impulso): 1 turno ≈ TURNO segundos. Con eso, "1/16 de los PS por turno" ≈ 1,56 %/s (como los Restos) y "1/8" ≈ 3,1 %/s.
// No incluidas por no tener sentido aquí: Regeneración y Cura Natural (curan al cambiar de Pokémon, y cada Pokémon entra una sola vez).
const TURNO=4,P16=.0156,P8=.031,HEAL_VENENO=.03,PROB_MUDA=1/3;
const cadaTurno=(m,k,fn)=>{m[k]=(m[k]||0)+1;if(m[k]>=TURNO){m[k]=0;fn(m)}};
const climaK=k=>!!(campo.cl&&campo.cl.k===k);
const curable=m=>m.hp<m.max&&!(m.vol&&m.vol.hblock);
const curaEstado=(m,s)=>{if(m.ail){m.ail=null;txt.push({x:m.x,y:m.y-56,s,c:'#bbf7d0',l:1.2,sm:1})}};
Object.assign(HAB,{
 'rain-dish':{n:'Cura Lluvia',g:'Periódica',d:'Con lluvia, recupera el 1,56 % de los PS por segundo.',seg(m){if(climaK('rain')&&curable(m))curaPS(m,P16)}},
 'ice-body':{n:'Gélido',g:'Periódica',d:'Con granizo o nieve, recupera el 1,56 % de los PS por segundo y no sufre su daño.',seg(m){if(climaK('hail')&&curable(m))curaPS(m,P16)},sinClimaDano(m,cl){return cl==='hail'}},
 'solar-power':{n:'Poder Solar',g:'Periódica',d:'Con sol, su At. Esp. sube un 50 % pero pierde el 3,1 % de los PS por segundo.',
  statMul(m,k){return k==='spa'&&climaK('sun')?1.5:1},seg(m){if(climaK('sun'))dotDano(m,P8,'#fb923c')}},
 'poison-heal':{n:'Antídoto',g:'Periódica',d:'Envenenado, en vez de perder PS recupera el 3 % por segundo.',
  sinDotVeneno(){return true},seg(m){if(m.ail&&(m.ail.k==='psn'||m.ail.k==='tox')&&curable(m))curaPS(m,HEAL_VENENO,'#c084fc')}},
 'shed-skin':{n:'Mudar',g:'Periódica',d:'Cada '+TURNO+' s tiene un 33 % de curarse de su estado alterado.',seg(m){cadaTurno(m,'hMuda',m=>{if(rnd()<PROB_MUDA)curaEstado(m,'¡Mudó!')})}},
 'hydration':{n:'Hidratación',g:'Periódica',d:'Con lluvia, se cura del estado alterado cada '+TURNO+' s.',seg(m){cadaTurno(m,'hHidra',m=>{if(climaK('rain'))curaEstado(m,'¡Hidratación!')})}},
 'bad-dreams':{n:'Mal Sueño',g:'Periódica',d:'Un rival dormido pierde el 3,1 % de sus PS por segundo.',seg(m){const o=rivalDe(m);if(o&&o.ail&&o.ail.k==='slp')dotDano(o,P8,'#6d28d9')}},
 'moody':{n:'Veleta',g:'Periódica',d:'Cada '+TURNO+' s sube mucho (+2) una estadística al azar y baja otra.',
  seg(m){cadaTurno(m,'hMood',m=>{const K=['atk','def','spa','spd','spe'],a=K[Math.floor(rnd()*5)],b=K.filter(x=>x!==a)[Math.floor(rnd()*4)];stg(m,{[a]:2});stg(m,{[b]:-1})})}},
 'truant':{n:'Ausente',g:'Periódica',d:'Se salta uno de cada dos ataques.',
  cancelaAtaque(m){if(m.hol){m.hol=0;txt.push({x:m.x,y:m.y-56,s:'¡Está holgazaneando!',c:'#cbd5e1',l:1.2,sm:1});return true}m.hol=1;return false}},
 'harvest':{n:'Cosecha',g:'Periódica',d:'Cada '+TURNO+' s puede recuperar la baya que se comió (50 %; siempre con sol).',
  seg(m){cadaTurno(m,'hCose',m=>{const k=m.objGastadoK;if(m.obj||!k||!/berry$/.test(k))return;if(rnd()<(climaK('sun')?1:.5)){m.obj=k;if(m.u){m.u.obj=k;m.u.objGastado=0}m.objGastadoK=null;txt.push({x:m.x,y:m.y-56,s:'¡Cosecha!',c:'#86efac',l:1.2,sm:1})}})}},
 'cheek-pouch':{n:'Carrillo',g:'Periódica',d:'Al comerse una baya, recupera además el 33 % de sus PS.',alComerBaya(m){if(curable(m))curaPS(m,.33,'#fde047')}},
 'wimp-out':{n:'Huida',g:'Periódica',d:'Al bajar de la mitad de PS por un golpe, se retira del combate (si queda alguien en el equipo).',golpeado(m,o,dm,prim){if(prim&&m.hp<=m.max/2&&m.hp+dm>m.max/2)forzarCambio(m)}},
 'emergency-exit':{n:'Retirada',g:'Periódica',d:'Al bajar de la mitad de PS por un golpe, se retira del combate (si queda alguien en el equipo).',golpeado(m,o,dm,prim){if(prim&&m.hp<=m.max/2&&m.hp+dm>m.max/2)forzarCambio(m)}},
});