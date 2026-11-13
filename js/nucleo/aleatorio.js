// Aleatoriedad.
//  R(a,b)  -> SOLO efectos visuales (partículas, temblores). Siempre Math.random().
//  RS(a,b) / rnd() -> SIMULACIÓN (daño, críticos, precisión, IA, posiciones). Se puede fijar con semilla(n)
//                     para que un combate sea repetible (necesario para el modo online).
//  Regla de oro al crear ataques: lo que afecta al resultado usa rnd()/RS(); lo que solo se ve usa R().
let _semilla=null;
function semilla(n){_semilla=(n==null)?null:n>>>0}
function rnd(){if(_semilla===null)return Math.random();_semilla=(_semilla+0x6D2B79F5)>>>0;let t=_semilla;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
const RS=(a,b)=>a+rnd()*(b-a),R=(a,b)=>a+Math.random()*(b-a);
