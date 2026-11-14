// Gigaimpacto (giga-impact): aura Super Saiyan -> embestida con haz de energía -> explosión amarilla con grietas -> agotamiento.
CUSTOM['giga-impact']={
 mv:{cu:'giga-impact',r:360,tk:0,est:'contacto'},
 fallback:()=>({n:'Gigaimpacto',key:'giga-impact',p:150,cd:10,c:1,r:360,u:0,t:'normal',cat:'phy',acc:90,sty:'hit',cu:'giga-impact'}),

 start(m,tg,p){
  m.sc={id:'giga-impact',t:0,p};
  bn={s:p.n,c:'#facc15',l:1.8};
  cz=.07;
  ents.push({k:'u',cu:'giga-impact',o:m,tg,t:0,life:2.2,pf:[]});
 },

 run(m,dt,s){
  const tg=m.tg,t=s.t;
  if((!tg||tg.dead)&&!s.h){m.sqz=m.tilt=0;return true}

  // Carga (0 a .7 s): se encoge y vibra mirando al rival
  if(t<.7){
   m.sqz=.4*t/.7;
   m.tilt=Math.sin(t*30)*.04*t/.7;
   m.a=turn(m.a,Math.atan2(tg.y-m.y,tg.x-m.x),dt*10);
   return false;
  }

  // Al soltar: se fija la línea de embestida (se queda a 45 px del rival)
  if(!s.d){
   s.d=1;m.sqz=0;
   s.x0=m.x;s.y0=m.y;
   const dx=tg.x-m.x,dy=tg.y-m.y,d=Math.hypot(dx,dy)||1,k=Math.max(0,d-45)/d;
   s.ex=m.x+dx*k;s.ey=m.y+dy*k;s.ux=dx/d;s.uy=dy/d;
   m.a=Math.atan2(dy,dx);
  }

  // Embestida (.7 a 1 s): acelera hasta chocar
  if(t<1){
   const u=((t-.7)/.3)**2;
   m.x=s.x0+(s.ex-s.x0)*u;
   m.y=s.y0+(s.ey-s.y0)*u;
   m.tilt=s.ux>=0?.35:-.35;
   return false;
  }

  // Choque
  if(!s.h){
   s.h=1;m.x=s.ex;m.y=s.ey;m.tilt=0;
   const X=tg.x,Y=tg.y-25;
   hit(tg,s.p.p,s.p.t,m,{cat:s.p.cat,f:true});
   for(let i=0;i<44&&ps.length<900;i++){
    const a=R(0,6.28),v=R(140,460);
    ps.push({x:X,y:Y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:R(.3,.8),m:.8,c:['#fde047','#fb923c','#fff'][i%3],s:R(3,9),g:1});
   }
   for(let i=0;i<14&&ps.length<900;i++)  // escombros que salen despedidos y caen
    ps.push({x:X+R(-20,20),y:Y+15,vx:R(-220,220),vy:R(-420,-160),gy:520,l:R(.7,1.2),m:1.2,c:['#78716c','#a8a29e'][i%2],s:R(4,10)});
   blast(X,Y,'#fef08a',140);
   ring(X,Y,'#facc15',190,.7,9);
   ring(X,Y,'#fff',95,.4,5);
   imp(X,Y,'normal',3.5);
   vfx(X,Y,'punch','normal');
   m.kx-=s.ux*80;m.ky-=s.uy*80;
   shk=Math.max(shk,24);sfl=.5;sfc='#fffbe0';
  }

  // Agotamiento: jadea hasta recuperar la pose
  m.sqz=Math.max(0,.25-(t-1)*.28+Math.sin(t*10)*.03);
  m.tilt=Math.sin(t*6)*.03;
  if(t<1.9)return false;
  m.sqz=m.tilt=0;
  return true;
 },

 eup(e,dt){
  const o=e.o,tg=e.tg;
  e.t+=dt;
  e.life=2.2-e.t;
  if(o.dead){e.life=0;return}
  const t=e.t,x=o.x,y=o.y-30,fy=y+22;
  const spark=(x,y,vx,vy,l,c,s)=>ps.length<900&&ps.push({x,y,vx,vy,l,m:l,c,s,g:1});
  // Bocanadas propias (polvo y humo): se mueven aquí y se pintan blandas en edraw
  const puff=(x,y,vx,vy,r,gr,l,c)=>e.pf.length<160&&e.pf.push({x,y,vx,vy,r,gr,l,m:l,c});
  const dust=(x,y,vx,vy,r)=>puff(x,y,vx,vy,r,R(25,45),R(.7,1.2),['214,199,161','184,169,138','231,229,228'][Math.floor(R(0,3))]);
  e.pf.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97;p.l-=dt});
  e.pf=e.pf.filter(p=>p.l>0);

  // Carga: el suelo tiembla, chispas y piedras flotan, el polvo sale hacia los lados
  if(t<.7){
   shk=Math.max(shk,1.5+t/.7*4);
   for(let i=0;i<4;i++)spark(x+R(-30,30),y+R(5,30),R(-30,30),R(-240,-100),.55,['#fde047','#4ade80','#fff'][i%3],R(2,5));
   if(Math.random()<.35)ps.push({x:x+R(-40,40),y:fy,vx:R(-30,30),vy:R(-150,-60),gy:140,l:.8,m:.8,c:'#a8a29e',s:R(3,6)});
   if(Math.random()<.45){const d=Math.random()<.5?-1:1;dust(x+d*R(10,30),fy+R(-4,6),d*R(60,170),R(-25,0),R(14,24))}
  }
  // Embestida: salida con gran nube de polvo, rastro de polvo y chispas
  else if(t<1){
   shk=Math.max(shk,5);
   if(!e.p0){
    e.p0=[x,y];sfl=.3;sfc='#fffbe0';shk=Math.max(shk,11);
    for(let i=0;i<24;i++){const a=R(0,6.28);dust(x+R(-10,10),fy+R(-4,6),Math.cos(a)*R(90,290),Math.sin(a)*R(15,60)-20,R(22,38))}
   }
   for(let i=0;i<2;i++)dust(x+R(-10,10),fy+R(-4,6),R(-40,40),R(-30,0),R(16,28));
   for(let i=0;i<3;i++)spark(x+R(-12,12),y+R(-16,16),R(-90,90),R(-90,90),.35,['#bef264','#fde047','#fff'][i],R(3,6));
  }
  // Choque: grietas incandescentes, columna de humo y anillo de polvo en el rival
  else{
   if(!e.cr){
    const X=e.cx=tg.x,Y=e.cy=tg.y-25;
    e.cr=Array.from({length:9},(_,i)=>({a:i*.698+R(-.2,.2),l:R(80,170),j:[R(-10,10),R(-6,6)]}));
    for(let i=0;i<14;i++)puff(X+R(-24,24),Y+R(-8,18),R(-50,50),R(-190,-50),R(22,40),R(40,70),R(1,1.6),i%2?'87,83,78':'120,113,108');
    for(let i=0;i<18;i++){const a=R(0,6.28);dust(X,Y+18,Math.cos(a)*R(130,340),Math.sin(a)*R(25,80),R(24,40))}
   }
   if(t<1.9){
    if(Math.random()<.35)spark(x+R(-14,14),y+R(-14,14),R(-40,40),R(-120,-40),R(.3,.6),'#a3e635',R(2,4));
    if(Math.random()<.2)puff(x+R(-14,14),y+R(-10,10),R(-10,10),R(-60,-20),10,18,R(.6,1),'231,229,228');
   }
  }
 },

 edraw(e){
  const o=e.o,t=e.t,x=o.x,y=o.y-30;
  const glow=(X,Y,r,a,c1,c2)=>{
   const g=cx.createRadialGradient(X,Y,1,X,Y,r);
   g.addColorStop(0,'#fff');g.addColorStop(.4,c1);g.addColorStop(1,c2);
   cx.globalAlpha=a;cx.fillStyle=g;cx.beginPath();cx.arc(X,Y,r,0,7);cx.fill();
  };
  const ring=(X,Y,k,w,a,c)=>{cx.globalAlpha=a;cx.strokeStyle=c;cx.lineWidth=w;cx.beginPath();cx.ellipse(X,Y,20+k*220,8+k*72,0,0,7);cx.stroke()};
  cx.save();
  cx.lineCap='round';

  // Polvo y humo: bocanadas blandas que crecen y se desvanecen
  for(const p of e.pf){
   const a=p.l/p.m,r=p.r+p.gr*(1-a),al=Math.min(1,a*1.6)*.55;
   let g=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
   g.addColorStop(0,`rgba(${p.c},${al})`);g.addColorStop(1,`rgba(${p.c},0)`);
   cx.globalAlpha=1;cx.fillStyle=g;cx.beginPath();cx.arc(p.x,p.y,r,0,7);cx.fill();
   g=cx.createRadialGradient(p.x-r*.3,p.y-r*.3,0,p.x-r*.3,p.y-r*.3,r*.6);
   g.addColorStop(0,`rgba(255,255,255,${al*.35})`);g.addColorStop(1,'rgba(255,255,255,0)');
   cx.fillStyle=g;cx.beginPath();cx.arc(p.x-r*.3,p.y-r*.3,r*.6,0,7);cx.fill();
  }
  cx.globalCompositeOperation='lighter';

  // Grietas incandescentes en el suelo del rival
  if(e.cr&&t<1.95){
   const a=Math.min(1,(1.95-t)/.7);
   for(const[w,c]of[[7,'#f97316'],[2.5,'#fef08a']]){
    cx.strokeStyle=c;cx.lineWidth=w;cx.globalAlpha=a*.7;
    for(const k of e.cr){
     const cs=Math.cos(k.a),sn=Math.sin(k.a)*.35;
     cx.beginPath();cx.moveTo(e.cx,e.cy+18);
     cx.lineTo(e.cx+cs*k.l*.5+k.j[0],e.cy+18+sn*k.l*.5+k.j[1]);
     cx.lineTo(e.cx+cs*k.l,e.cy+18+sn*k.l);
     cx.stroke();
    }
   }
  }

  // Carga: ondas que salen del suelo y pilar de luz
  if(t<.7){
   const u=t/.7;
   for(let i=0;i<3;i++){const k=(t*2.5+i/3)%1;ring(x,y+22,k*.45,3,(1-k)*u,i%2?'#4ade80':'#fde047')}
  }
  const pw=t<.7?6+t/.7*12:t<.85?18*(1-(t-.7)/.15):0;
  if(pw>0){
   const g=cx.createLinearGradient(x,y+22,x,y-270);
   g.addColorStop(0,'rgba(253,224,71,.9)');g.addColorStop(.6,'rgba(74,222,128,.4)');g.addColorStop(1,'rgba(74,222,128,0)');
   cx.globalAlpha=.8+.2*Math.sin(T*40);cx.fillStyle=g;cx.fillRect(x-pw,y-270,pw*2,292);
  }

  // Haz de energía: del punto de salida al Pokémon, con espirales, estrías de velocidad y cabeza ancha
  if(e.p0&&t<1.35){
   const[x0,y0]=e.p0,dx=x-x0,dy=y-y0,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,nx=-uy,ny=ux;
   const fade=t<1?1:Math.max(0,1-(t-1)/.35);
   for(const[k,rgb]of[[1,'34,197,94'],[.65,'253,224,71'],[.3,'255,255,255']]){
    const g=cx.createLinearGradient(x0,y0,x,y),hw=38*k;
    g.addColorStop(0,`rgba(${rgb},0)`);g.addColorStop(1,`rgba(${rgb},.9)`);
    cx.globalAlpha=fade;cx.fillStyle=g;cx.beginPath();
    cx.moveTo(x0+nx*2,y0+ny*2);cx.lineTo(x+nx*hw,y+ny*hw);
    cx.lineTo(x-nx*hw,y-ny*hw);cx.lineTo(x0-nx*2,y0-ny*2);
    cx.fill();
   }
   cx.lineWidth=3;
   for(let h=0;h<2;h++){
    cx.strokeStyle=h?'#86efac':'#fde047';cx.globalAlpha=fade*.9;cx.beginPath();
    for(let i=0;i<=24;i++){
     const s=i/24,off=Math.sin(s*14-T*40+h*3.14)*30*s;
     const px=x0+dx*s+nx*off,py=y0+dy*s+ny*off;
     i?cx.lineTo(px,py):cx.moveTo(px,py);
    }
    cx.stroke();
   }
   cx.strokeStyle='#fff';
   for(let i=0;i<9;i++){
    const a=R(10,120),l=R(50,140),o2=R(-48,48);
    cx.globalAlpha=fade*.5;cx.lineWidth=R(1,3);cx.beginPath();
    cx.moveTo(x-ux*a+nx*o2,y-uy*a+ny*o2);cx.lineTo(x-ux*(a+l)+nx*o2,y-uy*(a+l)+ny*o2);cx.stroke();
   }
  }

  // Aura Super Saiyan: once lenguas de fuego verdes, amarillas y blancas que suben y parpadean
  const k=t<.7?t/.7:t<1?1:Math.max(0,1-(t-1)/.25);
  if(k>0){
   glow(x,y+10,60+35*k,.65*k,'#fde047','rgba(74,222,128,0)');
   for(const[sc,c,a]of[[1,'#4ade80',.55],[.68,'#fde047',.8],[.34,'#fff',.85]]){
    cx.fillStyle=c;cx.globalAlpha=a*Math.min(1,k*1.5);
    for(let i=0;i<11;i++){
     const h=(60+30*Math.sin(T*9+i*1.7)+(5-Math.abs(i-5))*14)*k*sc,s=Math.sin(T*12+i*2.1)*8,xo=x+(i-5)*7;
     cx.beginPath();cx.moveTo(xo-8*sc,y+22);
     cx.quadraticCurveTo(xo-7*sc+s,y-h*.5,xo+s*1.4,y+22-h);
     cx.quadraticCurveTo(xo+7*sc+s,y-h*.5,xo+8*sc,y+22);
     cx.fill();
    }
   }
   cx.strokeStyle='#fef9c3';cx.lineWidth=2;cx.globalAlpha=k;
   for(let i=0;i<5;i++)if(Math.random()<.7){
    const a=x+R(-26,26),b=y+R(-34,26);
    cx.beginPath();cx.moveTo(a,b);cx.lineTo(a+R(-16,16),b+R(-16,16));cx.lineTo(a+R(-30,30),b+R(-30,30));cx.stroke();
   }
  }

  // Agotamiento: brillo verdoso que se apaga con parpadeo
  if(t>=1&&t<1.9)glow(x,y,34,(1-(t-1)/.9)*(.3+.2*Math.sin(T*18)),'#a3e635','rgba(74,222,128,0)');

  // Explosión amarilla tipo bomba: destello, bola de fuego abultada, rayos y tres ondas en el suelo
  if(e.cr&&t<1.7){
   const u=(t-1)/.7,a=Math.max(0,1-u*u),X=e.cx,Y=e.cy,r=40+Math.sqrt(u)*150,c2='rgba(234,88,12,0)';
   glow(X,Y,280,Math.max(0,1-u*7)*.9,'#fff','rgba(255,255,255,0)');
   for(let i=0;i<8;i++){const an=i*.785+.3;glow(X+Math.cos(an)*r*.5,Y+Math.sin(an)*r*.5-u*35,r*.6,a,'#facc15',c2)}
   glow(X,Y-u*15,r,a,'#fde047',c2);
   glow(X,Y,r*.5*(1-u),a,'#fff','rgba(255,255,255,0)');
   for(let i=0;i<14;i++){
    const an=i*.449+T*.2;
    cx.strokeStyle=i%2?'#fff':'#fde047';cx.lineWidth=R(2,6)*a;cx.globalAlpha=a*.8;
    cx.beginPath();cx.moveTo(X+Math.cos(an)*r*.3,Y+Math.sin(an)*r*.3);cx.lineTo(X+Math.cos(an)*r*1.4,Y+Math.sin(an)*r*1.4);cx.stroke();
   }
   for(let j=0;j<3;j++){const k2=u*1.6-j*.25;if(k2>0&&k2<1)ring(X,Y+18,k2,8*(1-k2)+1,1-k2,'#fef08a')}
  }
  cx.restore();
 }
};