// Lógica del modo aventura LIBRE (código PURO: sin red ni DOM). Una partida = tu viaje por una región, con su box propia.
// Lo que se guarda (todo JSON):
//   partida = {version:2, region, nombre, contador, pokes:[{uid,especieId,nivel,xp,genero}], equipo:[uid...] (máx. 6),
//              objetos:{pokeball:n,...}, dinero, medallas:[], nodo (dónde estás), visitados:{id:1}, vencidos:{'nodo:e0':1,'nodo:gim':1},
//              hallazgos:{nodo:1}, enc (salvaje en curso), pendCaptura:{id,nv}|null, stats:{combates,capturas,derrotas}}
// Las funciones que necesitan datos del juego reciben `ctx`:
//   {Experiencia, grupoDe(id), EVOLUCIONES, rateDe(id), rz(id)}   (rz = rareza 'N'..'LR')
const Aventura=(()=>{
  // Todo lo ajustable está aquí (valores de EJEMPLO para probar).
  const CFG={
    inicial:{nivel:5,pokeball:8,dinero:300},
    equipoMax:6,
    escala:{stat:[.15,.85],hp:[.35,.65]},   // multiplicador = a + b·nivel/100 (nivel 100 = stats base completas)
    xp:{salvaje:1/8,entrenador:1.5/8},      // XP = suma de stats base del rival · su nivel · factor
    dinero:{salvaje:5,entrenador:40},       // salvaje: nivel·5 · entrenador: suma de niveles·40 (o el `dinero` del entrenador)
    captura:{N:.85,R:.7,SR:.5,SSR:.35,UR:.2,LR:.1},   // probabilidad de atrapar según la rareza de la especie
    bolas:{pokeball:1,superball:1.5},       // multiplicador de cada tipo de bola
    huidaFallo:.2,                          // probabilidad de que el Pokémon escape tras fallar una bola
  };
  const mult=(c,n)=>c[0]+c[1]*n/100;
  const bst=st=>Object.values(st).reduce((a,b)=>a+b,0);
  function escalar(st,H,nv,cfg=CFG){   // stats de combate de un Pokémon de cierto nivel
    const k=mult(cfg.escala.stat,nv),out={};
    for(const s in st)out[s]=Math.max(1,Math.round(st[s]*k));
    return{st:out,H:Math.max(10,Math.round(H*mult(cfg.escala.hp,nv)))};
  }
  const xpVictoria=(bstRival,nv,entrenador,cfg=CFG)=>Math.max(1,Math.round(bstRival*nv*(entrenador?cfg.xp.entrenador:cfg.xp.salvaje)));
  const probCaptura=(rareza,bola='pokeball',cfg=CFG)=>Math.min(.95,(cfg.captura[rareza]??.5)*(cfg.bolas[bola]||1));
  const generoPor=r=>r===undefined||r===null?null:r<0?'N':r===0?'M':r>=8?'F':null;
  function sortearGenero(r,rng=Math.random){const g=generoPor(r);return g||(r===undefined||r===null?null:rng()*8<r?'F':'M')}

  const poke=(run,uid)=>run.pokes.find(p=>p.uid===uid);
  const equipo=run=>run.equipo.map(u=>poke(run,u)).filter(Boolean);
  const tengo=(run,k)=>run.objetos[k]||0;
  const dar=(run,pr)=>{for(const[k,n]of Object.entries(pr||{}))run.objetos[k]=(run.objetos[k]||0)+n};
  const gastar=(run,k,n)=>{run.objetos[k]=tengo(run,k)-n;if(run.objetos[k]<=0)delete run.objetos[k]};

  function nuevoPoke(run,especieId,nivel,ctx,rng=Math.random){
    const p={uid:'a'+(++run.contador),especieId,nivel,xp:ctx.Experiencia.xpTotal(ctx.grupoDe(especieId),nivel),genero:sortearGenero(ctx.rateDe(especieId),rng)};
    run.pokes.push(p);return p;
  }
  function nuevaPartida(R,inicialId,ctx,nombre='Entrenador',rng=Math.random){
    const run={version:2,region:R.id,nombre,contador:0,pokes:[],equipo:[],objetos:{pokeball:CFG.inicial.pokeball},dinero:CFG.inicial.dinero,medallas:[],
      nodo:R.inicio,visitados:{[R.inicio]:1},vencidos:{},hallazgos:{},enc:null,pendCaptura:null,stats:{combates:0,capturas:0,derrotas:0},creada:Date.now()};
    run.equipo.push(nuevoPoke(run,inicialId,CFG.inicial.nivel,ctx,rng).uid);
    return run;
  }

  // ---------- Mapa libre ----------
  function vecinos(R,id){   // las conexiones valen en los dos sentidos
    const n=R.nodos[id];
    return Object.keys(R.nodos).filter(k=>k!==id&&((n.con||[]).includes(k)||(R.nodos[k].con||[]).includes(id)));
  }
  function acceso(run,R,id){   // {ok, motivo}
    const n=R.nodos[id];
    if(!n)return{ok:false,motivo:'No existe'};
    if(n.proximamente)return{ok:false,motivo:'Próximamente'};
    const q=n.requiere||{};
    if(q.medalla&&!run.medallas.includes(q.medalla))return{ok:false,motivo:'Necesitas la medalla '+q.medalla};
    if(q.medallas&&run.medallas.length<q.medallas)return{ok:false,motivo:'Necesitas '+q.medallas+' medallas'};
    return{ok:true};
  }
  const viajeRapido=(run,R)=>Object.keys(run.visitados).filter(id=>id!==run.nodo&&R.nodos[id]&&['pueblo','ciudad'].includes(R.nodos[id].tipo)&&acceso(run,R,id).ok);
  // Ir a un lugar vecino o, con rapido=true, a una ciudad/pueblo ya visitado. Devuelve {ok,motivo}.
  function ir(run,R,id,rapido=false){
    if(run.pendCaptura)return{ok:false,motivo:'Tienes un Pokémon por capturar'};
    const a=acceso(run,R,id);if(!a.ok)return a;
    if(rapido?!viajeRapido(run,R).includes(id):!vecinos(R,run.nodo).includes(id))return{ok:false,motivo:'No se puede ir allí desde aquí'};
    run.nodo=id;run.visitados[id]=1;run.enc=null;return{ok:true};
  }

  // ---------- Evolución ----------
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
    for(const[k,n]of puedeEvo(run,p,e).costes||[])gastar(run,k,n);
    const g1=ctx.grupoDe(p.especieId);p.especieId=e.a;
    if(ctx.grupoDe(e.a)!==g1)p.xp=ctx.Experiencia.xpTotal(ctx.grupoDe(e.a),p.nivel);
    const g=generoPor(ctx.rateDe(e.a));if(g)p.genero=g;
  }
  function evolucionar(run,p,e,ctx){   // evolución elegida por el jugador (objeto). false si no se puede
    if(!puedeEvo(run,p,e).ok)return false;
    const de=p.especieId;aplicarEvo(run,p,e,ctx);return{de,a:p.especieId};
  }
  function evolucionAuto(run,p,ctx,rng=Math.random){   // las de nivel se hacen solas
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
  // Caramelos: dan XP fija (Experiencia.XP_CARAMELO). Devuelve el resultado de darXp o null.
  function usarCaramelo(run,p,k,n,ctx,rng){
    const xpc=ctx.Experiencia.XP_CARAMELO[k];
    if(!xpc||p.nivel>=ctx.Experiencia.NIVEL_MAX)return null;
    const falta=ctx.Experiencia.xpTotal(ctx.grupoDe(p.especieId),ctx.Experiencia.NIVEL_MAX)-p.xp;
    n=Math.min(n,tengo(run,k),Math.ceil(falta/xpc));if(n<=0)return null;
    gastar(run,k,n);const r=darXp(run,p,n*xpc,ctx,rng);r.n=n;return r;
  }

  // ---------- Combates ----------
  function elegirEnc(n,rng){
    const t=n.encuentros.reduce((s,e)=>s+e.peso,0);let q=rng()*t,k=0;
    while(k<n.encuentros.length-1&&(q-=n.encuentros[k].peso)>0)k++;
    const e=n.encuentros[k];return{id:e.id,nv:e.min+Math.floor(rng()*(e.max-e.min+1))};
  }
  // Acciones de combate del lugar actual: [{clave, tipo, titulo, enemigos, hecho}]. 'salvaje' fija un encuentro en la partida.
  function acciones(run,R,rng=Math.random){
    const n=R.nodos[run.nodo],out=[];
    if(n.encuentros&&n.encuentros.length){
      if(!run.enc)run.enc=elegirEnc(n,rng);
      out.push({clave:'salvaje',tipo:'salvaje',titulo:'Pokémon salvaje',enemigos:[run.enc],hecho:false});
    }
    (n.entrenadores||[]).forEach((t,i)=>out.push({clave:'e'+i,tipo:'entrenador',titulo:(t.titulo?t.titulo+' ':'')+t.nombre,enemigos:t.equipo,hecho:!!run.vencidos[run.nodo+':e'+i]}));
    if(n.gimnasio)out.push({clave:'gim',tipo:'gimnasio',titulo:(n.gimnasio.titulo?n.gimnasio.titulo+' ':'')+n.gimnasio.nombre,enemigos:n.gimnasio.equipo,hecho:!!run.vencidos[run.nodo+':gim']});
    return out;
  }
  const accion=(run,R,clave,rng)=>acciones(run,R,rng).find(a=>a.clave===clave&&!a.hecho&&!run.pendCaptura)||null;
  const datosRival=(R,run,clave)=>{const n=R.nodos[run.nodo];return clave==='gim'?n.gimnasio:clave[0]==='e'?n.entrenadores[+clave.slice(1)]:null};
  // p = {clave, enemigos:[{id,nv,bst}], usados:[uid]}. Devuelve el informe para la pantalla.
  function victoria(run,R,p,ctx,rng=Math.random){
    const esT=p.clave!=='salvaje',rival=esT?datosRival(R,run,p.clave):null;
    const inf={xp:0,dinero:0,subidas:[],medalla:null,premio:null,captura:null};
    inf.xp=p.enemigos.reduce((s,e)=>s+xpVictoria(e.bst||300,e.nv,esT),0);
    inf.dinero=esT?(rival.dinero??p.enemigos.reduce((s,e)=>s+e.nv,0)*CFG.dinero.entrenador):p.enemigos[0].nv*CFG.dinero.salvaje;
    run.dinero+=inf.dinero;
    for(const uid of new Set(p.usados)){const q=poke(run,uid);if(q)inf.subidas.push({uid,...darXp(run,q,inf.xp,ctx,rng)})}
    run.stats.combates++;
    if(esT){
      run.vencidos[run.nodo+':'+p.clave]=1;
      if(rival.medalla&&!run.medallas.includes(rival.medalla)){run.medallas.push(rival.medalla);inf.medalla=rival.medalla}
      if(rival.premio){dar(run,rival.premio);inf.premio=rival.premio}
    }else{run.pendCaptura={id:p.enemigos[0].id,nv:p.enemigos[0].nv};inf.captura=run.pendCaptura;run.enc=null}
    return inf;
  }
  const derrota=run=>{run.stats.derrotas++;return{}};   // sin castigo: puedes volver a intentarlo

  // ---------- Captura, tienda, hallazgos y equipo ----------
  function lanzarBola(run,ctx,bola='pokeball',rng=Math.random){
    const c=run.pendCaptura;if(!c)return{ok:false,motivo:'nada'};
    if(!(tengo(run,bola)>0))return{ok:false,motivo:'sinBolas'};
    gastar(run,bola,1);
    const prob=probCaptura(ctx.rz(c.id),bola);
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
  function comprar(run,o,precio,n=1){
    if(run.dinero<precio*n)return false;
    run.dinero-=precio*n;dar(run,{[o]:n});return true;
  }
  function recogerHallazgo(run,R){
    const n=R.nodos[run.nodo];
    if(!n.hallazgo||run.hallazgos[run.nodo])return null;
    run.hallazgos[run.nodo]=1;dar(run,n.hallazgo);return n.hallazgo;
  }
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
  return{CFG,bst,escalar,xpVictoria,probCaptura,sortearGenero,poke,equipo,tengo,nuevaPartida,nuevoPoke,vecinos,acceso,viajeRapido,ir,
    opcionesEvo,evolucionar,evolucionAuto,darXp,usarCaramelo,acciones,accion,victoria,derrota,lanzarBola,soltarCaptura,comprar,
    recogerHallazgo,alternarEquipo,liberar};
})();
if(typeof module!=='undefined')module.exports=Aventura;