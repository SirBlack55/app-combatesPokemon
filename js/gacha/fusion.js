// Fusión de repetidos del gacha (código PURO: sin red ni DOM).
// Una carta (la BASE) absorbe a otra (el MATERIAL), que desaparece, y la base gana estrellas. Reglas:
//  · el material debe ser de la misma especie que la base o de una etapa ANTERIOR de su camino evolutivo
//    (Eevee sirve para cualquier eeveelución; Vaporeon no sirve para Flareon; Charmander sirve para Charmeleon);
//  · mismo arquetipo y carta no bloqueada;
//  · si en esa línea el sexo decide una evolución (Kirlia→Gallade, Salandit→Salazzle...), mismo sexo: una copia que
//    nunca podría llegar a esa especie no cuenta; en el resto de líneas el sexo no importa.
// Estrellas: una carta de N estrellas equivale a N+1 copias, así que base + material = base + material + 1 (máx. 5).
// EV = EVOLUCIONES (evoluciones-datos.js): { idOrigen:[{a, g?, ...}] }.
const Fusion=(()=>{
  const MAX_ESTRELLAS=5,memo=new WeakMap();
  function indice(EV){
    if(memo.has(EV))return memo.get(EV);
    const ix={padres:{},hijos:{},anc:{},raiz:{},genero:{}};
    for(const de in EV)for(const e of EV[de]){(ix.padres[e.a]=ix.padres[e.a]||[]).push(+de);(ix.hijos[de]=ix.hijos[de]||[]).push(e)}
    memo.set(EV,ix);return ix;
  }
  function ancestros(id,EV){   // la propia especie y todas sus etapas anteriores
    const ix=indice(EV);if(ix.anc[id])return ix.anc[id];
    const s=new Set([id]),pila=[id];
    while(pila.length)for(const p of ix.padres[pila.pop()]||[])if(!s.has(p)){s.add(p);pila.push(p)}
    return ix.anc[id]=s;
  }
  function raiz(id,EV){   // primera etapa de la línea
    const ix=indice(EV);if(ix.raiz[id]!==undefined)return ix.raiz[id];
    let r=id,n=0;while((ix.padres[r]||[]).length&&n++<10)r=ix.padres[r][0];
    return ix.raiz[id]=r;
  }
  function generoDecide(id,EV){   // ¿alguna evolución de la línea exige un género?
    const ix=indice(EV),r=raiz(id,EV);if(ix.genero[r]!==undefined)return ix.genero[r];
    const vis=new Set([r]),pila=[r];let si=false;
    while(pila.length)for(const e of ix.hijos[pila.pop()]||[]){if(e.g)si=true;if(!vis.has(e.a)){vis.add(e.a);pila.push(e.a)}}
    return ix.genero[r]=si;
  }
  const mismaLinea=(a,b,EV)=>raiz(a.especieId,EV)===raiz(b.especieId,EV);
  function puedeFusionar(base,mat,EV){
    if(mat.id===base.id)return{ok:false,motivo:'Es la misma carta'};
    if(mat.bloqueado)return{ok:false,motivo:'Está bloqueada'};
    if(!mismaLinea(base,mat,EV))return{ok:false,motivo:'Es de otra línea evolutiva'};
    if(!ancestros(base.especieId,EV).has(mat.especieId))return{ok:false,motivo:'No es una etapa anterior de esta evolución'};
    if(mat.arquetipo!==base.arquetipo)return{ok:false,motivo:'Distinto arquetipo'};
    if(generoDecide(base.especieId,EV)&&mat.genero!==base.genero)return{ok:false,motivo:'En esta línea el sexo decide una evolución: hace falta el mismo sexo'};
    return{ok:true};
  }
  function resultado(base,mats){
    const bruto=(base.estrellas||0)+mats.reduce((s,m)=>s+(m.estrellas||0)+1,0),final=Math.min(MAX_ESTRELLAS,bruto);
    return{estrellas:final,perdidas:bruto-final};
  }
  return{MAX_ESTRELLAS,ancestros,raiz,generoDecide,mismaLinea,puedeFusionar,resultado};
})();
if(typeof module!=='undefined')module.exports=Fusion;