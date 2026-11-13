// Lanzamiento de ataques.
function atk(m){const p=m.plan,tg=m.tg;m.cd=2*Math.pow(100/stat(m,'spe'),.5);m.mc[m.pi]=p.cd;m.say=1.2;m.sayT=p.n;
 if(p.cat=='sta'){applySt(m,tg,p);log(`${tn(m.t)} usó ${p.n}`);m.freeze=.35;m.plan=null;return}
 if(p.acc&&rnd()*100>p.acc){txt.push({x:tg.x,y:tg.y-30,s:'¡Falló!',c:'#cbd5e1',l:1,sm:1});m.plan=null;return}
 if(p.cu&&CUSTOM[p.cu]){CUSTOM[p.cu].start(m,tg,p);m.plan=null;return}
 if(p.tk){m.lw=.22;m.lhit=false;m.la=Math.atan2(tg.y-m.y,tg.x-m.x);return}
 const col=TCOL[p.t]||'#fff',c=p.c,K=p.u?ultK(p.t):({beam:'s',storm:'z',quake:'q',wave:'w'}[p.sty]||(p.t=='elec'?'b':'p')),D=p.u?.75:.3;
 const B={o:m,tg,cat:p.cat,t:p.t,sty:p.sty,dm:p.p/c,f:true,ph:R(0,6),life:2.2,x:m.x,y:m.y,a:m.a,cc:col};
 if(p.u){m.freeze=.75;m.flash=.1;bn={s:p.n,c:col,l:1.5};cz=.07;dim=.4;log(`${tn(m.t)} usa ¡${p.n}!`)}else m.freeze=.3;
 m.cast=.3;m.castc=col;
 if(K=='m'||K=='b'||K=='p'){for(let i=0;i<c;i++)ents.push({...B,k:K,sky:K=='b'&&p.u?1:0,delay:D+i*(K=='m'?.12:K=='b'?.2:.07),f:i==0,ch:i==0})}
 else ents.push({...B,k:K,delay:D,ch:1,rad:95});
 m.plan=null}
