// Motor de tirada de los banners NORMALES (de las celebraciones). Código PURO: sin red ni DOM.
// A diferencia del banner inicial, aquí se puede repetir carta (las copias se fusionan) y hay destacados y pity.
//   banner = { id, nombre, tipo:'normal', precio:{una,multi}, prob:{N,R,SR,SSR,UR,LR}, rateUp, pity,
//              destacados:[{id,arq}], pool:[{id,arq}] }      (arq = arquetipo FIJO de esa carta en este banner)
//  · prob = peso de cada rareza; las rarezas que no existen en el banner se quitan y el resto se reparte.
//  · rateUp = probabilidad de que, DENTRO de la rareza de un destacado, salga el destacado (0.5 = la mitad).
//  · pity = nº de tiradas sin destacado a partir de las cuales la siguiente es un destacado seguro (se reinicia al salir uno).
// Estado del pity: partida.pity[banner.id] = tiradas seguidas sin destacado.
const BannersNormales=(()=>{
  const RAREZAS=['N','R','SR','SSR','UR','LR'];
  const PROB={N:15,R:40,SR:30,SSR:10,UR:4,LR:1};
  const RATE_UP=.5;
  const tramos=(b,rz)=>{   // rarezas presentes con su peso y sus especies (normales y destacadas)
    const prob=b.prob||PROB,pool=b.pool||[],des=b.destacados||[];
    return RAREZAS.filter(r=>prob[r]>0).map(r=>({r,w:prob[r],ps:pool.filter(e=>rz(e.id)===r),ds:des.filter(e=>rz(e.id)===r)}))
      .filter(t=>t.ps.length||t.ds.length);
  };
  // Una tirada. pity = tiradas seguidas sin destacado hasta ahora. Devuelve {carta:{especieId,arquetipo,rareza,destacado}, pity, porPity}
  function tirada(b,rz,pity=0,rng=Math.random){
    const pick=a=>a[Math.floor(rng()*a.length)],des=b.destacados||[],n=pity+1;
    let e,dest=false,porPity=false;
    if(b.pity&&des.length&&n>=b.pity){e=pick(des);dest=true;porPity=true}
    else{
      const t=tramos(b,rz);if(!t.length)throw new Error('Banner sin cartas');
      let q=rng()*t.reduce((s,x)=>s+x.w,0),k=0;
      while(k<t.length-1&&(q-=t[k].w)>0)k++;
      const x=t[k],ru=b.rateUp??RATE_UP;
      if(x.ds.length&&(!x.ps.length||rng()<ru)){e=pick(x.ds);dest=true}else e=pick(x.ps);
    }
    return{carta:{especieId:e.id,arquetipo:e.arq,rareza:rz(e.id),destacado:dest},pity:dest?0:n,porPity};
  }
  // Varias tiradas seguidas (el pity avanza en cada una). Devuelve {cartas:[{carta,porPity}], pity}
  function tiradas(b,rz,pity,veces,rng=Math.random){
    const cartas=[];
    for(let i=0;i<veces;i++){const t=tirada(b,rz,pity,rng);pity=t.pity;cartas.push({...t.carta,porPity:t.porPity})}
    return{cartas,pity};
  }
  // Probabilidades que se enseñan al jugador (sin contar el pity): % por rareza y % de destacado en una tirada.
  function probabilidades(b,rz){
    const t=tramos(b,rz),tot=t.reduce((s,x)=>s+x.w,0),ru=b.rateUp??RATE_UP;let dest=0;const por={};
    for(const x of t){
      const p=x.w/tot*100;por[x.r]=p;
      if(x.ds.length)dest+=x.ps.length?p*ru:p;
    }
    return{porRareza:por,destacado:dest};
  }
  return{RAREZAS,PROB,tirada,tiradas,probabilidades};
})();
if(typeof module!=='undefined')module.exports=BannersNormales;