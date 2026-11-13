// Efectos visuales reutilizables: partículas, ondas, explosiones.
function spk(r,n=4){cx.beginPath();for(let i=0;i<n*2;i++){const a=i*PI/n,q=i%2?r*.4:r;cx.lineTo(Math.cos(a)*q,Math.sin(a)*q)}cx.closePath();cx.fill()}
function emit(x,y,t,n,vm,o={}){const Q=IMP[t]||IMP.normal;for(let i=0;i<n&&ps.length<900;i++){const a=R(0,6.283),v=R(.2,1)*vm;ps.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(Q.up?60:0),gy:Q.gy,l:R(.4,.9),m:.9,c:Q.c[i%Q.c.length],s:R(3,7),g:Q.g,sh:Q.sh,r:R(0,6),vr:R(-8,8),...o})}}
function imp(x,y,t,k=1){const Q=IMP[t]||IMP.normal;emit(x,y,t,Math.round(Q.n*k),Q.v*k);ring(x,y,Q.ring,40*k+20);if(Q.rings)for(let i=1;i<=Q.rings;i++)ring(x,y,Q.ring,30+i*22,.4+i*.12,3);shk=Math.max(shk,k*2)}
function vfx(x,y,sty,t){ents.push({k:'v',vs:sty||'hit',x,y,life:.35,m:.35,cc:TCOL[t]||'#fff'})}
function ring(x,y,c,r1,l=.5,w=6){rg.push({x,y,c,r1,l,m:l,w})}
function blast(x,y,c,r,n=40){ring(x,y,c,r);ring(x,y,'#fff',r*.7,.35,4);ring(x,y,c,r*1.3,.7,3);for(let i=0;i<n&&ps.length<700;i++){const a=R(0,7),v=R(60,r*3.2);ps.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:R(.4,1),m:1,c:i%3?c:'#fff',s:R(3,8),g:1})}shk=Math.max(shk,r/12);sfl=Math.max(sfl,Math.min(.45,r/200));sfc=c}
function burst(x,y,col,n,sp=140,glow){for(let i=0;i<n&&ps.length<700;i++){const a=R(0,7),v=R(30,sp);ps.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:R(.3,.7),m:.7,c:col,s:R(2,5),g:glow})}}
function trail(x,y,col,s,glow,sh){if(ps.length<700)ps.push({x,y,vx:R(-15,15),vy:R(-25,-5),l:.35,m:.35,c:col,s,g:glow,sh,r:R(0,6),vr:R(-6,6)})}
