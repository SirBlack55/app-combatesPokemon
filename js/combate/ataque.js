// Lanzamiento de ataques.
function atk(m){let p=m.plan;const tg=m.tg;const pk=tg?ganchoMul('cdRec',tg,m):1;   // Presión del rival: recarga más lenta
 m.cd=2*Math.pow(100/stat(m,'spe'),.5)*pk;m.mc[m.pi]=p.cd*pk;m.say=1.2;m.sayT=p.n;
 // Bola Climática / Pulso Terreno: cambian de tipo y potencia con el clima o el terreno
 if(p.fx&&p.fx.k=='wb'){const cl=p.fx.tipo=='clima',c=cl?campo.cl&&campo.cl.k:campo.te&&campo.te.k,M=cl?{sun:'fire',rain:'water',sand:'rock',hail:'ice'}:{elec:'elec',leaf:'leaf',mist:'fairy',psy:'psychic'};if(c&&M[c]){p={...p,t:M[c],p:100};m.plan=p}}
 m.last=p;if(fallaEst(m))return;(m.us=m.us||{})[m.pi]=1;
 if(p.ef&&p.ef.cp){const q=tg&&tg.last;if(!q||(q.ef&&q.ef.cp)){txt.push({x:m.x,y:m.y-46,s:'¡Falló!',c:'#cbd5e1',l:1,sm:1});m.freeze=.3;m.plan=null;return}m.plan=q;return atk(m)}
 if(p.cat=='sta'){if(tg&&ofensivoSt(p)&&conAtq(m,()=>gancho('bloqMove',tg,m,p))){txt.push({x:tg.x,y:tg.y-48,s:'No afecta',c:'#e2e8f0',l:1,sm:1});log(`${tn(m.t)} usó ${p.n}`);m.freeze=.35;m.plan=null;return}
  if(p.ef&&p.ef.a&&!p.ef.a.yo&&p.acc&&rnd()*100>accEf(m,tg,p)){txt.push({x:tg.x,y:tg.y-30,s:'¡Falló!',c:'#cbd5e1',l:1,sm:1});m.freeze=.35;m.plan=null;return}const pr0=m.prot;applySt(m,tg,p);if(p.cu&&CUSTOM[p.cu]&&CUSTOM[p.cu].visual){CUSTOM[p.cu].visual(m,tg,p,pr0);if(m.prot&&m.prot!==pr0)m.prot.vis=1}log(`${tn(m.t)} usó ${p.n}`);m.freeze=.35;m.plan=null;return}
 if(p.rep)repite(m,p);
 if(p.dt&&m.dtDone!==p){iniciaDosTurnos(m,tg,p);return}   // Rayo Solar, Excavar...: primero carga o se esconde
 m.dtDone=null;
 if(p.acc&&rnd()*100>accEf(m,tg,p)){if(m.vol&&m.vol.furia)delete m.vol.furia;m.failT=T;txt.push({x:tg.x,y:tg.y-30,s:'¡Falló!',c:'#cbd5e1',l:1,sm:1});m.plan=null;return}
 if(p.cu&&CUSTOM[p.cu]){CUSTOM[p.cu].start(m,tg,p);m.plan=null;return}
 if(p.tk){m.lw=p.pr?.08:.22;m.lhit=false;m.la=Math.atan2(tg.y-m.y,tg.x-m.x);return}
 const col=TCOL[p.t]||'#fff',c=p.c,K=p.u?ultK(p.t):({beam:'s',storm:'z',quake:'q',wave:'w'}[p.sty]||(p.t=='elec'?'b':'p')),D=p.u?.75:p.pr?.1:.3;
 const B={o:m,tg,fx:p.fx,sec:p.sec,cat:p.cat,t:p.t,sty:p.sty,dm:p.p/c,f:true,ph:R(0,6),life:2.2,x:m.x,y:m.y,a:m.a,cc:col};
 if(p.u){m.freeze=.75;m.flash=.1;bn={s:p.n,c:col,l:1.5};cz=.07;dim=.4;log(`${tn(m.t)} usa ¡${p.n}!`)}else m.freeze=.3;
 m.cast=.3;m.castc=col;
 if(K=='m'||K=='b'||K=='p'){for(let i=0;i<c;i++)ents.push({...B,k:K,sky:K=='b'&&p.u?1:0,delay:D+i*(K=='m'?.12:K=='b'?.2:.07),f:i==0,ch:i==0})}
 else ents.push({...B,k:K,delay:D,ch:1,rad:95});
 m.plan=null}