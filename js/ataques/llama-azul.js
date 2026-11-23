
 // Llama Azul (Blue Flare): concentración -> erupción de fuego -> columna de llamas -> brasas.
CUSTOM['blue-flare']={
 mv:{cu:'blue-flare',r:420,tk:0,est:'distancia'},
 fallback:()=>({n:'Llama Azul',key:'blue-flare',p:130,cd:8,c:1,r:420,u:0,t:'fire',cat:'spe',acc:85,sty:'beam',cu:'blue-flare'}),

 start(m,tg,p){
  m.sc={id:'blue-flare',t:0};
  bn={s:p.n,c:'#38bdf8',l:2};
  cz=.07;
  ents.push({k:'u',cu:'blue-flare',o:m,tg,cat:p.cat,dm:p.p,t:0,tk:0,hit:0,life:2.5});
 },

 run(m,dt,s){
  const t=s.t;
  if(m.tg&&!m.tg.dead)m.a=turn(m.a,Math.atan2(m.tg.y-m.y,m.tg.x-m.x),dt*12);

  // Concentración de energía.
  m.sqz=t<.5?.16*Math.sin(t/.5*Math.PI):0;
  m.tilt=t<.5?Math.sin(t*18)*.025:0;

  // Retroceso al liberar el fuego.
  if(t>=.5&&t<.8){
   m.sqz=-.12*Math.sin((t-.5)/.3*Math.PI);
  }

  if(t<2.45)return false;
  m.sqz=m.tilt=0;
  return true;
 },

 eup(e,dt){
  const o=e.o,t=e.tg;
  e.t+=dt;
  e.life=2.5-e.t;

  if(o.dead){e.life=0;return}
  if(t.dead&&e.t<1.9)e.t=1.9;

  const Q=hpos(e);
  if(!Q)return;
  const{Ox,Oy,Tx,Ty}=Q;

  const spark=(x,y,vx,vy,l,c,s)=>ps.length<900&&ps.push({
   x,y,vx,vy,l,m:l,c,s,g:1
  });

  // 1. CONCENTRACIÓN: pequeñas llamas convergen en el atacante.
  if(e.t<.55){
   for(let i=0;i<6;i++){
    const a=R(0,6.28),r=R(35,95);
    const x=Ox+Math.cos(a)*r;
    const y=Oy+Math.sin(a)*r;

    spark(x,y,
     -Math.cos(a)*R(45,110),
     -Math.sin(a)*R(45,110),
     R(.3,.6),
     ['#38bdf8','#7dd3fc','#fff','#0284c7'][i%4],
     R(2,5));
   }

   if(Math.random()<.65){
    const a=R(0,6.28);
    spark(Ox+Math.cos(a)*25,Oy+Math.sin(a)*25,
     Math.cos(a)*30,Math.sin(a)*30,
     .3,'#fff',3);
   }
  }

  // 2. ERUPCIÓN: el fuego aparece directamente en el objetivo.
  else if(e.t<1.95){

   if(!e.fs){
    e.fs=1;

    o.kx-=Math.cos(o.a)*55;
    o.ky-=Math.sin(o.a)*55;

    shk=Math.max(shk,12);
    sfl=.45;
    sfc='#c9f3ff';

    blast(Tx,Ty,'#fff',100);
    blast(Tx,Ty,'#38bdf8',130);

    ring(Tx,Ty,'#fff',65,.35,5);
    ring(Tx,Ty,'#38bdf8',115,.7,8);
    ring(Tx,Ty,'#1d4ed8',85,.6,5);
   }

   const age=e.t-.55;
   const intensity=Math.max(.2,1-age/1.5);

   // Partículas que salen disparadas desde la explosión.
   for(let i=0;i<13;i++){
    const a=R(0,6.28);
    const v=R(65,230);

    spark(
     Tx+R(-22,22),
     Ty+R(-15,35),
     Math.cos(a)*v,
     Math.sin(a)*v-R(40,170),
     R(.3,.8),
     ['#38bdf8','#7dd3fc','#fff','#0284c7','#1d4ed8'][i%5],
     R(3,8)
    );
   }

   // Lenguas de fuego que ascienden por la columna.
   for(let i=0;i<7;i++){
    const x=Tx+R(-65,65);
    const y=Ty+R(-30,65);

    spark(x,y,
     R(-45,45),
     -R(100,280),
     R(.4,.9),
     ['#38bdf8','#7dd3fc','#fff','#0ea5e9'][i%4],
     R(4,10));
   }

   // Remolinos de fuego alrededor de la base.
   for(let i=0;i<3;i++){
    const a=R(0,6.28);
    const r=R(30,85);

    spark(
     Tx+Math.cos(a)*r,
     Ty+Math.sin(a)*r*.45,
     -Math.sin(a)*R(40,130),
     -Math.cos(a)*R(30,100)-50,
     R(.3,.65),
     '#7dd3fc',
     R(3,6)
    );
   }

   // Daño una única vez.
   if(e.t>=.62&&!e.hit){
    e.hit=1;

    hit(t,e.dm,'fire',o,{cat:e.cat,f:true});

    blast(Tx,Ty,'#fff',110);
    blast(Tx,Ty,'#38bdf8',120);

    ring(Tx,Ty,'#fff',95,.5,7);
    ring(Tx,Ty,'#38bdf8',150,.85,9);
    ring(Tx,Ty,'#1d4ed8',125,.75,7);

    imp(Tx,Ty,'fire',3);

    shk=Math.max(shk,15);
    sfl=.5;
    sfc='#e0f7ff';
   }
  }

  // 3. REMATE: las llamas se elevan y se dispersan.
  else if(!e.end){
   e.end=1;

   blast(Tx,Ty,'#7dd3fc',75);
   ring(Tx,Ty,'#38bdf8',125,.75,6);

   shk=Math.max(shk,7);
  }
 },

 edraw(e){
  const Q=e.o&&e.tg&&hpos(e);
  if(!Q)return;

  const{Ox,Oy,Tx,Ty}=Q;
  const time=e.t;

  const glow=(x,y,rx,ry,stops)=>{
   const g=cx.createRadialGradient(x,y,1,x,y,Math.max(rx,ry));
   stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));
   cx.fillStyle=g;
   cx.beginPath();
   cx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
   cx.fill();
  };

  // Dibuja una lengua de fuego con punta curva.
  const flame=(x,y,w,h,angle,color1,color2,seed)=>{
   cx.save();
   cx.translate(x,y);
   cx.rotate(angle);

   const wave=Math.sin(T*17+seed)*w*.28;
   const flicker=Math.sin(T*23+seed*2)*h*.07;

   const g=cx.createLinearGradient(0,-h,0,0);
   g.addColorStop(0,color1);
   g.addColorStop(.45,color2);
   g.addColorStop(1,'rgba(14,165,233,0)');

   cx.fillStyle=g;
   cx.beginPath();
   cx.moveTo(-w*.5,0);
   cx.bezierCurveTo(
    -w*.65,-h*.25,
    -w*.15+wave,-h*.55,
    wave,-h-flicker
   );
   cx.bezierCurveTo(
    w*.55+wave,-h*.65,
    w*.6,-h*.3,
    w*.5,0
   );
   cx.quadraticCurveTo(0,h*.12,-w*.5,0);
   cx.fill();

   cx.restore();
  };

  cx.save();

  // 1. CARGA: energía azul alrededor del atacante.
  if(time<.55){
   const u=time/.55;
   const r=12+u*27;
   const pulse=1+Math.sin(T*24)*.1;

   cx.globalCompositeOperation='lighter';

   glow(Ox,Oy,r*2.5,r*2.5,[
    'rgba(255,255,255,.75)',
    'rgba(56,189,248,.5)',
    'rgba(29,78,216,0)'
   ]);

   glow(Ox,Oy,r*pulse,r*pulse,[
    '#fff',
    '#e0f2fe',
    '#38bdf8',
    'rgba(14,165,233,0)'
   ]);

   // Pequeños arcos eléctricos.
   for(let i=0;i<3;i++){
    cx.save();
    cx.translate(Ox,Oy);
    cx.rotate(T*(i%2? -2:2)+i*2);

    cx.beginPath();
    cx.ellipse(0,0,r*1.7,r*.55,0,0,Math.PI*2);
    cx.strokeStyle=i===1?'#fff':'#38bdf8';
    cx.lineWidth=2;
    cx.globalAlpha=.75;
    cx.stroke();

    cx.restore();
   }

   cx.restore();
   return;
  }

  // 2. GRAN ERUPCIÓN DE FUEGO AZUL EN EL OBJETIVO.
  if(time>=.55&&time<2.15){

   const age=time-.55;
   const fade=time>1.75?Math.max(0,1-(time-1.75)/.4):1;

   // La columna crece rápidamente y después se consume.
   const grow=Math.min(1,age/.25);
   const shrink=time>1.45?Math.max(.25,1-(time-1.45)/.7):1;

   const height=185*grow*shrink;
   const width=75*grow*shrink;
   const pulse=1+Math.sin(T*20)*.07;

   cx.globalAlpha=fade;
   cx.globalCompositeOperation='lighter';

   // Resplandor general de la explosión.
   glow(Tx,Ty-height*.35,width*2.5,height*.85,[
    'rgba(255,255,255,.35)',
    'rgba(125,211,252,.35)',
    'rgba(14,165,233,.25)',
    'rgba(29,78,216,0)'
   ]);

   // Base de la llamarada.
   glow(Tx,Ty+5,width*1.5,width*.6,[
    'rgba(255,255,255,.95)',
    'rgba(125,211,252,.85)',
    'rgba(14,165,233,.55)',
    'rgba(29,78,216,0)'
   ]);

   // Núcleo vertical de fuego.
   flame(Tx,Ty+15,width*.9,height*.9,-.08,
    '#fff','#7dd3fc',1);

   flame(Tx-24,Ty+20,width*.75,height*.78,.14,
    '#fff','#38bdf8',2);

   flame(Tx+25,Ty+20,width*.8,height*.82,-.16,
    '#e0f2fe','#0ea5e9',3);

   // Grandes lenguas exteriores.
   for(let i=0;i<8;i++){
    const side=i%2===0?-1:1;
    const offset=side*(25+Math.floor(i/2)*17);
    const h=height*(.55+(i%4)*.13);
    const w=width*(.35+(i%3)*.12);

    const wave=Math.sin(T*12+i*2)*12;

    flame(
     Tx+offset+wave,
     Ty+R(5,15),
     w,h,
     side*(.12+Math.sin(T*9+i)*.1),
     i%3===0?'#fff':'#7dd3fc',
     i%2===0?'#0284c7':'#2563eb',
     i+4
    );
   }

   // Puntas blancas incandescentes en la parte superior.
   for(let i=0;i<5;i++){
    const x=Tx+Math.sin(T*9+i*2)*width*.45+(i-2)*12;

    flame(
     x,
     Ty-height*.65,
     22,
     height*.35,
     Math.sin(T*10+i)*.3,
     '#fff',
     '#38bdf8',
     i+12
    );
   }

   // Remolino horizontal en la base.
   cx.globalAlpha=fade*.85;

   cx.beginPath();
   cx.ellipse(Tx,Ty+15,width*1.3,width*.3,T*.12,0,Math.PI*2);
   cx.strokeStyle='#38bdf8';
   cx.lineWidth=7;
   cx.stroke();

   cx.beginPath();
   cx.ellipse(Tx,Ty+15,width*.9,width*.2,-T*.15,0,Math.PI*2);
   cx.strokeStyle='#fff';
   cx.lineWidth=3;
   cx.stroke();

   // Onda expansiva que se abre en el suelo.
   const ringProgress=Math.min(1,age/.5);

   cx.globalAlpha=fade*(1-ringProgress)*.9;
   cx.beginPath();
   cx.ellipse(Tx,Ty+22,25+ringProgress*115,10+ringProgress*32,0,0,Math.PI*2);
   cx.strokeStyle='#7dd3fc';
   cx.lineWidth=7*(1-ringProgress)+1;
   cx.stroke();

   // Destello inicial.
   if(age<.18){
    const a=1-age/.18;
    glow(Tx,Ty,width*2*a+10,height*1.5*a+10,[
     `rgba(255,255,255,${a})`,
     `rgba(125,211,252,${a*.7})`,
     'rgba(56,189,248,0)'
    ]);
   }
  }

  // 3. BRASAS AZULES QUE QUEDAN TRAS LA EXPLOSIÓN.
  if(time>=1.75&&time<2.5){
   const a=Math.max(0,1-(time-1.75)/.75);

   cx.globalCompositeOperation='lighter';
   cx.globalAlpha=a*.65;

   for(let i=0;i<12;i++){
    const phase=T*1.5+i*2.4;
    const x=Tx+Math.sin(phase)* (35+i*5);
    const y=Ty-40-((T*35+i*29)%125);

    glow(x,y,3,5,[
     '#fff',
     '#7dd3fc',
     'rgba(56,189,248,0)'
    ]);
   }

   // Último resplandor.
   glow(Tx,Ty-25,65*a,100*a,[
    `rgba(125,211,252,${a*.22})`,
    'rgba(14,165,233,0)'
   ]);
  }

  cx.restore();
 }
};
