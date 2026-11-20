// Guardado LOCAL del modo aventura: una partida.
// Todo async a propósito (igual que guardado.js): si algún día se guarda en un servidor solo cambia este archivo.
// (Las "runs" de la versión anterior usaban otra clave y se ignoran.)
const GuardadoAventura=(()=>{
  const K='aventura-partida-v2';
  const leer=()=>{try{const v=localStorage.getItem(K);return v==null?null:JSON.parse(v)}catch(e){return null}};
  const cargar=async()=>{const r=leer();return r&&r.version===2&&Array.isArray(r.pokes)&&r.pokes.length?r:null};
  const guardar=async p=>localStorage.setItem(K,JSON.stringify(p));   // puede lanzar si no queda espacio
  const borrar=async()=>localStorage.removeItem(K);
  return{cargar,guardar,borrar};
})();
if(typeof module!=='undefined')module.exports=GuardadoAventura;