// Eventos del gacha (datos). Ver eventos.js para el formato. Todas las cantidades son de EJEMPLO para probar el ritmo.
// Objetos posibles en 'drop' y 'primera': cualquier clave de OBJETOS (evoluciones-datos.js): caramelo-s/m/l/xl, pokecoin, piedras...
// 'arq' del rival es opcional: si no se pone, se elige el primer arquetipo viable de esa especie. 'hpMult' del rival (opcional) = vida ×N (jefes).
// 'misiones' del evento (opcional): propias de ese evento; si no hay, no sale el botón. Ver eventos.js.
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
  { id:'jefe-prueba', nombre:'Jefe de prueba: Snorlax', icono:'👹', tipo:'desafio', desbloqueo:'libre',
    desc:'Tu equipo contra un solo Snorlax con mucha más vida de lo normal. Evento de prueba.',
    fases:[
      {id:'jefe', nombre:'Snorlax', equipo:6,
       rivales:[{esp:143,nivel:30,arq:'fisico',hpMult:3}],
       drop:[{o:'caramelo-s',min:3,max:5}],
       primera:{pokecoin:1}},
    ],
    misiones:[
      {id:'jp-combate',nombre:'Al ataque',desc:'Juega un combate contra el jefe.',ev:'combate',meta:1,premio:{'caramelo-s':5}},
      {id:'jp-victoria',nombre:'Jefe derrotado',desc:'Gana un combate contra el jefe.',ev:'victoria',meta:1,premio:{pokecoin:1}},
      {id:'jp-victoria3',nombre:'Cazador de jefes',desc:'Gana 3 combates contra el jefe.',ev:'victoria',meta:3,premio:{'caramelo-m':3}},
    ]},
];