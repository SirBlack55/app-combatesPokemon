// Elección de ataque de la IA.
function wt(m,v,i){if(m.mc[i]>0)return 0;
 const V=m.vol||{};   // control: Tormento, Otra Vez, Anulación, Mofa, Último Recurso
 if(m.pi!=null&&((V.torment&&i===m.pi)||((V.encore||V.furia)&&i!==m.pi)))return 0;
 if(V.sil&&typeof SONIDO!=='undefined'&&SONIDO.includes(v.key))return 0;
 if(V.disable&&V.disable.i===i)return 0;
 if(V.taunt&&v.cat=='sta')return 0;
 if(v.fx&&v.fx.k=='ultimo'&&!m.mv.every((x,j)=>j===i||(m.us&&m.us[j])))return 0;
 const f=v.fx;if(f){if(f.k=='kamik'||f.k=='gambito')return m.hp/m.max<.35?3:.15;if(f.k=='igualar')return m.tg&&m.tg.hp>m.hp?2:0}
 if(v.cat=='sta'){const e=v.ef||{},o=m.tg;if(e.c)return m.cnt?0:1;
  const w=wtEfx(m,e,o);if(w!==undefined)return w;
  if(e.a&&!e.a.yo){if(!o||!puedeEst(o,e.a.k))return 0;return e.a.k=='slp'||e.a.k=='par'?1.6:1.2}if(e.h)return m.hp/m.max<.5?4:m.hp/m.max<.8?.3:0;
  if(e.s)return Object.keys(e.s).every(x=>m.stg[x]>=2)?0:1.3;
  if(e.o)return !o||Object.keys(e.o).every(x=>o.stg[x]<=-2)?0:1.1;return 0}
 return(v.u?.8:v.tk?1:1.3)*(v.pr?(m.tg&&m.tg.hp/m.tg.max<.3?2.2:1.15):1)}   // los de prioridad: más ganas de rematar
function plan(m){const L=m.mv,w=L.map((v,i)=>wt(m,v,i)),S=w.reduce((a,b)=>a+b,0);if(!S){m.plan=null;return}let q=rnd()*S,i=0;while(i<L.length-1&&(q-=w[i])>0)i++;if(!w[i])i=w.findIndex(x=>x>0);m.plan=L[i];m.pi=i}