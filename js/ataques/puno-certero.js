// Puño Certero (focus-punch): se concentra casi 1 s; si le golpean mientras tanto, pierde la concentración y falla.
CUSTOM['focus-punch']={
 mv:{cu:'focus-punch',r:55,tk:1,est:'contacto'},
 fallback:()=>({n:'Puño Certero',key:'focus-punch',p:150,cd:10,c:1,r:55,u:0,tk:1,t:'fighting',cat:'phy',acc:100,sty:'punch',cu:'focus-punch'}),

 start(m,tg,p){
  m.sc={id:'focus-punch',t:0,p,t0:T};
  bn={s:p.n,c:'#f97316',l:1.2};
 },

 run(m,dt,s){
  const tg=m.tg,t=s.t;
  // Si recibe un golpe durante la concentración, se rompe
  if(t<.9&&m.dmgT>=s.t0){
   txt.push({x:m.x,y:m.y-56,s:'¡Perdió la concentración!',c:'#fca5a5',l:1.3,sm:1});
   m.sqz=0;return true;
  }
  if(!tg||tg.dead){m.sqz=0;return true}
  // Concentración (0 a .9 s): se encoge, vibra y se le ve el esfuerzo
  if(t<.9){
   m.sqz=.3*t/.9;
   m.x+=Math.sin(t*80)*.8;
   m.a=turn(m.a,Math.atan2(tg.y-m.y,tg.x-m.x),dt*10);
   if(Math.random()<.5)m.flash=.06;
   if(ps.length<880)ps.push({x:m.x+R(-14,14),y:m.y-10+R(-10,10),vx:R(-30,30),vy:R(-120,-40),l:.4,m:.4,c:Math.random()<.5?'#fdba74':'#fff',s:R(2,5),g:1});
   return false;
  }
  // Embestida corta hasta el rival
  if(!s.d){
   s.d=1;m.sqz=0;s.x0=m.x;s.y0=m.y;
   const dx=tg.x-m.x,dy=tg.y-m.y,d=Math.hypot(dx,dy)||1,k=Math.max(0,d-30)/d;
   s.ex=m.x+dx*k;s.ey=m.y+dy*k;m.a=Math.atan2(dy,dx);
  }
  if(t<1.12){
   const u=(t-.9)/.22;
   m.x=s.x0+(s.ex-s.x0)*u;m.y=s.y0+(s.ey-s.y0)*u;
   return false;
  }
  if(!s.h){
   s.h=1;
   hit(tg,s.p.p,s.p.t,m,{cat:s.p.cat,f:true});
   vfx(tg.x,tg.y-20,'punch','fighting');
   imp(tg.x,tg.y-20,'fighting',1.8);ring(tg.x,tg.y-20,'#f97316',80,.5,6);
   shk=Math.max(shk,12);sfl=.3;sfc='#fed7aa';
  }
  return t>=1.4;
 }
};