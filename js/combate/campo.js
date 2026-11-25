// Campo de batalla: clima, terreno, salas, deportes y trampas de entrada, además de protecciones, precisión, críticos,
// cambios de Pokémon y pesos de la IA de los ataques de estado nuevos. Se reinicia en cada combate (nuevoCampo).
// Duraciones y fuerzas: constantes de abajo.
const CAMPO_L=15,CLIMA_DOT=.03,TERRENO_CURA=.03;
// El clima se lee y se escribe como campo.cl; mientras algún luchador lo anule (Cielo Despejado, Bucle Aire) se ve como null y no corre su tiempo.
const nuevoCampo=()=>({_cl:null,get cl(){return this._cl&&!(typeof climaAnulado==='function'&&climaAnulado())?this._cl:null},set cl(v){this._cl=v},te:null,sa:null,dep:{},haz:[{},{}],tc:0,gp:[]});   // gp = golpes pendientes de los ataques de varios golpes
var campo=nuevoCampo();
const salaK=k=>!!(campo.sa&&campo.sa.k==k);
const NOM_CAMPO={sun:'☀ Sol',rain:'🌧 Lluvia',sand:'🏜 Tormenta de arena',hail:'❄ Granizo',elec:'⚡ Campo eléctrico',leaf:'🌿 Campo de hierba',mist:'🌫 Campo de niebla',psy:'🔮 Campo psíquico',trick:'🔄 Sala Trampa',wonder:'🔀 Sala Extraña'};
// Color de la esfera de cada protección (proteccion.js)
const PROT_COL={protect:'#38bdf8',endure:'#fbbf24',king:'#e2e8f0',spiky:'#84cc16',bunker:'#c084fc',obstruct:'#f87171',silk:'#f9a8d4',bulwark:'#fb923c'};
const NOM_HAZ={spikes:'Púas',tspikes:'Púas tóxicas',rocks:'Rocas',web:'Red'};

function fallo(m,s='¡Falló!'){txt.push({x:m.x,y:m.y-46,s,c:'#cbd5e1',l:1,sm:1})}
function ponerCampo(tipo,k,m){
 const o=campo[tipo];
 if(o&&o.k==k){fallo(m);return}
 campo[tipo]={k,l:CAMPO_L};
 txt.push({x:m.x,y:m.y-56,s:NOM_CAMPO[k]+'!',c:'#fde047',l:1.5,sm:1});log(`${NOM_CAMPO[k]}`);
}
function ponerDep(k,m){if(campo.dep[k]){fallo(m);return}campo.dep[k]=CAMPO_L;txt.push({x:m.x,y:m.y-56,s:'¡'+(k=='water'?'Chorro de agua':'Chorro de barro')+'!',c:'#bae6fd',l:1.2,sm:1})}
function ponerHaz(m,k){
 if(k=='limpia'){campo.haz=[{},{}];txt.push({x:m.x,y:m.y-56,s:'¡Trampas despejadas!',c:'#bae6fd',l:1.2,sm:1});return}
 const h=campo.haz[1-m.side],tope={spikes:3,tspikes:2,rocks:1,web:1}[k];
 if((h[k]||0)>=tope){fallo(m);return}
 h[k]=(h[k]||0)+1;
 txt.push({x:m.x,y:m.y-56,s:'¡'+NOM_HAZ[k]+' en el campo rival!',c:'#fdba74',l:1.4,sm:1});
}
// Al entrar un Pokémon (luchadores.js, spawn)
function aplicaHaz(m){
 const h=campo.haz[m.side],vuela=m.types.includes('flying')||!!gancho('inmune',m,'ground');
 if(h.spikes&&!vuela)dotDano(m,[0,.125,.1667,.25][h.spikes],'#fdba74');
 if(h.tspikes&&!vuela){if(m.types.includes('poison'))delete h.tspikes;else aplicarEst(m,h.tspikes>1?'tox':'psn',null)}
 if(h.rocks&&!m.dead)dotDano(m,.125*tEff('rock',m.types),'#a8a29e');
 if(h.web&&!vuela&&!m.dead)stg(m,{spe:-1});
}
// Ataques de varios golpes: el primero lo da hit(); los demás se agendan cada .11 s (nHits sortea cuántos)
function nHits([mn,mx]){
 if(mn>=mx)return mn;
 if(mn==2&&mx==5)return pickP([2,3,4,5],[3,3,1,1]);
 return mn+Math.floor(rnd()*(mx-mn+1));
}
function agendaHits(o,tg,dm,t,cat,fx){
 const n=nHits(o.last.hits)-1;
 for(let i=1;i<=n;i++)campo.gp.push({t:.11*i,o,tg,dm:o.last.ramp?dm*(i+1):dm,tt:t,cat,fx,sec:o.last.sec,sty:o.last.sty});
}
function tickCampo(dt){
 const c=campo;
 if(c.gp.length){
  for(const g of c.gp)g.t-=dt;
  const listos=c.gp.filter(g=>g.t<=0);c.gp=c.gp.filter(g=>g.t>0);
  for(const g of listos){if(g.tg.dead||g.o.dead)continue;hit(g.tg,g.dm,g.tt,g.o,{cat:g.cat,f:false,mh:1,fx:g.fx,sec:g.sec});vfx(g.tg.x,g.tg.y-20,g.sty,g.tt)}
 }
 for(const k of['cl','te','sa'])if(c[k]&&(c[k].l-=dt)<=0)c[k]=null;
 for(const k of Object.keys(c.dep))if((c.dep[k]-=dt)<=0)delete c.dep[k];
 c.tc+=dt;
 if(c.tc<1)return;
 c.tc-=1;
 for(const m of mons.slice()){
  if(m.dead||m.enter>0)continue;
  const cl=c.cl&&c.cl.k;
  if(cl=='sand'&&!m.types.some(t=>['rock','ground','steel'].includes(t))&&!gancho('sinClimaDano',m,'sand'))dotDano(m,CLIMA_DOT,'#d6a550');
  else if(cl=='hail'&&!m.types.includes('ice')&&!gancho('sinClimaDano',m,'hail'))dotDano(m,CLIMA_DOT,'#a5f3fc');
  if(!m.dead&&c.te&&c.te.k=='leaf'&&m.hp<m.max){const r=Math.min(Math.round(m.max*TERRENO_CURA),m.max-m.hp);m.hp+=r;txt.push({x:m.x,y:m.y-40,s:'+'+r,c:'#4ade80',l:.7,sm:1})}
 }
}
// Multiplicador de daño por clima, terreno, deportes y pantallas
function campoMul(t,tg,cat){
 let f=1;const c=campo,cl=c.cl&&c.cl.k,te=c.te&&c.te.k;
 if(cl=='sun')f*=t=='fire'?1.5:t=='water'?.5:1;
 if(cl=='rain')f*=t=='water'?1.5:t=='fire'?.5:1;
 if(te=='elec'&&t=='elec')f*=1.3;if(te=='leaf'&&t=='leaf')f*=1.3;if(te=='psy'&&t=='psychic')f*=1.3;if(te=='mist'&&t=='dragon')f*=.5;
 if(c.dep.water&&t=='fire')f*=.33;if(c.dep.mud&&t=='elec')f*=.33;
 const V=tg.vol;if(V&&(V.aveil||(cat=='phy'?V.reflect:V.lscreen)))f*=.6;
 return f;
}
// Precisión efectiva (estados de precisión/evasión, Fijar Blanco, clima)
function accEf(m,tg,p){
 if(m.lock){m.lock=0;return 1e9}
 if(gancho('noFalla',m)||gancho('noFalla',tg))return 1e9;
 const c=campo.cl&&campo.cl.k,tr=p.key=='thunder'||p.key=='hurricane';
 if(c=='rain'&&tr||c=='hail'&&p.key=='blizzard')return 1e9;
 const s=Math.max(-6,Math.min(6,(m.stg.acc||0)-(tg.stg.eva||0)));
 return p.acc*(s>=0?(3+s)/3:3/(3-s))*(c=='sun'&&tr?.7:1)*ganchoMul('accMul',m,tg,p)*ganchoMul('accRec',tg,m,p);
}
function critP(o,tg,e){
 if(tg.vol&&tg.vol.lucky)return 0;
 if(gancho('sinCrit',tg))return 0;   // Armadura Batalla, Caparazón
 if(o.lf&&(!e||e.f)){o.lf=0;return 1}
 const et=((o.last&&o.last.cr)||0)+(o.vol&&o.vol.focus?2:0)+ganchoSum('critEt',o);   // etapas de crítico: 0 → 6,25 % · 1 → 12,5 % · 2 → 50 % · 3 → 100 %
 return[.0625,.125,.5,1][Math.min(3,et)];
}
// Efectividad de un tipo contra un luchador, con Levitación (inmune a Tierra) e Identificado (quita inmunidades de Fantasma/Siniestro)
function efTipo(t,tg){
 const V=tg.vol;let ts=tg.types;
 if(V&&V.ident)ts=ts.filter(x=>!((x=='ghost'&&(t=='normal'||t=='fighting'))||(x=='dark'&&t=='psychic')));
 if(V&&V.levit&&t=='ground')return 0;
 if(gancho('inmune',tg,t))return 0;   // habilidades y objetos (Levitación...)
 return tEff(t,ts);
}
// Un golpe contra alguien que se protege (hit lo llama y se detiene)
function protegido(tg,o,e){
 const cat=(e&&e.cat)||(o.plan&&o.plan.cat)||(o.last&&o.last.cat)||'phy';
 // cada golpe bloqueado se nota: el primero con texto grande, los demás (ataques de varios golpes) con uno pequeño
 if(!e||e.f)txt.push({x:tg.x,y:tg.y-48,s:'¡Se protegió!',c:'#93c5fd',l:1,sm:1});
 else if(T-(tg.pbT||-9)>.2)txt.push({x:tg.x+R(-12,12),y:tg.y-40,s:'Bloqueado',c:'#bfdbfe',l:.5,sm:1});
 const col=PROT_COL[tg.prot.k]||'#93c5fd',a=Math.atan2(o.y-tg.y,o.x-tg.x);
 tg.pbT=T;tg.pbA=a;tg.flash=.05;o.failT=T;   // proteccion.js ilumina la esfera por ese lado
 burst(tg.x+Math.cos(a)*40,tg.y-28+Math.sin(a)*34,col,6,130,true);
 if(o.dead||cat!='phy'||(e&&!e.f))return;   // efecto de contacto: ataques FÍSICOS (en los de varios golpes, solo el primero)
 tg.pxT=T;
 switch(tg.prot.k){
  case'spiky':dotDano(o,.125,'#f87171');break;
  case'king':stg(o,{atk:-1});break;
  case'bunker':aplicarEst(o,'psn',tg,true);break;
  case'obstruct':stg(o,{def:-2});break;
  case'silk':stg(o,{spe:-1});break;
  case'bulwark':aplicarEst(o,'brn',tg,true);break;
 }
}
function protege(m,k){
 const n=(T-(m.pt==null?-99:m.pt)<3.5)?(m.pn||0)+1:0;m.pn=n;m.pt=T;
 if(n>0&&rnd()>1/Math.pow(3,n)){fallo(m);return}
 m.prot={k,l:1.5};txt.push({x:m.x,y:m.y-56,s:k=='endure'?'¡Aguanta!':'¡Se protege!',c:'#93c5fd',l:1.2,sm:1});ring(m.x,m.y,'#93c5fd',45,.6);
}
// El Pokémon se retira y entra el siguiente del equipo (si queda alguien). Su carta no cae.
function forzarCambio(m){
 const s=m.side,nx=team[s]&&team[s].find(u=>!u.used);
 if(!nx||m.dead||over)return false;
 m.dead=true;m.fade=.5;m.vol=null;m.ail=null;m.plan=null;send[s]=.3;
 burst(m.x,m.y,'#fff',16,160,true);log(`${tn(m.t)} se retira del combate`);ui();
 return true;
}
// Peso de la IA para los ataques de estado nuevos (undefined = lo decide ia.js como antes)
function wtEfx(m,e,o){
 const V=m.vol||{},fr=m.hp/m.max,tiene=k=>o&&o.vol&&o.vol[k];
 if(e.nada)return 0;
 if(e.sw&&!(team[m.side]&&team[m.side].some(u=>!u.used)))return 0;
 if(e.cost)return fr>.6&&!(e.s&&m.stg.atk>=3)?1.2:0;
 if(e.kam)return fr<.35?3:.1;
 if(e.pr)return m.prot||T-(m.pt==null?-99:m.pt)<2.5?0:.5;
 if(e.cl)return campo.cl&&campo.cl.k==e.cl?0:1;
 if(e.te)return campo.te&&campo.te.k==e.te?0:.9;
 if(e.sa)return campo.sa&&campo.sa.k==e.sa?0:.7;
 if(e.dep)return campo.dep[e.dep]?0:.5;
 if(e.ha){if(e.ha=='limpia')return Object.keys(campo.haz[m.side]).length?2:0;
  return(campo.haz[1-m.side][e.ha]||0)<{spikes:3,tspikes:2,rocks:1,web:1}[e.ha]?.9:0}
 if(e.sb)return V.sub||fr<.5?0:1;
 if(e.v){const ks=[].concat(e.v);
  if(e.of)return!o||tiene(ks[0])||!puedeEst(o,ks[0],m)?0:1;
  if(e.both)return V[ks[0]]||tiene(ks[0])?0:.2;
  if(e.req&&!(campo.cl&&campo.cl.k==e.req))return 0;
  return V[ks[0]]?0:.8}
 if(e.cu)return m.types.includes('ghost')&&fr<=.6?0:1;
 if(e.cur&&!e.s&&!e.h)return m.ail||V.cnf||V.inf?3:0;
 if(e.pu)return o&&Object.values(o.stg).some(x=>x>=2)?1.5:0;
 if(e.hz)return o&&(Object.values(o.stg).some(x=>x>=2)||Object.values(m.stg).some(x=>x<=-2))?1.5:0;
 if(e.pd)return o&&fr<o.hp/o.max-.2?1.5:0;
 if(e.ce)return V.focus?0:.7;
 if(e.lf)return m.lf?0:.5;
 if(e.lk)return m.lock?0:.5;
 if(e.cp)return o&&o.last&&!(o.last.ef&&o.last.ef.cp)?1:0;
 if(e.mi)return o&&o.last&&o.last.cat!==undefined&&!m.mv.includes(o.last)?.8:0;
 if(e.sw)return e.sw=='yo'?(fr<.4?1.5:.2):.6;
 if(e.sp||e.ty||e.ta||e.tys||e.cv||e.rt)return o?.4:0;
 if(e.ac)return .8;
 if(e.sx){const k=e.sx;if(!o)return 0;
  if(k=='heart'||k=='topsy')return Object.values(o.stg).some(x=>x>=2)||Object.values(m.stg).some(x=>x<=-2)?1.5:0;
  if(k=='guard'||k=='power')return Object.values(m.stg).some(x=>x<=-2)?1.2:0;
  if(k=='speed')return o.st.spe>m.st.spe*1.2?1:0;
  if(k=='ptrick'||k=='pshift')return m.st.def>m.st.atk*1.3?.8:0;
  if(k=='psplit')return o.st.atk>m.st.atk*1.2||o.st.spa>m.st.spa*1.2?1:0;
  if(k=='gsplit')return o.st.def<m.st.def*.8||o.st.spd<m.st.spd*.8?0:.6;
  if(k=='trans')return m.ail&&!o.ail&&puedeEst(o,m.ail.k,m)?2:0}
 if(e.cc){const a=Object.keys(campo.haz[m.side]).length,b=Object.keys(campo.haz[1-m.side]).length;return a>b?2:0}
 if(e.ts)return m.types.includes(e.ts.t)||(o&&o.types.includes(e.ts.t))?.6:0;
 if(e.stk)return(m.stk||0)<3?.9:0;
 if(e.swl)return m.stk&&fr<.6?2:0;
 if(e.rv)return team[m.side]&&team[m.side].some(u=>u.dead)?1.5:0;
 return undefined;
}
// Dibujo del clima y etiquetas del campo (dibujo.js, al final de draw)
function dibujaCampo(){
 const c=campo;if(!c)return;
 const cl=c.cl&&c.cl.k,col={sun:'255,200,60',rain:'80,140,255',sand:'200,160,80',hail:'190,230,255'}[cl];
 cx.save();
 if(col){
  cx.globalAlpha=1;cx.fillStyle=`rgba(${col},.1)`;cx.fillRect(0,0,W,H);
  cx.strokeStyle=cx.fillStyle=`rgba(${col},.6)`;cx.lineWidth=1.5;
  for(let i=0;i<46;i++){
   if(cl=='rain'){const x=(i*131)%W,y=(i*53+T*520)%H;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x-5,y+14);cx.stroke()}
   else if(cl=='sand'){const x=(i*97+T*260)%W,y=(i*61)%H+Math.sin(T*3+i)*6;cx.fillRect(x,y,3,2)}
   else if(cl=='hail'){const x=((i*113)%W+Math.sin(T+i)*14+W)%W,y=(i*47+T*70)%H;cx.beginPath();cx.arc(x,y,2.2,0,7);cx.fill()}
  }
  if(cl=='sun'){const g=cx.createRadialGradient(W-60,30,5,W-60,30,260);g.addColorStop(0,'rgba(255,230,120,.45)');g.addColorStop(1,'rgba(255,200,60,0)');cx.fillStyle=g;cx.fillRect(0,0,W,H)}
 }
 const l=[];
 for(const k of['cl','te','sa'])if(c[k])l.push(NOM_CAMPO[c[k].k]+' '+Math.ceil(c[k].l)+'s');
 if(c.dep.water)l.push('Chorro de agua '+Math.ceil(c.dep.water)+'s');if(c.dep.mud)l.push('Chorro de barro '+Math.ceil(c.dep.mud)+'s');
 cx.font='bold 11px system-ui';cx.textAlign='left';cx.lineWidth=3;cx.strokeStyle='rgba(0,0,0,.7)';cx.fillStyle='#fff';
 l.forEach((s,i)=>{cx.strokeText(s,8,16+i*14);cx.fillText(s,8,16+i*14)});
 [0,1].forEach(side=>{
  const h=Object.entries(c.haz[side]).map(([k,n])=>NOM_HAZ[k]+(n>1?' x'+n:'')).join(', ');if(!h)return;
  const s='⚠ '+h;cx.textAlign=side?'right':'left';const x=side?W-8:8;
  cx.strokeText(s,x,H-8);cx.fillStyle=side?'#fca5a5':'#93c5fd';cx.fillText(s,x,H-8);cx.fillStyle='#fff';
 });
 cx.restore();
}