// TABLA DE OBJETOS EQUIPADOS (clave = nombre en la PokéAPI). Ganchos: ver ganchos.js. Un objeto de un solo uso llama a gastarObj(m).
// Los nombres e iconos se registran solos en OBJETOS (inventario del gacha) desde js/gacha/habilidades-carta.js. Ajustes de ritmo: OBJ_CFG.
const OBJ_CFG={restos:.0156,vidasfera:{mul:1.3,retro:.1},zidra:{umbral:.5,cura:.25}};
// Baya que cura al bajar de cierta fracción de PS (no se come con Cura Bloqueada ni si está llena)
function bayaCura(m,nombre,umbral,frac){
 if(m.dead||m.hp<=0||m.hp>m.max*umbral||m.hp>=m.max||(m.vol&&m.vol.hblock))return;
 const r=rivalDe(m);if(r&&gancho('bloqBaya',r))return;   // Nerviosismo del rival
 gastarObj(m);curaPS(m,frac,'#fde047');gancho('alComerBaya',m);   // Mofletes
 txt.push({x:m.x,y:m.y-56,s:'¡'+nombre+'!',c:'#fde047',l:1.2,sm:1});
}
const OBJ_EQ={
 'leftovers':{n:'Restos',i:'🍀',g:'Periódico',d:'Cura el 1,56 % de los PS cada segundo.',
  seg(m){if(m.hp<m.max&&!(m.vol&&m.vol.hblock))curaPS(m,OBJ_CFG.restos,'#86efac')}},
 'life-orb':{n:'Vidasfera',i:'🔮',g:'Daño',d:'+30 % de daño, pero pierde el 10 % de sus PS en cada ataque.',
  danoMul(){return OBJ_CFG.vidasfera.mul},
  daDano(m,tg,d,prim){if(prim)dotDano(m,OBJ_CFG.vidasfera.retro,'#f87171')}},
 'sitrus-berry':{n:'Baya Zidra',i:'🍋',g:'Consumible',d:'Al bajar de la mitad de PS cura el 25 % (un solo uso).',
  golpeado(m){bayaCura(m,'Baya Zidra',OBJ_CFG.zidra.umbral,OBJ_CFG.zidra.cura)},
  seg(m){bayaCura(m,'Baya Zidra',OBJ_CFG.zidra.umbral,OBJ_CFG.zidra.cura)}},
};