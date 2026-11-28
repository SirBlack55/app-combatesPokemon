// MODO MANUAL (paso 2 del nuevo motor): el jugador controla al Pokémon del equipo 🔵 (lado 0). Vale en todos los modos que usan este combate.
//  · Botón "🎮 Manual" en la barra del combate (se recuerda en el navegador y se puede cambiar en mitad del combate).
//  · PC: WASD / flechas para moverse · 1-4 ataques · C abre el banquillo (y 1-6 elige) · Esc lo cierra.
//  · Móvil: joystick a la izquierda del campo · botones de ataque y de cambio debajo del campo.
//  · Apuntado automático: el ataque va al rival. Si está lejos, el Pokémon se acerca solo (si no lo mueves tú) y ataca al llegar.
//  · Tras un KO eliges quién entra (si no eliges en MANUAL_CFG.eleccion s, elige la IA).
// Va DESPUÉS de laboratorio.js. Usa cambios.js (puedeCambiar, cambiarA, eleccion, libres).
const MANUAL_CFG={vel:.85,eleccion:6,giro:14};
let modoManual=false;try{modoManual=localStorage.getItem('combate-manual')==='1'}catch(e){}
const JUG={x:0,y:0,tec:{},joy:{x:0,y:0},menu:false,koT:null};
const jugador=()=>mons.find(m=>m.side===0&&!m.dead&&m.ctrl==='jugador')||null;
const activo0=()=>mons.find(m=>m.side===0&&!m.dead)||null;
const ctrlDe=(side,u)=>side===0&&modoManual?'jugador':(u&&u.ctrl)||'ia';

// ---- Quién controla a cada uno ----
{const s0=spawn;spawn=function(side,u){s0(side,u);const m=mons[mons.length-1];if(m&&!m.lab)m.ctrl=ctrlDe(side,u);JUG.menu=false;pintaManual()}}
function ponManual(v){modoManual=!!v;try{localStorage.setItem('combate-manual',v?'1':'0')}catch(e){}
 for(const m of mons)if(m.side===0&&!m.lab){m.ctrl=ctrlDe(0,m.u);if(m.ctrl==='ia')m.plan=null}
 JUG.menu=false;pintaManual()}

// ---- Restricciones de uso (Tormento, Otra Vez, Anulación, Mofa, Elegidos...) ----
function puedeUsar(m,i){const v=m.mv[i];if(!v)return'—';
 if(m.mc[i]>0)return'Recargando';
 const V=m.vol||{};
 if(m.pi!=null&&V.torment&&i===m.pi)return'Atormentado';
 if(m.pi!=null&&(V.encore||V.furia)&&i!==m.pi)return'Solo puede repetir';
 if(V.sil&&typeof SONIDO!=='undefined'&&SONIDO.includes(v.key))return'Silenciado';
 if(V.disable&&V.disable.i===i)return'Anulado';
 if(V.sellar&&V.sellar.keys&&V.sellar.keys.includes(v.key))return'Sellado';   // Sellar (ataques-restantes.js)
 if(V.taunt&&v.cat==='sta')return'Provocado';
 if(v.key==='sleep-talk'&&!(m.ail&&m.ail.k==='slp'))return'Solo dormido';
 if(v.fx&&v.fx.k==='ultimo'&&!m.mv.every((x,j)=>j===i||(m.us&&m.us[j])))return'Usa antes los demás';
 if(m.elegI!=null&&m.elegI!==i&&gancho('elegido',m))return'Bloqueado por el objeto';
 return true;
}
function pideAtaque(i){const m=jugador();if(!m)return;const r=puedeUsar(m,i);
 if(r!==true){txt.push({x:m.x,y:m.y-46,s:r,c:'#cbd5e1',l:.9,sm:1});return}
 m.plan=m.mv[i];m.pi=i;
 if(gancho('elegido',m)&&m.elegI==null)m.elegI=i;
}

// ---- Movimiento del jugador (misma base que upM, sin la IA) ----
function dirJugador(){let x=JUG.joy.x,y=JUG.joy.y;const k=JUG.tec;
 if(k.a||k.arrowleft)x-=1;if(k.d||k.arrowright)x+=1;if(k.w||k.arrowup)y-=1;if(k.s||k.arrowdown)y+=1;
 const l=Math.hypot(x,y);return l>.15?{x:x/Math.max(1,l),y:y/Math.max(1,l),l:Math.min(1,l)}:null}
function upJugador(m,dt){const SP=m.spd*mult(m.stg.spe)*estMul(m,'spe')*(m.vol&&(m.vol.trap||m.vol.net||m.vol.octo)?.6:1);
 if(m.dead){m.fade-=dt;return}if(m.enter>0){m.enter-=dt;return}
 m.cd-=dt;m.flash-=dt;m.say-=dt;m.cast-=dt;if(m.cnt&&(m.cnt.l-=dt)<=0)m.cnt=null;tickEst(m,dt);if(m.dead)return;tickGanchos(m,dt);if(m.dead)return;
 for(let i=0;i<m.mc.length;i++)if(m.mc[i]>0)m.mc[i]-=dt;m.x+=m.kx*dt;m.y+=m.ky*dt;const f=Math.pow(.01,dt);m.kx*=f;m.ky*=f;
 if(m.sc){scr(m,dt);return}
 if(m.freeze>0){m.freeze-=dt;if(m.freeze>.35&&Math.random()<.5)m.flash=.06;if(m.tg)m.a=turn(m.a,Math.atan2(m.tg.y-m.y,m.tg.x-m.x),dt*8);return}
 if(m.lw>0){m.lw-=dt;m.a=turn(m.a,m.la,dt*12);if(m.lw<=0)m.lunge=.3;return}
 if(!m.tg||m.tg.dead||m.tg.enter>0)m.tg=mons.find(o=>o.side!==m.side&&!o.dead&&!(o.enter>0))||null;
 if(m.ail&&(m.ail.k=='slp'||m.ail.k=='frz')){if(m.ail.k=='slp'&&m.plan&&m.plan.key==='sleep-talk'&&m.cd<=0&&m.tg)atk(m);else m.plan=null;return}   // dormido: solo Sonámbulo
 const J=dirJugador(),t=m.tg;let vx=0,vy=0,face=null;
 if(m.lunge>0){m.lunge-=dt;trail(m.x,m.y-20,TCOL[m.plan&&m.plan.t]||'#fff',7,1,'c');m.a=m.la;vx=Math.cos(m.la)*560;vy=Math.sin(m.la)*560;
  if(t&&!t.dead&&!m.lhit&&Math.hypot(t.x-m.x,t.y-m.y)<30){m.lhit=true;hit(t,m.plan?m.plan.p:38,m.plan?m.plan.t:'normal',m,null);vfx(t.x,t.y,m.plan&&m.plan.sty,m.plan&&m.plan.t)}
  if(m.lunge<=0)m.plan=null}
 else{
  if(J){const v=SP*MANUAL_CFG.vel*J.l;vx=J.x*v;vy=J.y*v;face=Math.atan2(J.y,J.x)}
  if(t){const dx=t.x-m.x,dy=t.y-m.y,d=Math.hypot(dx,dy),an=Math.atan2(dy,dx),p=m.plan;
   if(p){if(d>p.r*(p.tk?1:.9)){if(!J){vx=Math.cos(an)*SP*1.1;vy=Math.sin(an)*SP*1.1;face=an}}   // fuera de alcance: se acerca solo si no lo mueves
    else if(m.cd<=0){if(p.cat=='sta')atk(m);else{m.a=turn(m.a,an,dt*MANUAL_CFG.giro);face=null;if(Math.abs(((an-m.a+PI*3)%(PI*2))-PI)<.35)atk(m)}}
    else face=an}
   else if(!J)face=an}
 }
 if(face!=null&&m.lunge<=0)m.a=turn(m.a,face,dt*(J?10:5));
 m.x+=vx*dt;m.y+=vy*dt;if(vx||vy)m.ph+=Math.hypot(vx,vy)*dt*.09;
 for(const o of OB){const dx=m.x-o.x,dy=m.y-o.y,d=Math.hypot(dx,dy),r=o.r+16;if(d<r&&d>0){m.x=o.x+dx/d*r;m.y=o.y+dy/d*r}}
 m.x=Math.max(100,Math.min(W-100,m.x));m.y=Math.max(100,Math.min(350,m.y))}
{const u0=upM;upM=function(m,dt){if(m.ctrl==='jugador'&&!m.lab)return upJugador(m,dt);return u0(m,dt)}}

// ---- Tras un KO: el jugador elige quién entra (con tiempo límite) ----
{const s0=siguienteDe;siguienteDe=function(s){
 if(s===0&&modoManual&&!over&&!eleccion[0]){const L=libres(0);
  if(L.length>1){if(JUG.koT==null){JUG.koT=T;JUG.menu=true;pintaManual()}
   if(T-JUG.koT<MANUAL_CFG.eleccion){send[0]=Math.max(send[0],.05);return L[0]}   // mientras elige, no entra nadie
   JUG.koT=null;JUG.menu=false;eleccion[0]=s0(s);pintaManual();return eleccion[0]}}   // se acabó el tiempo: elige la IA
 if(s===0)JUG.koT=null;return s0(s)}}
function eligeBanquillo(u){
 const m=activo0();
 if(m){const r=puedeCambiar(m);if(r!==true){if(m)txt.push({x:m.x,y:m.y-46,s:r,c:'#cbd5e1',l:1,sm:1});return}cambiarA(m,u)}
 else{eleccion[0]=u;JUG.koT=null}
 JUG.menu=false;pintaManual()}

// ---- Interfaz: botón en la barra, joystick, botones y banquillo ----
const esTactil=()=>('ontouchstart' in window)||(window.matchMedia&&matchMedia('(pointer:coarse)').matches);
let manualListo=false;
function montaManual(){if(manualListo||!$('#bar'))return;manualListo=true;
 const st=document.createElement('style');st.textContent=`
 #ctl{display:none;gap:6px;margin-top:6px;grid-template-columns:1fr 1fr 64px;grid-template-rows:auto auto}#game.manual #ctl{display:grid}
 #ctl .ma{border:2px solid var(--t);border-radius:10px;background:#0b1220;color:#e2e8f0;padding:8px 6px;text-align:left;font-size:13px;min-height:48px;position:relative;overflow:hidden;touch-action:manipulation;user-select:none}
 #ctl .ma b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#ctl .ma small{opacity:.7}
 #ctl .ma i{position:absolute;left:0;bottom:0;height:4px;background:var(--t)}#ctl .ma.no{opacity:.45}#ctl .ma.pl{outline:2px solid #fbbf24}
 #ctl .mc{grid-row:1/3;grid-column:3;border-radius:10px;font-size:22px;border:2px solid #64748b;background:#0b1220;color:#e2e8f0}
 #joy{display:none;position:absolute;left:12px;bottom:12px;width:110px;height:110px;border-radius:50%;background:rgba(15,23,42,.35);border:2px solid rgba(255,255,255,.35);touch-action:none}
 #game.manual.tactil #joy{display:block}#joy span{position:absolute;left:35px;top:35px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.75)}
 #banq{display:none;position:absolute;inset:0;background:rgba(0,0,0,.6);border-radius:14px;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#fff;padding:10px}
 #banq.on{display:flex}#banq .bq{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
 #banq button{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:10px;border:2px solid #64748b;background:#0f172a;color:#e2e8f0;font-size:13px}
 #banq img{width:40px;height:40px;image-rendering:pixelated}#banq em{display:block;height:4px;border-radius:2px;background:#22c55e;margin-top:3px}`;
 document.head.appendChild(st);
 const b=document.createElement('button');b.id='man';b.onclick=()=>ponManual(!modoManual);$('#bar').prepend(b);
 const cw=$('.cw');
 const joy=document.createElement('div');joy.id='joy';joy.innerHTML='<span></span>';cw.appendChild(joy);
 const bq=document.createElement('div');bq.id='banq';cw.appendChild(bq);
 const ctl=document.createElement('div');ctl.id='ctl';cw.after(ctl);
 // joystick (táctil o ratón)
 const k=joy.querySelector('span');let pid=null;
 const mueve=e=>{const r=joy.getBoundingClientRect(),cx_=r.left+r.width/2,cy_=r.top+r.height/2,R_=r.width/2;
  let x=(e.clientX-cx_)/R_,y=(e.clientY-cy_)/R_;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}JUG.joy={x,y};k.style.left=35+x*35+'px';k.style.top=35+y*35+'px'};
 const suelta=()=>{pid=null;JUG.joy={x:0,y:0};k.style.left=k.style.top='35px'};
 joy.addEventListener('pointerdown',e=>{pid=e.pointerId;joy.setPointerCapture(pid);mueve(e);e.preventDefault()});
 joy.addEventListener('pointermove',e=>{if(e.pointerId===pid)mueve(e)});
 joy.addEventListener('pointerup',suelta);joy.addEventListener('pointercancel',suelta);
 ctl.addEventListener('pointerdown',e=>{const x=e.target.closest('[data-i],[data-c]');if(!x)return;e.preventDefault();
  if(x.dataset.c!=null){JUG.menu=!JUG.menu;pintaManual()}else pideAtaque(+x.dataset.i)});
 bq.addEventListener('pointerdown',e=>{const x=e.target.closest('[data-u]');if(x){const u=(team[0]||[])[+x.dataset.u];if(u)eligeBanquillo(u)}else if(e.target.dataset.x!=null){JUG.menu=false;pintaManual()}});
 // teclado
 const enCampo=e=>!(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName));
 addEventListener('keydown',e=>{if(!inGame||!modoManual||!enCampo(e))return;const q=e.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(q)){JUG.tec[q]=1;e.preventDefault();return}
  if(JUG.menu){if(q==='escape'||q==='c'){JUG.menu=false;pintaManual();return}const n=+q;if(n>=1){const L=libres(0);if(L[n-1])eligeBanquillo(L[n-1])}return}
  if(q>='1'&&q<='4'){pideAtaque(+q-1);return}
  if(q==='c'){JUG.menu=true;pintaManual()}});
 addEventListener('keyup',e=>{delete JUG.tec[e.key.toLowerCase()]});
 addEventListener('blur',()=>{JUG.tec={}});
 pintaManual();
}
let ultPinta='';
function pintaManual(){if(!manualListo)return;
 const g=$('#game');g.classList.toggle('manual',modoManual&&inGame);g.classList.toggle('tactil',esTactil());
 $('#man').textContent=modoManual?'🎮 Manual':'🤖 Automático';
 const m=jugador(),ctl=$('#ctl');
 // botones de ataque
 let h='';if(m)m.mv.forEach((v,i)=>{const r=Math.max(0,m.mc[i]),ok=puedeUsar(m,i)===true&&m.cd<=0;
  h+=`<button class="ma${ok?'':' no'}${m.plan===v?' pl':''}" data-i="${i}" style="--t:${TC[v.t]}"><b>${esTactil()?'':(i+1)+' · '}${v.n}</b><small>${CI[v.cat]} ${v.p?Math.round(v.p):''}</small><i style="width:${r>0?(1-r/v.cd)*100:100}%"></i></button>`});
 else h='<div style="grid-column:1/3;opacity:.7;padding:8px">Esperando a tu Pokémon…</div>';
 const pc=m?puedeCambiar(m):true;
 h+=`<button class="mc" data-c="1" title="Cambiar (C)" style="opacity:${pc===true||!m?1:.45}">🔄</button>`;
 if(h!==ultPinta){ctl.innerHTML=h;ultPinta=h}
 // banquillo
 const bq=$('#banq');bq.classList.toggle('on',JUG.menu&&modoManual&&inGame);
 if(JUG.menu){const L=libres(0),A=activo0(),motivo=A?puedeCambiar(A):true;
  bq.innerHTML=`<b>${A?'¿Quién entra?':'¡Elige quién entra!'}</b>${motivo!==true?`<small>${motivo}</small>`:''}<div class="bq">${L.map((u,j)=>{const y=TY[u.t],fr=u.vida?Math.max(0,u.vida.hp)/MH(u.t):1;
   return `<button data-u="${team[0].indexOf(u)}"><img src="${y.img}" alt=""><span>${esTactil()?'':(j+1)+' · '}${y.n}${u.vida&&u.vida.ail?' · '+EST[u.vida.ail.k].tag:''}<em style="width:${Math.round(fr*100)}%;background:${fr<.2?'#ef4444':fr<.5?'#eab308':'#22c55e'}"></em></span></button>`}).join('')||'<small>No queda nadie</small>'}</div>${A?'<button data-x="1">Cerrar</button>':''}`}
}
// refresco de la interfaz junto al de los paneles (mvui)
{const v0=mvui;mvui=function(){v0();if(!manualListo)montaManual();pintaManual()}}
