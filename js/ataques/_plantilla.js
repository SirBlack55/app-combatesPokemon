// ============================================================================
//  PLANTILLA DE ATAQUES CON ANIMACIÓN PROPIA   (este archivo NO se carga en el juego)
//
//  Para usar un modelo: cópialo a un archivo nuevo, p. ej. js/ataques/bote.js, cambia el ID
//  y añade su <script> en index.html junto a los demás ataques. Pruébalo en el 🧪 Laboratorio.
//
//  La clave (CUSTOM['bounce']) es el ID del ataque en la PokéAPI: inglés, minúsculas, con guiones.
//  Reglas del motor que conviene recordar:
//   · Tipos con estos nombres: normal fire water elec leaf ice fighting poison ground flying psychic
//     bug rock ghost dark steel fairy dragon   (¡'elec' y 'leaf', NO 'electric' ni 'grass'!)
//   · Aleatoriedad: R(a,b) para lo que SOLO se ve (partículas); RS(a,b) / rnd() para lo que afecta
//     al resultado (daño, a quién golpea, dónde cae). Nunca Math.random() para lo segundo.
//   · Si tu ataque es de tipo Dragón/Roca, especial y con poder >= 110, el conversor multiplica su
//     poder por 1.8: pon p: (el poder que quieras) y c:1 dentro de mv para fijarlo.
//   · La entidad con 'delay' la gestiona el motor: eup() empieza a llamarse cuando el delay termina,
//     y edraw() puede llamarse ANTES del primer eup(): inicializa en start() todo lo que dibujes.
//   · m.tilt solo estira el sprite si |tilt| > 0.3 (picados). Para vibrar mueve m.x.
// ============================================================================

// ---------- MODELO A: guion sobre el Pokémon (salto con aplastamiento) ----------
CUSTOM['bounce']={
  mv:{cu:'bounce',r:360,tk:0},                      // r = alcance (px). tk:0 = no es una embestida normal
  fallback:()=>({n:'Bote',key:'bounce',p:85,cd:(1+85/45)*1.4,c:1,r:360,u:0,t:'normal',cat:'phy',acc:85,sty:'hit',cu:'bounce'}),
  start(m,tg,p){m.sc={id:'bounce',t:0,p}},          // se llama UNA vez al lanzarlo
  run(m,dt,s){const tg=m.tg,t=s.t;if(!tg||tg.dead)return true;   // cada paso; true = terminó
    if(t<.25){m.sqz=t/.25;return false}             // 0 - 0.25 s: se agacha
    m.sqz=0;
    if(t<.85){const u=(t-.25)/.6;m.z=220*Math.sin(u*PI);          // 0.25 - 0.85 s: arco de salto (m.z = altura)
      m.x+=(tg.x-m.x)*Math.min(1,dt*3);m.y+=(tg.y-m.y)*Math.min(1,dt*3);return false}
    if(!s.h){s.h=1;m.z=0;                           // aterriza: UN solo golpe
      hit(tg,s.p.p,s.p.t,m,{cat:s.p.cat,f:true});
      imp(tg.x,tg.y-20,'normal',1.5);shk=Math.max(shk,8)}
    return t>1.1}
};

// ---------- MODELO B: entidad con dibujo propio (rayo psíquico de 3 golpes) ----------
CUSTOM['psybeam']={
  mv:{cu:'psybeam'},
  fallback:()=>({n:'Psicorrayo',key:'psybeam',p:65,cd:(1+65/45)*1.4,c:1,r:300,u:0,t:'psychic',cat:'spe',acc:100,sty:'beam',cu:'psybeam'}),
  start(m,tg,p){m.sc={id:'psybeam',t:0};            // el Pokémon se queda quieto mirando al rival
    ents.push({k:'u',cu:'psybeam',o:m,tg,cat:p.cat,dm:p.p/3,t:0,tk:0,n:0,life:1.3,delay:0})},   // entidad visual
  run(m,dt,s){return s.t>=1.2},
  eup(e,dt){const o=e.o,t=e.tg;e.t+=dt;e.life=1.3-e.t;if(o.dead){e.life=0;return}
    if(e.t>.3&&e.t<1.1){e.tk+=dt;if(e.tk>=.2){e.tk=0;e.n++;      // un golpe cada 0.2 s
      if(!t.dead){hit(t,e.dm,'psychic',o,{cat:e.cat,f:e.n==1});imp(t.x,t.y-30,'psychic',.8)}}}},
  edraw(e){const o=e.o,t=e.tg;if(e.t<.3||e.t>1.15)return;
    const x1=o.x,y1=o.y-34,x2=t.x,y2=t.y-34,w=1+Math.sin(T*40)*.2;     // y-34 = centro del sprite
    cx.save();cx.lineCap='round';
    for(const [lw,c] of [[26,'rgba(244,114,182,.55)'],[12,'rgba(217,70,239,.9)'],[4,'#fff']]){
      cx.strokeStyle=c;cx.lineWidth=lw*w;cx.beginPath();cx.moveTo(x1,y1);cx.lineTo(x2,y2);cx.stroke()}
    cx.restore()}
};
