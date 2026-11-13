// Movimiento e IA de cada luchador en cada paso.
function upM(m,dt){const SP=m.spd*mult(m.stg.spe);
 if(m.dead){m.fade-=dt;return}if(m.enter>0){m.enter-=dt;return}
 m.cd-=dt;m.flash-=dt;m.say-=dt;m.cast-=dt;for(let i=0;i<m.mc.length;i++)if(m.mc[i]>0)m.mc[i]-=dt;m.x+=m.kx*dt;m.y+=m.ky*dt;const f=Math.pow(.01,dt);m.kx*=f;m.ky*=f;
 if(m.sc){scr(m,dt);return}if(m.freeze>0){m.freeze-=dt;if(m.freeze>.35&&Math.random()<.5)m.flash=.06;if(m.tg)m.a=turn(m.a,Math.atan2(m.tg.y-m.y,m.tg.x-m.x),dt*8);return}if(m.lw>0){m.lw-=dt;m.a=turn(m.a,m.la,dt*12);if(m.lw<=0)m.lunge=.3;return}if(m.lab&&!(m.lunge>0)){if(m.hp<m.max*.5)m.hp=m.max;const hx=m.home.x-m.x,hy=m.home.y-m.y,dd=Math.hypot(hx,hy);if(dd>8){m.a=Math.atan2(hy,hx);m.x+=Math.cos(m.a)*200*dt;m.y+=Math.sin(m.a)*200*dt;m.ph+=dt*8}else if(m.tg)m.a=turn(m.a,Math.atan2(m.tg.y-m.y,m.tg.x-m.x),dt*8);return}if(!m.tg||m.tg.dead){m.tg=mons.find(o=>o.side!==m.side&&!o.dead&&!(o.enter>0))||null;if(m.tg&&!m.plan)plan(m)}
 let sp=SP*.45,want=m.a,go=true;
 if(m.lunge>0){m.lunge-=dt;sp=560;trail(m.x,m.y-20,TCOL[m.plan&&m.plan.t]||'#fff',7,1,'c');want=m.la;m.a=m.la;const t=m.tg;if(t&&!t.dead&&!m.lhit&&Math.hypot(t.x-m.x,t.y-m.y)<30){m.lhit=true;hit(t,m.plan?m.plan.p:38,m.plan?m.plan.t:'normal',m,null);vfx(t.x,t.y,m.plan&&m.plan.sty,m.plan&&m.plan.t)}if(m.lunge<=0)m.plan=null}
 else if(m.tg){const t=m.tg,dx=t.x-m.x,dy=t.y-m.y,d=Math.hypot(dx,dy),an=Math.atan2(dy,dx);if(!m.plan&&m.cd<=0)plan(m);want=an;
  if(!m.plan){want=an+PI/2*(m.dir||1);sp=SP*.5;if(d>220){want=an;sp=SP}else if(d<120)want=an+PI*.75*(m.dir||1);if(rnd()<.01)m.dir=-(m.dir||1)}else if(d>m.plan.r*(m.plan.tk?1:.9)){sp=SP*1.1}else{go=false;if(m.cd>0){want=an+PI/2*(m.dir||1);go=true;sp=SP*.5;if(rnd()<.01)m.dir=-(m.dir||1)}else if(m.plan.cat=='sta'||Math.abs(((an-m.a+PI*3)%(PI*2))-PI)<.35)atk(m)}}
 else{m.wt-=dt;if(m.wt<=0||Math.hypot(m.tx-m.x,m.ty-m.y)<20){m.tx=RS(110,W-110);m.ty=RS(105,345);m.wt=RS(2,5)}want=Math.atan2(m.ty-m.y,m.tx-m.x)}
 if(m.lunge<=0)m.a=turn(m.a,want,dt*5);
 if(go){m.x+=Math.cos(m.a)*sp*dt;m.y+=Math.sin(m.a)*sp*dt;m.ph+=sp*dt*.09}
 for(const o of OB){const dx=m.x-o.x,dy=m.y-o.y,d=Math.hypot(dx,dy),r=o.r+16;if(d<r&&d>0){m.x=o.x+dx/d*r;m.y=o.y+dy/d*r}}
 m.x=Math.max(100,Math.min(W-100,m.x));m.y=Math.max(100,Math.min(350,m.y))}
