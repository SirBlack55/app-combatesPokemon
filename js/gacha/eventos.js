// Eventos del gacha (código PURO: sin red ni DOM). Los datos están en eventos-datos.js y las pantallas en eventos-pantallas.js.
// Tres tipos, como en Dokkan:  farmeo (recursos de entrenamiento) · historia (celebraciones) · desafio (combates difíciles).
//   evento = { id, nombre, icono, desc, tipo, dias?:[0..6] (0 = domingo; sin 'dias' = siempre), desbloqueo?:'orden'|'libre', fases:[fase] }
//   fase   = { id, nombre, desc?, equipo (cartas que puede llevar el jugador), intentosDia? (sin valor = ilimitado),
//              rivales:[{esp, nivel, arq?}], drop:[{o, min, max, prob?}], primera?:{objeto:n} }
//  · drop = tabla de recompensas por VICTORIA: cada línea se sortea por separado (prob 0..1, por defecto 1).
//  · primera = premio extra que solo se da la primera vez que se supera la fase.
//  · El intento se gasta al EMPEZAR el combate (se gane o se pierda). Los intentos diarios se reinician por fecha del juego.
// Lo guardado en la partida: partida.eventos[id] = {dia, intentos:{faseId:n}, victorias:{faseId:n}, primera:{faseId:true}}
const Eventos=(()=>{
  const TIPOS={
    farmeo:{nombre:'Farmeo',icono:'🍬',desc:'Consigue caramelos y otros recursos para entrenar a tus cartas.'},
    historia:{nombre:'Historia',icono:'📖',desc:'Eventos de las celebraciones: fases con historia y recompensas únicas.'},
    desafio:{nombre:'Desafíos',icono:'🔥',desc:'Combates difíciles con rivales fuertes y grandes recompensas.'},
  };
  const DIAS=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const aFecha=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
  const IVS_RIVAL={hp:15,atk:15,def:15,spa:15,spd:15,spe:15};

  function estado(p,ev,hoy){   // normaliza partida.eventos[id] y reinicia los intentos si cambió el día
    const R=p.eventos||(p.eventos={}),E=R[ev.id]||(R[ev.id]={});
    E.victorias=E.victorias||{};E.primera=E.primera||{};
    if(E.dia!==hoy||!E.intentos){E.dia=hoy;E.intentos={}}
    return E;
  }
  const disponible=(ev,hoy)=>!ev.dias||ev.dias.includes(aFecha(hoy).getDay());
  const diasTexto=ev=>ev.dias?ev.dias.map(d=>DIAS[d]).join(', '):'todos los días';
  const desbloqueada=(p,ev,i,hoy)=>ev.desbloqueo==='libre'||i===0||(estado(p,ev,hoy).victorias[ev.fases[i-1].id]||0)>0;
  const intentosRestantes=(p,ev,f,hoy)=>f.intentosDia==null?Infinity:Math.max(0,f.intentosDia-(estado(p,ev,hoy).intentos[f.id]||0));
  const puedeEntrar=(p,ev,i,hoy)=>disponible(ev,hoy)&&desbloqueada(p,ev,i,hoy)&&intentosRestantes(p,ev,ev.fases[i],hoy)>0;

  function gastarIntento(p,ev,f,hoy){   // false si ya no quedan
    const i=ev.fases.indexOf(f);
    if(i<0||!puedeEntrar(p,ev,i,hoy))return false;
    const E=estado(p,ev,hoy);E.intentos[f.id]=(E.intentos[f.id]||0)+1;return true;
  }
  const dar=(p,pr)=>{p.objetos=p.objetos||{};for(const[k,n]of Object.entries(pr))p.objetos[k]=(p.objetos[k]||0)+n};

  // Victoria: sortea el drop, añade el premio de primera vez, lo mete en el inventario y cuenta la victoria.
  function resolver(p,ev,f,hoy,rng=Math.random){
    const E=estado(p,ev,hoy),premio={},add=(k,n)=>{if(n>0)premio[k]=(premio[k]||0)+n};
    for(const d of f.drop||[])if(rng()<(d.prob??1))add(d.o,d.min+Math.floor(rng()*(d.max-d.min+1)));
    const primera=!E.primera[f.id];
    if(primera){E.primera[f.id]=true;for(const[k,n]of Object.entries(f.primera||{}))add(k,n)}
    E.victorias[f.id]=(E.victorias[f.id]||0)+1;
    dar(p,premio);
    return{premio,primera};
  }

  // Estadísticas de una carta (fórmula de los juegos, sin EVs). b = stats base, nat = {u,d} de Guardado.NATURALEZAS.
  function estadisticas(b,ivs,nivel,nat){
    nat=nat||{};const r={hp:Math.floor((2*b.hp+ivs.hp)*nivel/100)+nivel+10};
    for(const s of['atk','def','spa','spd','spe']){
      const v=Math.floor((2*b[s]+ivs[s])*nivel/100)+5;r[s]=Math.floor(v*(nat.u===s?110:nat.d===s?90:100)/100);
    }
    return r;
  }
  // PS en combate: con esta escala una carta de nivel ~50 queda parecida a un Pokémon normal del simulador. Ajustable.
  const vidaCombate=hp=>Math.round(hp+60);

  return{TIPOS,IVS_RIVAL,estado,disponible,diasTexto,desbloqueada,intentosRestantes,puedeEntrar,gastarIntento,resolver,estadisticas,vidaCombate};
})();
if(typeof module!=='undefined')module.exports=Eventos;