// Experiencia del gacha (código PURO: sin red ni DOM). Las 6 curvas de los juegos de Pokémon.
// El grupo de cada especie viene de la PokéAPI (experiencia-datos.js → GRUPO_EXP[id]).
//   r Rápido · m Medio · p Parabólico · l Lento · e Errático · f Fluctuante
// xp de una carta = XP TOTAL acumulada; su nivel sale de esa XP con la curva de su especie. Sin tope por carta: el máximo es el 100.
const Experiencia=(()=>{
  const NIVEL_MAX=100;
  const GRUPOS={r:'Rápido',m:'Medio',p:'Parabólico',l:'Lento',e:'Errático',f:'Fluctuante'};
  // XP total necesaria para llegar al nivel n (fórmulas de los juegos)
  const F={
    r:n=>4*n**3/5,
    m:n=>n**3,
    p:n=>6*n**3/5-15*n**2+100*n-140,
    l:n=>5*n**3/4,
    e:n=>n<50?n**3*(100-n)/50:n<68?n**3*(150-n)/100:n<98?n**3*Math.floor((1911-10*n)/3)/500:n**3*(160-n)/100,
    f:n=>n<15?n**3*(Math.floor((n+1)/3)+24)/50:n<36?n**3*(n+14)/50:n**3*(Math.floor(n/2)+32)/50,
  };
  const xpTotal=(g,n)=>n<=1?0:Math.max(0,Math.floor((F[g]||F.m)(Math.min(n,NIVEL_MAX))));
  function nivelPorXp(g,xp){let n=1;while(n<NIVEL_MAX&&xpTotal(g,n+1)<=xp)n++;return n}
  // Caramelos: XP fija por unidad (valores de ejemplo, a probar)
  const XP_CARAMELO={'caramelo-s':100,'caramelo-m':500,'caramelo-l':2000,'caramelo-xl':10000};

  // Plan automático de caramelos para llegar a un nivel. inv = {clave: cantidad que tiene el jugador}.
  // Criterio: 1º gastar la mínima XP posible (la XP de más no se pierde, pero se queda en esa carta y se la quitas a las demás);
  // 2º, a igualdad, el menor número de caramelos. Mochila exacta, así que sirve con cualquier valor de XP por caramelo.
  // Devuelve {ok, usar:{clave:n}, xp (total que da), sobrante (XP por encima de lo necesario), n (caramelos)}; ok=false si no alcanza.
  const mcd=(a,b)=>b?mcd(b,a%b):a;
  function planCaramelos(g,xp,objetivo,inv){
    const falta=xpTotal(g,Math.min(objetivo,NIVEL_MAX))-xp;
    if(falta<=0)return{ok:true,usar:{},xp:0,sobrante:0,n:0};
    const tipos=Object.keys(XP_CARAMELO).filter(k=>(inv[k]||0)>0);
    if(!tipos.length)return{ok:false,usar:{},xp:0,sobrante:0,n:0};
    const u=Object.values(XP_CARAMELO).reduce(mcd),need=Math.ceil(falta/u);
    const limite=need+Math.max(...tipos.map(k=>XP_CARAMELO[k]/u))-1;   // pasarse más que el mayor caramelo usado nunca compensa
    const items=[];   // lotes de 1,2,4,8... caramelos de cada tipo (mochila acotada)
    for(const k of tipos){let resto=inv[k],p=1;while(resto>0){const c=Math.min(p,resto);items.push({k,c,v:c*XP_CARAMELO[k]/u});resto-=c;p*=2}}
    let dp=new Array(limite+1).fill(Infinity);dp[0]=0;
    const toma=[];
    for(const it of items){
      const nd=dp.slice(),tk=new Uint8Array(limite+1);
      for(let t=it.v;t<=limite;t++)if(dp[t-it.v]+it.c<nd[t]){nd[t]=dp[t-it.v]+it.c;tk[t]=1}
      dp=nd;toma.push(tk);
    }
    let t=need;while(t<=limite&&dp[t]===Infinity)t++;
    if(t>limite)return{ok:false,usar:{},xp:0,sobrante:0,n:0};
    const total=t*u,usar={};let n=0;
    for(let i=items.length-1;i>=0;i--)if(toma[i][t]){usar[items[i].k]=(usar[items[i].k]||0)+items[i].c;n+=items[i].c;t-=items[i].v}
    return{ok:true,usar,xp:total,sobrante:total-falta,n};
  }
  return{NIVEL_MAX,GRUPOS,xpTotal,nivelPorXp,XP_CARAMELO,planCaramelos};
})();
if(typeof module!=='undefined')module.exports=Experiencia;