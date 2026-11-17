// MODO AVENTURA (pantallas): menú, elegir inicial, mapa por nodos, combates, captura y equipo.
// Necesita: aventura/regiones.js, aventura/aventura.js, aventura/guardado-aventura.js, experiencia.js (+ experiencia-datos.js),
//           evoluciones-datos.js, rarezas.js, generos-datos.js y pokeapi.js (loadSp, SPR, jf, ERR) + el simulador (iniciarCombate).
// Los combates usan el motor del simulador: cada Pokémon se registra en TY con sus stats escalados por nivel (clave 'p25@12').
const ModoAventura=(()=>{
  const RC={N:'#94a3b8',R:'#4ade80',SR:'#60a5fa',SSR:'#c084fc',UR:'#fbbf24',LR:'#f472b6'};
  const GN={M:['♂','#60a5fa'],F:['♀','#f472b6']};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const h=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
  const rz=id=>(typeof RAREZA_POR_ESPECIE!=='undefined'&&RAREZA_POR_ESPECIE[id]||['N'])[0];
  const grupoDe=id=>(typeof GRUPO_EXP!=='undefined'&&GRUPO_EXP[id])||'m';
  const ctx=()=>({Experiencia,grupoDe,EVOLUCIONES:typeof EVOLUCIONES!=='undefined'?EVOLUCIONES:{},
    rateDe:id=>typeof GENERO_RATE!=='undefined'?GENERO_RATE[id]:undefined,rz});
  let cont,salir,run=null,hayEstilo=false,ocupado=false;
  if(typeof OBJETOS!=='undefined'&&!OBJETOS.pokeball)OBJETOS.pokeball=['Poké Ball','⚪'];
  const objN=k=>typeof objetoNombre==='function'?objetoNombre(k):k,objI=k=>typeof objetoIcono==='function'?objetoIcono(k):'📦';
  const premioHtml=p=>Object.entries(p).map(([k,n])=>`<span title="${esc(objN(k))}" style="white-space:nowrap">${objI(k)}×${n}</span>`).join(' ');

  // Nombres en español (misma caché que el gacha)
  let NOM={};try{NOM=JSON.parse(localStorage.getItem('nombres-es-v1')||'{}')}catch(e){}
  async function nombreEs(id){
    if(NOM[id])return NOM[id];
    try{
      const s=await jf(API+'pokemon-species/'+id+'/');
      NOM[id]=(s.names.find(x=>x.language.name==='es')||s.names.find(x=>x.language.name==='en')||{name:s.name}).name;
      try{localStorage.setItem('nombres-es-v1',JSON.stringify(NOM))}catch(e){}
      return NOM[id];
    }catch(e){return'#'+id}
  }
  const nm=id=>NOM[id]||'#'+id;
  const cargarNombres=ids=>Promise.all([...new Set(ids)].map(nombreEs));

  const reg=()=>REGIONES[run.region];
  const nodoAct=()=>reg().nodos[run.nodo];
  async function guardar(){
    try{await GuardadoAventura.guardar(run)}
    catch(e){alert('No se pudo guardar la run (¿sin espacio en el navegador?).')}
  }
  const limpiar=()=>{cont.innerHTML='';window.scrollTo&&window.scrollTo(0,0)};

  function estilo(){
    if(hayEstilo)return;hayEstilo=true;
    document.head.append(h('style','',`
      .av-grid{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
      .av-card{width:104px;border:2px solid var(--c);border-radius:10px;padding:6px 4px;text-align:center;background:#0f172a;color:#e2e8f0;cursor:pointer;font:12px system-ui,sans-serif}
      .av-card.off{opacity:.55;border-style:dashed}
      .av-card img{width:72px;height:72px;image-rendering:pixelated}
      .av-card .r{display:inline-block;padding:0 6px;border-radius:8px;background:var(--c);color:#0f172a;font-weight:700;font-size:11px}
      .av-card small{display:block;opacity:.75}
      .av-box{border:1px solid #334155;border-radius:10px;padding:10px;margin:10px 0;max-width:560px}
      .av-dot{display:inline-block;width:12px;height:12px;border-radius:50%;border:2px solid #4ade80;margin-right:4px}
      .av-dot.on{background:#4ade80}`));
  }

  function cabecera(titulo,atras){
    const d=h('div','display:flex;align-items:center;gap:8px;margin:8px 0;flex-wrap:wrap');
    if(atras){const b=h('button','','← Volver');b.onclick=atras;d.append(b)}
    d.append(h('b','font-size:16px',esc(titulo)));
    if(run)d.append(h('span','margin-left:auto;font-size:13px',
      `${'❤️'.repeat(Math.max(0,run.vidas))||'💀'} · 🏅 ${run.medallas.length} · ${objI('pokeball')} <b>${run.objetos.pokeball||0}</b>`));
    return d;
  }
  function tarjeta(p,{alClick,off,extra}={}){
    const r=rz(p.especieId),d=h('div','');d.className='av-card'+(off?' off':'');d.style.setProperty('--c',RC[r]);
    d.innerHTML=`<img src="${SPR+p.especieId}.png" alt=""><div class="n">${esc(nm(p.especieId))}</div><span class="r">${r}</span>${GN[p.genero]?` <b style="color:${GN[p.genero][1]}">${GN[p.genero][0]}</b>`:''}
      <small>Nv ${p.nivel}</small>${extra?`<small>${extra}</small>`:''}`;
    if(alClick)d.onclick=alClick;
    return d;
  }

  // ---------- Menú ----------
  async function pantallaMenu(){
    limpiar();run=null;cont.append(cabecera('🗺️ Aventura',salir));
    const g=await GuardadoAventura.cargar();
    if(g){
      const n=REGIONES[g.region].nodos[g.nodo],box=h('div','',`<b>Run en curso</b> · ${esc(REGIONES[g.region].nombre)} · ${n.icono} ${esc(n.nombre)}<br>
        <small>${'❤️'.repeat(Math.max(0,g.vidas))} · 🏅 ${g.medallas.length} medalla${g.medallas.length===1?'':'s'} · ${g.pokes.length} Pokémon</small><br>`);
      box.className='av-box';
      const c=h('button','margin:6px 6px 0 0','▶ Continuar'),a=h('button','color:#f87171;margin-top:6px','🗑 Abandonar');
      c.onclick=async()=>{run=g;await cargarNombres(g.pokes.map(p=>p.especieId));pantallaNodo()};
      a.onclick=async()=>{if(!confirm('¿Abandonar la run? Se pierde todo el progreso.'))return;await GuardadoAventura.archivar(g);pantallaMenu()};
      box.append(c,a);cont.append(box);
    }
    const nw=h('button','padding:12px 16px',g?'🆕 Nueva run (sustituye a la actual)':'🆕 Nueva run');
    nw.onclick=()=>{if(g&&!confirm('Ya tienes una run en curso. ¿Empezar otra y perder la actual?'))return;pantallaInicial()};
    cont.append(nw);
    const hist=await GuardadoAventura.historial();
    if(hist.length)cont.append(h('div','margin-top:16px;font-size:12px;max-width:560px','<b>Últimas runs</b><br>'+hist.slice(0,5).map(x=>
      `${x.resultado==='victoria'?'🏆':x.resultado==='derrota'?'💀':'🚪'} ${x.fecha} · ${esc(x.region)} · 🏅${x.medallas} · ${x.capturas} capturas · ${x.combates} combates`).join('<br>')));
  }

  async function pantallaInicial(){
    limpiar();run=null;cont.append(cabecera('Elige tu inicial',pantallaMenu));
    const R=REGIONES.kanto;await cargarNombres(R.iniciales);
    cont.append(h('p','margin:6px 0',`Empiezas en <b>${esc(R.nombre)}</b> con un Pokémon de nivel ${Aventura.CFG.inicial.nivel} y ${Aventura.CFG.inicial.pokeball} Poké Balls.`));
    const g=h('div','');g.className='av-grid';
    for(const id of R.iniciales){
      const c=tarjeta({especieId:id,nivel:Aventura.CFG.inicial.nivel,genero:null},{alClick:async()=>{
        if(!confirm(`¿Empezar con ${nm(id)}?`))return;
        run=Aventura.nuevaRun(R,id,ctx());await guardar();pantallaNodo();
      }});
      g.append(c);
    }
    cont.append(g);
  }

  // ---------- Mapa por nodos ----------
  async function pantallaNodo(aviso){
    if(run.fin)return pantallaFin();
    if(run.pendCaptura)return pantallaCaptura();
    const R=reg(),n=nodoAct();
    const pend=Aventura.pendiente(run,R);if(pend)await guardar();   // el encuentro salvaje queda fijado en la run
    await cargarNombres([...Aventura.equipo(run).map(p=>p.especieId),...(pend?pend.enemigos.map(e=>e.id):[])]);
    limpiar();cont.append(cabecera(R.nombre,pantallaMenu));
    if(typeof aviso==='string')cont.append(h('p','color:#4ade80;margin:6px 0',esc(aviso)));
    const tot=Aventura.total(n),box=h('div','',`<div style="font-size:20px">${n.icono} <b>${esc(n.nombre)}</b></div><div style="font-size:12px;opacity:.8;margin:2px 0">${esc(n.desc||'')}</div>`);
    box.className='av-box';
    if(tot)box.append(h('div','margin:6px 0',Array.from({length:tot},(_,i)=>`<span class="av-dot${i<run.prog?' on':''}"></span>`).join('')+` <small>${run.prog}/${tot}</small>`));
    if(!run.completo&&pend){
      if(pend.tipo==='salvaje')box.append(h('div','margin:6px 0',`Te sale al paso: <b>${esc(nm(pend.enemigos[0].id))}</b> salvaje de nivel ${pend.enemigos[0].nv}`));
      else box.append(h('div','margin:6px 0',`<b>${esc(pend.titulo)}</b>: ${pend.enemigos.map(e=>`<img src="${SPR+e.id}.png" width="40" height="40" style="image-rendering:pixelated;vertical-align:middle" alt="" title="${esc(nm(e.id))}">Nv ${e.nv}`).join(' ')}`));
      const b=h('button','padding:10px 16px','⚔️ ¡Combatir!');b.onclick=combatir;box.append(b);
    }else if(run.completo){
      box.append(h('div','color:#4ade80;margin:6px 0','✅ Completado'));
      for(const id of n.sig||[]){
        const s=R.nodos[id],b=h('button','display:block;text-align:left;margin:6px 0;padding:10px;width:100%',`${s.icono} <b>${esc(s.nombre)}</b><br><small>${esc(s.desc||'')}</small>`);
        b.onclick=async()=>{Aventura.elegirSiguiente(run,R,id);await guardar();pantallaNodo()};
        box.append(b);
      }
    }
    cont.append(box);
    cont.append(h('div','margin-top:10px','<b>Tu equipo</b>'));
    const g=h('div','');g.className='av-grid';
    for(const p of Aventura.equipo(run))g.append(tarjeta(p));
    cont.append(g);
    const inv=Object.entries(run.objetos);
    cont.append(h('div','font-size:12px;margin:6px 0','<b>🎒</b> '+(inv.length?inv.map(([k,v])=>`${objI(k)} ${esc(objN(k))} ×${v}`).join(' · '):'vacía')));
    const eq=h('button','margin-top:6px','👥 Equipo y box');eq.onclick=()=>pantallaEquipo();cont.append(eq);
  }

  // ---------- Puente con el combate del simulador ----------
  // Registra en TY una versión de la especie con stats de ese nivel y devuelve su clave.
  async function claveNivel(id,nv){
    const base=await loadSp(id),key=base+'@'+nv;
    if(!TY[key]){const b=TY[base],e=Aventura.escalar(b.st,b.H,nv);TY[key]={...b,st:e.st,H:e.H,n:b.n+' Nv '+nv,bst0:Aventura.bst(b.st)}}
    return key;
  }
  let alContinuar=null;
  document.addEventListener('click',e=>{if(e.target&&e.target.id==='av-ok'&&alContinuar)alContinuar()});
  // Lanza un combate (equipos = listas de {t,s,uid}) y devuelve {ganaJugador, huyo, usados:[uid]}.
  function lanzar(eqJ,eqR){
    return new Promise(res=>{
      const cerrar=r=>{
        alContinuar=null;alTerminarCombate=null;alSalirCombate=null;over=true;inGame=false;
        $('#game').style.display='none';$('#ban').style.display='none';
        $('#setup').style.display='flex';$('#go').style.display='block';$('#srch').style.display='block';   // como toSetup(), para no romper el simulador
        document.body.classList.remove('av-combate');$('#rs').textContent='Equipos';
        res(r);
      };
      alTerminarCombate=w=>{
        const r={ganaJugador:w===0,huyo:false,usados:team[0].filter(u=>u.used).map(u=>u.uid)};
        $('#ban').innerHTML=`${r.ganaJugador?'🏆<br>¡Victoria!':'💀<br>Derrota'}<div style="margin-top:10px"><button id="av-ok">Continuar</button></div>`;
        alContinuar=()=>cerrar(r);
      };
      alSalirCombate=()=>{if(confirm('¿Huir del combate?'))cerrar({ganaJugador:false,huyo:true,usados:[]})};
      document.body.classList.add('av-combate');$('#rs').textContent='Huir';
      iniciarCombate([eqJ,eqR]);
    });
  }

  async function combatir(){
    if(ocupado)return;
    const R=reg(),pend=Aventura.pendiente(run,R);if(!pend)return;
    ocupado=true;limpiar();cont.append(cabecera('Preparando combate…'));
    const st=h('p','margin:8px 0','Cargando…');cont.append(st);
    try{
      const jug=[],riv=[],bsts=[],mios=Aventura.equipo(run);
      for(let i=0;i<mios.length;i++){st.textContent=`Cargando tu equipo ${i+1}/${mios.length}…`;const t=await claveNivel(mios[i].especieId,mios[i].nivel);jug.push({t,s:[...TY[t].ds],uid:mios[i].uid})}
      for(let i=0;i<pend.enemigos.length;i++){st.textContent=`Cargando rival ${i+1}/${pend.enemigos.length}…`;const e=pend.enemigos[i],t=await claveNivel(e.id,e.nv);riv.push({t,s:[...TY[t].ds]});bsts.push(TY[t].bst0)}
      const r=await lanzar(jug,riv);
      let inf=null;
      if(r.ganaJugador)inf=Aventura.victoria(run,R,{enemigos:pend.enemigos.map((e,i)=>({...e,bst:bsts[i]})),usados:r.usados,entrenador:pend.entrenador},ctx());
      else inf=Aventura.derrota(run,R,{entrenador:pend.entrenador});
      await guardar();ocupado=false;
      await cargarNombres([...(inf.subidas||[]).flatMap(s=>[Aventura.poke(run,s.uid).especieId,...s.evol.flatMap(e=>[e.de,e.a])])]);
      pantallaResultado(r,inf,pend);
    }catch(e){
      ocupado=false;st.textContent=ERR;
      const b=h('button','','← Volver');b.onclick=()=>pantallaNodo();cont.append(b);
    }
  }

  function pantallaResultado(r,inf,pend){
    limpiar();cont.append(cabecera(r.ganaJugador?'🏆 ¡Victoria!':r.huyo?'💨 Has huido':'💀 Derrota'));
    const box=h('div','');box.className='av-box';
    if(r.ganaJugador){
      box.append(h('div','margin-bottom:6px',`Cada Pokémon que luchó gana <b>${inf.xp} XP</b>.`));
      for(const s of inf.subidas){
        const p=Aventura.poke(run,s.uid);
        let t=`${esc(nm(p.especieId))}: Nv ${s.antes}${s.despues>s.antes?` → <b style="color:#4ade80">${s.despues}</b>`:''}`;
        for(const e of s.evol)t+=`<br>✨ ¡${esc(nm(e.de))} ha evolucionado a <b>${esc(nm(e.a))}</b>!`;
        box.append(h('div','margin:3px 0',t));
      }
      if(inf.medalla)box.append(h('div','margin-top:8px',`🏅 ¡Medalla ${esc(inf.medalla)} conseguida!`));
      if(inf.completo)box.append(h('div','margin-top:8px;color:#4ade80',`✅ Has completado <b>${esc(nodoNombre())}</b>${inf.premio?`. Premio: ${premioHtml(inf.premio)}`:''}`));
    }else if(r.huyo)box.append(h('div','',pend.entrenador?'Huir de un entrenador cuenta como derrota.':'El Pokémon salvaje sigue ahí: puedes volver a intentarlo.'));
    else box.append(h('div','',pend.entrenador?'Has perdido contra el entrenador.':'Tu equipo no ha podido con el Pokémon salvaje. Puedes volver a intentarlo.'));
    if(!r.ganaJugador&&inf.vidasPerdidas)box.append(h('div','margin-top:6px;color:#fbbf24',`❤️ Pierdes una vida. Te quedan ${Math.max(0,run.vidas)}.`));
    cont.append(box);
    const b=h('button','padding:10px 16px','Continuar');b.onclick=()=>pantallaNodo();cont.append(b);
  }
  const nodoNombre=()=>nodoAct().nombre;

  // ---------- Captura ----------
  async function pantallaCaptura(aviso){
    const c=run.pendCaptura;await cargarNombres([c.id]);
    limpiar();cont.append(cabecera('¡Está agotado!'));
    if(typeof aviso==='string')cont.append(h('p','color:#fbbf24;margin:6px 0',esc(aviso)));
    const r=rz(c.id),pr=Math.round(Aventura.probCaptura(r)*100),bolas=run.objetos.pokeball||0;
    const box=h('div','text-align:center',`<img src="${SPR+c.id}.png" style="width:112px;height:112px;image-rendering:pixelated" alt="">
      <div><b>${esc(nm(c.id))}</b> Nv ${c.nv} <span style="background:${RC[r]};color:#0f172a;border-radius:8px;padding:0 8px;font-weight:700">${r}</span></div>
      <div style="font-size:12px;margin:6px 0">Probabilidad de captura: <b>${pr} %</b> · ${objI('pokeball')} Poké Balls: <b>${bolas}</b></div>`);
    box.className='av-box';
    const l=h('button','margin:4px 6px;padding:10px 16px',`${objI('pokeball')} Lanzar Poké Ball`),d=h('button','margin:4px 6px','Dejarlo marchar');
    l.disabled=bolas<=0;if(bolas<=0)box.append(h('div','font-size:12px;opacity:.8','No te quedan Poké Balls.'));
    l.onclick=async()=>{
      const x=Aventura.lanzarBola(run,ctx());await guardar();
      if(x.capturado){await nombreEs(x.poke.especieId);pantallaNodo(`¡${nm(x.poke.especieId)} capturado! ${x.enEquipo?'Se une a tu equipo.':'Va a la box (equipo completo).'}`)}
      else if(x.huyo)pantallaNodo('¡El Pokémon se ha escapado!');
      else pantallaCaptura('¡Se ha soltado! Puedes intentarlo otra vez (pero puede escapar).');
    };
    d.onclick=async()=>{Aventura.soltarCaptura(run);await guardar();pantallaNodo()};
    box.append(l,d);cont.append(box);
  }

  // ---------- Equipo y box ----------
  async function pantallaEquipo(aviso){
    await cargarNombres(run.pokes.map(p=>p.especieId));
    limpiar();cont.append(cabecera('👥 Equipo y box',()=>pantallaNodo()));
    if(typeof aviso==='string')cont.append(h('p','color:#4ade80;margin:6px 0',esc(aviso)));
    const sec=(t,l)=>{cont.append(h('div','margin-top:8px',`<b>${t}</b>`));const g=h('div','');g.className='av-grid';
      if(!l.length)g.append(h('small','opacity:.7','Vacío'));
      for(const p of l)g.append(tarjeta(p,{alClick:()=>pantallaPoke(p.uid),off:!run.equipo.includes(p.uid)}));cont.append(g)};
    sec(`Equipo (${run.equipo.length}/${Aventura.CFG.equipoMax})`,Aventura.equipo(run));
    sec('Box',run.pokes.filter(p=>!run.equipo.includes(p.uid)));
  }

  async function pantallaPoke(uid,aviso){
    const p=Aventura.poke(run,uid);if(!p)return pantallaEquipo();
    const ops=Aventura.opcionesEvo(run,p,ctx());await cargarNombres([p.especieId,...ops.map(o=>o.e.a)]);
    limpiar();cont.append(cabecera(nm(p.especieId),()=>pantallaEquipo()));
    if(typeof aviso==='string')cont.append(h('p','color:#4ade80;margin:6px 0',esc(aviso)));
    const g=grupoDe(p.especieId),r=rz(p.especieId),sig=p.nivel<Experiencia.NIVEL_MAX?Experiencia.xpTotal(g,p.nivel+1)-p.xp:0;
    const d=h('div','display:flex;gap:14px;flex-wrap:wrap;align-items:center',`<img src="${SPR+p.especieId}.png" style="width:112px;height:112px;image-rendering:pixelated" alt="">
      <div><div style="font-size:18px"><b>${esc(nm(p.especieId))}</b> <span style="background:${RC[r]};color:#0f172a;border-radius:8px;padding:0 8px;font-weight:700">${r}</span>${GN[p.genero]?` <b style="color:${GN[p.genero][1]}">${GN[p.genero][0]}</b>`:''}</div>
      <div>Nivel ${p.nivel}${sig?` · faltan ${sig} XP para el ${p.nivel+1}`:' · nivel máximo'}</div></div>`);
    cont.append(d);
    cont.append(h('div','margin-top:12px','<b>🧬 Evolución</b>'));
    if(!ops.length)cont.append(h('p','opacity:.7;margin:6px 0','No tiene más evoluciones.'));
    for(const o of ops){
      const e=o.e,f=h('div','display:flex;align-items:center;gap:8px;border:1px solid #334155;border-radius:8px;padding:6px;margin:6px 0;max-width:520px');
      const req=e.t==='nivel'?`Nivel ${e.nivel} <small>(automática)</small>`:e.t==='objeto'?[[e.o,e.n],...(e.x||[])].map(([k,n])=>`${objI(k)} ${n} × ${esc(objN(k))} <small>(tienes ${run.objetos[k]||0})</small>`).join(' + '):'🔒 Próximamente';
      f.innerHTML=`<img src="${SPR+e.a}.png" style="width:48px;height:48px;image-rendering:pixelated" alt=""><div style="flex:1"><b>${esc(nm(e.a))}</b><br><span style="font-size:12px">${req}${!o.ok&&o.motivo&&e.t==='objeto'&&o.motivo!=='Faltan objetos'?` · ${esc(o.motivo)}`:''}</span></div>`;
      if(e.t==='objeto'){
        const b=h('button','','Evolucionar');b.disabled=!o.ok;
        b.onclick=async()=>{if(!confirm(`¿Evolucionar a ${nm(e.a)}?`))return;const x=Aventura.evolucionar(run,p,e,ctx());await guardar();pantallaPoke(uid,x?`¡${nm(x.de)} ha evolucionado a ${nm(x.a)}!`:null)};
        f.append(b);
      }
      cont.append(f);
    }
    const en=run.equipo.includes(uid),b1=h('button','margin:12px 8px 0 0',en?'📦 Pasar a la box':'⭐ Añadir al equipo'),b2=h('button','color:#f87171;margin-top:12px','Liberar');
    b1.onclick=async()=>{const m=Aventura.alternarEquipo(run,uid);if(m){alert(m);return}await guardar();pantallaPoke(uid,en?'Pasa a la box.':'Entra en el equipo.')};
    b2.onclick=async()=>{if(!confirm(`¿Liberar a ${nm(p.especieId)}? No se puede deshacer.`))return;const m=Aventura.liberar(run,uid);if(m){alert(m);return}await guardar();pantallaEquipo('Pokémon liberado.')};
    cont.append(b1,b2);
  }

  // ---------- Fin de la run ----------
  function pantallaFin(){
    limpiar();const gana=run.fin==='victoria';cont.append(cabecera(gana?'🏆 ¡Run completada!':'💀 Fin de la run'));
    const box=h('div','',`<div style="font-size:16px;margin-bottom:6px">${gana?'¡Has llegado hasta el final de esta versión de Kanto!':'Te has quedado sin vidas.'}</div>
      🏅 Medallas: <b>${run.medallas.length}</b> (${esc(run.medallas.join(', ')||'ninguna')})<br>⚔️ Combates ganados: <b>${run.stats.combates}</b><br>
      🎯 Capturas: <b>${run.stats.capturas}</b> · 👥 Pokémon: <b>${run.pokes.length}</b><br>💥 Derrotas: <b>${run.stats.derrotas}</b>`);
    box.className='av-box';cont.append(box);
    const b=h('button','padding:10px 16px','Volver al menú');b.onclick=async()=>{await GuardadoAventura.archivar(run);pantallaMenu()};cont.append(b);
  }

  // Punto de entrada: lo llama el menú de modos.
  async function abrir(contenedor,volver){cont=contenedor;salir=volver;estilo();pantallaMenu()}
  return{abrir};
})();