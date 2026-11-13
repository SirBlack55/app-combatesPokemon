// Bucle del juego. La simulación avanza en pasos FIJOS de 1/60 s (igual en cualquier pantalla),
// el dibujo se hace en cada fotograma.
function step(dt){if(hs>0){hs-=dt;return}T+=dt;if(!over){duelT+=dt;if(duelT>40&&!sd){sd=1;log('⚠️ ¡Muerte súbita! El daño aumenta con el tiempo')}}mons.forEach(m=>upM(m,dt));
 for(const a of mons)for(const b of mons)if(a<b&&!a.dead&&!b.dead){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<34&&d>0){const p=(34-d)/2;a.x-=dx/d*p;a.y-=dy/d*p;b.x+=dx/d*p;b.y+=dy/d*p}}
 for(const e of ents){if(e.delay>0){e.delay-=dt;if(e.o.dead)e.life=0;e.x=e.o.x;e.y=e.o.y;if(e.ch&&e.delay>0&&ps.length<700){const a=R(0,7);ps.push({x:e.o.x+Math.cos(a)*70,y:e.o.y+Math.sin(a)*70,vx:-Math.cos(a)*140,vy:-Math.sin(a)*140,l:.5,m:.5,c:e.cc,s:4,g:1})}if(e.delay<=0&&'xwsmcqz'.includes(e.k))act(e);if(e.delay<=0&&e.k=='p'){e.a=e.o.a+RS(-.3,.3);e.x+=Math.cos(e.o.a)*20;e.y+=Math.sin(e.o.a)*20}
   if(e.delay<=0&&e.k=='b'){e.life=.25;const t=e.tg;if(t.dead||e.o.dead){e.life=0}else{e.pts=[];const ox=e.sky?t.x+R(-50,50):e.o.x,oy=e.sky?-20:e.o.y,dx=t.x-ox,dy=t.y-oy,L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L;for(let i=0;i<=9;i++){const u=i/9,j=i%9==0?0:R(-14,14);e.pts.push([ox+dx*u+nx*j,oy+dy*u+ny*j])}if(e.sky){shk=Math.max(shk,3);sfl=.3;sfc='#fff';ring(t.x,t.y,'#fde047',50,.4)}hit(t,e.dm,'elec',e.o,e);burst(t.x,t.y,'#fde047',10,150,true)}}continue}
  if(e.k=='b'){e.life-=dt;continue}if(e.k!='p'){upFx(e,dt);continue}
  e.life-=dt;const t=e.tg;if(t&&!t.dead)e.a=turn(e.a,Math.atan2(t.y-e.y,t.x-e.x),dt*(e.t=='leaf'?3.5:5));
  const v=e.t=='leaf'?330:e.t=='water'?420:380;e.x+=Math.cos(e.a)*v*dt;e.y+=Math.sin(e.a)*v*dt;e.ph+=dt*14;
  trail(e.x,e.y,TCOL[e.t]||'#fff',e.t=='leaf'?2:5,!['leaf','ground','rock','water'].includes(e.t),(IMP[e.t]||IMP.normal).sh);
  if(t&&!t.dead&&Math.hypot(t.x-e.x,t.y-e.y)<17){hit(t,e.dm,e.t,e.o,e);e.life=0}
  if(e.x<-20||e.x>W+20||e.y<-20||e.y>H+20)e.life=0}
 ents=ents.filter(e=>e.life>0);
 for(const p of ps){p.l-=dt;if(p.gy)p.vy+=p.gy*dt;if(p.vr)p.r+=p.vr*dt;if(p.sw)p.vx+=Math.sin(T*9+p.r*3)*p.sw*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96}ps=ps.filter(p=>p.l>0);
 for(const t of txt){t.l-=dt;t.y-=25*dt}txt=txt.filter(t=>t.l>0);for(const r of rg)r.l-=dt;rg=rg.filter(r=>r.l>0);for(const q of scars)q.l-=dt;scars=scars.filter(q=>q.l>0);shk=Math.max(0,shk-dt*25);sfl=Math.max(0,sfl-dt*1.5);cz=Math.max(0,cz-dt*.05);dim=Math.max(0,dim-dt*.45);if(bn){bn.l-=dt;if(bn.l<=0)bn=null}
 mons=mons.filter(m=>!m.dead||m.fade>0);
 if(over)return;
 for(let s=0;s<2;s++){const act=mons.some(m=>m.side==s&&!m.dead),nx=team[s].find(u=>!u.used);
  if(!act&&nx){send[s]-=dt;if(send[s]<=0){spawn(s,nx);send[s]=1.4}}
  else if(!act&&!nx){over=true;const w=1-s;$('#ban').innerHTML=`🏆<br>¡Gana el Equipo ${w+1} ${w?'🔴':'🔵'}!<div style="margin-top:10px"><button id="rv">Revancha</button> <button id="ch">Cambiar equipos</button></div>`;$('#ban').style.display='flex';log('🏆 Gana el Equipo '+(w+1));if(alTerminarCombate)alTerminarCombate(w)}}}
const PASO=1/60;let acum=0;
function loop(t){const dt=Math.min(.1,(t-last)/1000||0)*spd;last=t;
 if(inGame){if(!paused){acum+=dt;let n=0;while(acum>=PASO&&n<8){step(PASO);acum-=PASO;n++}if(n==8)acum=0}draw();if(t-lu>120){lu=t;mvui()}}
 requestAnimationFrame(loop)}
