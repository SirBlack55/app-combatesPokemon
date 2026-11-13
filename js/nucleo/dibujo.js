// Dibujo del canvas: campo, Pokémon, proyectiles y efectos.
const BG=new Image();BG.src=asset('img/campo.jpg');
function vdraw(e){const p=1-e.life/e.m,a=1-p,vs=e.vs;cx.globalAlpha=Math.max(0,vs=='crack'?Math.min(1,e.life*1.5):a);cx.translate(e.x,e.y);cx.lineCap='round';cx.shadowColor=e.cc;cx.shadowBlur=14;
 if(vs=='slash'){for(let i=0;i<3;i++){const q=Math.min(1,Math.max(0,p*2.4-i*.3));if(q<=0)continue;cx.strokeStyle=i==1?'#fff':e.cc;cx.lineWidth=7-i*1.5;cx.beginPath();cx.moveTo(-35+i*20,-45);cx.lineTo(-35+i*20+30*q,-45+90*q);cx.stroke()}}
 else if(vs=='bite'){const d=Math.max(0,1-p*3.5)*34;cx.fillStyle='#fff';for(const s of[-1,1]){cx.beginPath();for(let i=0;i<4;i++){const x=-24+i*16;cx.moveTo(x,s*(d+6));cx.lineTo(x+8,s*(d+6)-s*22);cx.lineTo(x+16,s*(d+6))}cx.fill()}}
 else if(vs=='kick'){cx.strokeStyle=e.cc;cx.lineWidth=11*a;cx.beginPath();cx.arc(0,10,40,-2.4+p*1.4,-.7+p*1.4);cx.stroke();cx.strokeStyle='#fff';cx.lineWidth=4*a;cx.stroke()}
 else if(vs=='whip'){cx.strokeStyle=e.cc;cx.lineWidth=9*a;cx.beginPath();cx.moveTo(-50,25);cx.quadraticCurveTo(-5,-55+p*50,50,25-p*10);cx.stroke();cx.strokeStyle='#fff';cx.lineWidth=3*a;cx.stroke()}
 else if(vs=='mark'){const q=Math.min(1,p*2);cx.globalAlpha=.9*(1-p*.4);cx.fillStyle='rgba(0,0,0,.28)';cx.beginPath();cx.ellipse(0,0,10+q*34,6+q*20,0,0,7);cx.fill();cx.strokeStyle=e.cc;cx.lineWidth=2.5;cx.beginPath();cx.ellipse(0,0,34*(1.2-q*.2),20*(1.2-q*.2),0,0,7);cx.stroke();cx.beginPath();cx.moveTo(-44,0);cx.lineTo(44,0);cx.moveTo(0,-26);cx.lineTo(0,26);cx.stroke()}
 else if(vs=='crack'){for(const r of e.cr){const L=r.l*Math.min(1,p*5+.15);cx.beginPath();cx.moveTo(0,0);for(let k=1;k<=4;k++)cx.lineTo(Math.cos(r.a)*L*k/4+r.j[k%3],Math.sin(r.a)*L*k/4*.6+r.j[(k+1)%3]);cx.strokeStyle='#1c1917';cx.lineWidth=5;cx.stroke();cx.strokeStyle=e.cc;cx.lineWidth=2;cx.stroke()}}
 else{const r=(vs=='punch'?46:32)*(.4+p);cx.fillStyle=e.cc;spk(r,8);cx.fillStyle='#fff';spk(r*.55,8)}}
function drawProj(e){const t=e.t,rot=e.ph;cx.save();cx.translate(e.x,e.y);cx.globalCompositeOperation='lighter';
 const orb=(r,c1,c2)=>{const g=cx.createRadialGradient(0,0,1,0,0,r);g.addColorStop(0,'#fff');g.addColorStop(.4,c1);g.addColorStop(1,c2);cx.fillStyle=g;cx.beginPath();cx.arc(0,0,r,0,7);cx.fill()},so=()=>{cx.globalCompositeOperation='source-over'},poly=(r,f,s)=>{cx.rotate(rot);cx.beginPath();for(let i=0;i<6;i++){const q=r*[1,.75,1.1,.8,1,.7][i];cx.lineTo(Math.cos(i*1.047)*q,Math.sin(i*1.047)*q)}cx.closePath();cx.fillStyle=f;cx.fill();cx.strokeStyle=s;cx.lineWidth=2;cx.stroke()},dia=(r,f,s)=>{cx.rotate(rot*.6);cx.beginPath();cx.moveTo(0,-r*1.6);cx.lineTo(r*.7,0);cx.lineTo(0,r*1.6);cx.lineTo(-r*.7,0);cx.closePath();cx.fillStyle=f;cx.fill();cx.strokeStyle=s;cx.lineWidth=1.5;cx.stroke()};
 if(t=='fire')orb(14,'#fb923c','rgba(220,38,38,0)');
 else if(t=='water'){so();cx.fillStyle='#38bdf8';cx.strokeStyle='#fff';cx.lineWidth=1.5;cx.beginPath();cx.arc(0,0,8,0,7);cx.fill();cx.stroke();cx.fillStyle='#fff';cx.beginPath();cx.arc(-3,-3,2.5,0,7);cx.fill()}
 else if(t=='leaf'){so();cx.rotate(rot);cx.fillStyle='#22c55e';cx.beginPath();cx.ellipse(0,0,10,4.5,0,0,7);cx.fill();cx.strokeStyle='#bbf7d0';cx.lineWidth=1;cx.beginPath();cx.moveTo(-9,0);cx.lineTo(9,0);cx.stroke()}
 else if(t=='ice'||t=='steel'){so();dia(8,t=='ice'?'#a5f3fc':'#cbd5e1',t=='ice'?'#fff':'#475569')}
 else if(t=='psychic'){orb(13,'#f472b6','rgba(168,85,247,0)');cx.strokeStyle='#fbcfe8';cx.lineWidth=2;cx.rotate(rot);for(let i=0;i<2;i++){cx.beginPath();cx.ellipse(0,0,19,7,0,0,7);cx.stroke();cx.rotate(1.5)}}
 else if(t=='ghost'){so();const g=cx.createRadialGradient(0,0,1,0,0,14);g.addColorStop(0,'#1e1b4b');g.addColorStop(.7,'#4c1d95');g.addColorStop(1,'rgba(167,139,250,0)');cx.fillStyle=g;cx.beginPath();cx.arc(0,0,14,0,7);cx.fill()}
 else if(t=='dark'){so();cx.fillStyle='#020617';cx.strokeStyle='#ef4444';cx.lineWidth=2;cx.beginPath();cx.arc(0,0,10,0,7);cx.fill();cx.stroke()}
 else if(t=='poison'){so();cx.fillStyle='rgba(168,85,247,.6)';cx.strokeStyle='#84cc16';cx.lineWidth=2;cx.beginPath();cx.arc(0,0,9+Math.sin(rot*2)*1.5,0,7);cx.fill();cx.stroke();cx.fillStyle='#fff';cx.beginPath();cx.arc(-3,-3,2,0,7);cx.fill()}
 else if(t=='ground'||t=='rock'){so();poly(t=='rock'?12:9,t=='rock'?'#a8a29e':'#a16207',t=='rock'?'#57534e':'#78350f')}
 else if(t=='bug'){so();for(let i=0;i<6;i++){const a=rot*2+i*1.05,r=6+Math.sin(rot*3+i)*4;cx.fillStyle=i%2?'#a3e635':'#365314';cx.beginPath();cx.arc(Math.cos(a)*r,Math.sin(a)*r,2.4,0,7);cx.fill()}}
 else if(t=='flying'){so();cx.rotate(e.a);cx.strokeStyle='#fff';cx.lineWidth=4;cx.beginPath();cx.arc(-6,0,16,-1.1,1.1);cx.stroke();cx.strokeStyle='#93c5fd';cx.lineWidth=2;cx.beginPath();cx.arc(-10,0,16,-1.1,1.1);cx.stroke()}
 else if(t=='fairy'){orb(14,'#f9a8d4','rgba(244,114,182,0)');so();cx.rotate(rot);cx.fillStyle='#f9a8d4';spk(14);cx.fillStyle='#fff';spk(7)}
 else if(t=='fighting')orb(12,'#f97316','rgba(239,68,68,0)');
 else if(t=='dragon')orb(14,'#a78bfa','rgba(76,29,149,0)');
 else orb(12,'#e5e7eb','rgba(255,255,255,0)');
 cx.restore()}
function drawApi(m){const o=TY[m.t];if(Math.abs(Math.cos(m.a))>.25)m.fl=Math.cos(m.a)<0;const up=Math.sin(m.a)<-.6,im=up&&o.bi&&o.bi.naturalWidth?o.bi:o.fi,b=Math.abs(Math.sin(m.ph*2))*3,h=86,wl=Math.max(m.lw>0?1-m.lw/.22:0,m.sqz||0),sx0=m.sx==null?1:m.sx;
 m.sx=sx0+(((m.fl&&!up)?-1:1)-sx0)*.3;
 if(m.cast>0){const u=1-m.cast/.3;cx.save();cx.globalCompositeOperation='lighter';cx.globalAlpha=.55;cx.fillStyle=m.castc||'#fff';cx.beginPath();cx.arc(0,-30,12+u*26,0,7);cx.fill();cx.restore()}
 cx.imageSmoothingEnabled=false;if(m.flash>0)cx.filter='brightness(4)';
 if(im&&im.naturalWidth){cx.save();cx.translate(0,16-(m.z||0));cx.rotate(Math.sin(m.ph*2)*.06+(m.tilt||0));cx.scale(m.sx*(1+.16*wl+(m.lunge>0?.18:0)+(Math.abs(m.tilt||0)>.3?.15:0)),1-.2*wl-(m.lunge>0?.1:0)-(Math.abs(m.tilt||0)>.3?.12:0));cx.drawImage(im,-h/2,-h+10-b,h,h);cx.restore()}else{cx.fillStyle=o.c[0];cx.beginPath();cx.arc(0,-12,18,0,7);cx.fill()}
 cx.filter='none';cx.imageSmoothingEnabled=true}
function drawM(m){cx.save();cx.translate(m.x,m.y);if(m.dead){cx.globalAlpha=Math.max(0,m.fade/1.2);cx.scale(m.fade/1.2+.3,m.fade/1.2+.3)}
 const zs=Math.max(.25,1-(m.z||0)/450);cx.fillStyle='rgba(0,0,0,'+.25*zs+')';cx.beginPath();cx.ellipse(3,7,20*zs,14*zs,0,0,7);cx.fill();
 if(m.enter>0){const k=Math.max(.05,1-m.enter/.7);cx.scale(k,k)}
 cx.strokeStyle=m.side?"#ef4444":"#3b82f6";cx.lineWidth=3;cx.beginPath();cx.ellipse(0,5,24,17,0,0,7);cx.stroke();
 drawApi(m);cx.restore()}
function drawFx(e){const t=e.tg;cx.save();
 if(e.k=='u')CUSTOM[e.cu].edraw(e);
 else if(e.k=='v')vdraw(e);
 else if(e.k=='w'&&e.px!=null){cx.globalCompositeOperation='lighter';for(let i=-6;i<=6;i++){const q=i*8,cu=Math.abs(i)*3.5,x=e.px+Math.cos(e.ang+PI/2)*q-Math.cos(e.ang)*cu,y=e.py+Math.sin(e.ang+PI/2)*q-Math.sin(e.ang)*cu;cx.fillStyle=i%2?'rgba(186,230,253,.8)':'rgba(56,189,248,.8)';cx.beginPath();cx.arc(x,y,16-Math.abs(i),0,7);cx.fill()}}
 else if(e.k=='s'&&!t.dead&&!e.o.dead){cx.globalCompositeOperation='lighter';cx.lineCap='round';const w=1+Math.sin(T*50)*.15,A=Math.min(1,e.life*5);for(const [lw,c,al] of [[34,e.cc,.35],[18,e.cc,.85],[7,'#fff',1]]){cx.globalAlpha=A*al;cx.strokeStyle=c;cx.lineWidth=lw*w;cx.beginPath();cx.moveTo(e.o.x,e.o.y);cx.lineTo(t.x,t.y);cx.stroke()}cx.globalAlpha=A*.9;cx.fillStyle=e.cc;cx.beginPath();cx.arc(e.o.x,e.o.y,17*w,0,7);cx.fill()}
 else if(e.k=='m'){const u=1-e.life/.6,x=e.lx+240*(1-u),y=e.ly-380*(1-u);cx.fillStyle='rgba(0,0,0,'+(.15+u*.25)+')';cx.beginPath();cx.ellipse(e.lx,e.ly,10+u*40,6+u*24,0,0,7);cx.fill();cx.strokeStyle='rgba(167,139,250,'+u*.8+')';cx.lineWidth=2;cx.stroke();
  cx.globalCompositeOperation='lighter';const tg=cx.createLinearGradient(x,y,x+60,y-95);tg.addColorStop(0,'rgba(251,146,60,.9)');tg.addColorStop(1,'rgba(251,146,60,0)');cx.strokeStyle=tg;cx.lineWidth=16;cx.lineCap='round';cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+60,y-95);cx.stroke();
  const g=cx.createRadialGradient(x,y,1,x,y,18);g.addColorStop(0,'#fff');g.addColorStop(.4,'#fb923c');g.addColorStop(1,'rgba(124,58,237,0)');cx.fillStyle=g;cx.beginPath();cx.arc(x,y,18,0,7);cx.fill()}
 else if(e.k=='c'&&e.cx!=null){const p=1-e.life/.35;for(let i=0;i<3;i++){const q=Math.min(1,Math.max(0,p*2.2-i*.35));if(q<=0)continue;const x0=e.cx-35+i*20,y0=e.cy-45;cx.globalAlpha=1-p*.6;cx.strokeStyle=i==1?'#fff':'#c4b5fd';cx.lineWidth=7-i;cx.lineCap='round';cx.shadowColor='#7c3aed';cx.shadowBlur=14;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(x0+30*q,y0+90*q);cx.stroke()}}
 cx.restore()}
function draw(){const sx=shk>0?R(-shk,shk):0,sy=shk>0?R(-shk,shk):0;cx.setTransform(sc,0,0,sc,sx*sc,sy*sc);if(cz>0){cx.translate(W/2,H/2);cx.scale(1+cz,1+cz);cx.translate(-W/2,-H/2)}cx.fillStyle='#4aa83c';cx.fillRect(0,0,W,H);if(BG.complete&&BG.naturalWidth)cx.drawImage(BG,0,0,W,H);
 for(const q of scars){cx.globalAlpha=Math.min(.5,q.l/6);cx.fillStyle='#1c1917';cx.beginPath();cx.ellipse(q.x,q.y,24,14,0,0,7);cx.fill()}cx.globalAlpha=1;if(dim>0){cx.globalAlpha=Math.min(.5,dim);cx.fillStyle='#020617';cx.fillRect(-30,-30,W+60,H+60);cx.globalAlpha=1}const L=[...mons].sort((a,b)=>a.y-b.y);L.forEach(drawM);
 for(const e of ents){if(e.delay>0)continue;
  if(e.k=='b'&&e.pts){cx.save();cx.globalAlpha=Math.min(1,e.life*6);cx.lineJoin='round';cx.shadowColor='#facc15';cx.shadowBlur=14;for(const [w,c] of [[7,'#fde047'],[2.5,'#fff']]){cx.strokeStyle=c;cx.lineWidth=w;cx.beginPath();e.pts.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.stroke()}cx.restore();continue}
  if(e.k=='b')continue;if(e.k!='p'){drawFx(e);continue}
  drawProj(e)}
 for(const r of rg){const u=1-r.l/r.m;cx.globalAlpha=1-u;cx.strokeStyle=r.c;cx.lineWidth=r.w*(1-u)+1;cx.globalCompositeOperation='lighter';cx.beginPath();cx.arc(r.x,r.y,r.r1*Math.sqrt(u),0,7);cx.stroke()}cx.globalCompositeOperation='source-over';for(const p of ps){const u=Math.max(0,p.l/p.m),z=p.s*Math.max(.3,u);cx.globalAlpha=u;cx.globalCompositeOperation=p.g?'lighter':'source-over';cx.fillStyle=cx.strokeStyle=p.c;cx.save();cx.translate(p.x,p.y);if(p.r)cx.rotate(p.r);
 if(p.sh=='d'){cx.beginPath();cx.moveTo(0,-z*1.7);cx.lineTo(z,0);cx.lineTo(0,z*1.7);cx.lineTo(-z,0);cx.fill()}
 else if(p.sh=='s')spk(z*1.8);
 else if(p.sh=='k'){cx.lineWidth=2;cx.beginPath();cx.moveTo(-z*2,0);cx.lineTo(z*2,0);cx.stroke()}
 else if(p.sh=='l'){cx.beginPath();cx.ellipse(0,0,z*1.6,z*.7,0,0,7);cx.fill()}
 else if(p.sh=='r'){cx.beginPath();for(let i=0;i<5;i++){const a=i*1.2566,q=z*(i%2?.8:1.2);cx.lineTo(Math.cos(a)*q,Math.sin(a)*q)}cx.fill()}
 else if(p.sh=='o'){cx.lineWidth=1.5;cx.beginPath();cx.arc(0,0,z*1.2,0,7);cx.stroke()}
 else if(p.sh=='f'){cx.beginPath();cx.ellipse(0,0,z*2.4,z*.85,0,0,7);cx.fill();cx.strokeStyle='rgba(71,85,105,.85)';cx.lineWidth=1;cx.beginPath();cx.moveTo(-z*2.4,0);cx.lineTo(z*2.4,0);cx.stroke()}
 else{cx.beginPath();cx.arc(0,0,z,0,7);cx.fill()}
 cx.restore()}
 cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
 for(const m of mons){if(m.dead)continue;const y=m.y-34-(m.z||0);cx.fillStyle='rgba(0,0,0,.55)';cx.fillRect(m.x-21,y,42,6);const q=Math.max(0,m.hp/m.max);cx.fillStyle=q<.25?'#ef4444':q<.5?'#eab308':'#22c55e';cx.fillRect(m.x-20,y+1,40*q,4);
  cx.font='bold 10px system-ui';cx.textAlign='center';cx.lineWidth=3;cx.strokeStyle='rgba(0,0,0,.7)';
  if(m.say>0){cx.font='bold 12px system-ui';cx.strokeText('¡'+m.sayT+'!',m.x,y-17);cx.fillStyle='#fde047';cx.fillText('¡'+m.sayT+'!',m.x,y-17)}}
 for(const t of txt){cx.globalAlpha=Math.min(1,t.l*2);cx.font=`bold ${t.sm?11:16}px system-ui`;cx.textAlign='center';cx.lineWidth=3;cx.strokeStyle='#000';cx.strokeText(t.s,t.x,t.y);cx.fillStyle=t.c;cx.fillText(t.s,t.x,t.y)}cx.globalAlpha=1;cx.setTransform(sc,0,0,sc,0,0);if(sfl>0){cx.globalAlpha=sfl;cx.fillStyle=sfc;cx.fillRect(0,0,W,H);cx.globalAlpha=1}if(bn){const k=1.4-.4*Math.min(1,(1.5-bn.l)*6);cx.save();cx.globalAlpha=Math.min(1,bn.l*2);cx.translate(W/2,58);cx.scale(k,k);cx.font='900 26px system-ui';cx.textAlign='center';cx.lineWidth=6;cx.strokeStyle='#000';cx.strokeText(bn.s,0,0);cx.fillStyle=bn.c;cx.shadowColor=bn.c;cx.shadowBlur=16;cx.fillText(bn.s,0,0);cx.restore()}}
function rs(){const d=window.devicePixelRatio||1,w=cv.clientWidth;cv.width=w*d;cv.height=w*d*H/W;sc=cv.width/W}
