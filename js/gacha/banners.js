// Lógica de banners del gacha (código PURO: sin red ni DOM).
// Una "carta" = especie en primera etapa + arquetipo + rareza (la rareza se calcula con rarezaDe(id)).
//
// Banner inicial (tipo 'tutorial'): gratis, de un solo uso, 10 cartas = 1 inicial garantizado + 9 de relleno,
// con reroll ilimitado: nada se guarda hasta que el jugador se queda con una tirada.
//   { id, nombre, tipo:'tutorial', gratis:true, unSoloUso:true, tiradas:10, reroll:true,
//     garantizado:{cantidad:1, pool:[{id, arqs:[...]}]},
//     relleno:{cantidad:9, sinRepetir:true, prob:{N,R,SR,SSR}, pool:[{id, arqs:[...]}]} }
// 'arqs' = arquetipos distintos de esa especie; al tirar se elige uno al azar.

// 3 iniciales por generación (sin Pikachu ni Eevee de Let's Go)
const INICIALES_IDS=[1,4,7,152,155,158,252,255,258,387,390,393,495,498,501,650,653,656,722,725,728,810,813,816,906,909,912];

// Especies que NO entran en el relleno del banner inicial (para que el primer banner sea "amable"):
// Ultraentes (Alola) y Paradoja (Paldea). Se pueden reservar para banners especiales.
const EXCLUIDOS_DEL_INICIAL=[793,794,795,796,797,798,799,803,804,805,806,
  984,985,986,987,988,989,990,991,992,993,994,995,1005,1006,1009,1010,1020,1021,1022,1023];

// Generador de números aleatorios con semilla (para sortear pools reproducibles).
function crearRng(seed){
  let a=seed>>>0;
  return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};
}

// Elige las especies de relleno de un banner respetando cuotas por rareza y buscando variedad:
// premia los tipos que aún no han salido y penaliza repetir un tipo o la misma combinación de tipos.
// cands=[{id,rareza,tipos:[]}], cuotas={N:10,R:9,...}
function sortearRelleno(cands,cuotas,rng){
  const out=[],cuenta={},combos=new Set();
  for(const[r,n]of Object.entries(cuotas)){
    const libres=cands.filter(c=>c.rareza===r);
    for(let i=0;i<n&&libres.length;i++){
      const w=libres.map(c=>{
        const nuevos=c.tipos.filter(t=>!cuenta[t]).length,rep=Math.max(...c.tipos.map(t=>cuenta[t]||0));
        return(1+3*nuevos)/(1+rep)*(combos.has(c.tipos.slice().sort().join('/'))?.1:1);
      });
      let q=rng()*w.reduce((a,b)=>a+b,0),k=0;
      while(k<libres.length-1&&(q-=w[k])>0)k++;
      const c=libres.splice(k,1)[0];
      c.tipos.forEach(t=>cuenta[t]=(cuenta[t]||0)+1);combos.add(c.tipos.slice().sort().join('/'));out.push(c.id);
    }
  }
  return out;
}

function crearBannerInicial(iniciales,relleno,prob={N:40,R:38,SR:17,SSR:5}){
  return{id:'inicial',nombre:'Banner inicial',tipo:'tutorial',gratis:true,unSoloUso:true,tiradas:10,reroll:true,
    garantizado:{cantidad:1,pool:iniciales},
    relleno:{cantidad:9,sinRepetir:true,prob,pool:relleno}};
}

// Una tirada del banner inicial. rarezaDe(id) → 'N'|'R'|... · rng por defecto: Math.random.
// Devuelve [{especieId, arquetipo, rareza}] con el inicial garantizado primero.
function tiradaInicial(b,rarezaDe,rng=Math.random){
  const cartas=[],usados=new Set();
  const pick=a=>a[Math.floor(rng()*a.length)];
  const carta=e=>({especieId:e.id,arquetipo:pick(e.arqs),rareza:rarezaDe(e.id)});
  for(let i=0;i<b.garantizado.cantidad;i++){
    const libres=b.garantizado.pool.filter(e=>!usados.has(e.id));
    if(!libres.length)break;
    const e=pick(libres);usados.add(e.id);cartas.push(carta(e));
  }
  for(let i=0;i<b.relleno.cantidad;i++){
    const libres=b.relleno.pool.filter(e=>!usados.has(e.id));
    // solo cuentan las rarezas que aún tienen especies libres (la probabilidad de las vacías se reparte)
    const tiers=Object.entries(b.relleno.prob).filter(([r])=>libres.some(e=>rarezaDe(e.id)===r));
    if(!tiers.length)break;
    let q=rng()*tiers.reduce((a,[,p])=>a+p,0),k=0;
    while(k<tiers.length-1&&(q-=tiers[k][1])>0)k++;
    const e=pick(libres.filter(e=>rarezaDe(e.id)===tiers[k][0]));usados.add(e.id);cartas.push(carta(e));
  }
  return cartas;
}

if(typeof module!=='undefined')module.exports={INICIALES_IDS,EXCLUIDOS_DEL_INICIAL,crearRng,sortearRelleno,crearBannerInicial,tiradaInicial};