// Convierte un ataque de la PokéAPI en un ataque del juego (tipo de animación, daño, cooldown...).
const STY=[[/slash|scratch|claw|cut|blade|shear|scissor|sword|fury-swipes|razor|slice/,'slash'],[/bite|crunch|fang|chomp/,'bite'],[/punch|hammer|fist|mach|thrash|superpower|close-combat|cross-chop|karate|jab|rage/,'punch'],[/kick|stomp|stamp|trample|jump|strike/,'kick'],[/tail|whip|vine|wrap|bind|lash|slap|pound|crush|slam|squeeze/,'whip'],[/beam|ray|cannon|laser|solar|pulse|spit|flash/,'beam'],[/storm|tornado|hurricane|twister|cyclone|blizzard|whirl|typhoon|swarm|rain|barrage/,'storm'],[/quake|slide|fissure|bulldoze|tectonic|magnitude|rumble/,'quake'],[/surf|wave|tsunami|torrent/,'wave']],MEL=['slash','bite','punch','kick','whip','hit'];
function conv0(d){const t=TN[d.type.name]||'normal',nm=(d.names.find(x=>x.language.name=='es')||{name:d.name}).name,cl=d.damage_class.name,mt=d.meta||{};
 if(['explosion','self-destruct','misty-explosion','memento','final-gambit','focus-punch','dream-eater','belch','sky-drop','fling','last-resort','synchronoise'].includes(d.name))return null;
 if(cl=='status'){const ef={},SN={attack:'atk',defense:'def','special-attack':'spa','special-defense':'spd',speed:'spe'},LB={atk:'Ataque',def:'Defensa',spa:'At. Esp.',spd:'Def. Esp.',spe:'Velocidad'};
  if(mt.healing>0){ef.h=mt.healing/100;ef.d='Cura '+mt.healing+'% PS'}
  else{const me=d.target&&['user','user-or-ally','users-field','user-and-allies'].includes(d.target.name),o={};for(const c of d.stat_changes||[]){const k=SN[c.stat.name];if(k)o[k]=Math.max(-3,Math.min(3,c.change))}
   const v=Object.values(o);if(!v.length)return null;if(me&&v.some(x=>x>0))ef.s=o;else if(!me&&v.some(x=>x<0))ef.o=o;else return null;
   ef.d=(me?'':'Rival: ')+Object.entries(o).map(([k,x])=>(x>0?'+':'−')+Math.abs(x)+' '+LB[k]).join(', ')}
  return{n:nm,key:d.name,p:0,cd:(mt.healing>0?18:9)*1.4,c:1,r:999,u:0,t,cat:'sta',ef,acc:0}}
 if(!d.power)return null;const P=d.power,phy=cl=='physical',acc=d.accuracy||100;let sty=phy?'hit':'orb';for(const[r,k]of STY)if(r.test(d.name)){sty=k;break}
 if(!phy&&MEL.includes(sty))sty='orb';
 if(phy&&MEL.includes(sty))return{n:nm,key:d.name,p:P,cd:(1+P/45)*1.4,c:1,r:55,u:0,tk:1,t,cat:'phy',acc,sty};
 const u=!phy&&P>=110,K=u?ultK(t):({beam:'s',storm:'z',quake:'q',wave:'w'}[sty]||(t=='elec'?'b':'p')),c=K=='s'?5:K=='z'?(u?6:5):K=='q'||K=='w'||K=='x'?1:K=='m'?10:K=='b'?(u?6:P<=60?1:P<=90?2:3):(P<=50?1:P<=70?3:P<=90?5:6);
 return{n:nm,key:d.name,p:u&&K=='m'?P*1.8:P,cd:(u?6:1+P/45)*1.4,c,r:u?300:P<=70?230:260,u:u?1:0,t,cat:phy?'phy':'spe',acc,sty}}
function conv(d){const mv=conv0(d);if(mv&&CUSTOM[d.name])Object.assign(mv,CUSTOM[d.name].mv);return mv}
