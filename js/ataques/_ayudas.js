// Registro de ataques con animación propia y ayudas compartidas.
// Cada ataque va en su propio archivo de esta carpeta: CUSTOM['id-del-ataque']={...}
const CUSTOM={};
function hpos(e){const o=e.o,t=e.tg,tx=t.x,ty=t.y-34,dx0=tx-o.x,dy0=ty-(o.y-34),l0=Math.hypot(dx0,dy0)||1,ox=o.x+dx0/l0*30,oy=o.y-34+dy0/l0*14,dx=tx-ox,dy=ty-oy,L=Math.hypot(dx,dy)||1;return L<30?null:{Wm:Math.max(22,Math.min(56,L*.14)),Ox:ox,Oy:oy,Tx:tx,Ty:ty,ux:dx/L,uy:dy/L,nx:-dy/L,ny:dx/L,L}}
function feathers(x,y,n,v){for(let i=0;i<n&&ps.length<950;i++){const a=R(0,6.28),q=R(.3,1)*v;ps.push({x,y,vx:Math.cos(a)*q,vy:Math.sin(a)*q-20,gy:50,sw:220,l:R(.8,1.4),m:1.4,c:['#fff','#e2e8f0','#bfdbfe'][i%3],s:R(3.5,6),sh:'f',r:R(0,6.28),vr:R(-5,5)})}}
function wind(x,y){if(ps.length<950)ps.push({x:x+R(-18,18),y:y+R(10,50),vx:0,vy:R(120,220),l:.3,m:.3,c:'#e0f2fe',s:5,sh:'k',r:1.5708,vr:0})}
function scr(m,dt){const s=m.sc,C=CUSTOM[s.id];s.t+=dt;if(C.run(m,dt,s)){m.sc=null;m.z=0;m.tilt=0;m.sqz=0}}
