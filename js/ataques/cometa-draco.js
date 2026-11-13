// Cometa Draco (draco-meteor): 5 meteoritos de roca ardiente que caen sobre el rival y se estrellan.
CUSTOM['draco-meteor']={
 // p:130 y c:1 → el conversor multiplicaba el poder por 1.8 (llegaba 234) y c:10 no se usa aquí
 mv:{cu:'draco-meteor',r:420,tk:0,p:130,c:1},
 fallback:()=>({n:'Cometa Draco',key:'draco-meteor',p:130,cd:8.4,c:1,r:420,u:1,t:'dragon',cat:'spe',acc:90,sty:'beam',cu:'draco-meteor'}),

 start(m,tg,p){
  m.sc={id:'draco-meteor',t:0,p};
  dim=.5;
  shk=Math.max(shk,6);
  bn={s:p.n,c:'#a855f7',l:1.5};

  // Energía draconiana subiendo desde el atacante
  for(let i=0;i<25;i++){
   const a=R(0,6.28),d=R(15,40);
   ps.push({x:m.x+Math.cos(a)*d,y:m.y-34+Math.sin(a)*d,vx:R(-20,20),vy:R(-250,-150),l:.6,m:.6,c:i%2?'#60a5fa':'#c084fc',s:R(4,8),g:1,sh:'s'});
  }

  // 5 meteoritos escalonados ('delay' lo gestiona el motor: eup() empieza cuando termina).
  // Vienen en diagonal desde el lado con más espacio; el último es el más grande.
  const N=5,side=tg.x<W/2?-1:1;
  for(let i=0;i<N;i++){
   const sx=tg.x-side*R(110,230);
   ents.push({k:'u',cu:'draco-meteor',o:m,tg,cat:p.cat,dm:p.p/N,t:0,idx:i,
    delay:.4+i*.12,
    sx,sy:-120,cx:sx,cy:-120,           // posición inicial válida (edraw puede dibujar antes del primer eup)
    ox:R(-20,20),tx:tg.x,ty:tg.y-20,
    sz:i===N-1?26:R(12,17),             // radio de la roca
    shape:Array.from({length:11},()=>R(.7,1.2)),rot0:R(0,6.28),spin:R(-5,5),
    pf:[],hitDone:false,life:1.5});
  }
 },

 run(m,dt,s){
  const t=s.t;
  if(t<1)dim=Math.max(dim,.4);          // el campo sigue oscuro mientras caen
  if(t<.4){m.x+=Math.sin(t*90)*1.2;return false}   // vibración (m.tilt estira el sprite, mejor mover x)
  return t>=1.2;
 },

 eup(e,dt){
  const o=e.o,tg=e.tg,s=e.sz;
  e.t+=dt;
  e.life=1.5-e.t;
  // Humo y polvo propios: se mueven aquí y se pintan blandos en edraw
  const puff=(x,y,vx,vy,r,gr,l,c)=>e.pf.length<60&&e.pf.push({x,y,vx,vy,r,gr,l,m:l,c});
  e.pf.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97;p.l-=dt});
  e.pf=e.pf.filter(p=>p.l>0);
  if(e.hitDone)return;

  // Caída: acelera hacia donde está el rival (el impacto cae donde está)
  const u=Math.min(1,e.t/.42);
  e.tx=tg.x+e.ox;e.ty=tg.y-20;
  const w=u**1.35;
  e.cx=e.sx+(e.tx-e.sx)*w;
  e.cy=e.sy+(e.ty-e.sy)*w;

  if(u<1){
   puff(e.cx,e.cy,R(-25,25),R(-25,25),s*.8,s*1.8,R(.5,.9),'88,70,100');
   for(let i=0;i<2&&ps.length<900;i++)   // brasas que se desprenden de la roca
    ps.push({x:e.cx+R(-6,6),y:e.cy+R(-6,6),vx:R(-50,50),vy:R(-20,60),gy:220,l:R(.3,.6),m:.6,c:['#fb923c','#fde047','#c084fc'][i+(Math.random()<.4?1:0)],s:R(2,5),g:1});
   return;
  }

  // Impacto (una vez): daño, explosión, escombros, humo y polvo
  e.hitDone=true;e.th=e.t;
  const X=e.ix=e.tx,Y=e.iy=e.ty,k=s/14;
  if(!tg.dead)hit(tg,e.dm,'dragon',o,{cat:e.cat,f:e.idx===0});
  imp(X,Y,'dragon',1.2*Math.sqrt(k));
  blast(X,Y,'#a855f7',45*k);
  ring(X,Y,'#c084fc',90*k,.45,5);
  ring(X,Y,'#fb923c',55*k,.3,3);
  shk=Math.max(shk,7+k*3);sfl=.18;sfc='#f3e8ff';
  for(let i=0;i<22&&ps.length<900;i++){
   const a=R(0,6.28),v=R(100,360)*Math.sqrt(k);
   ps.push({x:X,y:Y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.8-60,gy:300,l:R(.3,.7),m:.7,c:['#fb923c','#fde047','#c084fc','#fff'][i%4],s:R(2,6),g:1});
  }
  for(let i=0;i<8&&ps.length<900;i++)   // escombros que salen despedidos y caen
   ps.push({x:X+R(-10,10),y:Y,vx:R(-200,200),vy:R(-340,-120),gy:560,l:R(.6,1),m:1,c:i%2?'#57534e':'#3b2a3f',s:R(3,7)});
  for(let i=0;i<6;i++)puff(X+R(-15,15),Y+R(-8,8),R(-40,40),R(-110,-30),s*1.4,s*3,R(.8,1.3),'88,70,100');
  for(let i=0;i<8;i++){const a=R(0,6.28);puff(X,Y+10,Math.cos(a)*R(90,220),Math.sin(a)*R(15,50),s*1.2,s*2.5,R(.7,1.1),'214,199,161')}
 },

 edraw(e){
  if(e.t<=0||e.cx==null)return;
  const t=e.t,s=e.sz;
  const glow=(X,Y,r,a,c1,c2)=>{
   const g=cx.createRadialGradient(X,Y,1,X,Y,r);
   g.addColorStop(0,'#fff');g.addColorStop(.4,c1);g.addColorStop(1,c2);
   cx.globalAlpha=a;cx.fillStyle=g;cx.beginPath();cx.arc(X,Y,r,0,7);cx.fill();
  };
  cx.save();
  cx.lineCap='round';

  // Humo y polvo: bocanadas blandas que crecen y se desvanecen
  for(const p of e.pf){
   const a=p.l/p.m,r=p.r+p.gr*(1-a),g=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
   g.addColorStop(0,`rgba(${p.c},${Math.min(1,a*1.6)*.55})`);g.addColorStop(1,`rgba(${p.c},0)`);
   cx.globalAlpha=1;cx.fillStyle=g;cx.beginPath();cx.arc(p.x,p.y,r,0,7);cx.fill();
  }

  if(!e.hitDone){
   const u=Math.min(1,t/.42),dx=e.tx-e.sx,dy=e.ty-e.sy,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,nx=-uy,ny=ux;
   cx.globalCompositeOperation='lighter';

   // Sombra incandescente en el suelo: avisa de dónde va a caer
   cx.save();cx.translate(e.tx,e.ty+10);cx.scale(1,.35);
   glow(0,0,s*(2+u*3),u*.7,'#f0abfc','rgba(147,51,234,0)');
   cx.restore();

   // Cola de fuego cónica en tres capas (plasma morado, fuego naranja, núcleo blanco)
   const tl=s*11*(1+.15*Math.sin(T*40+e.idx));
   for(const[k,rgb]of[[1,'168,85,247'],[.62,'251,146,60'],[.3,'255,247,205']]){
    const hw=s*1.3*k,bx=e.cx-ux*tl,by=e.cy-uy*tl,g=cx.createLinearGradient(e.cx,e.cy,bx,by);
    g.addColorStop(0,`rgba(${rgb},.9)`);g.addColorStop(1,`rgba(${rgb},0)`);
    cx.globalAlpha=1;cx.fillStyle=g;cx.beginPath();
    cx.moveTo(e.cx+nx*hw,e.cy+ny*hw);cx.lineTo(bx,by);cx.lineTo(e.cx-nx*hw,e.cy-ny*hw);cx.fill();
   }
   glow(e.cx,e.cy,s*3.2,1,'#fb923c','rgba(168,85,247,0)');

   // Roca: polígono irregular que gira, oscuro, con grietas al rojo vivo
   cx.globalCompositeOperation='source-over';cx.globalAlpha=1;
   cx.save();cx.translate(e.cx,e.cy);cx.rotate(e.rot0+e.spin*t);
   const n=e.shape.length,P=i=>[Math.cos(i*6.283/n)*s*e.shape[i%n],Math.sin(i*6.283/n)*s*e.shape[i%n]];
   const g=cx.createRadialGradient(-s*.3,-s*.3,1,0,0,s*1.2);
   g.addColorStop(0,'#7c5a6e');g.addColorStop(.6,'#3b2a3f');g.addColorStop(1,'#120a14');
   cx.fillStyle=g;cx.strokeStyle='#1a0f1c';cx.lineWidth=1.5;cx.beginPath();
   for(let i=0;i<n;i++){const[x,y]=P(i);i?cx.lineTo(x,y):cx.moveTo(x,y)}
   cx.closePath();cx.fill();cx.stroke();
   cx.globalCompositeOperation='lighter';cx.strokeStyle='#fdba74';cx.lineWidth=2;
   for(let i=0;i<n;i+=3){
    const[x,y]=P(i);
    cx.beginPath();cx.moveTo(x*.15,y*.15);cx.lineTo(x*.6+Math.sin(i)*3,y*.6+Math.cos(i)*3);cx.lineTo(x*.95,y*.95);cx.stroke();
   }
   cx.restore();

   // Frente al rojo blanco, donde la roca choca con el aire
   glow(e.cx+ux*s*.6,e.cy+uy*s*.6,s*1.6,.9,'#fff7cd','rgba(251,146,60,0)');
  }
  else{
   // Tras el impacto: cráter chamuscado con borde incandescente y bola de fuego
   const v=t-e.th,X=e.ix,Y=e.iy,fade=Math.max(0,1-v/1.1);
   if(fade>0){
    cx.save();cx.translate(X,Y+10);cx.scale(1,.35);
    const c=cx.createRadialGradient(0,0,1,0,0,s*2.4);
    c.addColorStop(0,'rgba(11,6,16,.9)');c.addColorStop(1,'rgba(11,6,16,0)');
    cx.globalAlpha=.6*fade;cx.fillStyle=c;cx.beginPath();cx.arc(0,0,s*2.4,0,7);cx.fill();
    cx.globalCompositeOperation='lighter';cx.globalAlpha=.8*fade;cx.strokeStyle='#fb923c';cx.lineWidth=4;
    cx.beginPath();cx.arc(0,0,s*1.5,0,7);cx.stroke();
    cx.restore();
   }
   if(v<.5){
    const uu=v/.5,a=1-uu,r=s*(2+Math.sqrt(uu)*5),c2='rgba(168,85,247,0)';
    cx.globalCompositeOperation='lighter';
    glow(X,Y,s*10,Math.max(0,1-uu*6)*.8,'#fff','rgba(255,255,255,0)');
    for(let i=0;i<6;i++){const an=i*1.047+.4;glow(X+Math.cos(an)*r*.4,Y+Math.sin(an)*r*.4-uu*20,r*.55,a,'#fb923c',c2)}
    glow(X,Y,r,a,'#c084fc',c2);
    cx.globalAlpha=a;cx.strokeStyle='#e9d5ff';cx.lineWidth=5*a+1;
    cx.beginPath();cx.ellipse(X,Y+10,s+uu*s*9,s*.35+uu*s*3,0,0,7);cx.stroke();
   }
  }
  cx.restore();
 }
};