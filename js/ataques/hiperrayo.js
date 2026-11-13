// Hiperrayo (hyper-beam): carga -> rayo cónico -> explosión.
CUSTOM['hyper-beam']={
 mv:{cu:'hyper-beam',r:420,tk:0},
 fallback:()=>({n:'Hiperrayo',key:'hyper-beam',p:150,cd:10,c:1,r:420,u:0,t:'normal',cat:'spe',acc:90,sty:'beam',cu:'hyper-beam'}),

 start(m,tg,p){
  m.sc={id:'hyper-beam',t:0};
  bn={s:p.n,c:'#fbbf24',l:1.8};
  cz=.07;
  ents.push({k:'u',cu:'hyper-beam',o:m,tg,cat:p.cat,dm:p.p,t:0,tk:0,hit:0,life:1.65});
 },

 run(m,dt,s){
  const t=s.t;
  if(m.tg&&!m.tg.dead)m.a=turn(m.a,Math.atan2(m.tg.y-m.y,m.tg.x-m.x),dt*12);
  m.sqz=t<.55?.32*t/.55:Math.max(0,.32-(t-.55)*.3);
  m.tilt=t<.55?Math.sin(t*18)*.025:0;
  if(t<1.85)return false;
  m.sqz=m.tilt=0;
  return true;
 },

 eup(e,dt){
  const o=e.o,t=e.tg;
  e.t+=dt;
  e.life=1.65-e.t;
  if(o.dead){e.life=0;return}
  if(t.dead&&e.t<1.4)e.t=1.4;
  const Q=hpos(e);
  if(!Q)return;
  const{Ox,Oy,ux,uy,nx,ny,L,Tx,Ty}=Q;
  const spark=(x,y,vx,vy,l,c,s)=>ps.length<900&&ps.push({x,y,vx,vy,l,m:l,c,s,g:1});

  // Carga: la energía converge en la boca
  if(e.t<.55){
   for(let i=0;i<4;i++){
    const a=R(0,6.28),r=R(25,50);
    spark(Ox+Math.cos(a)*r,Oy+Math.sin(a)*r,-Math.cos(a)*r*2.5,-Math.sin(a)*r*2.5,.35,i%3?'#fbbf24':'#fff7cc',R(2,5));
   }
  }
  // Disparo
  else if(e.t<1.4){
   if(!e.fs){
    e.fs=1;
    o.kx-=ux*105;o.ky-=uy*105;
    shk=Math.max(shk,7);sfl=.3;sfc='#fff5c4';
    ring(Ox,Oy,'#fbbf24',65,.45,5);
   }
   const reach=Math.min(1,(e.t-.55)/.13);
   for(let i=0;i<8;i++){
    const s=R(.05,1)*reach,d=R(-1,1);
    spark(Ox+ux*L*s+nx*d*Q.Wm*.4,Oy+uy*L*s+ny*d*Q.Wm*.4,nx*d*R(80,240)+ux*R(40,150),ny*d*R(80,240)+uy*R(40,150),R(.18,.4),i%3?'#fbbf24':'#fff',R(2,5));
   }
   if(e.t>.72&&Math.random()<.8){
    const a=R(0,6.28),v=R(60,230);
    spark(Tx+R(-15,15),Ty+R(-15,15),Math.cos(a)*v,Math.sin(a)*v,.45,Math.random()<.5?'#fbbf24':'#fff',R(3,7));
   }
   if(e.t>=.78&&!e.hit){
    e.hit=1;
    hit(t,e.dm,'normal',o,{cat:e.cat,f:true});
    blast(Tx,Ty,'#fff0a0',85);
    ring(Tx,Ty,'#fbbf24',110,.65,7);
    ring(Tx,Ty,'#fff',55,.35,4);
    imp(Tx,Ty,'normal',3);
    shk=Math.max(shk,10);sfl=.35;sfc='#fff8dc';
   }
  }
  // Remate
  else if(!e.end){
   e.end=1;
   blast(Tx,Ty,'#fbbf24',55);
   ring(Tx,Ty,'#fcd34d',135,.8,5);
   imp(Tx,Ty,'normal',2);
   shk=Math.max(shk,7);
  }
 },

 edraw(e){
  const Q=e.o&&e.tg&&hpos(e);
  if(!Q)return;
  const{Ox,Oy,ux,uy,nx,ny,L,Tx,Ty,Wm}=Q,time=e.t;
  const glow=(x,y,r,stops)=>{
   const g=cx.createRadialGradient(x,y,1,x,y,r);
   stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));
   cx.fillStyle=g;cx.beginPath();cx.arc(x,y,r,0,7);cx.fill();
  };
  cx.save();

  // Esfera de carga
  if(time<.55){
   const r=(7+time/.55*22)*(1+Math.sin(T*23)*.09);
   cx.globalCompositeOperation='lighter';
   glow(Ox,Oy,r*2.5,['rgba(255,255,220,.8)','rgba(251,191,36,.5)','rgba(249,115,22,0)']);
   glow(Ox,Oy,r,['#fff','#fff7bc','#fbbf24','rgba(249,115,22,.2)']);
   cx.globalCompositeOperation='source-over';
   cx.lineWidth=2;
   for(let i=0;i<2;i++){
    cx.strokeStyle=i?'#fff':'#fbbf24';
    cx.beginPath();cx.ellipse(Ox,Oy,r*1.55,r*.48,T*(i?-2.5:3),0,7);cx.stroke();
   }
   cx.restore();
   return;
  }

  // Rayo: columna de grosor fijo con filos en zigzag
  if(time<1.4){
   const reach=Math.min(1,(time-.55)/.13);
   const fade=time>1.17?Math.max(0,1-(time-1.17)/.23):1;
   const w=Wm*.4*fade*(1+.05*Math.sin(T*38));
   const ex=Ox+ux*L*reach,ey=Oy+uy*L*reach;
   cx.globalAlpha=fade;
   for(const[k,c]of[[1,'rgba(234,88,12,.8)'],[.8,'rgba(249,115,22,.9)'],[.58,'rgba(251,191,36,.95)'],[.36,'rgba(254,240,138,1)'],[.18,'#fff']]){
    const r=w*k;
    cx.fillStyle=c;cx.beginPath();
    cx.moveTo(Ox+nx*r,Oy+ny*r);cx.lineTo(ex+nx*r,ey+ny*r);
    cx.lineTo(ex-nx*r,ey-ny*r);cx.lineTo(Ox-nx*r,Oy-ny*r);
    cx.arc(ex,ey,r,0,7);
    cx.fill();
   }
   // Zigzags de energía en los filos
   cx.lineJoin='miter';
   for(const side of[1,-1]){
    cx.beginPath();
    for(let i=0;i<=24;i++){
     const s=reach*i/24,off=side*w*(1+(i%2?.3:-.15)*(.6+.4*Math.sin(T*50+i*2.3+side)));
     const x=Ox+ux*L*s+nx*off,y=Oy+uy*L*s+ny*off;
     i?cx.lineTo(x,y):cx.moveTo(x,y);
    }
    cx.strokeStyle='#f97316';cx.lineWidth=5;cx.stroke();
    cx.strokeStyle='#fff';cx.lineWidth=2;cx.stroke();
   }
   // Bandas de energía que recorren el rayo
   cx.strokeStyle='rgba(255,255,255,.85)';cx.lineWidth=3;
   for(let k=0;k<6;k++){
    const s=((T*2.8+k/6)%1)*reach;
    cx.beginPath();
    cx.moveTo(Ox+ux*L*s+nx*w*.8,Oy+uy*L*s+ny*w*.8);
    cx.lineTo(Ox+ux*L*s-nx*w*.8,Oy+uy*L*s-ny*w*.8);
    cx.stroke();
   }
   cx.globalCompositeOperation='lighter';
   glow(Ox,Oy,17*fade+5,['#fff','#fff7c2','#fbbf24','rgba(249,115,22,0)']);
  }

  // Explosión en el objetivo
  if(time>=.78&&time<1.4){
   const u=(time-.78)/.55,a=1-u,r=15+u*100;
   cx.globalAlpha=1;
   cx.globalCompositeOperation='lighter';
   glow(Tx,Ty,r,[`rgba(255,255,255,${a*.9})`,`rgba(255,230,140,${a*.7})`,`rgba(251,146,60,${a*.35})`,'rgba(249,115,22,0)']);
   cx.globalCompositeOperation='source-over';
   cx.globalAlpha=a*.85;
   cx.strokeStyle='#fff1b5';cx.lineWidth=7*a+1;
   cx.beginPath();cx.arc(Tx,Ty,12+u*90,0,7);cx.stroke();
   for(let i=0;i<12;i++){
    const an=i*Math.PI/6+T*.3,len=r*R(.65,1.1);
    cx.strokeStyle=i%2?'#fff':'#fbbf24';cx.lineWidth=R(2,5)*a;
    cx.beginPath();
    cx.moveTo(Tx+Math.cos(an)*r*.2,Ty+Math.sin(an)*r*.2);
    cx.lineTo(Tx+Math.cos(an)*len,Ty+Math.sin(an)*len);
    cx.stroke();
   }
  }
  cx.restore();
 }
};