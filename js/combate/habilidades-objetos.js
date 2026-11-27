// HABILIDADES · familia OBJETOS (tanda 3 de objetos): Recogida, Gula, Hurto, Prestidigitador, Maduración y Rumia,
// y se rehacen Liviano y Cosecha para que funcionen con los objetos robados, quitados o lanzados de la tanda 2.
// Va justo DESPUÉS de objetos-ataques.js (usa quitarObj, darObj, objQuitable, efectoBaya...). Se registran en HAB.
// Regla de la carta (igual que siempre): lo que coge o roba en combate es temporal; nunca pasa a su carta.
const HOBJ_CFG={recogida:3,rumia:3,gula:.5};
const avisoHO=(m,s,c)=>txt.push({x:m.x,y:m.y-56,s,c:c||'#fde68a',l:1.3,sm:1});
const tieneHab=(m,k)=>!!(m&&m.hab===k&&!m.habOff&&!gasNeutro(m));
const robaObj=(m,de,nom)=>{const r=quitarObj(de);darObj(m,r.k,r.d);avisoHO(m,'¡'+nom+': '+nomObj(r.k)+'!')};

// ---- Gula: las bayas que se comen al 25 % de PS se las come ya al 50 % ----
const GULA=[...B_STAT.map(x=>x[0]),'starf-berry','lansat-berry',...Object.keys(B_CURA).filter(k=>B_CURA[k][2]<=.25)];
for(const k of GULA){const O=OBJ_EQ[k];if(!O)continue;
 const cura=!!B_CURA[k];
 const ck=m=>{if(!tieneHab(m,'gluttony')||m.dead||m.obj!==k||m.hp<=0||m.hp>m.max*HOBJ_CFG.gula)return false;
  if(cura&&(m.hp>=m.max||(m.vol&&m.vol.hblock)))return true;
  const r=rivalDe(m);if(r&&gancho('bloqBaya',r))return true;
  gastarObj(m);efectoBaya(m,k);return true};
 for(const h of['seg','golpeado']){const f=O[h];O[h]=function(m,...a){if(ck(m))return;return f&&f.call(this,m,...a)}}
}

// ---- Maduración: las bayas hacen el doble (curan el doble, suben el doble, las de tipo dejan el golpe en ¼) ----
const madura=m=>tieneHab(m,'ripen');
{const c0=comerBaya;comerBaya=function(m,nombre,fn){if(m)m.bayaComida=m.obj;if(!madura(m)||!fn)return c0(m,nombre,fn);return c0(m,nombre,x=>{fn(x);if(!x.dead)fn(x)})}}
{const b0=bayaCura;bayaCura=function(m,nombre,umbral,frac){if(m)m.bayaComida=m.obj;return b0(m,nombre,umbral,madura(m)?frac*2:frac)}}
{const e0=efectoBaya;efectoBaya=function(m,k){if(!madura(m)||k==='starf-berry')return e0(m,k);
 const s0=stg,c0=m.vol&&m.vol.hblock;let r;
 stg=(x,o,...a)=>{const d={};for(const q in o)d[q]=o[q]*2;return s0(x,d,...a)};   // las de estadísticas: el doble de etapas
 try{r=e0(m,k)}finally{stg=s0}
 if(r&&!c0&&(B_CURA[k]||k==='sitrus-berry'||k==='enigma-berry'))curaPS(m,B_CURA[k]?B_CURA[k][3]:.25,'#fde047');   // las de curar: otra vez
 return r}}
for(const[k]of B_TIPO){const O=OBJ_EQ[k],f=O.danoRec;O.danoRec=function(m,...a){const v=f.call(this,m,...a);return v<1&&madura(m)?v*v:v}}

Object.assign(HAB,{
 // ---- Robar objetos ----
 'pickpocket':{n:'Hurto',g:'Objetos',d:'Si le golpean con un ataque de contacto y no lleva objeto, le roba el suyo al atacante.',
  golpeado(m,o,d,prim){if(prim&&!m.obj&&!o.dead&&contactoReal(o)&&objQuitable(o))robaObj(m,o,'Hurto')}},
 'magician':{n:'Prestidigitador',g:'Objetos',d:'Si golpea con un ataque y no lleva objeto, le roba el suyo al rival.',
  daDano(o,tg,d,prim){if(prim&&!o.obj&&!tg.dead&&objQuitable(tg))robaObj(o,tg,'Prestidigitador')}},
 // ---- Recuperar objetos ----
 'pickup':{n:'Recogida',g:'Objetos',d:'Si no lleva objeto, cada '+HOBJ_CFG.recogida+' s recoge el último objeto que gastó el rival.',
  seg(m){m.hRec=(m.hRec||0)+1;if(m.hRec<HOBJ_CFG.recogida)return;m.hRec=0;
   const o=rivalDe(m);if(m.obj||!o||!o.objGastadoK)return;const k=o.objGastadoK;o.objGastadoK=null;darObj(m,k,null);avisoHO(m,'¡Recogida: '+nomObj(k)+'!','#86efac')}},
 'harvest':{n:'Cosecha',g:'Periódica',d:'Cada '+TURNO+' s puede recuperar la baya que se comió (50 %; siempre con sol).',
  seg(m){cadaTurno(m,'hCose',m=>{const k=m.objGastadoK;if(m.obj||!esBaya(k))return;
   if(rnd()<(climaK('sun')?1:.5)){const d=m.objGastadoD===undefined?m:m.objGastadoD;darObj(m,k,d);m.objGastadoK=null;
    if(d===m&&m.u){m.u.obj=k;m.u.objGastado=0}avisoHO(m,'¡Cosecha!','#86efac')}})}},
 // ---- Al quedarse sin objeto / al comer bayas ----
 'unburden':{n:'Liviano',g:'Objetos',d:'Si pierde su objeto (lo gasta, se lo roban, lo lanza...), su Velocidad se duplica.',
  alPerderObj(m){m.liviano=1},statMul(m,k){return k==='spe'&&m.liviano&&!m.obj?2:1}},
 'cud-chew':{n:'Rumia',g:'Objetos',d:'Cuando se come una baya, la vuelve a comer '+HOBJ_CFG.rumia+' s después (sin gastar otra).',
  alComerBaya(m){if(m.enRumia)return;const k=m.bayaComida;if(esBaya(k))m.rumia={k,t:T+HOBJ_CFG.rumia}},
  seg(m){const r=m.rumia;if(!r||T<r.t||m.dead)return;m.rumia=null;m.enRumia=1;try{avisoHO(m,'¡Rumia!','#fde047');efectoBaya(m,r.k)}finally{m.enRumia=0}}},
 'ripen':{n:'Maduración',g:'Objetos',d:'Las bayas que se come hacen el doble de efecto.'},
 'gluttony':{n:'Gula',g:'Objetos',d:'Se come al 50 % de PS las bayas que normalmente se comería al 25 %.'},
});
// Rumia necesita saber qué baya se comió (también con Picadura, Picoteo, Lanzamiento o Gula, que no pasan por comerBaya)
{const e0=efectoBaya;efectoBaya=function(m,k){if(m)m.bayaComida=k;return e0(m,k)}}
