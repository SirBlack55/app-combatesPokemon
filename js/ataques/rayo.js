// Rayo (thunderbolt): carga -> descarga en zigzag con ramas -> destello.
CUSTOM['thunderbolt']={
 mv:{cu:'thunderbolt',r:360,tk:0,est:'distancia'},
 fallback:()=>({n:'Rayo',key:'thunderbolt',p:90,cd:(1+90/45)*1.4,c:1,r:360,u:0,t:'elec',cat:'spe',acc:100,sty:'beam',cu:'thunderbolt'}),

 start(m,tg,p){
  m.sc={id:'thunderbolt',t:0};
  bn={s:p.n,c:'#fde047',l:1.4};
  cz=.04;
  ents.push({k:'u',cu:'thunderbolt',o:m,tg,cat:p.cat,dm:p.p/5,t:0,tk:0,n:0,life:1.35});
 },

 run(m,dt,s){
  const t=s.t;
  if(m.tg&&!m.tg.dead)m.a=turn(m.a,Math.atan2(m.tg.y-m.y,m.tg.x-m.x),dt*14);
  m.sqz=t<.22?.16*t/.22:Math.max(0,.16-(t-.22)*.8);
  m.tilt=t>.95?Math.sin(t*13)*.025:0;
  if(t<1.35)return false;
  m.sqz=m.tilt=0;
  return true;
 },

 eup(e,dt){
  const o=e.o,t=e.tg;
  e.t+=dt;
  e.life=1.35-e.t;
  if(o.dead||!t||t.dead){e.life=0;return}
  const Q=hpos(e);
  if(!Q)return;
  const{Ox,Oy,ux,uy,nx,ny,L,Tx,Ty}=Q;
  const spark=(x,y,vx,vy,l,c,s)=>ps.length<900&&ps.push({x,y,vx,vy,l,m:l,c,s,g:1});

  // Carga: chispas hacia la boca
  if(e.t<.22){
   for(let i=0;i<4;i++){
    const a=R(0,6.28),r=R(12,35),v=R(50,120);
    spark(Ox+Math.cos(a)*r,Oy+Math.sin(a)*r,-Math.cos(a)*v,-Math.sin(a)*v,.18,i%2?'#fde047':'#fff',R(2,4));
   }
  }
  // Descarga: cinco impactos seguidos
  else if(e.t<1.05){
   if(!e.fs){
    e.fs=1;
    o.kx-=ux*35;o.ky-=uy*35;
    shk=Math.max(shk,3);sfl=.16;sfc='#fffde7';
   }
   e.tk+=dt;
   if(e.tk>=.14&&e.n<5){
    e.tk-=.14;e.n++;
    hit(t,e.dm,'elec',o,{cat:e.cat,f:e.n==1});
    if(e.n==1)ring(Tx,Ty,'#fde047',38,.3,3);
    imp(Tx,Ty,'elec',.65);
    shk=Math.max(shk,2);
   }
   for(let i=0;i<6;i++){
    const s=R(.05,1),d=R(-1,1);
    spark(Ox+ux*L*s+nx*d*12,Oy+uy*L*s+ny*d*12,nx*d*R(80,190)+ux*R(-40,100),ny*d*R(80,190)+uy*R(-40,100),R(.12,.3),i%3?'#fde047':'#fff',R(2,4));
   }
  }
  else if(!e.end){
   e.end=1;
   ring(Tx,Ty,'#fde047',65,.4,4);
   imp(Tx,Ty,'elec',1);
  }
 },

 edraw(e){
  const Q=e.o&&e.tg&&hpos(e);
  if(!Q)return;
  const{Ox,Oy,ux,uy,nx,ny,L,Tx,Ty}=Q,time=e.t;
  const glow=(x,y,r,a)=>{
   const g=cx.createRadialGradient(x,y,1,x,y,r);
   g.addColorStop(0,'#fff');g.addColorStop(.4,'#fde047');g.addColorStop(1,'rgba(250,204,21,0)');
   cx.globalAlpha=a;cx.fillStyle=g;cx.beginPath();cx.arc(x,y,r,0,7);cx.fill();
  };
  // Un rayo se guarda como puntos [avance 0..1, desvío en px] y se coloca sobre el eje actual
  const P=q=>[Ox+ux*L*q[0]+nx*q[1],Oy+uy*L*q[0]+ny*q[1]];
  // Desplazamiento del punto medio: cada pasada parte los tramos y los rompe
  const zig=(a,b,d,n)=>{
   let p=[a,b];
   while(n--){p=p.flatMap((v,i)=>i?[[(v[0]+p[i-1][0])/2,(v[1]+p[i-1][1])/2+R(-d,d)],v]:[v]);d*=.55}
   return p;
  };
  const draw=(pts,w)=>{
   cx.beginPath();
   pts.forEach((q,i)=>{const[x,y]=P(q);i?cx.lineTo(x,y):cx.moveTo(x,y)});
   for(const[c,k]of[['rgba(250,204,21,.3)',5],['rgba(253,224,71,.85)',2],['#fff',1]]){
    cx.strokeStyle=c;cx.lineWidth=w*k;cx.stroke();
   }
  };
  cx.save();
  cx.lineJoin='round';cx.lineCap='round';
  cx.globalCompositeOperation='lighter';

  // Carga
  if(time<.22){
   const r=5+time/.22*15;
   glow(Ox,Oy,r*2*(1+Math.sin(T*35)*.15),1);
   for(let i=0;i<4;i++){
    const a=R(0,6.28);
    cx.strokeStyle=i%2?'#fff':'#fde047';cx.lineWidth=2;
    cx.beginPath();cx.moveTo(Ox,Oy);
    cx.lineTo(Ox+Math.cos(a)*r*1.4+R(-4,4),Oy+Math.sin(a)*r*1.4+R(-4,4));
    cx.lineTo(Ox+Math.cos(a+.3)*r*2.4,Oy+Math.sin(a+.3)*r*2.4);
    cx.stroke();
   }
   cx.restore();
   return;
  }

  // Descarga: el trazado se regenera ~20 veces por segundo para que parpadee
  if(time<1.05){
   const fade=time>.91?Math.max(0,1-(time-.91)/.14):1;
   if(!e.pts||T-e.pt>.05){
    e.pt=T;
    e.pts=zig([0,0],[1,0],Math.min(48,L*.16),5);
    e.br=[0,0,0,0].map(()=>{
     const q=e.pts[Math.floor(R(4,e.pts.length-4))],d=Math.random()<.5?1:-1;
     return zig(q,[q[0]+R(.06,.18),q[1]+d*R(25,60)],10,3);
    });
   }
   cx.globalAlpha=fade*(Math.random()<.15?.55:1);
   e.br.forEach(b=>draw(b,1.1));
   draw(e.pts,2.2);
   glow(Ox,Oy,24,fade);
   glow(Tx,Ty,28,fade);
  }

  // Destello final
  if(time>=.91&&time<1.2){
   const u=(time-.91)/.29;
   glow(Tx,Ty,10+u*48,1-u);
  }
  cx.restore();
 }
};