// Habilidad y objeto equipado de las CARTAS del gacha (código PURO: sin red ni DOM).
//  · carta.habilidad = clave de la habilidad (PokéAPI) · carta.habSlot = hueco de la especie: 0, 1 (normales) o 'o' (oculta) · carta.objeto = clave de OBJ_EQ o null
//  · La habilidad se sortea al conseguir la carta con las de su especie (HABILIDADES_ESP, generado por la herramienta 🧬 Habilidades): la oculta sale rara.
//  · Al evolucionar se conserva el hueco (la habilidad cambia si la nueva especie tiene otra en ese hueco).
//  · Un objeto se equipa sacando 1 unidad del inventario; si ya había otro, vuelve al inventario (no se pierde). Se puede quitar (vuelve al inventario). Solo se pierden los de un solo uso gastados en combate.
// Va DESPUÉS de evoluciones-datos.js (registra los objetos nuevos en OBJETOS) y ANTES de guardado.js.
const HabCarta=(()=>{
 const P_OCULTA=.05;   // probabilidad de la habilidad oculta (si la especie la tiene)
 const cap=n=>String(n).replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
 const datos=()=>typeof HABILIDADES_ESP!=='undefined'?HABILIDADES_ESP:null;
 const info_=()=>typeof HABILIDADES_INFO!=='undefined'?HABILIDADES_INFO:{};
 function opciones(id){const d=datos(),e=d&&d[id];return e?{n:e[0]||[],o:e[1]||null}:null}
 function sortear(id,rng=Math.random){
  const e=opciones(id);if(!e||(!e.n.length&&!e.o))return null;
  if(e.o&&(!e.n.length||rng()<P_OCULTA))return{hab:e.o,slot:'o'};
  const i=Math.floor(rng()*e.n.length);return{hab:e.n[i],slot:i};
 }
 function slotDe(id,hab){const e=opciones(id);if(!e)return 0;if(e.o===hab)return'o';const i=e.n.indexOf(hab);return i<0?0:i}
 function porSlot(id,slot){const e=opciones(id);if(!e)return null;
  if(slot==='o'&&e.o)return{hab:e.o,slot:'o'};
  const i=typeof slot==='number'&&e.n[slot]?slot:0;
  return e.n[i]?{hab:e.n[i],slot:i}:(e.o?{hab:e.o,slot:'o'}:null);
 }
 // Cartas que aún no tienen habilidad (antiguas o conseguidas sin datos): se les sortea. Devuelve true si cambió algo.
 function dar(c,rng){
  let cambio=false;
  if(c.objeto===undefined){c.objeto=null;cambio=true}
  if(!c.habilidad){const h=sortear(c.especieId,rng);if(h){c.habilidad=h.hab;c.habSlot=h.slot;cambio=true}}
  return cambio;
 }
 function alEvolucionar(c){const h=porSlot(c.especieId,c.habSlot);if(h){c.habilidad=h.hab;c.habSlot=h.slot}}
 const infoHab=k=>{
  if(!k)return{n:'—',d:'Sin habilidad (faltan los datos: carga habilidades-datos.js).',hecho:false};
  const H=typeof HAB!=='undefined'&&HAB[k],I=info_()[k]||[];
  return{n:I[0]||(H&&H.n)||cap(k),d:(H&&H.d)||I[1]||'',hecho:!!H};   // el nombre oficial de la PokéAPI manda; el de la tabla es de reserva
 };
 const infoObj=k=>{const O=typeof OBJ_EQ!=='undefined'&&OBJ_EQ[k];return O?{n:O.n,i:O.i||'📦',d:O.d||''}:{n:cap(k),i:'📦',d:''}};
 const objetosEquipables=()=>typeof OBJ_EQ!=='undefined'?Object.keys(OBJ_EQ):[];
 // Equipa el objeto k sacando 1 del inventario; el que llevaba la carta (si había) vuelve al inventario. Devuelve {ok, devuelto (el que había antes) | motivo}
 function equipar(p,c,k){
  if(typeof OBJ_EQ==='undefined'||!OBJ_EQ[k])return{ok:false,motivo:'Ese objeto no se puede equipar'};
  const o=p.objetos||(p.objetos={});
  if(!(o[k]>0))return{ok:false,motivo:'No te quedan'};
  o[k]--;if(o[k]<=0)delete o[k];
  const devuelto=c.objeto||null;if(devuelto)o[devuelto]=(o[devuelto]||0)+1;
  c.objeto=k;return{ok:true,devuelto};
 }
 // Quita el objeto de la carta y lo devuelve al inventario. Devuelve {ok, quitado | motivo}
 function quitar(p,c){
  if(!c.objeto)return{ok:false,motivo:'No lleva objeto'};
  const o=p.objetos||(p.objetos={}),k=c.objeto;o[k]=(o[k]||0)+1;c.objeto=null;return{ok:true,quitado:k};
 }
 // Objetos nuevos → inventario (nombre e icono) y objetos de prueba
 if(typeof OBJETOS!=='undefined'&&typeof OBJ_EQ!=='undefined')for(const k of Object.keys(OBJ_EQ))if(!OBJETOS[k])OBJETOS[k]=[OBJ_EQ[k].n,OBJ_EQ[k].i||'📦'];
 if(typeof OBJETOS_PRUEBA!=='undefined')Object.assign(OBJETOS_PRUEBA,{'leftovers':2,'life-orb':2,'sitrus-berry':5});
 // Cartas de prueba con habilidad y objeto: [especie, nivel, arquetipo, género, estrellas, habilidad, objeto]
 const CARTAS_PRUEBA=[[130,30,'fisico',null,0,'intimidate','leftovers'],[92,30,'especial',null,0,'levitate','life-orb'],[291,30,'fisico',null,0,'speed-boost','sitrus-berry']];
 return{P_OCULTA,opciones,quitar,sortear,slotDe,porSlot,dar,alEvolucionar,infoHab,infoObj,objetosEquipables,equipar,CARTAS_PRUEBA};
})();
if(typeof module!=='undefined')module.exports=HabCarta;