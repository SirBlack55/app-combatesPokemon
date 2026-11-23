// Ataques de dos turnos y ataques que se repiten.
//  · k:'carga' (Rayo Solar, Pico Taladro...): se concentra ~0,9 s con partículas y luego lanza el ataque normal.
//  · k:'inv' (Excavar, Buceo, Bote, Golpe Fantasma...): desaparece ~0,8 s (m.inv) y reaparece junto al rival para atacar.
// Datos (qué ataque es de cuál): DT en datos/ataques-especiales.js. atk() llama a iniciaDosTurnos(); cuando acaba el guion
// (SCRIPTS_INT.dt, que _ayudas.js:scr() ejecuta como los de CUSTOM) vuelve a llamar a atk() y esta vez sí lo lanza.
// Mientras está escondido, hit() ignora los golpes salvo los de INV_HIT (p. ej. Terremoto contra Excavar).
const INV_HIT={dig:['earthquake','magnitude','fissure'],dive:['surf','whirlpool'],sky:['thunder','gust','twister','hurricane','sky-uppercut','smack-down'],ghost:[]};

function iniciaDosTurnos(m,tg,p){
 const d=p.dt,c=campo.cl&&campo.cl.k;
 if((d.sun&&c=='sun')||(d.rain&&c=='rain')){m.dtDone=p;atk(m);return}   // con ese clima no hace falta cargar
 m.sc={id:'dt',t:0,p,d,dur:d.k=='carga'?.9:.8};
 if(d.s)stg(m,d.s);
 bn={s:p.n,c:d.c||'#e2e8f0',l:1.1};
 if(d.k=='inv'){m.inv=d.v;if(d.v=='dig'||d.v=='dive')m.hide=true;if(d.v=='ghost')m.invA=1}
}
const finDT=m=>{m.inv=null;m.hide=false;m.invA=null;m.z=0;m.tilt=0;m.sqz=0};

const SCRIPTS_INT={dt:{
 run(m,dt,s){
  const p=s.p,d=s.d,tg=m.tg,t=s.t,u=Math.min(1,t/s.dur);
  if(m.dead){finDT(m);return true}
  if(!tg||tg.dead){finDT(m);return true}   // sin rival: se cancela
  m.a=turn(m.a,Math.atan2(tg.y-m.y,tg.x-m.x),dt*10);
  const col=d.c||'#fff',spark=(x,y,vx,vy,l,c,sz,gy)=>ps.length<900&&ps.push({x,y,vx,vy,gy,l,m:l,c,s:sz,g:1});
  if(d.k=='carga'){
   m.sqz=.3*u;m.x+=Math.sin(t*70)*.7;
   for(let i=0;i<3;i++){const a=R(0,6.28),r=R(25,60),v=R(80,160);spark(m.x+Math.cos(a)*r,m.y-30+Math.sin(a)*r,-Math.cos(a)*v,-Math.sin(a)*v,.3,i%2?col:'#fff',R(2,5))}
  }else if(d.v=='dig'||d.v=='dive'){
   m.sqz=.3*Math.min(1,t/.2);
   const c1=d.v=='dig'?['#a16207','#d6a550','#78350f']:['#38bdf8','#bae6fd','#fff'];
   for(let i=0;i<3;i++)spark(m.x+R(-16,16),m.y+8,R(-60,60),R(-170,-60),R(.3,.6),c1[i%3],R(3,6),420);
  }else if(d.v=='sky'){
   m.z=450*u*u;wind(m.x,m.y-m.z);if(Math.random()<.5)feathers(m.x+R(-14,14),m.y-m.z-20,2,70);
  }else{   // ghost: se desvanece entre humo morado
   m.invA=Math.max(.12,1-u*1.3);
   for(let i=0;i<2;i++)spark(m.x+R(-20,20),m.y-R(0,60),R(-30,30),R(-80,-20),R(.4,.8),i?'#a78bfa':'#4c1d95',R(4,8));
  }
  if(t<s.dur)return false;
  // fase 2: reaparece junto al rival y ataca (atk vuelve a entrar con dtDone y lanza el ataque de verdad)
  finDT(m);
  if(d.k=='inv'){
   const dx=tg.x-m.x,dy=tg.y-m.y,L=Math.hypot(dx,dy)||1;
   m.x=Math.max(100,Math.min(W-100,tg.x-dx/L*36));m.y=Math.max(100,Math.min(350,tg.y-dy/L*14));
   burst(m.x,m.y,col,18,200,true);ring(m.x,m.y,col,60,.4,4);
  }
  m.dtDone=p;m.plan=p;
  atk(m);
  return true;
 }
}};
// Dibujo de quien está escondido bajo tierra o agua (drawM lo llama cuando m.hide; el contexto ya está en la posición del Pokémon)
function invDraw(m){
 if(m.inv=='dig'){
  cx.fillStyle='rgba(120,83,45,.9)';cx.beginPath();cx.ellipse(0,10,26,10,0,0,7);cx.fill();
  cx.fillStyle='rgba(180,140,90,.9)';cx.beginPath();cx.ellipse(-3,6,16,6,0,0,7);cx.fill();
 }else{
  cx.strokeStyle='rgba(125,211,252,.9)';cx.lineWidth=2;
  for(let i=0;i<3;i++){const k=(T*1.6+i/3)%1;cx.globalAlpha=1-k;cx.beginPath();cx.ellipse(0,10,10+k*30,4+k*12,0,0,7);cx.stroke()}
  cx.globalAlpha=1;cx.fillStyle='rgba(2,132,199,.55)';cx.beginPath();cx.ellipse(0,10,16,6,0,0,7);cx.fill();
 }
}
// Ataques que se repiten (Atropello, Pataleta, Danza Pétalo, Rodar...): fija el ataque unos usos seguidos y, si toca, acaba confuso
function repite(m,p){
 const r=p.rep,f=m.vol&&m.vol.furia;
 if(!f){
  const n=r.n[0]+Math.floor(rnd()*(r.n[1]-r.n[0]+1));
  (m.vol=m.vol||{}).furia={l:12,t:0,n:n-1,u:0,conf:r.conf};
  if(n>1)m.mc[m.pi]=p.cd*.3;
 }else{
  f.u++;f.n--;
  if(f.n>0)m.mc[m.pi]=p.cd*.3;
  else{delete m.vol.furia;if(f.conf)aplicarEst(m,'cnf',m)}
 }
}