// Entidades de efecto (proyectiles, rayos, ondas...): activación y actualización.
function act(e){const t=e.tg,o=e.o;
 if(e.k=='q'){if(t.dead){e.life=0;return}ents.push({k:'v',vs:'crack',x:t.x,y:t.y+12,life:1.4,m:1.4,cc:e.t=='ground'?'#f59e0b':e.cc,cr:Array.from({length:10},(_,i)=>({a:i*.628+R(-.2,.2),l:R(60,115),j:[R(-8,8),R(-8,8),R(-8,8)]}))});shk=Math.max(shk,e.dm>25?11:7);imp(t.x,t.y,e.t,1.6);hit(t,e.dm,e.t,o,e);e.life=0;return}
 if(e.k=='z'){e.life=.9;e.tk=.1;return}
 if(e.k=='x'){if(t.dead){e.life=0;return}blast(t.x,t.y,e.cc,e.rad);imp(t.x,t.y,e.t,1.8);hit(t,e.dm,e.t,o,e);for(let i=0;i<10;i++)ps.push({x:t.x+R(-50,50),y:t.y+R(-20,30),vx:R(-20,20),vy:R(-170,-60),l:R(.6,1),m:1,c:i%2?'#fde047':e.cc,s:R(6,12),g:1});e.life=0}
 else if(e.k=='w'){e.sx=o.x;e.sy=o.y;e.life=1.2;e.u=0}
 else if(e.k=='s'){e.life=.8;e.tk=.1}
 else if(e.k=='m'){const q=rnd()<.45;e.lx=Math.max(110,Math.min(W-110,t.x+(q?0:RS(-100,100))));e.ly=Math.max(105,Math.min(345,t.y+(q?0:RS(-70,70))));e.life=.6}
 else if(e.k=='c'){e.cx=t.x;e.cy=t.y;e.life=.35}}
function upFx(e,dt){const t=e.tg,o=e.o;
 if(e.k=='u'){CUSTOM[e.cu].eup(e,dt);return}
 if(e.k=='v'){e.life-=dt;return}
 if(e.k=='z'){e.life-=dt;e.tk+=dt;const Q=IMP[e.t]||IMP.normal;
  for(let i=0;i<3&&ps.length<850;i++){const a=T*7+R(0,6.28),r=R(12,65);ps.push({x:t.x+Math.cos(a)*r,y:t.y+Math.sin(a)*r*.55,vx:-Math.sin(a)*90,vy:Math.cos(a)*50-(Q.up?50:30),gy:Q.gy>200?200:0,l:R(.4,.8),m:.8,c:Q.c[i%Q.c.length],s:R(3,7),g:Q.g,sh:Q.sh,r:R(0,6),vr:R(-8,8)})}
  if(e.tk>.15&&!t.dead&&!o.dead){e.tk=0;hit(t,e.dm,e.t,o,e);e.f=0;imp(t.x+R(-24,24),t.y+R(-24,24),e.t,.6)}
  if(e.life<=0&&!t.dead)imp(t.x,t.y,e.t,1.5);return}
 if(e.k=='w'){e.u+=dt/.8;const k=Math.min(1,e.u);e.px=e.sx+(t.x-e.sx)*k;e.py=e.sy+(t.y-e.sy)*k;e.ang=Math.atan2(t.y-e.sy,t.x-e.sx);
  for(let i=0;i<4&&ps.length<700;i++){const q=R(-45,45);ps.push({x:e.px+Math.cos(e.ang+PI/2)*q,y:e.py+Math.sin(e.ang+PI/2)*q,vx:R(-20,20),vy:R(-30,10),l:.4,m:.4,c:i%2?'#bae6fd':'#38bdf8',s:R(4,8),g:0})}
  if(e.u>=1){if(!t.dead){blast(t.x,t.y,'#38bdf8',85,50);hit(t,e.dm,'water',o,e)}e.life=0}return}
 if(e.k=='s'){e.life-=dt;e.tk+=dt;if(e.tk>.15&&!t.dead&&!o.dead){e.tk=0;hit(t,e.dm,e.t,o,e);e.f=0}
  if(!t.dead&&!o.dead)for(let i=0;i<3&&ps.length<700;i++){const u=Math.random();ps.push({x:o.x+(t.x-o.x)*u+R(-10,10),y:o.y+(t.y-o.y)*u+R(-10,10),vx:R(-30,30),vy:R(-30,30),l:.4,m:.4,c:e.cc,s:R(3,6),g:1})}
  if(e.life<=0&&!t.dead)blast(t.x,t.y,e.cc,60,30);return}
 if(e.k=='m'){e.life-=dt;if(e.life<=0){blast(e.lx,e.ly,'#f97316',58,26);ring(e.lx,e.ly,'#a78bfa',80,.6);scars.push({x:e.lx,y:e.ly,l:6});if(!t.dead&&Math.hypot(t.x-e.lx,t.y-e.ly)<58)hit(t,e.dm,'dragon',o,e)}return}
 if(e.k=='c'){e.life-=dt;if(!e.hd&&e.life<.2){e.hd=1;if(!t.dead){hit(t,e.dm,'dragon',o,e);burst(t.x,t.y,'#ddd6fe',10,160,true)}}}}
