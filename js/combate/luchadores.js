// Creación de luchadores.
function spawn(side,u){const t=u.t,x=side?W-130:130,y=RS(150,310);u.used=true;duelT=0;sd=0;
 mons.push({t,side,u,types:TY[t].types||[t],st:{...TY[t].st},stg:{atk:0,def:0,spa:0,spd:0,spe:0},mv:u.s.map(i=>mkmv(t,TY[t].pool[i])),mc:u.s.map(i=>mkmv(t,TY[t].pool[i]).u?3:0),x,y,a:side?PI:0,hp:MH(t),max:MH(t),kx:0,ky:0,cd:1.4,flash:0,say:0,lunge:0,ph:R(0,9),tx:x,ty:y,wt:0,tg:null,plan:null,dead:false,fade:1.2,enter:.7,dir:side?1:-1,spd:(55+Math.min(TY[t].st.spe,160)*.5)*RS(.95,1.05)});
 burst(x,y,'#fff',22,180,true);log(`${side?'🔴':'🔵'} ¡${tn(t)} entra al combate!`);ui()}
