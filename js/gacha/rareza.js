// Rareza de cada especie según su línea evolutiva (N < R < SR < SSR < UR < LR).
// Regla: la ETAPA FINAL de cada línea marca el techo (por estadísticas base, o LR si es
// legendario/mítico) y cada etapa anterior baja un escalón por paso, como el "awaken" de Dokkan.
// Código PURO (sin red ni DOM). La rareza se calcula, no se guarda en la partida.
//
// cadenas = [{id, hijos:[{id, hijos:[...]}]}]   (árbol de cada línea evolutiva)
// info    = { [id]: {bst:<suma de estadísticas base>, legendario:<true/false>} }

const RAREZAS=['N','R','SR','SSR','UR','LR'];
const RAREZA_CFG={
  // bst de la etapa final: <cortes[0] → R · <cortes[1] → SR · <cortes[2] → SSR · resto → UR
  cortes:[475,500,580],
  // Legendarios y míticos: LR si su bst es ≥ este valor; si no, UR (0 = todos LR).
  legendarioLR:600,
  // Excepciones a mano sobre la ETAPA FINAL: {id: 'SR'}  (p. ej. subir un Pokémon popular)
  excepciones:{},
};

function rarezaFinalIdx(f,cfg=RAREZA_CFG){
  const ex=cfg.excepciones[f.id];
  if(ex!=null)return typeof ex==='number'?ex:RAREZAS.indexOf(ex);
  if(f.legendario)return cfg.legendarioLR&&(f.bst||0)<cfg.legendarioLR?4:5;
  return 1+cfg.cortes.filter(c=>(f.bst||0)>=c).length;
}

// Devuelve {[id]: {rareza, idx, etapa, final, techo}}
//   etapa = posición en la línea (1 = primera) · final = id de la evolución final hacia la que apunta
//   techo = índice de rareza de esa final.
// Si hay ramas (Eevee), cada especie apunta a su mejor final (la de más rareza; a igualdad, la más cercana).
function construirRarezas(cadenas,info,cfg=RAREZA_CFG){
  const out={};
  const rec=(n,etapa)=>{
    let mejor=null;const hs=n.hijos||[];
    if(!hs.length)mejor={idx:rarezaFinalIdx({id:n.id,...(info[n.id]||{})},cfg),pasos:0,final:n.id};
    for(const h of hs){
      const r=rec(h,etapa+1),c={idx:r.idx,pasos:r.pasos+1,final:r.final};
      if(!mejor||c.idx>mejor.idx||(c.idx===mejor.idx&&c.pasos<mejor.pasos))mejor=c;
    }
    const idx=Math.max(0,mejor.idx-mejor.pasos);
    out[n.id]={rareza:RAREZAS[idx],idx,etapa,final:mejor.final,techo:mejor.idx};
    return mejor;
  };
  for(const c of cadenas)rec(c,1);
  return out;
}

// Cuántas especies hay por rareza: en todas las etapas y solo en la primera (las que salen en tiradas).
function resumenRarezas(r){
  const t=RAREZAS.map(()=>0),p=RAREZAS.map(()=>0);
  for(const o of Object.values(r)){t[o.idx]++;if(o.etapa===1)p[o.idx]++}
  return RAREZAS.map((n,i)=>({rareza:n,todas:t[i],primeraEtapa:p[i]}));
}

if(typeof module!=='undefined')module.exports={RAREZAS,RAREZA_CFG,rarezaFinalIdx,construirRarezas,resumenRarezas};