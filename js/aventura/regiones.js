// Regiones del modo aventura (SOLO DATOS). Para añadir una región: copia el bloque de kanto y cámbialo.
// Cada región = un grafo de NODOS. El jugador recorre un nodo y, al completarlo, elige el siguiente de `sig`.
//   tipo:'pueblo'       → sin combates (se completa solo)
//   tipo:'ruta'         → `combates` encuentros salvajes seguidos. encuentros:[{id, peso, min, max}] (id = nº de Pokédex, min/max = nivel)
//   tipo:'entrenadores' → combates contra entrenadores en orden (gimnasios, Liga). {nombre, titulo?, equipo:[{id,nv}], medalla?}
//   premio:{objeto:n}   → se da al completar el nodo (claves de partida.objetos, ver OBJETOS en evoluciones-datos.js)
//   final:true          → al completarlo termina la run con victoria
//   sig:[ids]           → nodos a los que se puede avanzar (varios = bifurcación)
// Todas las cantidades y niveles son de EJEMPLO para probar.
const REGIONES={
  kanto:{id:'kanto',nombre:'Kanto',inicio:'paleta',iniciales:[1,4,7],
    nodos:{
      paleta:{nombre:'Pueblo Paleta',tipo:'pueblo',icono:'🏠',desc:'Aquí empieza tu viaje.',sig:['ruta1']},
      ruta1:{nombre:'Ruta 1',tipo:'ruta',icono:'🌾',desc:'Un camino tranquilo con Pokémon pequeños.',combates:3,
        encuentros:[{id:16,peso:50,min:2,max:4},{id:19,peso:50,min:2,max:4}],
        premio:{pokeball:4},sig:['bosque','ruta22']},
      // Bifurcación: el Bosque Verde es más seguro; la Ruta 22 es más dura pero da más cosas.
      bosque:{nombre:'Bosque Verde',tipo:'ruta',icono:'🌲',desc:'Bichos por todas partes… y quizá un Pikachu.',combates:4,
        encuentros:[{id:10,peso:30,min:3,max:5},{id:13,peso:30,min:3,max:5},{id:11,peso:12,min:4,max:6},{id:14,peso:12,min:4,max:6},{id:25,peso:6,min:4,max:6}],
        premio:{pokeball:5,'thunder-stone':1},sig:['plateada']},
      ruta22:{nombre:'Ruta 22',tipo:'ruta',icono:'⛰️',desc:'Pokémon más fuertes, pero con mejores premios.',combates:4,
        encuentros:[{id:19,peso:20,min:5,max:8},{id:21,peso:25,min:5,max:8},{id:56,peso:20,min:5,max:8},{id:29,peso:17,min:5,max:8},{id:32,peso:18,min:5,max:8}],
        premio:{pokeball:4,'cable-link':1,'moon-stone':1},sig:['plateada']},
      plateada:{nombre:'Gimnasio de Ciudad Plateada',tipo:'entrenadores',icono:'🪨',desc:'Brock, el líder de tipo Roca.',
        entrenadores:[{nombre:'Brock',titulo:'Líder',equipo:[{id:74,nv:12},{id:95,nv:14}],medalla:'Roca'}],
        premio:{pokeball:5},
        final:true}   // ← versión de prueba: aquí termina la run. Para seguir: quita `final`, pon sig:['ruta3'] y añade los nodos nuevos.
    }}
};
if(typeof module!=='undefined')module.exports=REGIONES;