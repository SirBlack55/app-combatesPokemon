// Convierte un ataque de la PokéAPI en un ataque del juego (tipo de animación, daño, cooldown...).
const STY=[[/slash|scratch|claw|cut|blade|shear|scissor|sword|fury-swipes|razor|slice/,'slash'],[/bite|crunch|fang|chomp/,'bite'],[/punch|hammer|fist|mach|thrash|superpower|close-combat|cross-chop|karate|jab|rage/,'punch'],[/kick|stomp|stamp|trample|jump|strike/,'kick'],[/tail|whip|vine|wrap|bind|lash|slap|pound|crush|slam|squeeze/,'whip'],[/beam|ray|cannon|laser|solar|pulse|spit|flash/,'beam'],[/storm|tornado|hurricane|twister|cyclone|blizzard|whirl|typhoon|swarm|rain|barrage/,'storm'],[/quake|slide|fissure|bulldoze|tectonic|magnitude|rumble/,'quake'],[/surf|wave|tsunami|torrent/,'wave']],MEL=['slash','bite','punch','kick','whip','hit'];
const fxDe=F=>F&&F.k?{fx:F}:{};
const SNM={attack:'atk',defense:'def','special-attack':'spa','special-defense':'spd',speed:'spe',accuracy:'acc',evasion:'eva'};
// Estado alterado que provoca un ataque (null si no lo hay o aún no existe en el juego)
function ailDe(d,mt){const k=AIL[(mt.ailment||{}).name];return k==='psn'&&TOXICOS.includes(d.name)?'tox':k}
// Efectos secundarios de un ataque con daño: a=estado, pa=% · f=% retroceso · dr=drenar(+)/retroceso de PS(−) en % del daño · so/ss=stats del rival/propios, ps=%
function secDe(d,mt){const s={},k=ailDe(d,mt);
 if(k){s.a=k;s.pa=mt.ailment_chance||100}
 if(mt.flinch_chance>0)s.f=mt.flinch_chance;
 if(mt.drain)s.dr=mt.drain;
 if(CAMBIA_YO.includes(d.name))s.sw='yo';else if(CAMBIA_RIVAL.includes(d.name))s.sw='rival';
 const o={},y={};for(const c of d.stat_changes||[]){const q=SNM[c.stat.name];if(q&&!SIN_STATS.includes(d.name))(c.change>0||AUTOBAJA.includes(d.name)?y:o)[q]=Math.max(-3,Math.min(3,c.change))}
 if(Object.keys(o).length)s.so=o;if(Object.keys(y).length)s.ss=y;
 if(s.so||s.ss)s.ps=mt.stat_chance||100;
 return Object.keys(s).length?s:undefined}
const secX=(d,mt)=>{const s=secDe(d,mt);return s?{sec:s}:{}};
function conv0(d){const t=TN[d.type.name]||'normal',nm=(d.names.find(x=>x.language.name=='es')||{name:d.name}).name,cl=d.damage_class.name,mt=d.meta||{};

 const F=ESP[d.name];   // efectos especiales (datos/ataques-especiales.js)
 const X=EFX[d.name];   // ataques de estado con efecto propio (datos/ataques-especiales.js)
 if(X){const of=X.of&&!X.yo;return{n:nm,key:d.name,p:0,cd:(X.cd||9)*1.4,c:1,r:of?320:999,u:0,t,cat:'sta',ef:X,acc:of?(d.accuracy||0):0}}
 if(F&&F.k=='contra')return{n:nm,key:d.name,p:0,cd:14,c:1,r:999,u:0,t,cat:'sta',ef:{c:F,d:F.d},acc:0};
 if(cl=='status'){const ef={},LB={atk:'Ataque',def:'Defensa',spa:'At. Esp.',spd:'Def. Esp.',spe:'Velocidad',acc:'Precisión',eva:'Evasión'},al=ailDe(d,mt),me=!!(d.target&&['user','user-or-ally','users-field','user-and-allies'].includes(d.target.name));
  if(d.name=='rest'){ef.h=1;ef.a={k:'slp',yo:1};ef.d='Cura todos los PS y duerme'}
  else if(mt.healing>0){ef.h=mt.healing/100;ef.d='Cura '+mt.healing+'% PS'}
  else{const o={};for(const c of d.stat_changes||[]){const k=SNM[c.stat.name];if(k)o[k]=Math.max(-3,Math.min(3,c.change))}
   const v=Object.values(o);
   if(v.length){if(me&&v.some(x=>x>0))ef.s=o;else if(!me&&(v.some(x=>x<0)||al))ef.o=o;else if(!al)return null;
    if(ef.s||ef.o)ef.d=(me?'':'Rival: ')+Object.entries(o).map(([k,x])=>(x>0?'+':'−')+Math.abs(x)+' '+LB[k]).join(', ')}
   else if(!al)return null}
  if(al&&!me&&!ef.a){const k=al==='trap'?'net':al;ef.a={k,yo:0};ef.d=(ef.d?ef.d+' · ':'')+AIL_TXT[k]}
  if(!ef.h&&!ef.s&&!ef.o&&!ef.a)return null;
  const of=ef.a&&!ef.a.yo;
  return{n:nm,key:d.name,p:0,cd:(mt.healing>0?18:9)*1.4,c:1,r:of?320:999,u:0,t,cat:'sta',ef,acc:of?(d.accuracy||0):0}}
 if(!d.power&&!(F&&F.p))return null;const P=d.power||F.p,phy=cl=='physical',acc=d.accuracy||100;let sty=phy?'hit':'orb';for(const[r,k]of STY)if(r.test(d.name)){sty=k;break}
 if(F&&F.sty)sty=F.sty;if(!phy&&MEL.includes(sty))sty='orb';
 if(phy&&MEL.includes(sty))return{n:nm,key:d.name,p:P,cd:(1+P/45)*1.4,c:1,r:55,u:0,tk:1,t,cat:'phy',acc,sty,...fxDe(F),...secX(d,mt)};
 const u=!phy&&P>=110,K=u?ultK(t):({beam:'s',storm:'z',quake:'q',wave:'w'}[sty]||(t=='elec'?'b':'p')),c=K=='s'?5:K=='z'?(u?6:5):K=='q'||K=='w'||K=='x'?1:K=='m'?10:K=='b'?(u?6:P<=60?1:P<=90?2:3):(P<=50?1:P<=70?3:P<=90?5:6);
 return{n:nm,key:d.name,p:u&&K=='m'?P*1.8:P,cd:(u?6:1+P/45)*1.4,c:F?1:c,r:u?300:P<=70?230:260,u:u?1:0,t,cat:phy?'phy':'spe',acc,sty,...fxDe(F),...secX(d,mt)}}
function conv(d){const mv=conv0(d);if(mv&&CUSTOM[d.name])Object.assign(mv,CUSTOM[d.name].mv);return mv}