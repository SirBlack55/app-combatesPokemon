// MEGAEVOLUCIÓN y REGRESIÓN PRIMIGENIA. Va DESPUÉS de formas.js (usa cambiaForma) y antes de los archivos de ui.
//  · Megapiedras como objetos equipables (no se pueden robar ni cambiar si las lleva su Pokémon). Mega Rayquaza: sin piedra, con Ascenso Draco.
//  · Una megaevolución por equipo y combate. Se queda megaevolucionado aunque se retire y vuelva a entrar.
//  · Al megaevolucionar el combate SE PARA y se ve la animación (oscurece, haz y cintas de colores, capullo de luz que se agrieta, destello
//    y aparece la forma Mega con su nueva habilidad). La Regresión Primigenia (Esfera Roja/Azul) es automática al entrar, con su propia animación.
//  · Manual: botón MEGA sobre el campo o tecla M. La IA (y tu equipo en automático) megaevoluciona nada más entrar.
const MEGA_CFG={dur:3.6,cambio:2.3,primal:2.4,iaEspera:.6};
// piedra: [especie, forma de la PokéAPI, nombre en español]
const MEGA={
 'venusaurite':[3,'venusaur-mega','Venusaurita'],'charizardite-x':[6,'charizard-mega-x','Charizardita X'],'charizardite-y':[6,'charizard-mega-y','Charizardita Y'],
 'blastoisinite':[9,'blastoise-mega','Blastoisita'],'beedrillite':[15,'beedrill-mega','Beedrillita'],'pidgeotite':[18,'pidgeot-mega','Pidgeotita'],
 'alakazite':[65,'alakazam-mega','Alakazamita'],'slowbronite':[80,'slowbro-mega','Slowbronita'],'gengarite':[94,'gengar-mega','Gengarita'],
 'kangaskhanite':[115,'kangaskhan-mega','Kangaskhanita'],'pinsirite':[127,'pinsir-mega','Pinsirita'],'gyaradosite':[130,'gyarados-mega','Gyaradosita'],
 'aerodactylite':[142,'aerodactyl-mega','Aerodactylita'],'mewtwonite-x':[150,'mewtwo-mega-x','Mewtwoita X'],'mewtwonite-y':[150,'mewtwo-mega-y','Mewtwoita Y'],
 'ampharosite':[181,'ampharos-mega','Ampharosita'],'steelixite':[208,'steelix-mega','Steelixita'],'scizorite':[212,'scizor-mega','Scizorita'],
 'heracronite':[214,'heracross-mega','Heracrossita'],'houndoominite':[229,'houndoom-mega','Houndoomita'],'tyranitarite':[248,'tyranitar-mega','Tyranitarita'],
 'sceptilite':[254,'sceptile-mega','Sceptilita'],'blazikenite':[257,'blaziken-mega','Blazikenita'],'swampertite':[260,'swampert-mega','Swampertita'],
 'gardevoirite':[282,'gardevoir-mega','Gardevoirita'],'sablenite':[302,'sableye-mega','Sableynita'],'mawilite':[303,'mawile-mega','Mawilita'],
 'aggronite':[306,'aggron-mega','Aggronita'],'medichamite':[308,'medicham-mega','Medichamita'],'manectite':[310,'manectric-mega','Manectricita'],
 'sharpedonite':[319,'sharpedo-mega','Sharpedonita'],'cameruptite':[323,'camerupt-mega','Cameruptita'],'altarianite':[334,'altaria-mega','Altarianita'],
 'banettite':[354,'banette-mega','Banettita'],'absolite':[359,'absol-mega','Absolita'],'glalitite':[362,'glalie-mega','Glalita'],
 'salamencite':[373,'salamence-mega','Salamencita'],'metagrossite':[376,'metagross-mega','Metagrossita'],'latiasite':[380,'latias-mega','Latiasita'],
 'latiosite':[381,'latios-mega','Latiosita'],'lopunnite':[428,'lopunny-mega','Lopunnita'],'garchompite':[445,'garchomp-mega','Garchompita'],
 'lucarionite':[448,'lucario-mega','Lucarionita'],'abomasite':[460,'abomasnow-mega','Abomasnowita'],'galladite':[475,'gallade-mega','Galladita'],
 'audinite':[531,'audino-mega','Audinita'],'diancite':[719,'diancie-mega','Diancita'],
};
// Megas nuevas encontradas con la herramienta 💎 (megas-datos.js, opcional: va antes de este archivo)
if(typeof MEGA_EXTRA!=='undefined')for(const[k,v]of Object.entries(MEGA_EXTRA))if(!MEGA[k])MEGA[k]=v;
const PRIMAL={'red-orb':[383,'groudon-primal','Esfera Roja','#ef4444'],'blue-orb':[382,'kyogre-primal','Esfera Azul','#3b82f6']};
for(const[k,[id,f,n]]of Object.entries(MEGA))OBJ_EQ[k]={n,i:'💎',g:'Megapiedra',d:`Permite megaevolucionar a ${f.replace(/-mega.*/,'').replace(/^./,c=>c.toUpperCase())} una vez por combate.`,objFijo(m){return especieDe(m)===id}};
for(const[k,[id,f,n]]of Object.entries(PRIMAL))OBJ_EQ[k]={n,i:id===383?'🔴':'🔵',g:'Megapiedra',d:`${id===383?'Groudon':'Kyogre'} hace la Regresión Primigenia al entrar en combate.`,objFijo(m){return especieDe(m)===id}};

const megaUsada=[0,0];let MEGA_ANIM=null,campoMega=null;
const syncMega=()=>{if(campo!==campoMega){campoMega=campo;megaUsada[0]=megaUsada[1]=0}};   // cada combate empieza sin Mega usada
// Variantes que comparten megapiedra: se elige por la forma del Pokémon (Magearna Color Original, Tatsugiri) o por su género (Meowstic)
const MEGA_VARIANTES={801:['magearna-original-mega'],678:['meowstic-male-mega'],978:['tatsugiri-droopy-mega','tatsugiri-stretchy-mega']};
function varianteMega(m,id,f){const L=MEGA_VARIANTES[id];if(!L)return f;const nb=nomB(m);
 for(const v of L){const tk=v.split('-').slice(1,-1).join('-');
  if(tk==='male'||tk==='female'){const g=/-female/.test(nb)?'F':m.genero;if(g&&g!=='N'&&(g==='M')===(tk==='male'))return v;continue}
  if(nb&&nb.includes(tk))return v}
 return f}
function megaDe(m){if(!m)return null;const id=especieDe(m),k=m.obj,S=k&&MEGA[k];
 if(S&&S[0]===id)return varianteMega(m,id,S[1]);
 if(id===384&&m.mv&&m.mv.some(v=>v.key==='dragon-ascent'))return'rayquaza-mega';
 return null}
function puedeMega(m){syncMega();return!!(m&&!m.dead&&!m.lab&&!(m.enter>0)&&!m.megaYa&&!megaUsada[m.side]&&!over&&!MEGA_ANIM&&!m.sc&&!(m.lunge>0)&&megaDe(m))}
function megaEvoluciona(m){if(!puedeMega(m))return false;const f=megaDe(m);
 megaUsada[m.side]=1;m.megaYa=1;if(m.u)m.u.mega=f;cargaForma(f);cargaForma(idPoke(m));
 MEGA_ANIM={m,f,t:0,dur:MEGA_CFG.dur,cambio:MEGA_CFG.cambio,hecho:false,tipo:'mega',piedra:(MEGA[m.obj]||[0,0,'Megapiedra'])[2],grietas:grietas(),pt:[]};
 log(`${TY[m.t].n} megaevoluciona`);return true}
function regresion(m){const P=PRIMAL[m.obj];if(!P||especieDe(m)!==P[0]||m.megaYa)return false;
 m.megaYa=1;if(m.u)m.u.mega=P[1];cargaForma(P[1]);cargaForma(idPoke(m));
 MEGA_ANIM={m,f:P[1],t:0,dur:MEGA_CFG.dur-.3,cambio:MEGA_CFG.primal,hecho:false,tipo:'primal',piedra:P[2],col:P[3],grietas:grietas(),pt:[]};return true}
const grietas=()=>Array.from({length:9},(_,i)=>{const a=i/9*PI*2+RS(-.2,.2),pts=[[0,0]];let r=0;while(r<130){r+=R(14,26);pts.push([Math.cos(a+RS(-.25,.25))*r,Math.sin(a+RS(-.25,.25))*r*.9])}return pts});
// Aplica la forma Mega (y su habilidad) al luchador
function aplicaMega(m,f,silencio){cambiaForma(m,f,{silencio:1});m.megaF=f;ponHabMega(m);if(!silencio)burst(m.x,m.y,'#fff',30,240,true)}
function ponHabMega(m){const F=FORMA_OK[m.megaF];if(!F||!m.megaF||m.habMega)return;
 if(F.hab&&HAB[F.hab]&&m.hab!==F.hab){m.hab=F.hab;m.hkE=0;txt.push({x:m.x,y:m.y-74,s:HAB[F.hab].n,c:'#e9d5ff',l:1.6,sm:1})}m.habMega=1}

// ---- La animación para el combate: mientras dura, step no avanza ----
{const s0=step;step=function(dt){if(MEGA_ANIM){animaMega(dt);return}s0(dt)}}
function animaMega(dt){const A=MEGA_ANIM,m=A.m;A.t+=dt;
 if(!A.hecho&&A.t>=A.cambio){A.hecho=true;aplicaMega(m,A.f,true)}
 if(A.t<A.cambio&&A.t>.5&&A.pt.length<160)for(let i=0;i<3;i++){const a=R(0,7),r=R(150,260);A.pt.push({x:Math.cos(a)*r,y:Math.sin(a)*r*.7,l:.7,c:ARCO[Math.floor(R(0,7))%7]})}
 if(A.hecho&&A.t-A.cambio<.1)for(let i=0;i<40;i++){const a=R(0,7),v=R(200,520);A.pt.push({x:0,y:0,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:R(.5,1),c:i%3?'#fff':ARCO[i%7],s:1})}
 for(const p of A.pt){p.l-=dt;if(p.s){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.95;p.vy*=.95}else{p.x*=1-dt*3.2;p.y*=1-dt*3.2}}
 A.pt=A.pt.filter(p=>p.l>0);
 if(A.t>=A.dur){MEGA_ANIM=null;if(!m.megaF)aplicaMega(m,A.f,true);ui()}}
const ARCO=['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
{const d0=draw;draw=function(){d0();if(MEGA_ANIM)dibujaMega()}}
function dibujaMega(){const CY=-90,A=MEGA_ANIM,m=A.m,t=A.t,X0=W/2,Y0=H/2+16,pr=A.tipo==='primal';
 const fin=t>A.dur-.45?Math.max(0,(A.dur-t)/.45):1;
 cx.save();cx.setTransform(sc,0,0,sc,0,0);cx.imageSmoothingEnabled=false;
 // fondo oscuro y franjas de cine
 cx.globalAlpha=Math.min(.85,t/.35*.85)*fin;cx.fillStyle=pr?'#0b0505':'#030712';cx.fillRect(0,0,W,H);
 const bh=Math.min(1,t/.3)*44*fin;cx.globalAlpha=1;cx.fillStyle='#000';cx.fillRect(0,0,W,bh);cx.fillRect(0,H-bh,W,bh);
 const sh=t>1.6&&t<A.cambio?(t-1.6)*9:0,ox=sh?R(-sh,sh):0,oy=sh?R(-sh,sh):0;
 cx.translate(X0+ox,Y0+oy);
 cx.globalCompositeOperation='lighter';
 // haz de la piedra (desde arriba)
 if(t>.35&&t<A.cambio){const a=Math.min(1,(t-.35)/.3)*(t>A.cambio-.3?(A.cambio-t)/.3:1);
  for(let i=0;i<7;i++){cx.globalAlpha=.55*a;cx.strokeStyle=pr?A.col:ARCO[i];cx.lineWidth=5;cx.beginPath();cx.moveTo(-X0+40+i*5,-Y0);cx.lineTo(i*3-9,CY);cx.stroke()}
  cx.globalAlpha=a;cx.strokeStyle='#fff';cx.lineWidth=3;cx.beginPath();cx.moveTo(-X0+55,-Y0);cx.lineTo(0,CY);cx.stroke()}
 // cintas de colores en espiral
 if(t>.5&&t<A.cambio+.1){const u=Math.min(1,(t-.5)/1.7);
  for(let i=0;i<7;i++){const c=pr?(i%2?A.col:'#fde68a'):ARCO[i];for(let j=0;j<14;j++){const a=t*4.5+i*PI*2/7-j*.12,r=(170*(1-u)+55)*(1+j*.025);
   cx.globalAlpha=(1-j/14)*.8;cx.fillStyle=c;cx.beginPath();cx.arc(Math.cos(a)*r,Math.sin(a)*r*.62+CY,6-j*.3,0,7);cx.fill()}}}
 for(const p of A.pt){cx.globalAlpha=Math.min(1,p.l*1.6);cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y+CY,p.s?3.5:2.5,0,7);cx.fill()}
 // emblema detrás de la forma nueva (diseño propio: anillo de colores con tres rombos que giran)
 if(A.hecho){const u=Math.min(1,(t-A.cambio)/.4);cx.globalAlpha=.85*u*fin;
  for(let i=0;i<7;i++){cx.strokeStyle=pr?(i%2?A.col:'#fde68a'):ARCO[i];cx.lineWidth=6;cx.beginPath();cx.arc(0,CY,92+u*8,t*1.5+i*PI*2/7,t*1.5+(i+1)*PI*2/7-.08);cx.stroke()}
  for(let i=0;i<3;i++){const a=-t*2+i*PI*2/3,x=Math.cos(a)*104,y=Math.sin(a)*104+CY;cx.fillStyle='#fff';cx.beginPath();cx.moveTo(x,y-12);cx.lineTo(x+7,y);cx.lineTo(x,y+12);cx.lineTo(x-7,y);cx.fill()}}
 cx.globalCompositeOperation='source-over';
 // el Pokémon en primer plano (se vuelve blanco antes del cambio)
 const o=TY[m.sprT||m.t],im=o&&o.fi;
 if(im&&im.naturalWidth){const bl=t<.6?0:t<A.cambio?Math.min(1,(t-.6)/1):Math.max(0,1-(t-A.cambio)/.5),
   k=A.hecho?2.5*(1+.22*Math.sin(Math.min(1,(t-A.cambio)/.35)*PI)):2.3*Math.min(1,t/.4+.6),h=96*k;
  cx.globalAlpha=Math.min(1,t/.3)*fin;if(bl>0)cx.filter=`brightness(${1+bl*9})`;cx.drawImage(im,-h/2,-h+24,h,h);cx.filter='none'}
 // capullo de luz que se agrieta (encima del Pokémon: lo envuelve)
 if(t>1.5&&t<A.cambio+.05){const u=Math.min(1,(t-1.5)/(A.cambio-1.5)),r=40+u*85,g=cx.createRadialGradient(0,CY,5,0,CY,r);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.6,pr?'rgba(255,200,150,.8)':'rgba(200,230,255,.75)');g.addColorStop(1,'rgba(255,255,255,0)');
  cx.globalCompositeOperation='lighter';cx.globalAlpha=.35+.65*u;cx.fillStyle=g;cx.beginPath();cx.arc(0,CY,r,0,7);cx.fill();
  cx.globalCompositeOperation='source-over';cx.strokeStyle=pr?A.col:'#a5f3fc';cx.lineWidth=2.5;cx.shadowColor='#fff';cx.shadowBlur=10;
  for(const g2 of A.grietas){const n=Math.floor(g2.length*u);if(n<2)continue;cx.beginPath();g2.slice(0,n).forEach((q,i)=>i?cx.lineTo(q[0]*r/130,q[1]*r/130+CY):cx.moveTo(q[0]*r/130,q[1]*r/130+CY));cx.stroke()}
  cx.shadowBlur=0}
 // destello
 if(t>=A.cambio&&t<A.cambio+.35){cx.setTransform(sc,0,0,sc,0,0);cx.globalAlpha=1-(t-A.cambio)/.35;cx.fillStyle='#fff';cx.fillRect(0,0,W,H)}
 // textos
 cx.setTransform(sc,0,0,sc,0,0);cx.globalAlpha=fin;cx.textAlign='center';cx.lineWidth=5;cx.strokeStyle='#000';
 const nom=TY[m.t].n,f=A.f,suf=/-x$/.test(f)?' X':/-y$/.test(f)?' Y':'';
 const s1=pr?`¡La ${A.piedra} reacciona!`:`¡${nom} reacciona a la ${A.piedra}!`,s2=pr?`¡Regresión Primigenia!`:`¡${nom} ha megaevolucionado en Mega ${nom}${suf}!`;
 if(t>.3&&!A.hecho){cx.font='800 20px system-ui';cx.globalAlpha=Math.min(1,(t-.3)*3)*fin;cx.strokeText(s1,W/2,34);cx.fillStyle='#fde68a';cx.fillText(s1,W/2,34)}
 if(A.hecho){const u=Math.min(1,(t-A.cambio)/.3),z=1.3-.3*u;cx.save();cx.translate(W/2,H-16);cx.scale(z,z);cx.globalAlpha=u*fin;cx.font='900 24px system-ui';cx.strokeText(s2,0,0);
  const g=cx.createLinearGradient(-200,0,200,0);(pr?[A.col,'#fde68a',A.col]:ARCO).forEach((c,i,L)=>g.addColorStop(i/(L.length-1),c));cx.fillStyle=g;cx.fillText(s2,0,0);cx.restore()}
 cx.restore();cx.globalAlpha=1;cx.globalCompositeOperation='source-over';cx.filter='none'}

// ---- Entrar: precarga, mantener la Mega al volver, Regresión Primigenia ----
{const s0=spawn;spawn=function(side,u){s0(side,u);const m=mons[mons.length-1];if(!m||m.lab)return;
 const f=megaDe(m)||(PRIMAL[m.obj]&&PRIMAL[m.obj][0]===especieDe(m)&&PRIMAL[m.obj][1]);if(f){cargaForma(f);cargaForma(idPoke(m))}
 if(u.mega){m.megaYa=1;aplicaMega(m,u.mega,true)}}}
// IA (y tu equipo en automático): megaevoluciona nada más entrar · Regresión Primigenia automática
{const u0=upM;upM=function(m,dt){u0(m,dt);
 syncMega();
 if(m.dead||m.lab)return;
 if(m.megaF&&!m.habMega)ponHabMega(m);
 if(MEGA_ANIM||m.enter>0||T-(m.entT||0)<MEGA_CFG.iaEspera)return;
 if(!m.megaYa&&PRIMAL[m.obj]&&PRIMAL[m.obj][0]===especieDe(m)){regresion(m);return}
 if(m.ctrl!=='jugador'&&puedeMega(m))megaEvoluciona(m)}}

// ---- Botón MEGA para el jugador (encima del campo) y tecla M ----
let megaBtn=null;
function montaMegaBtn(){if(megaBtn||!$('.cw'))return;
 const st=document.createElement('style');st.textContent=`#megaBtn{display:none;position:absolute;right:12px;bottom:12px;padding:10px 16px;border-radius:999px;border:3px solid #fff;
  font:900 16px system-ui;color:#fff;letter-spacing:1px;background:conic-gradient(from 0deg,#ef4444,#f97316,#facc15,#22c55e,#3b82f6,#8b5cf6,#ec4899,#ef4444);
  box-shadow:0 0 18px #fff8;text-shadow:0 1px 3px #000;animation:megaLat 1.2s ease-in-out infinite;touch-action:manipulation}
  #megaBtn.on{display:block}@keyframes megaLat{50%{transform:scale(1.08);box-shadow:0 0 30px #fffc}}`;
 document.head.appendChild(st);megaBtn=document.createElement('button');megaBtn.id='megaBtn';megaBtn.textContent='MEGA';megaBtn.title='Megaevolucionar (M)';
 megaBtn.addEventListener('pointerdown',e=>{e.preventDefault();const m=typeof jugador==='function'&&jugador();if(m)megaEvoluciona(m)});
 $('.cw').appendChild(megaBtn);
 addEventListener('keydown',e=>{if(!inGame||e.key.toLowerCase()!=='m'||/INPUT|SELECT|TEXTAREA/.test((e.target||{}).tagName||''))return;const m=typeof jugador==='function'&&jugador();if(m)megaEvoluciona(m)})}
{const v0=mvui;mvui=function(){v0();montaMegaBtn();if(megaBtn){const m=typeof jugador==='function'&&jugador();megaBtn.classList.toggle('on',!!(inGame&&m&&puedeMega(m)))}}}

// ---- Habilidades nuevas de las Megas de Leyendas Z-A ----
Object.assign(HAB,{
 'dragonize':hAte('Piel Dragontina','dragon','Sus ataques Normal pasan a ser Dragón y hacen +20 %.'),
 'eelevate':{n:'Impulso Anguila',g:'Inmunidad',d:'Levita (inmune a Tierra y a las púas del suelo) y al derrotar a un rival sube su mejor estadística.',rompible:1,
  inmune(m,t){return t=='ground'},alDerrotar(o){stg(o,{[mejorStat(o)]:1})}},
 'piercing-drill':{n:'Turbotaladro',g:'Al atacar',d:'Sus ataques de contacto atraviesan Protección, pero hacen solo un 25 % del daño.'},
 'aura-guard':{n:'Aura Protectora',g:'Resistencia',d:'Recibe la mitad de daño de los ataques de contacto.',rompible:1,danoRec(tg,o){return esContacto(mvDe(o))?.5:1}},
 'mega-sol':{n:'Megasolar',g:'Clima y terreno',d:'Sus ataques funcionan como si hiciera sol: Fuego +50 %, Agua −50 % y Rayo Solar sin cargar.',
  danoMul(o,tg,t){if(climaK('sun'))return 1;return t==='fire'?1.5:t==='water'?.5:1}},
 'fire-mane':{n:'Melena Ígnea',g:'Daño',d:'Sus ataques de Fuego hacen un 50 % más de daño.',danoMul(o,tg,t){return t==='fire'?1.5:1}},
 'spicy-spray':{n:'Salpicante',g:'Al recibir golpe',d:'Cuando le golpea un ataque, quema al atacante.',golpeado(m,o,d,prim){if(prim&&!o.dead)aplicarEst(o,'brn',m,true)}},
});
// Turbotaladro: el contacto atraviesa la protección con un 25 % del daño (la protección sigue haciendo su efecto: púas, veneno...)
{const h0=hit;hit=function(tg,dm,t,o,e){
 if(tg&&o&&tg!==o&&tg.prot&&tg.prot.k!=='endure'&&!o.dead&&tieneHab(o,'piercing-drill')&&contactoReal(o)){
  const pr=tg.prot;protegido(tg,o,e);if(o.dead)return;tg.prot=null;if(!e||e.f)txt.push({x:o.x,y:o.y-56,s:'¡Turbotaladro!',c:'#fca5a5',l:1.2,sm:1});
  try{return h0(tg,dm*.25,t,o,e)}finally{if(!tg.dead&&!tg.prot)tg.prot=pr}}
 return h0(tg,dm,t,o,e)}}
// Megasolar: Rayo Solar y similares sin cargar, y Meteorobola de Fuego aunque no haga sol
{const a0=atk;atk=function(m){const p=m.plan;
 if(p&&tieneHab(m,'mega-sol')&&!climaK('sun')){
  if(p.dt&&p.dt.sun&&m.dtDone!==p)m.dtDone=p;
  if(p.fx&&p.fx.k=='wb'&&p.fx.tipo=='clima'&&!(campo.cl&&campo.cl.k))m.plan={...p,t:'fire',p:100,fx:null}}
 return a0(m)}}
