// Trueno (thunder): carga -> nube de tormenta sobre el rival -> descarga -> onda expansiva.
CUSTOM['thunder']={
 mv:{cu:'thunder',r:420,tk:0,est:'distancia'},
 fallback:()=>({n:'Trueno',key:'thunder',p:110,cd:8.4,c:1,r:420,u:0,t:'elec',cat:'spe',acc:70,sty:'hit',cu:'thunder'}),

 start(m,tg,p){
  m.sc={id:'thunder',t:0};
  bn={s:p.n,c:'#fde047',l:1.6};
  cz=.06;
  ents.push({k:'u',cu:'thunder',o:m,tg,cat:p.cat,dm:p.p,t:0,tk:0,hit:0,life:1.65});
 },

 run(m,dt,s){
  const t=s.t;
  if(m.tg&&!m.tg.dead)m.a=turn(m.a,Math.atan2(m.tg.y-m.y,m.tg.x-m.x),dt*10);
  m.sqz=t<.5?.25*t/.5:Math.max(0,.25-(t-.5)*1.2);
  m.tilt=t<.5?Math.sin(t*22)*.025:t>.9?Math.sin(t*10)*.025:0;
  if(t<1.65)return false;
  m.sqz=m.tilt=0;
  return true;
 },

 eup(e,dt){
  const o=e.o,t=e.tg;
  e.t+=dt;
  e.life=1.65-e.t;
  if(o.dead){e.life=0;return}
  // El rival se fija en el instante en que cae el rayo
  if(e.t>=.69&&!e.lock){e.lock=1;e.tx=t.x;e.ty=t.y-34}
  if(t.dead&&!e.hit){e.life=0;return}
  const spark=(x,y,vx,vy,l,c,s,gy)=>ps.length<900&&ps.push({x,y,vx,vy,gy,l,m:l,c,s,g:1});

  // Carga del atacante
  if(e.t<.5){
   for(let i=0;i<4;i++){
    const a=R(0,6.28),r=R(20,48),v=R(50,130);
    spark(o.x+Math.cos(a)*r,o.y-34+Math.sin(a)*r,-Math.cos(a)*v,-Math.sin(a)*v,.22,i%2?'#fde047':'#fff',R(2,5));
   }
  }
  // Descarga
  else if(e.t>=.69&&e.t<1.05){
   const{tx,ty}=e.lock?{tx:e.tx,ty:e.ty}:{tx:t.x,ty:t.y-34};
   if(!e.hit){
    e.hit=1;
    if(!t.dead)hit(t,e.dm,'elec',o,{cat:e.cat,f:true});
    blast(tx,ty,'#fef08a',80);
    ring(tx,ty,'#fde047',100,.55,7);
    ring(tx,ty,'#fff',55,.3,4);
    imp(tx,ty,'elec',3);
    shk=Math.max(shk,11);sfl=.35;sfc='#fff';
   }
   for(let i=0;i<8;i++){
    const a=R(0,6.28),v=R(80,240);
    spark(tx+R(-12,12),ty+R(-8,15),Math.cos(a)*v,Math.sin(a)*v,R(.25,.55),i%3?'#fde047':'#fff',R(3,7),100);
   }
  }
  else if(e.t>=1.05&&!e.end){
   e.end=1;
   ring(e.tx,e.ty,'#fef08a',125,.65,4);
   imp(e.tx,e.ty,'elec',1.5);
  }
 },

 edraw(e){
  const o=e.o,t=e.tg;
  if(!o||!t)return;
  const time=e.t,tx=e.lock?e.tx:t.x,ty=e.lock?e.ty:t.y-34;
  const base=ty-137,y0=base+2;
  const glow=(x,y,r,a)=>{
   const g=cx.createRadialGradient(x,y,1,x,y,r);
   g.addColorStop(0,'#fff');g.addColorStop(.4,'#fde047');g.addColorStop(1,'rgba(250,204,21,0)');
   cx.globalAlpha=a;cx.fillStyle=g;cx.beginPath();cx.arc(x,y,r,0,7);cx.fill();
  };
  // Elipse en el suelo: un glow aplastado
  const ground=(r,a)=>{cx.save();cx.translate(tx,ty+22);cx.scale(1,.34);glow(0,0,r,a);cx.restore()};
  // Rayo vertical: puntos [avance 0..1, desvío en px]
  const P=q=>[tx+q[1],y0+(ty-y0)*q[0]];
  const zig=(a,b,d,n)=>{
   let p=[a,b];
   while(n--){p=p.flatMap((v,i)=>i?[[(v[0]+p[i-1][0])/2,(v[1]+p[i-1][1])/2+R(-d,d)],v]:[v]);d*=.55}
   return p;
  };
  const draw=(pts,w)=>{
   cx.beginPath();
   pts.forEach((q,i)=>{const[x,y]=P(q);i?cx.lineTo(x,y):cx.moveTo(x,y)});
   for(const[c,k]of[['rgba(250,204,21,.25)',11],['rgba(253,224,71,.6)',6],['#fff',2]]){
    cx.strokeStyle=c;cx.lineWidth=w*k;cx.stroke();
   }
  };
  cx.save();
  cx.lineJoin=cx.lineCap='round';

  // Cielo oscuro: tinta toda la pantalla (sin transformación, para ignorar cámara y zoom)
  if(time>=.25&&time<1.4){
   const dk=time<.6?(time-.25)/.35:time<1.05?1:Math.max(0,1-(time-1.05)/.35);
   cx.save();
   cx.setTransform(1,0,0,1,0,0);
   cx.globalAlpha=.5*dk*(time>=.69&&time<1.05&&Math.random()<.2?.4:1);
   cx.fillStyle='#0a0f28';
   cx.fillRect(0,0,cx.canvas.width,cx.canvas.height);
   cx.restore();
  }

  // Nube de tormenta en pixel art: máscara de 56x28 px, sombreada por tramos y escalada sin suavizado
  if(time>=.3&&time<1.35){
   if(!e.cv){
    const W=56,H=28,m=[];
    for(let x=0;x<W;x++)m.push(new Array(H).fill(0));
    const fill=(px,py,r)=>{for(let x=0;x<W;x++)for(let y=0;y<H;y++)if((x-px)**2+(y-py)**2<r*r)m[x][y]=1};
    // Base baja con extremos redondeados, cinco lóbulos arriba y cuatro abajo (desfasados)
    for(let x=11;x<=45;x++)for(let y=15;y<=20;y++)m[x][y]=1;
    fill(11,17.5,3.5);fill(45,17.5,3.5);
    for(let i=0;i<5;i++){
     const h=Math.sin((i+.5)/5*Math.PI);
     fill(11+i*8.5+R(-.8,.8),15-h*2.5+R(-.7,.7),4.5+h*1.8+R(0,.6));
    }
    for(let i=0;i<4;i++){
     const h=Math.sin((i+.5)/4*Math.PI);
     fill(15.2+i*8.5+R(-.6,.6),19.8+R(-.4,.4),4.3+h*1.1+R(0,.4));
    }
    const g=(x,y)=>m[x]&&m[x][y];
    e.cv=[['#cbd5e1','#94a3b8','#64748b','#475569','#1e293b'],['#fff','#fef9c3','#fde047','#eab308','#854d0e']].map(pal=>{
     const cv=document.createElement('canvas'),c=cv.getContext('2d');
     cv.width=W;cv.height=H;
     for(let x=0;x<W;x++)for(let y=0;y<H;y++){
      if(!m[x][y])continue;
      let d=0;while(d<12&&g(x,y-d-1))d++;
      c.fillStyle=!g(x-1,y)||!g(x+1,y)||!g(x,y-1)||!g(x,y+1)?pal[4]:d<2?pal[0]:d<6?pal[1]:d<10?pal[2]:pal[3];
      c.fillRect(x,y,1,1);
     }
     return cv;
    });
   }
   const grow=Math.min(1,(time-.3)/.3),a=grow*(time>1.05?Math.max(0,1-(time-1.05)/.3):1);
   const lit=time>=.69&&time<1.05||Math.random()<.08,px=4;
   cx.imageSmoothingEnabled=false;
   cx.globalAlpha=a;
   cx.drawImage(e.cv[lit?1:0],Math.round(tx-28*px),Math.round(base-22*px-(1-grow)*30+Math.round(Math.sin(T*2))*px),56*px,28*px);
  }
  cx.globalCompositeOperation='lighter';

  // Carga del atacante
  if(time<.5){
   const r=15+time/.5*15;
   glow(o.x,o.y-34,r*2,1);
   for(let i=0;i<5;i++){
    const a=T*5+i*1.26,x=o.x+Math.cos(a)*r,y=o.y-34+Math.sin(a)*r;
    cx.strokeStyle=i%2?'#fde047':'#fff';cx.lineWidth=2.5;
    cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+Math.cos(a+1)*10,y+Math.sin(a+1)*10);cx.stroke();
   }
  }

  // Marca de impacto en el suelo
  if(time>=.5&&time<.82){
   const u=Math.min(1,(time-.5)/.32),p=1+Math.sin(T*28)*.15;
   ground(65*p,1);
   cx.globalAlpha=.4+u*.5;cx.strokeStyle='#fff7ae';cx.lineWidth=2.5;
   cx.beginPath();cx.ellipse(tx,ty+22,18+u*42,7+u*13,0,0,7);cx.stroke();
  }

  // Rayo desde la nube: el trazado se regenera ~20 veces por segundo
  if(time>=.69&&time<1.05){
   const fade=time>.91?Math.max(0,1-(time-.91)/.14):1;
   if(!e.pts||T-e.pt>.05){
    e.pt=T;
    e.pts=zig([0,0],[1,0],26,5);
    e.br=[0,0,0,0].map(()=>{
     const q=e.pts[Math.floor(R(3,e.pts.length-4))],d=Math.random()<.5?1:-1;
     return zig(q,[q[0]+R(.1,.25),q[1]+d*R(30,60)],10,3);
    });
   }
   cx.globalAlpha=fade*(Math.random()<.15?.6:1);
   e.br.forEach(b=>draw(b,1.5));
   draw(e.pts,3.2);
   glow(tx,ty,65,fade);
  }

  // Onda expansiva
  if(time>=.78&&time<1.35){
   const u=Math.min(1,(time-.78)/.55),a=1-u;
   glow(tx,ty,15+u*95,a*.85);
   cx.globalCompositeOperation='source-over';
   cx.globalAlpha=a;
   cx.strokeStyle='#fff';cx.lineWidth=5*a+1;
   cx.beginPath();cx.ellipse(tx,ty+22,15+u*100,6+u*30,0,0,7);cx.stroke();
   cx.strokeStyle='#facc15';cx.lineWidth=3;
   cx.beginPath();cx.ellipse(tx,ty+22,22+u*105,8+u*33,0,0,7);cx.stroke();
  }
  cx.restore();
 }
};