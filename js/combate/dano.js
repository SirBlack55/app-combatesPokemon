// Cálculo de daño.
function hit(tg,dm,t,o,e){if(tg.dead||tg.z>30)return;const ef=tEff(t,tg.types),cat=(e&&e.cat)||(o.plan&&o.plan.cat)||'phy',cr=rnd()<.0625?1.5:1,d=ef==0?0:Math.max(1,Math.round((.44*dm*stat(o,cat=='phy'?'atk':'spa')/stat(tg,cat=='phy'?'def':'spd')+.5)*(o.types.includes(t)?1.5:1)*ef*cr*RS(.85,1.15)*.9*(1+Math.max(0,duelT-40)/25))),an=Math.atan2(tg.y-o.y,tg.x-o.x);
 tg.hp-=d;if(d>0&&(ef>1||cr>1||dm>=35))hs=Math.max(hs,.05);if(cr>1)txt.push({x:tg.x,y:tg.y-62,s:'¡Crítico!',c:'#fb923c',l:1.1,sm:1});tg.flash=.18;tg.kx+=Math.cos(an)*130;tg.ky+=Math.sin(an)*130;if(!tg.tg)tg.tg=o;
 const col=TCOL[t]||'#fff';imp(tg.x,tg.y,t,ef>1?1.3:ef==0?.4:ef<1?.7:1);
 txt.push({x:tg.x+R(-10,10),y:tg.y-30,s:'-'+d,c:ef>1?'#fde047':ef<1?'#cbd5e1':'#fff',l:.9});
 if((!e||e.f)&&ef!=1)txt.push({x:tg.x,y:tg.y-48,s:ef>1?'¡Súper eficaz!':ef==0?'No afecta':'Poco eficaz',c:ef>1?'#fde047':'#e2e8f0',l:1.2,sm:1});
 if(tg.hp<=0){tg.dead=true;tg.fade=1.2;tg.u.dead=true;send[tg.side]=1.4;log(`${tn(o.t)} derrotó a ${tn(tg.t)}`);burst(tg.x,tg.y,'#fff',22,200,true);ui()}}
