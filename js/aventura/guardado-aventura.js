// Guardado LOCAL del modo aventura: una run en curso + historial de runs terminadas.
// Todo async a propósito (igual que guardado.js): si algún día se guarda en un servidor solo cambia este archivo.
const GuardadoAventura=(()=>{
  const K={run:'aventura-run-v1',hist:'aventura-historial-v1'};
  const leer=(k,def)=>{try{const v=localStorage.getItem(k);return v==null?def:JSON.parse(v)}catch(e){return def}};
  const cargar=async()=>{const r=leer(K.run,null);return r&&Array.isArray(r.pokes)&&r.pokes.length?r:null};
  const guardar=async run=>localStorage.setItem(K.run,JSON.stringify(run));   // puede lanzar si no queda espacio
  const borrar=async()=>localStorage.removeItem(K.run);
  const historial=async()=>leer(K.hist,[]);
  async function archivar(run){   // guarda un resumen de la run terminada y la borra
    const h=leer(K.hist,[]);
    h.unshift({fecha:new Date().toISOString().slice(0,10),region:run.region,resultado:run.fin||'abandonada',medallas:run.medallas.length,capturas:run.stats.capturas,combates:run.stats.combates});
    try{localStorage.setItem(K.hist,JSON.stringify(h.slice(0,20)))}catch(e){}
    await borrar();
  }
  return{cargar,guardar,borrar,historial,archivar};
})();
if(typeof module!=='undefined')module.exports=GuardadoAventura;