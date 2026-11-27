// Cálculo de daño. Los ataques con efectos especiales (mv.fx, ver datos/ataques-especiales.js y combate/especiales.js) también pasan por aquí.
function hit(tg,dm,t,o,e){if(tg.dead||tg.z>30)return;
 if(tg.prot&&tg.prot.k!='endure'){protegido(tg,o,e);return}
 if(tg.inv&&!((INV_HIT[tg.inv]||[]).includes((o.last&&o.last.key)||''))){if(!e||e.f)txt.push({x:tg.x,y:tg.y-48,s:'No afecta',c:'#e2e8f0',l:1,sm:1});return}   // escondido (Excavar, Buceo...)
 if(gancho('absorbe',tg,o,t,e,!e||e.f)){   // habilidades que absorben o anulan el ataque (Absorbe Agua, Insonorizar, Superguardia...): el efecto lo aplica la propia habilidad
  const f0=e?e.fx:(o.plan&&o.plan.fx);if(f0&&(f0.k=='kamik'||f0.k=='gambito')&&(!e||e.f))debilitar(o,null);return}
 if(climaBloquea(t)){if(!e||e.f)txt.push({x:tg.x,y:tg.y-48,s:t==='water'?'¡Se evapora!':'¡Se apaga!',c:'#e2e8f0',l:1.2,sm:1});return}   // clima extremo
 const fx=e?e.fx:(o.plan&&o.plan.fx);   // e = entidad del ataque (null en embestidas: entonces vale el plan del atacante)
 if(fx&&fx.k=='pot'&&fx.f=='stk'&&!o.stk){txt.push({x:o.x,y:o.y-46,s:'¡Falló!',c:'#cbd5e1',l:1,sm:1});return}
 if(fx&&fx.k=='pot')dm=potEsp(fx.f,o,tg,fx);
 if(fx&&((fx.k=='dormido'&&!(tg.ail&&tg.ail.k=='slp'))||(fx.k=='sinc'&&!o.types.some(x=>tg.types.includes(x))))){txt.push({x:tg.x,y:tg.y-48,s:'No afecta',c:'#e2e8f0',l:1.2,sm:1});return}
 const ef=efTipo(t,tg),cat=(e&&e.cat)||(o.plan&&o.plan.cat)||'phy',fj=fx?danoEsp(fx,o,tg):null,mxK=fx&&fx.mx?(stat(o,'atk')>stat(o,'spa')?'phy':'spe'):null,AQ=(fx&&fx.as)||((mxK||cat)=='phy'?'atk':'spa'),DQ=(fx&&fx.od)||(((mxK||cat)=='phy')!=salaK('wonder')?'def':'spd'),
  cr=rnd()<critP(o,tg,e)&&fj==null?1.5*ganchoMul('critMul',o,tg):1,
  d=(ef==0&&!(fx&&fx.ig))?0:fj!=null?fj:Math.max(1,Math.round((.44*dm*stat(fx&&fx.ua?tg:o,AQ)/stat(tg,DQ)+.5)*(o.types.includes(t)?1.5:1)*ef*campoMul(t,tg,cat)*mulDano(o,tg,t,cat,dm)*cr*RS(.85,1.15)*.9*(1+Math.max(0,duelT-40)/25))),an=Math.atan2(tg.y-o.y,tg.x-o.x);
 const hh=(!e||e.f)&&o.last&&o.last.hits;   // golpe principal de un ataque de varios golpes: agenda el resto
 if(hh&&d>0&&!tg.dead)agendaHits(o,tg,dm,t,cat,fx);
 if(tg.vol&&tg.vol.sub&&d>0){const sb=tg.vol.sub;sb.hp-=d;imp(tg.x,tg.y,t,.7);txt.push({x:tg.x+R(-10,10),y:tg.y-30,s:'-'+d,c:'#fbbf24',l:.9});if(sb.hp<=0){delete tg.vol.sub;txt.push({x:tg.x,y:tg.y-56,s:'¡Se rompió el sustituto!',c:'#fbbf24',l:1.2,sm:1})}if(fx&&(fx.k=='kamik'||fx.k=='gambito'))debilitar(o,null);return}
 tg.hp-=d;tg.hpAnt=tg.hp+d;if(d>0){tg.dmgT=T;tg.nHit=(tg.nHit||0)+1}if(tg.hp<1&&tg.prot&&tg.prot.k=='endure'){tg.hp=1;txt.push({x:tg.x,y:tg.y-62,s:'¡Aguantó!',c:'#93c5fd',l:1.1,sm:1})}else if(tg.hp<1&&d>0&&gancho('aguanta',tg,o,d)){tg.hp=1;txt.push({x:tg.x,y:tg.y-62,s:'¡Aguantó!',c:'#fbbf24',l:1.1,sm:1})}
 if(d>0&&(ef>1||cr>1||dm>=35))hs=Math.max(hs,.05);if(cr>1){tg.critT=T;txt.push({x:tg.x,y:tg.y-62,s:'¡Crítico!',c:'#fb923c',l:1.1,sm:1})}tg.flash=.18;tg.kx+=Math.cos(an)*130;tg.ky+=Math.sin(an)*130;if(!tg.tg)tg.tg=o;
 const col=TCOL[t]||'#fff';imp(tg.x,tg.y,t,ef>1?1.3:ef==0?.4:ef<1?.7:1);
 txt.push({x:tg.x+R(-10,10),y:tg.y-30,s:'-'+d,c:ef>1?'#fde047':ef<1?'#cbd5e1':'#fff',l:.9});
 if((!e||e.f)&&ef!=1&&fj==null)txt.push({x:tg.x,y:tg.y-48,s:ef>1?'¡Súper eficaz!':ef==0?'No afecta':'Poco eficaz',c:ef>1?'#fde047':'#e2e8f0',l:1.2,sm:1});
 if(fx&&fx.k=='ohko'&&d>0&&tg.hp<=0)txt.push({x:tg.x,y:tg.y-62,s:'¡KO de un golpe!',c:'#fde047',l:1.3,sm:1});
 if(d>0)descongelar(tg,t);
 const sec=ganchoVal('secRec',tg,ganchoVal('secMod',o,(e&&'sec' in e)?e.sec:(o.last&&o.last.sec),tg),o);   // efectos secundarios (conversor: secDe); Fuerza Bruta y Polvo Escudo los modifican
 if(sec&&d>0&&EFECTOS_SECUNDARIOS)secundarios(sec,o,tg,d,!e||e.f);
 if(d>0&&tg.hp>0)gancho('golpeado',tg,o,d,!e||e.f);   // habilidades y objetos del que recibe
 // Postura de contraataque del rival: si sigue vivo, devuelve parte del daño
 const cn=tg.cnt;
 if(d>0&&tg.hp>0&&cn&&(cn.cat=='any'||cn.cat==cat)&&!o.dead&&o!==tg){
  const r=Math.max(1,Math.round(d*cn.m));tg.cnt=null;o.hp-=r;o.flash=.18;
  txt.push({x:o.x,y:o.y-30,s:'-'+r,c:'#fbbf24',l:.9});txt.push({x:tg.x,y:tg.y-62,s:'¡Contraataque!',c:'#fbbf24',l:1.1,sm:1});ring(o.x,o.y,'#fbbf24',50,.5);
  if(o.hp<=0)debilitar(o,tg)}
 if(tg.hp<=0)debilitar(tg,o);
 if(fx&&(fx.k=='kamik'||fx.k=='gambito'))debilitar(o,null);
 if(d>0&&!o.dead)gancho('daDano',o,tg,d,!e||e.f)}   // habilidades y objetos del que ataca