// Vuelo (fly): sube al cielo y cae en picado sobre el rival.
CUSTOM['fly']={mv:{r:360,tk:0,cu:'fly'},fallback:()=>({n:'Vuelo',key:'fly',p:90,cd:(1+90/45)*1.4,c:1,r:360,u:0,t:'flying',cat:'phy',acc:95,sty:'hit',cu:'fly'}),
  start(m,tg,p){m.sc={id:'fly',t:0,p,x0:m.x}},
  run(m,dt,s){const tg=m.tg,t=s.t;if(!tg||tg.dead){return true}
   if(t<.2){m.sqz=t/.2;m.a=turn(m.a,Math.atan2(tg.y-m.y,tg.x-m.x),dt*10);if(!s.f0){s.f0=1;feathers(m.x,m.y-10,12,130)}return false}
   m.sqz=0;
   if(t<.75){const u=(t-.2)/.55;m.z=450*u*u;feathers(m.x+R(-14,14),m.y-m.z-20,2,70);wind(m.x,m.y-m.z);return false}
   if(t<1){m.z=450;if(!s.mk){s.mk=1;s.dir=tg.x>=s.x0?1:-1;ents.push({k:'v',vs:'mark',x:tg.x,y:tg.y+8,life:.5,m:.5,cc:'#93c5fd'})}return false}
   if(!s.d0){s.d0=1;s.dir=s.dir||(tg.x>=s.x0?1:-1);s.tx=tg.x;s.ty=tg.y;s.sx=Math.max(60,Math.min(W-60,s.tx-s.dir*170));m.a=s.dir>0?0:PI}
   if(t<1.22){const u=Math.min(1,(t-1)/.22);m.x=s.sx+(s.tx-s.dir*45-s.sx)*u;m.y=s.ty;m.z=450*(1-u*u);m.tilt=s.dir*.9;
    const py=m.y-m.z-30;feathers(m.x,py,4,100);for(let i=0;i<2;i++)ps.push({x:m.x+R(-8,8),y:py+R(-8,8),vx:0,vy:0,l:.25,m:.25,c:'#e0f2fe',s:12,g:1});
    if(u>=1&&!s.h){s.h=1;m.z=0;m.tilt=0;hit(tg,s.p.p,s.p.t,m,{cat:s.p.cat,f:true});feathers(tg.x,tg.y-30,36,280);imp(tg.x,tg.y-20,'flying',1.6);vfx(tg.x,tg.y-25,'punch','flying');shk=Math.max(shk,10)}return false}
   if(!s.h){s.h=1;hit(tg,s.p.p,s.p.t,m,{cat:s.p.cat,f:true});feathers(tg.x,tg.y-30,36,280);imp(tg.x,tg.y-20,'flying',1.6)}
   m.z=0;m.tilt=0;m.sqz=Math.max(0,.6-(t-1.22)*2);return t>=1.55}};
