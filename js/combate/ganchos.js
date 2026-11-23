// GANCHOS de habilidades y objetos equipados (motor). Las tablas están en habilidades.js (HAB) y objetos.js (OBJ_EQ).
// Una habilidad u objeto es un objeto con funciones que se llaman en estos momentos (todas opcionales; reciben el luchador dueño primero):
//   entra(m)                    al terminar la animación de entrada. Devuelve 'espera' para reintentarlo (p. ej. aún no hay rival)
//   seg(m)                      una vez por segundo de combate
//   danoMul(o,tg,t,cat,dm)      número: multiplica el daño que HACE el dueño (o = dueño)
//   danoRec(tg,o,t,cat,dm)      número: multiplica el daño que RECIBE el dueño (tg = dueño)
//   daDano(o,tg,d,prim)         tras hacer daño (prim = golpe principal del ataque, no los extras de varios golpes)
//   golpeado(tg,o,d,prim)       tras recibir daño y seguir vivo
//   inmune(m,t)                 true si el dueño es inmune al tipo t (ataques y trampas del suelo)
// Campos opcionales de cada entrada: n nombre · d descripción · g grupo (para la auditoría) · i icono (solo objetos).
// m.hab / m.obj = claves de HAB / OBJ_EQ. m.habOff / m.objOff = anuladas (Gastroácido, Embargo...: aún sin usar).
// Un objeto de un solo uso se gasta con gastarObj(m): desaparece del luchador y de su carta (la pantalla de eventos lo quita de la box).
const rivalDe=m=>mons.find(o=>o.side!==m.side&&!o.dead&&!(o.enter>0))||null;
function fuentesH(m){
 const r=[],h=m.hab&&!m.habOff&&typeof HAB!=='undefined'&&HAB[m.hab],o=m.obj&&!m.objOff&&typeof OBJ_EQ!=='undefined'&&OBJ_EQ[m.obj];
 if(h)r.push(h);if(o)r.push(o);return r;
}
// Llama a todas las fuentes y devuelve el primer valor verdadero
function gancho(k,m,...a){let r;for(const E of fuentesH(m)){const f=E[k];if(f){const v=f.call(E,m,...a);if(v&&!r)r=v}}return r}
// Producto de los números que devuelven las fuentes (1 si no hay)
function ganchoMul(k,m,...a){let x=1;for(const E of fuentesH(m)){const f=E[k];if(f){const v=f.call(E,m,...a);if(typeof v==='number')x*=v}}return x}
const mulDano=(o,tg,t,cat,dm)=>ganchoMul('danoMul',o,tg,t,cat,dm)*ganchoMul('danoRec',tg,o,t,cat,dm);
function gastarObj(m){const k=m.obj;m.obj=null;if(m.u){m.u.obj=null;m.u.objGastado=1}return k}
// Cada paso de simulación (lo llama upM, tras tickEst)
function tickGanchos(m,dt){
 if(!m.hkE){const r=gancho('entra',m);if(r!=='espera')m.hkE=1}
 m.hkT=(m.hkT||0)+dt;
 while(m.hkT>=1&&!m.dead){m.hkT-=1;gancho('seg',m)}
}