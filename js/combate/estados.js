// Ataques de estado: curar y cambiar estadísticas.
function stg(x,o){const N={atk:'Ataque',def:'Defensa',spa:'At. Esp.',spd:'Def. Esp.',spe:'Velocidad'};let j=0;for(const k in o){const b=x.stg[k],n=Math.max(-6,Math.min(6,b+o[k])),up=o[k]>0;x.stg[k]=n;txt.push({x:x.x,y:x.y-46-j++*13,s:n!=b?N[k]+(up?' ▲':' ▼').repeat(Math.abs(o[k])):N[k]+(up?' al máximo':' al mínimo'),c:up?'#fde047':'#fca5a5',l:1.5,sm:1});ring(x.x,x.y,up?'#fde047':'#f87171',45,.6)}}
function applySt(m,tg,p){const ef=p.ef||{};
 if(ef.h){const r=Math.min(Math.round(m.max*ef.h),m.max-m.hp);m.hp+=r;txt.push({x:m.x,y:m.y-40,s:'+'+r,c:'#4ade80',l:1.1});ring(m.x,m.y,'#4ade80',50,.7);for(let i=0;i<14;i++)ps.push({x:m.x+R(-22,22),y:m.y+R(-10,16),vx:R(-10,10),vy:R(-90,-30),l:.9,m:.9,c:i%2?'#bbf7d0':'#4ade80',s:R(3,6),g:1})}
 if(ef.s)stg(m,ef.s);if(ef.o&&tg)stg(tg,ef.o)}
