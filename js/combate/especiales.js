// Lógica de los ataques con efectos especiales (ver datos/ataques-especiales.js). Se usa desde dano.js.

// Debilita a un luchador. por = quien le derrota (null = se debilita solo, p. ej. Explosión).
function debilitar(m,por){
 if(m.dead)return;
 m.hp=Math.min(m.hp,0);m.dead=true;m.fade=1.2;m.u.dead=true;send[m.side]=1.4;
 log(por?`${tn(por.t)} derrotó a ${tn(m.t)}`:`${tn(m.t)} se debilitó`);
 burst(m.x,m.y,'#fff',22,200,true);ui();
 if(por&&m.vol&&m.vol.dbond&&!por.dead)debilitar(por,null);   // Mismo Destino
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
function potEsp(f,o,t){
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
 }
 return 60;
}