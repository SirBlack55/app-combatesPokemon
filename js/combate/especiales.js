// Lógica de los ataques con efectos especiales (ver datos/ataques-especiales.js). Se usa desde dano.js.

// Debilita a un luchador. por = quien le derrota (null = se debilita solo, p. ej. Explosión).
function debilitar(m,por){
 if(m.dead)return;
 m.hp=Math.min(m.hp,0);m.dead=true;m.fade=1.2;m.u.dead=true;send[m.side]=1.4;
 log(por?`${tn(por.t)} derrotó a ${tn(m.t)}`:`${tn(m.t)} se debilitó`);
 burst(m.x,m.y,'#fff',22,200,true);ui();
 if(por&&m.vol&&m.vol.dbond&&!por.dead)debilitar(por,null);   // Mismo Destino
 if(por&&por!==m){if(!por.dead)gancho('alDerrotar',por,m);gancho('alMorir',m,por)}   // habilidades al derrotar / al ser derrotado
}

// Daño FIJO del ataque (null = el ataque usa la fórmula normal). o = atacante, tg = rival.
function danoEsp(fx,o,tg){
 switch(fx.k){
  case'fijo':return Math.max(1,Math.round(tg.max*(fx.max?RS(fx.pct,fx.max):fx.pct)));
  case'mitad':return Math.max(1,Math.round(tg.hp/2));
  case'igualar':return Math.max(0,Math.round(tg.hp-o.hp));
  case'ohko':return Math.ceil(tg.max*OHKO_FRAC);
  case'gambito':return Math.max(1,Math.round(o.hp));
 }
 return null;
}

// Potencia de los ataques de potencia variable. Los PS máximos sirven de "peso" aproximado (la carga de especies no trae el peso).
const pickP=(v,w)=>{let q=rnd()*w.reduce((a,b)=>a+b,0),i=0;while(i<v.length-1&&(q-=w[i])>0)i++;return v[i]};
function potEsp(f,o,t,fx){
 const pos=m=>Object.values(m.stg).reduce((s,x)=>s+Math.max(0,x),0);
 switch(f){
  case'peso':{const r=t.max;return r<120?20:r<170?40:r<230?60:r<300?80:r<380?100:120}
  case'pesoRel':{const r=o.max/t.max;return r>=5?120:r>=4?100:r>=3?80:r>=2?60:40}
  case'gyro':return Math.min(150,Math.floor(25*stat(t,'spe')/stat(o,'spe'))+1);
  case'electro':{const r=stat(o,'spe')/stat(t,'spe');return r>=4?150:r>=3?120:r>=2?80:r>=1?60:40}
  case'flail':{const q=o.hp/o.max;return q<.0417?200:q<.104?150:q<.208?100:q<.354?80:q<.688?40:20}
  case'castigo':return Math.min(200,60+20*pos(t));
  case'psRival':return Math.max(1,Math.floor(120*t.hp/t.max));
  case'psAtq':return Math.max(1,Math.floor(150*o.hp/o.max));
  case'magnitud':return pickP([10,30,50,70,90,110,150],[5,10,20,30,20,10,5]);
  case'presente':return pickP([40,80,120],[40,30,10]);
  case'stk':{const n=o.stk||0;o.stk=0;return 100*Math.max(1,n)}
  case'hardpress':return Math.max(1,Math.floor(100*t.hp/t.max));
  case'estado':{const q=fx.req,a=q=='self'?o.ail:t.ail;const ok=(q=='any'||q=='self')?!!a:q=='psn'?!!(a&&(a.k=='psn'||a.k=='tox')):!!(a&&a.k==q);return ok?fx.b*2:fx.b}
  case'brine':return t.hp<t.max/2?130:65;
  case'danado':{const x=fx.qui=='yo'?o:t;return T-(x.dmgT==null?-99:x.dmgT)<3?fx.b*2:fx.b}
  case'fija':return fx.v;
  case'poder':return 20+20*pos(o);
  case'cutter':{if(T-(o.fcT==null?-99:o.fcT)>3)o.fc=0;const p=40*Math.pow(2,Math.min(2,o.fc||0));o.fc=(o.fc||0)+1;o.fcT=T;return p}
  case'eco':{if(T-(o.ecT==null?-99:o.ecT)>3)o.ec=0;const p=40*(1+Math.min(4,o.ec||0));o.ec=(o.ec||0)+1;o.ecT=T;return p}
  case'lash':return Object.values(o.stg).some(x=>x<0)?150:75;
  case'ira':return Math.min(350,50+50*(o.nHit||0));
  case'respetos':return 50+50*(team[o.side]?team[o.side].filter(u=>u.dead).length:0);
  case'terreno':return campo.te&&campo.te.k==fx.te?fx.p*fx.mul:fx.p;
  case'primero':return t.cd>.5?fx.b:fx.b*2;   // x2 si el rival aún no ha actuado (sin enfriamiento en marcha)
  case'despues':return t.cd>.5?fx.b*2:fx.b;     // x2 si el rival ya ha actuado (Represalia/Vendetta)
  case'fallo':return T-(o.failT==null?-99:o.failT)<4?fx.b*2:fx.b;   // x2 si su ataque anterior falló
  case'aliado':return team[o.side]&&team[o.side].some(u=>u.dead)?fx.b*2:fx.b;
  case'eficaz':return tEff((o.last&&o.last.t)||'normal',t.types)>1?fx.b*1.33:fx.b;
  case'sol':return campo.cl&&campo.cl.k=='sun'?fx.b*1.5:fx.b;
  case'rollout':{const f=o.vol&&o.vol.furia;return 30*Math.pow(2,f?Math.min(4,f.u||0):0)}
 }
 return 60;
}