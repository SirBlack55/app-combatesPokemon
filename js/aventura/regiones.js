// Regiones del modo aventura (SOLO DATOS). Para añadir una región o una zona: copia un bloque y cámbialo.
// El mapa es LIBRE: cada lugar (nodo) está conectado a otros con `con` (las conexiones valen en los dos sentidos)
// y el jugador va a donde quiera, salvo que el lugar pida algo en `requiere`.
//   tipo:'pueblo'|'ciudad'|'ruta'|'cueva'  → solo cambia el icono por defecto y si sale en el viaje rápido (pueblo/ciudad sí)
//   con:[ids]                    → lugares vecinos
//   requiere:{medalla:'Roca'}    → o {medallas:2}: hace falta esa medalla / ese número de medallas para entrar
//   proximamente:true            → aparece bloqueado como "Próximamente"
//   encuentros:[{id,peso,min,max}] → Pokémon salvajes SIN LÍMITE (id = nº de Pokédex, min/max = nivel). Sirven para subir y capturar.
//   entrenadores:[{nombre,titulo?,equipo:[{id,nv}],dinero?,premio?}] → combates que solo se ganan UNA vez
//   gimnasio:{nombre,titulo,equipo,medalla,premio?} → líder (una vez; da la medalla)
//   tienda:[{o,precio}]          → o = clave del objeto (ver OBJETOS en evoluciones-datos.js)
//   hallazgo:{objeto:n}          → objetos que se recogen UNA vez al pulsar "Buscar objetos"
// Todas las cantidades y niveles son de EJEMPLO para probar.
const REGIONES={
  kanto:{id:'kanto',nombre:'Kanto',inicio:'paleta',iniciales:[1,4,7],
    nodos:{
      paleta:{nombre:'Pueblo Paleta',tipo:'pueblo',icono:'🏠',desc:'Tu pueblo. Aquí empieza todo.',con:['ruta1']},
      ruta1:{nombre:'Ruta 1',tipo:'ruta',icono:'🌾',desc:'Un camino tranquilo con Pokémon pequeños.',con:['verde'],
        encuentros:[{id:16,peso:50,min:2,max:5},{id:19,peso:50,min:2,max:5}]},
      verde:{nombre:'Ciudad Verde',tipo:'ciudad',icono:'🏙️',desc:'Tiene Poké Mart. El gimnasio sigue cerrado.',con:['ruta2','ruta22'],
        tienda:[{o:'pokeball',precio:60},{o:'caramelo-s',precio:80},{o:'caramelo-m',precio:350}]},
      ruta22:{nombre:'Ruta 22',tipo:'ruta',icono:'⛰️',desc:'Pokémon algo más fuertes, cerca de la Calle Victoria.',
        encuentros:[{id:19,peso:20,min:5,max:8},{id:21,peso:25,min:5,max:8},{id:56,peso:20,min:5,max:8},{id:29,peso:17,min:5,max:8},{id:32,peso:18,min:5,max:8}]},
      ruta2:{nombre:'Ruta 2',tipo:'ruta',icono:'🌳',desc:'Lleva al Bosque Verde.',con:['bosque'],
        encuentros:[{id:19,peso:30,min:3,max:5},{id:16,peso:30,min:3,max:5},{id:10,peso:20,min:3,max:5},{id:13,peso:20,min:3,max:5}]},
      bosque:{nombre:'Bosque Verde',tipo:'ruta',icono:'🌲',desc:'Bichos por todas partes… y quizá un Pikachu.',con:['plateada'],
        encuentros:[{id:10,peso:30,min:3,max:6},{id:13,peso:30,min:3,max:6},{id:11,peso:12,min:4,max:7},{id:14,peso:12,min:4,max:7},{id:25,peso:6,min:4,max:7}],
        entrenadores:[{nombre:'Cazabichos Rico',equipo:[{id:13,nv:6},{id:10,nv:6}]},{nombre:'Cazabichos Sam',equipo:[{id:14,nv:7},{id:11,nv:7},{id:13,nv:7}]}],
        hallazgo:{pokeball:3}},
      plateada:{nombre:'Ciudad Plateada',tipo:'ciudad',icono:'🪨',desc:'Gimnasio de tipo Roca y Poké Mart.',con:['ruta3'],
        gimnasio:{nombre:'Brock',titulo:'Líder',equipo:[{id:74,nv:12},{id:95,nv:14}],medalla:'Roca',premio:{'caramelo-m':3}},
        tienda:[{o:'pokeball',precio:60},{o:'superball',precio:150},{o:'caramelo-s',precio:80},{o:'caramelo-m',precio:350}]},
      ruta3:{nombre:'Ruta 3',tipo:'ruta',icono:'🏔️',desc:'Entrenadores y Pokémon de montaña. Hay que ser digno de la medalla Roca.',con:['mtmoon'],requiere:{medalla:'Roca'},
        encuentros:[{id:16,peso:25,min:6,max:9},{id:21,peso:30,min:6,max:9},{id:56,peso:20,min:6,max:9},{id:39,peso:15,min:6,max:9},{id:27,peso:10,min:6,max:9}],
        entrenadores:[{nombre:'Joven Eddy',equipo:[{id:19,nv:9},{id:21,nv:9}]},{nombre:'Excursionista Marcos',equipo:[{id:74,nv:10},{id:27,nv:10}]},{nombre:'Lass Ana',equipo:[{id:39,nv:11},{id:16,nv:11}]}]},
      mtmoon:{nombre:'Mt. Moon',tipo:'cueva',icono:'🌙',desc:'Una cueva llena de Zubat. Dicen que hay piedras lunares.',con:['ruta4'],
        encuentros:[{id:41,peso:50,min:7,max:10},{id:74,peso:20,min:7,max:10},{id:46,peso:20,min:7,max:10},{id:35,peso:10,min:8,max:11}],
        entrenadores:[{nombre:'Recluta Rocket',equipo:[{id:19,nv:11},{id:41,nv:11}]},{nombre:'Recluta Rocket',equipo:[{id:23,nv:12},{id:41,nv:12}]}],
        hallazgo:{'moon-stone':1}},
      ruta4:{nombre:'Ruta 4',tipo:'ruta',icono:'🛤️',desc:'Baja de la montaña hacia Ciudad Celeste.',con:['celeste'],
        encuentros:[{id:19,peso:20,min:8,max:11},{id:21,peso:25,min:8,max:11},{id:23,peso:20,min:8,max:11},{id:27,peso:20,min:8,max:11},{id:56,peso:15,min:8,max:11}],
        entrenadores:[{nombre:'Excursionista Luis',equipo:[{id:27,nv:12},{id:23,nv:12}]}]},
      celeste:{nombre:'Ciudad Celeste',tipo:'ciudad',icono:'💧',desc:'Gimnasio de tipo Agua y Poké Mart con piedras evolutivas.',con:['ruta24','ruta5'],
        gimnasio:{nombre:'Misty',titulo:'Líder',equipo:[{id:120,nv:18},{id:121,nv:21}],medalla:'Cascada',premio:{'caramelo-l':2}},
        tienda:[{o:'pokeball',precio:60},{o:'superball',precio:150},{o:'caramelo-s',precio:80},{o:'caramelo-m',precio:350},{o:'caramelo-l',precio:1200},
          {o:'fire-stone',precio:1500},{o:'water-stone',precio:1500},{o:'thunder-stone',precio:1500},{o:'leaf-stone',precio:1500},{o:'moon-stone',precio:1500}]},
      ruta24:{nombre:'Ruta 24',tipo:'ruta',icono:'🌉',desc:'El Puente Pepita, con muchos entrenadores.',con:['ruta25'],
        encuentros:[{id:16,peso:20,min:9,max:12},{id:43,peso:20,min:9,max:12},{id:69,peso:20,min:9,max:12},{id:10,peso:15,min:9,max:12},{id:13,peso:15,min:9,max:12},{id:63,peso:10,min:9,max:12}],
        entrenadores:[{nombre:'Joven Tim',equipo:[{id:19,nv:12},{id:16,nv:12}]},{nombre:'Lass Sara',equipo:[{id:43,nv:13},{id:69,nv:13}]},{nombre:'Cazabichos Pol',equipo:[{id:14,nv:13},{id:11,nv:13},{id:123,nv:14}]}]},
      ruta25:{nombre:'Ruta 25',tipo:'ruta',icono:'🏖️',desc:'Un camino costero hasta una casa solitaria.',
        encuentros:[{id:16,peso:20,min:10,max:13},{id:43,peso:20,min:10,max:13},{id:69,peso:20,min:10,max:13},{id:63,peso:15,min:10,max:13},{id:129,peso:5,min:10,max:13},{id:25,peso:20,min:10,max:13}],
        hallazgo:{'water-stone':1}},
      // Aquí seguirá Kanto: ruta5, Ciudad Azulona, Lavanda, Carmín...
      ruta5:{nombre:'Ruta 5',tipo:'ruta',icono:'🧭',desc:'Lleva a Ciudad Azulona.',proximamente:true}
    }}
};
if(typeof module!=='undefined')module.exports=REGIONES;