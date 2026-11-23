// Ataques de estado: curar, estadísticas, estados alterados, protecciones, campo, sustituto y demás efectos (ver EFX en datos/ataques-especiales.js).
function stg(x,o,ajeno){const N={atk:'Ataque',def:'Defensa',spa:'At. Esp.',spd:'Def. Esp.',spe:'Velocidad',acc:'Precisión',eva:'Evasión'};let j=0;
 if(ajeno&&x.vol&&x.vol.mist){const q={};for(const k in o)if(o[k]>0)q[k]=o[k];if(!Object.keys(q).length){txt.push({x:x.x,y:x.y-46,s:'¡Neblina!',c:'#e0f2fe',l:1.2,sm:1});return}o=q}
 for(const k in o){const b=x.stg[k]||0,n=Math.max(-6,Math.min(6,b+o[k])),up=o[k]>0;x.stg[k]=n;txt.push({x:x.x,y:x.y-46-j++*13,s:n!=b?N[k]+(up?' ▲':' ▼').repeat(Math.abs(o[k])):N[k]+(up?' al máximo':' al mínimo'),c:up?'#fde047':'#fca5a5',l:1.5,sm:1});ring(x.x,x.y,up?'#fde047':'#f87171',45,.6)}}
// Efectos que caen sobre el rival (los devuelve la Capa Mágica; los bloquea el Sustituto)
// Intercambios y repartos (Cambiacorazón, Cambiadefensa, Psicocambio...)
function intercambio(m,tg,k){
 const sw=(a,b,ks)=>{for(const q of ks){const t=a.stg[q]||0;a.stg[q]=b.stg[q]||0;b.stg[q]=t}};
 switch(k){
  case'heart':sw(m,tg,['atk','def','spa','spd','spe','acc','eva']);break;
  case'guard':sw(m,tg,['def','spd']);break;
  case'power':sw(m,tg,['atk','spa']);break;
  case'speed':{const t=m.st.spe;m.st.spe=tg.st.spe;tg.st.spe=t;const s=m.spd;m.spd=tg.spd;tg.spd=s;break}
  case'ptrick':{const t=m.st.atk;m.st.atk=m.st.def;m.st.def=t;break}
  case'pshift':{let t=m.st.atk;m.st.atk=m.st.def;m.st.def=t;t=m.st.spa;m.st.spa=m.st.spd;m.st.spd=t;break}
  case'psplit':{const a=Math.round((m.st.atk+tg.st.atk)/2),b=Math.round((m.st.spa+tg.st.spa)/2);m.st.atk=tg.st.atk=a;m.st.spa=tg.st.spa=b;break}
  case'gsplit':{const a=Math.round((m.st.def+tg.st.def)/2),b=Math.round((m.st.spd+tg.st.spd)/2);m.st.def=tg.st.def=a;m.st.spd=tg.st.spd=b;break}
  case'topsy':for(const q in tg.stg)tg.stg[q]=-tg.stg[q];break;
  case'trans':if(m.ail&&puedeEst(tg,m.ail.k,m)){const k2=m.ail.k;m.ail=null;aplicarEst(tg,k2,m,true)}else fallo(m);break;
 }
 txt.push({x:m.x,y:m.y-56,s:'¡Intercambio!',c:'#e9d5ff',l:1.2,sm:1});
}
function stOfensivo(m,tg,ef){
 if(!tg||tg.dead)return;
 if(tg.vol&&tg.vol.mcoat&&(ef.o||ef.a||(ef.v&&ef.of))){delete tg.vol.mcoat;txt.push({x:tg.x,y:tg.y-56,s:'¡Capa Mágica!',c:'#f0abfc',l:1.2,sm:1});const t=tg;tg=m;m=t}
 if(tg.vol&&tg.vol.sub&&(ef.o||ef.a||ef.v||ef.ty||ef.ta)){fallo(tg,'¡El sustituto lo bloquea!');return}
 if(ef.o)stg(tg,ef.o,true);
 if(ef.a&&!ef.a.yo)aplicarEst(tg,ef.a.k,m,true);
 if(ef.v&&ef.of)for(const k of[].concat(ef.v))aplicarEst(tg,k,m,true);
 if(ef.ty)tg.types=[ef.ty];
 if(ef.ta&&!tg.types.includes(ef.ta))tg.types=[...tg.types,ef.ta];
 if(ef.sp){const i=tg.mv.indexOf(tg.last);if(i>=0)tg.mc[i]+=5}
}
function applySt(m,tg,p){const ef=p.ef||{};
 if(ef.nada){fallo(m,'¡Pero no pasó nada!');return}
 if(ef.req&&!(campo.cl&&campo.cl.k==ef.req)){fallo(m);return}
 if(ef.cost){const c=Math.round(m.max*ef.cost);if(m.hp<=c){fallo(m);return}m.hp-=c;txt.push({x:m.x,y:m.y-30,s:'-'+c,c:'#f87171',l:.9})}
 if(ef.sb){const c=Math.round(m.max*.25);if((m.vol&&m.vol.sub)||m.hp<=c){fallo(m);return}m.hp-=c;(m.vol=m.vol||{}).sub={l:60,t:0,hp:c};txt.push({x:m.x,y:m.y-56,s:'¡Sustituto!',c:'#fbbf24',l:1.2,sm:1})}
 if(ef.pr)protege(m,ef.pr);
 if(ef.h){
  if(m.vol&&m.vol.hblock)fallo(m,'¡Cura bloqueada!');
  else{let h=ef.h;if(['moonlight','synthesis','morning-sun'].includes(p.key)&&campo.cl)h=campo.cl.k=='sun'?.67:.25;
   const r=Math.min(Math.round(m.max*h),m.max-m.hp);m.hp+=r;txt.push({x:m.x,y:m.y-40,s:'+'+r,c:'#4ade80',l:1.1});ring(m.x,m.y,'#4ade80',50,.7);for(let i=0;i<14;i++)ps.push({x:m.x+R(-22,22),y:m.y+R(-10,16),vx:R(-10,10),vy:R(-90,-30),l:.9,m:.9,c:i%2?'#bbf7d0':'#4ade80',s:R(3,6),g:1})}}
 if(ef.s)stg(m,ef.s);
 if(ef.c){m.cnt={cat:ef.c.cat,m:ef.c.m,l:ef.c.t};txt.push({x:m.x,y:m.y-46,s:'¡En guardia!',c:'#fbbf24',l:1.2,sm:1});ring(m.x,m.y,'#fbbf24',45,.6)}
 // campo
 if(ef.cl)ponerCampo('cl',ef.cl,m);if(ef.te)ponerCampo('te',ef.te,m);if(ef.sa)ponerCampo('sa',ef.sa,m);
 if(ef.dep)ponerDep(ef.dep,m);if(ef.ha)ponerHaz(m,ef.ha);
 // propios
 if(ef.cu){
  if(m.types.includes('ghost')){const c=Math.round(m.max*.5);if(tg&&m.hp>c&&!(tg.vol&&tg.vol.sub)){m.hp-=c;txt.push({x:m.x,y:m.y-30,s:'-'+c,c:'#f87171',l:.9});(tg.vol=tg.vol||{}).curse={l:12,t:0,by:m}}else fallo(m)}
  else stg(m,{atk:1,def:1,spe:-1})}
 if(ef.cur){m.ail=null;if(m.vol){delete m.vol.cnf;delete m.vol.inf}txt.push({x:m.x,y:m.y-56,s:'¡Curado!',c:'#bbf7d0',l:1.2,sm:1})}
 if(ef.pu&&tg)Object.assign(m.stg,tg.stg);
 if(ef.hz){for(const x of[m,tg])if(x)for(const k in x.stg)x.stg[k]=0;txt.push({x:m.x,y:m.y-56,s:'¡Estadísticas reiniciadas!',c:'#e2e8f0',l:1.2,sm:1})}
 if(ef.pd&&tg){const a=Math.round((m.hp+tg.hp)/2);m.hp=Math.min(m.max,a);tg.hp=Math.min(tg.max,a)}
 if(ef.ce)aplicarEst(m,'focus',m);
 if(ef.lf)m.lf=1;if(ef.lk)m.lock=1;
 if(ef.mi){const q=tg&&tg.last;if(!q||q.cat===undefined||(q.ef&&q.ef.mi)||m.mv.includes(q))fallo(m);else{m.mv[m.pi]=q;m.mc[m.pi]=0;txt.push({x:m.x,y:m.y-56,s:'¡Aprendió '+q.n+'!',c:'#fde047',l:1.4,sm:1})}}
 if(ef.cv&&m.mv[0])m.types=[m.mv[0].t];
 if(ef.tys)m.types=[ef.tys];
 if(ef.rt&&tg)m.types=[...tg.types];
 if(ef.ac){const k=['atk','def','spa','spd','spe'][Math.floor(rnd()*5)];stg(m,{[k]:2})}
 if(ef.stk){if((m.stk||0)>=3)fallo(m);else{m.stk=(m.stk||0)+1;stg(m,{def:1,spd:1});txt.push({x:m.x,y:m.y-66,s:'Reserva '+m.stk,c:'#e2e8f0',l:1,sm:1})}}
 if(ef.swl){const n=m.stk||0;if(!n||(m.vol&&m.vol.hblock))fallo(m);else{curaPS(m,[0,.25,.5,1][n]);m.stk=0}}
 if(ef.rv){const u=team[m.side]&&team[m.side].find(x=>x.dead);if(!u)fallo(m);else{u.dead=false;u.used=false;txt.push({x:m.x,y:m.y-56,s:'¡Un aliado vuelve!',c:'#fde047',l:1.4,sm:1})}}
 if(ef.cc){const a=campo.haz[0];campo.haz[0]=campo.haz[1];campo.haz[1]=a;txt.push({x:m.x,y:m.y-56,s:'¡Trampas intercambiadas!',c:'#bae6fd',l:1.2,sm:1})}
 if(ef.ts)for(const x of[m,tg])if(x&&!x.dead&&x.types.includes(ef.ts.t))stg(x,ef.ts.s);
 if(ef.sx&&tg)intercambio(m,tg,ef.sx);
 // sobre el rival
 stOfensivo(m,tg,ef);
 if(ef.v&&!ef.of){const ks=[].concat(ef.v);
  if(ef.yo)for(const k of ks)aplicarEst(m,k,m);
  if(ef.both&&tg)for(const k of ks){aplicarEst(m,k,m);aplicarEst(tg,k,m)}}
 if(ef.a&&ef.a.yo){m.ail=null;aplicarEst(m,ef.a.k,m)}
 if(ef.kam)debilitar(m,null);
 if(ef.sw=='yo')forzarCambio(m);else if(ef.sw=='rival'&&tg)forzarCambio(tg)}