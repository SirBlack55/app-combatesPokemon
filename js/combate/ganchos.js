// GANCHOS de habilidades y objetos equipados (motor). Las tablas están en habilidades.js (HAB) y objetos.js (OBJ_EQ).
// Una habilidad u objeto es un objeto con funciones que se llaman en estos momentos (todas opcionales; reciben el luchador dueño primero):
//   entra(m)                    al terminar la animación de entrada. Devuelve 'espera' para reintentarlo (p. ej. aún no hay rival)
//   seg(m)                      una vez por segundo de combate
//   danoMul(o,tg,t,cat,dm)      número: multiplica el daño que HACE el dueño (o = dueño)
//   danoRec(tg,o,t,cat,dm)      número: multiplica el daño que RECIBE el dueño (tg = dueño)
//   daDano(o,tg,d,prim)         tras hacer daño (prim = golpe principal del ataque, no los extras de varios golpes)
//   golpeado(tg,o,d,prim)       tras recibir daño y seguir vivo
//   inmune(m,t)                 true si el dueño es inmune al tipo t (ataques y trampas del suelo)
//   anulaClima(m)               true: mientras esté en combate el clima no tiene efecto (campo.cl se ve null)
//   cdRec(tg,o)                 número: multiplica la recarga de los ataques del rival (Presión)
//   bloqBaya(m)                 true: el rival no puede comer bayas (Nerviosismo)
//   auraMul(dueño,o,tg,t,cat,dm) / statGlobal(dueño,m,k)  auras que afectan a todos (Aura Oscura, Espada Debacle...)
//   rompible:1 (campo de la entrada) = Rompemoldes la ignora · rompe:1 = la entrada tiene Rompemoldes
//   absorbe(m,o,t,e,prim)       true: el ataque no le hace daño (la habilidad aplica su efecto, p. ej. curar, solo si prim) · bloqMove(m,o,p): true si anula un ataque de estado ofensivo
//   aguanta(m,o,d)              true: sobrevive con 1 PS a un golpe que lo mataría (Robustez) · sinClimaDano(m,cl): true si no le hiere ese clima (sand/hail)
//   statMul(m,k)                número: multiplica su estadística k (atk, def, spa, spd, spe). No debe llamar a stat()
//   accMul(o,tg,p) / accRec(tg,o,p)   número: multiplica la precisión de sus ataques / de los ataques que recibe
//   noFalla(m)                  true: sus ataques y los que recibe nunca fallan
//   sinCrit(m)                  true: no recibe golpes críticos · critEt(o): suma etapas de crítico · critMul(o,tg): multiplica el daño crítico
//   secMod(o,sec,tg) / secRec(tg,sec,o)  devuelven los efectos secundarios (mv.sec) que aplican al atacar / al recibir (null = ninguno)
// Campos opcionales de cada entrada: n nombre · d descripción · g grupo (para la auditoría) · i icono (solo objetos).
// m.hab / m.obj = claves de HAB / OBJ_EQ. m.habOff / m.objOff = anuladas (Gastroácido, Embargo...: aún sin usar).
// Un objeto de un solo uso se gasta con gastarObj(m): desaparece del luchador y de su carta (la pantalla de eventos lo quita de la box).
const rivalDe=m=>mons.find(o=>o.side!==m.side&&!o.dead&&!(o.enter>0))||null;
// H_ATQ = atacante mientras se resuelve un golpe o su precisión (lo fijan los envoltorios de hit y accEf, más abajo): si tiene Rompemoldes,
// las habilidades del rival marcadas con rompible:1 no cuentan en ese golpe.
let H_ATQ=null;
const hayHab=k=>mons.some(x=>!x.dead&&!(x.enter>0)&&x.hab===k&&!x.habOff&&!gasNeutro(x));
// Gas Reactivo: mientras haya un luchador con esa habilidad, las demás habilidades no funcionan
const gasNeutro=m=>m.hab!=='neutralizing-gas'&&mons.some(x=>x!==m&&!x.dead&&!(x.enter>0)&&x.hab==='neutralizing-gas'&&!x.habOff);
const climaAnulado=()=>mons.some(m=>!m.dead&&!(m.enter>0)&&!!gancho('anulaClima',m));
function fuentesH(m){
 const r=[],o=m.obj&&!m.objOff&&typeof OBJ_EQ!=='undefined'&&OBJ_EQ[m.obj];let h=m.hab&&!m.habOff&&typeof HAB!=='undefined'&&HAB[m.hab];
 if(h&&gasNeutro(m))h=null;
 if(h&&h.rompible&&H_ATQ&&H_ATQ!==m&&H_ATQ.side!==m.side&&!H_ATQ.habOff&&typeof HAB!=='undefined'&&HAB[H_ATQ.hab]&&HAB[H_ATQ.hab].rompe&&!gasNeutro(H_ATQ))h=null;
 if(h)r.push(h);if(o)r.push(o);return r;
}
// Llama a todas las fuentes y devuelve el primer valor verdadero
function gancho(k,m,...a){let r;for(const E of fuentesH(m)){const f=E[k];if(f){const v=f.call(E,m,...a);if(v&&!r)r=v}}return r}
// Producto de los números que devuelven las fuentes (1 si no hay)
function ganchoMul(k,m,...a){let x=1;for(const E of fuentesH(m)){const f=E[k];if(f){const v=f.call(E,m,...a);if(typeof v==='number')x*=v}}return x}
// Suma de los números que devuelven las fuentes (0 si no hay)
function ganchoSum(k,m,...a){let x=0;for(const E of fuentesH(m)){const f=E[k];if(f){const v=f.call(E,m,...a);if(typeof v==='number')x+=v}}return x}
// Valor que pasa por las fuentes: cada una recibe (m, valor, ...a) y, si devuelve algo distinto de undefined, ese es el nuevo valor
function ganchoVal(k,m,v,...a){for(const E of fuentesH(m)){const f=E[k];if(f){const r=f.call(E,m,v,...a);if(r!==undefined)v=r}}return v}
// Auras de campo: cada luchador en combate puede modificar el daño de TODOS (auraMul(dueño,o,tg,t,cat,dm)) o las estadísticas de los demás (statGlobal(dueño,m,k))
const auraDano=(o,tg,t,cat,dm)=>{let x=1;for(const m of mons)if(!m.dead&&!(m.enter>0))x*=ganchoMul('auraMul',m,o,tg,t,cat,dm);return x};
const statGlobal=(m,k)=>{let x=1;for(const o of mons)if(o!==m&&!o.dead&&!(o.enter>0))x*=ganchoMul('statGlobal',o,m,k);return x};
// Ejecuta f con o como atacante (Rompemoldes también vale para ataques de estado)
function conAtq(o,f){const q=H_ATQ;H_ATQ=o;try{return f()}finally{H_ATQ=q}}
// ¿Es un ataque de estado que actúa sobre el rival?
const ofensivoSt=p=>!!(p.ef&&(p.ef.o||(p.ef.a&&!p.ef.a.yo)||p.ef.of||p.ef.ty||p.ef.ta||p.ef.sp));
const mulDano=(o,tg,t,cat,dm)=>ganchoMul('danoMul',o,tg,t,cat,dm)*ganchoMul('danoRec',tg,o,t,cat,dm)*auraDano(o,tg,t,cat,dm);
function gastarObj(m){const k=m.obj;m.obj=null;if(m.u){m.u.obj=null;m.u.objGastado=1}return k}
// Cada paso de simulación (lo llama upM, tras tickEst)
function tickGanchos(m,dt){
 if(!m.hkE){const r=gancho('entra',m);if(r!=='espera')m.hkE=1}
 m.hkT=(m.hkT||0)+dt;
 while(m.hkT>=1&&!m.dead){m.hkT-=1;gancho('seg',m)}
}
// Envoltorios: mientras se resuelve un golpe o su precisión se sabe quién ataca (Rompemoldes)
{const h0=hit;hit=function(...a){const p=H_ATQ;H_ATQ=a[3];try{return h0.apply(this,a)}finally{H_ATQ=p}}}
{const a0=accEf;accEf=function(m,tg,p){const q=H_ATQ;H_ATQ=m;try{return a0(m,tg,p)}finally{H_ATQ=q}}}