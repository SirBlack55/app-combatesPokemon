// TABLA DE HABILIDADES (clave = nombre en la PokéAPI). Para añadir una: un bloque nuevo con los ganchos que necesite (ver ganchos.js).
// Las habilidades que no estén aquí se muestran en la carta como "aún sin efecto". Ajustes de ritmo: HAB_CFG.
const HAB_CFG={impulsoCada:4};   // Impulso: segundos entre cada subida de Velocidad
const HAB={
 'intimidate':{n:'Intimidación',g:'Al entrar',d:'Al entrar en combate, baja el Ataque del rival.',
  entra(m){const o=rivalDe(m);if(!o)return'espera';
   txt.push({x:m.x,y:m.y-56,s:'¡Intimidación!',c:'#fbbf24',l:1.2,sm:1});stg(o,{atk:-1},true)}},
 'levitate':{n:'Levitación',g:'Inmunidad',d:'Inmune a los ataques de tipo Tierra y a las púas del suelo.',
  inmune(m,t){return t=='ground'}},
 'speed-boost':{n:'Impulso',g:'Periódica',d:'Cada '+HAB_CFG.impulsoCada+' s sube la Velocidad.',
  seg(m){m.hbN=(m.hbN||0)+1;if(m.hbN>=HAB_CFG.impulsoCada){m.hbN=0;if((m.stg.spe||0)<6)stg(m,{spe:1})}}},
};