// Lógica del modo aventura (código PURO: sin red ni DOM). Una "run" es una partida independiente con su propia box.
// Lo que se guarda (todo JSON):
//   run = {version, region, nombre, vidas, contador, pokes:[{uid,especieId,nivel,xp,genero}], equipo:[uid...] (máx. 6),
//          objetos:{pokeball:n,...}, medallas:[], nodo, prog (combates hechos en el nodo), completo, enc (encuentro salvaje en curso),
//          pendCaptura:{id,nv}|null, stats:{combates,capturas,derrotas}, fin:null|'victoria'|'derrota'}
// Las funciones que necesitan datos del juego reciben `ctx`:
//   {Experiencia, grupoDe(id), EVOLUCIONES, rateDe(id), rz(id)}   (rz = rareza 'N'..'LR')
const Aventura=(()=>{
  // Todo lo ajustable está aquí (valores de EJEMPLO para probar).
  const CFG={
    inicial:{nivel:5,pokeball:8},
    vidas:3,               // derrotas contra entrenadores que aguanta la run
    perderVidaSalvaje:false,
    equipoMax:6,
    escala:{stat:[.15,.85],hp:[.35,.65]},   // multiplicador = a + b·nivel/100 (nivel 100 = stats base completas)
    xp:{salvaje:1/8,entrenador:1.5/8},      // XP = suma de stats base del rival · su nivel · factor
    captura:{N:.85,R:.7,SR:.5,SSR:.35,UR:.2,LR:.1},   // probabilidad de atrapar según la rareza de la especie
    huidaFallo:.2,         // probabilidad de que el Pokémon escape tras fallar una Poké Ball
  };
  const mult=(c,n)=>c[0]+c[1]*n/100;
  const bst=st=>Object.values(st).reduce((a,b)=>a+b,0);
  // Stats de combate de un Pokémon de cierto nivel a partir de sus stats base y su PS de combate (H).
  function escalar(st,H,nv,cfg=CFG){
    const k=mult(cfg.escala.stat,nv),out={};
    for(const s in st)out[s]=Math.max(1,Math.round(st[s]*k));
    return{st:out,H:Math.max(10,Math.round(H*mult(cfg.escala.hp,nv)))};
  }
  const xpVictoria=(bstRival,nv,entrenador,cfg=CFG)=>Math.max(1,Math.round(bstRival*nv*(entrenador?cfg.xp.entrenador:cfg.xp.salvaje)));
  const probCaptura=(rareza,cfg=CFG)=>cfg.captura[rareza]??.5;
  const generoPor=r=>r===undefined||r===null?null:r<0?'N':r===0?'M':r>=8?'F':null;   // null = depende del azar
  function sortearGenero(r,rng=Math.random){const g=generoPor(r);return g||(r===undefined||r===null?null:rng()*8<r?'F':'M')}

  const total=n=>n.tipo==='ruta'?n.combates:n.tipo==='entrenadores'?n.entrenadores.length:0;
  const poke=(run,uid)=>run.pokes.find(p=>p.uid===uid);
  const equipo=run=>run.equipo.map(u=>poke(run,u)).filter(Boolean);

  function nuevoPoke(run,especieId,nivel,ctx,rng=Math.random){
    const p={uid:'a'+(++run.contador),especieId,nivel,xp:ctx.Experiencia.xpTotal(ctx.grupoDe(especieId),nivel),genero:sortearGenero(ctx.rateDe(especieId),rng)};
    run.pokes.push(p);return p;
  }
  function nuevaRun(R,inicialId,ctx,nombre='Entrenador',rng=Math.random){
    const run={version:1,region:R.id,nombre,vidas:CFG.vidas,contador:0,pokes:[],equipo:[],objetos:{pokeball:CFG.inicial.pokeball},medallas:[],
      nodo:R.inicio,prog:0,completo:total(R.nodos[R.inicio])===0,enc:null,pendCaptura:null,stats:{combates:0,capturas:0,derrotas:0},fin:null,creada:Date.now()};
    run.equipo.push(nuevoPoke(run,inicialId,CFG.inicial.nivel,ctx,rng).uid);
    return run;
  }
  const dar=(run,pr)=>{for(const[k,n]of Object.entries(pr||{}))run.objetos[k]=(run.objetos[k]||0)+n};
  const tengo=(run,k)=>run.objetos[k]||0;

  // ---------- Evolución ----------
  // Opciones de evolución de la carta con su estado. Solo se evoluciona sola (al subir de nivel) la de tipo 'nivel';
  // las de objeto las elige el jugador. Las 'bloqueado' y 'stats' quedan fuera en la aventura por ahora.
  function puedeEvo(run,p,e){
    if(e.t==='bloqueado'||e.t==='stats')return{ok:false,motivo:'Próximamente'};
    if(e.nivel!=null&&p.nivel<e.nivel)return{ok:false,motivo:'Nivel '+e.nivel};
    if(e.g&&p.genero!==e.g)return{ok:false,motivo:e.g==='M'?'Solo macho':'Solo hembra'};
    if(e.t==='objeto'){
      const cs=[[e.o,e.n],...(e.x||[])];
      if(!cs.every(([k,n])=>tengo(run,k)>=n))return{ok:false,motivo:'Faltan objetos',costes:cs};
      return{ok:true,costes:cs};
    }
    return{ok:true,costes:[]};
  }
  const opcionesEvo=(run,p,ctx)=>(ctx.EVOLUCIONES[p.especieId]||[]).map(e=>({e,...puedeEvo(run,p,e)}));
  function aplicarEvo(run,p,e,ctx){
    for(const[k,n]of puedeEvo(run,p,e).costes||[]){run.objetos[k]=tengo(run,k)-n;if(run.objetos[k]<=0)delete run.objetos[k]}
    const g1=ctx.grupoDe(p.especieId);p.especieId=e.a;
    if(ctx.grupoDe(e.a)!==g1)p.xp=ctx.Experiencia.xpTotal(ctx.grupoDe(e.a),p.nivel);
    const r=ctx.rateDe(e.a),g=generoPor(r);if(g)p.genero=g;
  }
  function evolucionar(run,p,e,ctx){   // evolución elegida por el jugador (objeto). false si no se puede
    if(!puedeEvo(run,p,e).ok)return false;
    const de=p.especieId;aplicarEvo(run,p,e,ctx);return{de,a:p.especieId};
  }
  function evolucionAuto(run,p,ctx,rng=Math.random){
    const out=[];
    for(let i=0;i<4;i++){
      const ok=(ctx.EVOLUCIONES[p.especieId]||[]).filter(e=>e.t==='nivel'&&puedeEvo(run,p,e).ok);
      if(!ok.length)break;
      const e=ok[Math.floor(rng()*ok.length)];out.push({de:p.especieId,a:e.a});aplicarEvo(run,p,e,ctx);
    }
    return out;
  }
  function darXp(run,p,xp,ctx,rng){
    const antes=p.nivel;
    p.xp+=xp;p.nivel=Math.min(ctx.Experiencia.NIVEL_MAX,ctx.Experiencia.nivelPorXp(ctx.grupoDe(p.especieId),p.xp));
    return{xp,antes,despues:p.nivel,evol:evolucionAuto(run,p,ctx,rng)};
  }

  // ---------- Combates y nodos ----------
  function elegirEnc(n,rng){
    const t=n.encuentros.reduce((s,e)=>s+e.peso,0);let q=rng()*t,k=0;
    while(k<n.encuentros.length-1&&(q-=n.encuentros[k].peso)>0)k++;
    const e=n.encuentros[k];return{id:e.id,nv:e.min+Math.floor(rng()*(e.max-e.min+1))};
  }
  // Próximo combate del nodo (o null si ya está completo). El encuentro salvaje se guarda en la run para no cambiar al recargar.
  function pendiente(run,R,rng=Math.random){
    const n=R.nodos[run.nodo];if(run.completo||run.fin||run.pendCaptura)return null;
    if(n.tipo==='ruta'){
      if(!run.enc)run.enc=elegirEnc(n,rng);
      return{tipo:'salvaje',enemigos:[run.enc],entrenador:false,titulo:'Pokémon salvaje',n:run.prog+1,total:n.combates};
    }
    if(n.tipo==='entrenadores'){
      const t=n.entrenadores[run.prog];
      return{tipo:'entrenador',enemigos:t.equipo,entrenador:true,titulo:(t.titulo?t.titulo+' ':'')+t.nombre,n:run.prog+1,total:n.entrenadores.length};
    }
    return null;
  }
  // p = {enemigos:[{id,nv,bst}], usados:[uid], entrenador}. Devuelve el informe para la pantalla.
  function victoria(run,R,p,ctx,rng=Math.random){
    const n=R.nodos[run.nodo],inf={xp:0,subidas:[],premio:null,medalla:null,completo:false,captura:null,fin:null};
    inf.xp=p.enemigos.reduce((s,e)=>s+xpVictoria(e.bst||300,e.nv,p.entrenador),0);
    for(const uid of new Set(p.usados)){const q=poke(run,uid);if(q)inf.subidas.push({uid,...darXp(run,q,inf.xp,ctx,rng)})}
    run.stats.combates++;
    if(p.entrenador){
      const t=n.entrenadores[run.prog];
      if(t.medalla&&!run.medallas.includes(t.medalla)){run.medallas.push(t.medalla);inf.medalla=t.medalla}
    }else{run.pendCaptura={id:p.enemigos[0].id,nv:p.enemigos[0].nv};inf.captura=run.pendCaptura}
    run.enc=null;run.prog++;
    if(run.prog>=total(n)){
      run.completo=true;inf.completo=true;
      if(n.premio){dar(run,n.premio);inf.premio=n.premio}
      if(n.final)run.fin=inf.fin='victoria';
    }
    return inf;
  }
  function derrota(run,R,{entrenador}){
    const inf={vidasPerdidas:0,fin:false};
    if(entrenador||CFG.perderVidaSalvaje){
      run.vidas--;run.stats.derrotas++;inf.vidasPerdidas=1;
      if(run.vidas<=0){run.fin='derrota';inf.fin=true}
    }
    return inf;
  }
  // Avanza a otro nodo (solo si el actual está completo y es una de sus salidas).
  function elegirSiguiente(run,R,id){
    const n=R.nodos[run.nodo];
    if(!run.completo||run.fin||!n.sig||!n.sig.includes(id))return false;
    run.nodo=id;run.prog=0;run.enc=null;run.completo=total(R.nodos[id])===0;return true;
  }

  // ---------- Captura y equipo ----------
  function lanzarBola(run,ctx,rng=Math.random){
    const c=run.pendCaptura;if(!c)return{ok:false,motivo:'nada'};
    if(!(tengo(run,'pokeball')>0))return{ok:false,motivo:'sinBolas'};
    run.objetos.pokeball--;if(!run.objetos.pokeball)delete run.objetos.pokeball;
    const prob=probCaptura(ctx.rz(c.id));
    if(rng()<prob){
      const p=nuevoPoke(run,c.id,c.nv,ctx,rng),enEquipo=run.equipo.length<CFG.equipoMax;
      if(enEquipo)run.equipo.push(p.uid);
      run.pendCaptura=null;run.stats.capturas++;
      return{ok:true,capturado:true,poke:p,enEquipo};
    }
    if(rng()<CFG.huidaFallo){run.pendCaptura=null;return{ok:true,capturado:false,huyo:true}}
    return{ok:true,capturado:false,huyo:false,prob};
  }
  const soltarCaptura=run=>{run.pendCaptura=null};
  function alternarEquipo(run,uid){   // devuelve '' si ok o el motivo
    const i=run.equipo.indexOf(uid);
    if(i>=0){if(run.equipo.length<=1)return'Necesitas al menos un Pokémon en el equipo';run.equipo.splice(i,1);return''}
    if(run.equipo.length>=CFG.equipoMax)return'El equipo ya tiene '+CFG.equipoMax;
    run.equipo.push(uid);return'';
  }
  function liberar(run,uid){
    if(run.pokes.length<=1)return'No puedes liberar a tu último Pokémon';
    if(run.equipo.includes(uid)&&run.equipo.length<=1)return'Necesitas al menos un Pokémon en el equipo';
    run.pokes=run.pokes.filter(p=>p.uid!==uid);run.equipo=run.equipo.filter(u=>u!==uid);return'';
  }
  return{CFG,bst,escalar,xpVictoria,probCaptura,sortearGenero,total,poke,equipo,nuevaRun,nuevoPoke,opcionesEvo,evolucionar,evolucionAuto,darXp,
    pendiente,victoria,derrota,elegirSiguiente,lanzarBola,soltarCaptura,alternarEquipo,liberar};
})();
if(typeof module!=='undefined')module.exports=Aventura;