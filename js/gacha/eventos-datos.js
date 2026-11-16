// Eventos del gacha (datos). Ver eventos.js para el formato. Todas las cantidades son de EJEMPLO para probar el ritmo.
// Objetos posibles en 'drop' y 'primera': cualquier clave de OBJETOS (evoluciones-datos.js): caramelo-s/m/l/xl, pokecoin, piedras...
// 'arq' del rival es opcional: si no se pone, se elige el primer arquetipo viable de esa especie.
const EVENTOS=[
  { id:'granja-caramelos', nombre:'Granja de caramelos', icono:'🍬', tipo:'farmeo', desbloqueo:'orden',
    desc:'Derrota a los Pokémon salvajes y llévate caramelos para entrenar. Cada fase se desbloquea al superar la anterior.',
    fases:[
      {id:'facil', nombre:'Fácil', equipo:1, intentosDia:10,
       rivales:[{esp:19,nivel:10}],
       drop:[{o:'caramelo-s',min:5,max:8}]},
      {id:'normal', nombre:'Normal', equipo:2, intentosDia:8,
       rivales:[{esp:66,nivel:25}],
       drop:[{o:'caramelo-s',min:8,max:12},{o:'caramelo-m',min:1,max:2,prob:.5}],
       primera:{pokecoin:1}},
      {id:'dificil', nombre:'Difícil', equipo:3, intentosDia:6,
       rivales:[{esp:95,nivel:40},{esp:44,nivel:38}],
       drop:[{o:'caramelo-m',min:4,max:6},{o:'caramelo-l',min:1,max:2,prob:.6}],
       primera:{pokecoin:2}},
      {id:'experto', nombre:'Experto', equipo:3, intentosDia:4,
       rivales:[{esp:130,nivel:60},{esp:65,nivel:58}],
       drop:[{o:'caramelo-l',min:3,max:4},{o:'caramelo-xl',min:0,max:1,prob:.35}],
       primera:{pokecoin:3}},
    ]},
];