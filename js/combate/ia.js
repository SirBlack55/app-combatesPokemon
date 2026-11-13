// Elección de ataque de la IA.
function wt(m,v,i){if(m.mc[i]>0)return 0;
 if(v.cat=='sta'){const e=v.ef||{},o=m.tg;if(e.h)return m.hp/m.max<.5?4:m.hp/m.max<.8?.3:0;
  if(e.s)return Object.keys(e.s).every(x=>m.stg[x]>=2)?0:1.3;
  if(e.o)return !o||Object.keys(e.o).every(x=>o.stg[x]<=-2)?0:1.1;return 0}
 return v.u?.8:v.tk?1:1.3}
function plan(m){const L=m.mv,w=L.map((v,i)=>wt(m,v,i)),S=w.reduce((a,b)=>a+b,0);if(!S){m.plan=null;return}let q=rnd()*S,i=0;while(i<L.length-1&&(q-=w[i])>0)i++;if(!w[i])i=w.findIndex(x=>x>0);m.plan=L[i];m.pi=i}
