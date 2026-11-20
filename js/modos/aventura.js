// MODO AVENTURA LIBRE (pantallas): mapa por lugares, combates, captura, tienda, viaje rápido y equipo.
// Necesita: aventura/regiones.js, aventura/aventura.js, aventura/guardado-aventura.js, experiencia.js (+ experiencia-datos.js),
//           evoluciones-datos.js, rarezas.js, generos-datos.js y pokeapi.js (loadSp, SPR, jf, ERR) + el simulador (iniciarCombate).
// Los combates usan el motor del simulador: cada Pokémon se registra en TY con sus stats escalados por nivel (clave 'p25@12').
const ModoAventura=(()=>{
  const RC={N:'#94a3b8',R:'#4ade80',SR:'#60a5fa',SSR:'#c084fc',UR:'#fbbf24',LR:'#f472b6'};
  const GN={M:['♂','#60a5fa'],F:['♀','#f472b6']};
  const BOLAS=['pokeball','superball'];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const h=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
  const rz=id=>(typeof RAREZA_POR_ESPECIE!=='undefined'&&RAREZA_POR_ESPECIE[id]||['N'])[0];
  const grupoDe=id=>(typeof GRUPO_EXP!=='undefined'&&GRUPO_EXP[id])||'m';
  const ctx=()=>({Experiencia,grupoDe,EVOLUCIONES:typeof EVOLUCIONES!=='undefined'?EVOLUCIONES:{},
    rateDe:id=>typeof GENERO_RATE!=='undefined'?GENERO_RATE[id]:undefined,rz});
  let cont,salir,run=null,hayEstilo=false,ocupado=false;
  if(typeof OBJETOS!=='undefined'){if(!OBJETOS.pokeball)OBJETOS.pokeball=['Poké Ball','⚪'];if(!OBJETOS.superball)OBJETOS.superball=['Super Ball','🔵']}
  const objN=k=>typeof objetoNombre==='function'?objetoNombre(k):k,objI=k=>typeof objetoIcono==='function'?objetoIcono(k):'📦';
  const premioHtml=p=>Object.entries(p).map(([k,n])=>`<span title="${esc(objN(k))}" style="white-space:nowrap">${objI(k)}×${n}</span>`).join(' ');
  const R$=()=>REGIONES[run.region],nodoAct=()=>R$().nodos[run.nodo];

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
  async function guardar(){
    try{await GuardadoAventura.guardar(run)}
    catch(e){alert('No se pudo guardar la partida (¿sin espacio en el navegador?).')}
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
      .av-op{display:block;width:100%;text-align:left;margin:6px 0;padding:10px}
      .av-op small{opacity:.75}`));
  }
  function cabecera(titulo,atras){
    const d=h('div','display:flex;align-items:center;gap:8px;margin:8px 0;flex-wrap:wrap');
    if(atras){const b=h('button','','← Volver');b.onclick=atras;d.append(b)}
    d.append(h('b','font-size:16px',esc(titulo)));
    if(run)d.append(h('span','margin-left:auto;font-size:13px',
      `💰 <b>${run.dinero}</b> · 🏅 ${run.medallas.length} · ${BOLAS.map(k=>`${objI(k)}<b>${run.objetos[k]||0}</b>`).join(' ')}`));
    return d;
  }
  function tarjeta(p,{alClick,off,extra}={}){
    const r=rz(p.especieId),d=h('div','');d.className='av-card'+(off?' off':'');d.style.setProperty('--c',RC[r]);
    d.innerHTML=`<img src="${SPR+p.especieId}.png" alt=""><div class="n">${esc(nm(p.especieId))}</div><span class="r">${r}</span>${GN[p.genero]?` <b style="color:${GN[p.genero][1]}">${GN[p.genero][0]}</b>`:''}
      <small>Nv ${p.nivel}</small>${extra?`<small>${extra}</small>`:''}`;
    if(alClick)d.onclick=alClick;
    return d;
  }
  const sprites=l=>l.map(e=>`<img src="${SPR+e.id}.png" width="36" height="36" style="image-rendering:pixelated;vertical-align:middle" alt="" title="${esc(nm(e.id))}"><small>Nv ${e.nv}</small>`).join(' ');

  // ---------- Menú e inicial ----------
  async function pantallaMenu(){
    limpiar();run=null;cont.append(cabecera('🗺️ Aventura',salir));
    const g=await GuardadoAventura.cargar();
    if(g){
      const n=REGIONES[g.region].nodos[g.nodo],box=h('div','',`<b>Tu partida</b> · ${esc(REGIONES[g.region].nombre)} · ${n.icono} ${esc(n.nombre)}<br>
        <small>🏅 ${g.medallas.length} medalla${g.medallas.length===1?'':'s'} · ${g.pokes.length} Pokémon · 💰 ${g.dinero}</small><br>`);
      box.className='av-box';
      const c=h('button','margin:6px 6px 0 0;padding:8px 14px','▶ Continuar'),a=h('button','color:#f87171;margin-top:6px','🗑 Borrar partida');
      c.onclick=async()=>{run=g;await cargarNombres(g.pokes.map(p=>p.especieId));pantallaNodo()};
      a.onclick=async()=>{if(!confirm('¿Borrar la partida? Se pierde todo el progreso.'))return;await GuardadoAventura.borrar();pantallaMenu()};
      box.append(c,a);cont.append(box);
    }else{
      const nw=h('button','padding:12px 16px','🆕 Nueva partida');nw.onclick=pantallaInicial;cont.append(nw);
    }
  }
  async function pantallaInicial(){
    limpiar();run=null;cont.append(cabecera('Elige tu inicial',pantallaMenu));
    const R=REGIONES.kanto;await cargarNombres(R.iniciales);
    cont.append(h('p','margin:6px 0',`Empiezas en <b>${esc(R.nombre)}</b> con un Pokémon de nivel ${Aventura.CFG.inicial.nivel}, ${Aventura.CFG.inicial.pokeball} Poké Balls y 💰 ${Aventura.CFG.inicial.dinero}. Ve a donde quieras.`));
    const g=h('div','');g.className='av-grid';
    for(const id of R.iniciales)g.append(tarjeta({especieId:id,nivel:Aventura.CFG.inicial.nivel,genero:null},{alClick:async()=>{
      if(!confirm(`¿Empezar con ${nm(id)}?`))return;
      run=Aventura.nuevaPartida(R,id,ctx());await guardar();pantallaNodo();
    }}));
    cont.append(g);
  }

  // ---------- Lugar actual ----------
  async function pantallaNodo(aviso){
    if(run.pendCaptura)return pantallaCaptura();
    const R=R$(),n=nodoAct(),acc=Aventura.acciones(run,R);await guardar();   // el salvaje en curso queda fijado
    await cargarNombres([...Aventura.equipo(run).map(p=>p.especieId),...acc.flatMap(a=>a.enemigos.map(e=>e.id))]);
    limpiar();cont.append(cabecera(R.nombre,pantallaMenu));
    if(typeof aviso==='string')cont.append(h('p','color:#4ade80;margin:6px 0',esc(aviso)));
    const box=h('div','',`<div style="font-size:20px">${n.icono} <b>${esc(n.nombre)}</b></div><div style="font-size:12px;opacity:.8;margin:2px 0 6px">${esc(n.desc||'')}</div>`);
    box.className='av-box';
    for(const a of acc){
      if(a.hecho){box.append(h('div','font-size:12px;opacity:.6;margin:4px 0',`✔ ${esc(a.titulo)} (derrotado)`));continue}
      const b=h('button','');b.className='av-op';
      b.innerHTML=a.tipo==='salvaje'?`🌿 <b>Buscar Pokémon salvajes</b><br><small>Te sale al paso: ${esc(nm(a.enemigos[0].id))} de nivel ${a.enemigos[0].nv}</small>`
        :`${a.tipo==='gimnasio'?'🏟️':'⚔️'} <b>${esc(a.titulo)}</b><br>${sprites(a.enemigos)}`;
      b.onclick=()=>combatir(a.clave);box.append(b);
    }
    if(n.hallazgo&&!run.hallazgos[run.nodo]){const b=h('button','','🔎 <b>Buscar objetos</b>');b.className='av-op';b.innerHTML='🔎 <b>Buscar objetos</b><br><small>Puede que haya algo por aquí…</small>';
      b.onclick=async()=>{const p=Aventura.recogerHallazgo(run,R);await guardar();pantallaNodo('Encuentras: '+Object.entries(p).map(([k,v])=>v+' × '+objN(k)).join(', '))};box.append(b)}
    if(n.tienda){const b=h('button','');b.className='av-op';b.innerHTML='🛒 <b>Poké Mart</b><br><small>Bolas, caramelos y más</small>';b.onclick=()=>pantallaTienda(n.tienda);box.append(b)}
    cont.append(box);

    // Caminos: todos los lugares vecinos, sin orden obligatorio
    cont.append(h('div','margin-top:10px','<b>🧭 Ir a…</b>'));
    const cam=h('div','max-width:560px');
    for(const id of Aventura.vecinos(R,run.nodo)){
      const s=R.nodos[id],a=Aventura.acceso(run,R,id),b=h('button','');b.className='av-op';
      b.innerHTML=`${s.icono} <b>${esc(s.nombre)}</b>${run.visitados[id]?'':' <small>(nuevo)</small>'}<br><small>${a.ok?esc(s.desc||''):'🔒 '+esc(a.motivo)}</small>`;
      b.disabled=!a.ok;b.onclick=async()=>{const r=Aventura.ir(run,R,id);if(r.ok){await guardar();pantallaNodo()}else alert(r.motivo)};
      cam.append(b);
    }
    cont.append(cam);
    const vr=Aventura.viajeRapido(run,R);
    if(vr.length){const b=h('button','margin:6px 0','✈️ Viaje rápido ('+vr.length+')');b.onclick=pantallaViaje;cont.append(b)}

    cont.append(h('div','margin-top:10px','<b>Tu equipo</b>'));
    const g=h('div','');g.className='av-grid';
    for(const p of Aventura.equipo(run))g.append(tarjeta(p,{alClick:()=>pantallaPoke(p.uid)}));
    cont.append(g);
    const inv=Object.entries(run.objetos);
    cont.append(h('div','font-size:12px;margin:6px 0','<b>🎒</b> '+(inv.length?inv.map(([k,v])=>`${objI(k)} ${esc(objN(k))} ×${v}`).join(' · '):'vacía')));
    const eq=h('button','margin-top:6px','👥 Equipo y box');eq.onclick=()=>pantallaEquipo();cont.append(eq);
  }

  function pantallaViaje(){
    limpiar();cont.append(cabecera('✈️ Viaje rápido',()=>pantallaNodo()));
    const R=R$(),l=h('div','max-width:560px');
    for(const id of Aventura.viajeRapido(run,R)){
      const s=R.nodos[id],b=h('button','');b.className='av-op';b.innerHTML=`${s.icono} <b>${esc(s.nombre)}</b><br><small>${esc(s.desc||'')}</small>`;
      b.onclick=async()=>{const r=Aventura.ir(run,R,id,true);if(r.ok){await guardar();pantallaNodo()}else alert(r.motivo)};l.append(b);
    }
    cont.append(l);
  }

  // ---------- Tienda ----------
  function pantallaTienda(lista,aviso){
    limpiar();cont.append(cabecera('🛒 Poké Mart',()=>pantallaNodo()));
    if(typeof aviso==='string')cont.append(h('p','color:#4ade80;margin:6px 0',esc(aviso)));
    const l=h('div','max-width:560px');
    for(const it of lista){
      const f=h('div','display:flex;align-items:center;gap:8px;border:1px solid #334155;border-radius:8px;padding:6px 8px;margin:6px 0',
        `<div style="flex:1">${objI(it.o)} <b>${esc(objN(it.o))}</b> <small>(tienes ${run.objetos[it.o]||0})</small><br><small>💰 ${it.precio}</small></div>`);
      for(const n of[1,10]){
        const b=h('button','padding:4px 10px','×'+n);b.disabled=run.dinero<it.precio*n;
        b.onclick=async()=>{Aventura.comprar(run,it.o,it.precio,n);await guardar();pantallaTienda(lista,`Compras ${n} × ${objN(it.o)}.`)};f.append(b);
      }
      l.append(f);
    }
    cont.append(l);
  }

  // ---------- Puente con el combate del simulador ----------
  async function claveNivel(id,nv){   // registra en TY una versión de la especie con stats de ese nivel
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
  async function combatir(clave){
    if(ocupado)return;
    const R=R$(),a=Aventura.accion(run,R,clave);if(!a)return;
    ocupado=true;limpiar();cont.append(cabecera('Preparando combate…'));
    const st=h('p','margin:8px 0','Cargando…');cont.append(st);
    try{
      const jug=[],riv=[],bsts=[],mios=Aventura.equipo(run);
      for(let i=0;i<mios.length;i++){st.textContent=`Cargando tu equipo ${i+1}/${mios.length}…`;const t=await claveNivel(mios[i].especieId,mios[i].nivel);jug.push({t,s:[...TY[t].ds],uid:mios[i].uid})}
      for(let i=0;i<a.enemigos.length;i++){st.textContent=`Cargando rival ${i+1}/${a.enemigos.length}…`;const e=a.enemigos[i],t=await claveNivel(e.id,e.nv);riv.push({t,s:[...TY[t].ds]});bsts.push(TY[t].bst0)}
      const r=await lanzar(jug,riv);
      let inf=null;
      if(r.ganaJugador)inf=Aventura.victoria(run,R,{clave,enemigos:a.enemigos.map((e,i)=>({...e,bst:bsts[i]})),usados:r.usados},ctx());
      else if(!r.huyo)inf=Aventura.derrota(run);
      await guardar();ocupado=false;
      if(inf&&inf.subidas)await cargarNombres(inf.subidas.flatMap(s=>[Aventura.poke(run,s.uid).especieId,...s.evol.flatMap(e=>[e.de,e.a])]));
      pantallaResultado(r,inf||{},a);
    }catch(e){
      ocupado=false;st.textContent=ERR;
      const b=h('button','','← Volver');b.onclick=()=>pantallaNodo();cont.append(b);
    }
  }
  function pantallaResultado(r,inf,a){
    limpiar();cont.append(cabecera(r.ganaJugador?'🏆 ¡Victoria!':r.huyo?'💨 Has huido':'💀 Derrota'));
    const box=h('div','');box.className='av-box';
    if(r.ganaJugador){
      box.append(h('div','margin-bottom:6px',`Cada Pokémon que luchó gana <b>${inf.xp} XP</b> · 💰 +${inf.dinero}`));
      for(const s of inf.subidas){
        const p=Aventura.poke(run,s.uid);
        let t=`${esc(nm(p.especieId))}: Nv ${s.antes}${s.despues>s.antes?` → <b style="color:#4ade80">${s.despues}</b>`:''}`;
        for(const e of s.evol)t+=`<br>✨ ¡${esc(nm(e.de))} ha evolucionado a <b>${esc(nm(e.a))}</b>!`;
        box.append(h('div','margin:3px 0',t));
      }
      if(inf.medalla)box.append(h('div','margin-top:8px',`🏅 ¡Medalla ${esc(inf.medalla)} conseguida!`));
      if(inf.premio)box.append(h('div','margin-top:6px',`Premio: ${premioHtml(inf.premio)}`));
    }else if(r.huyo)box.append(h('div','',a.tipo==='salvaje'?'El Pokémon salvaje sigue ahí.':'Puedes volver a intentarlo cuando quieras.'));
    else box.append(h('div','','Tu equipo se retira a descansar. Sin castigo: sube de nivel o cambia de equipo y vuelve a intentarlo.'));
    cont.append(box);
    const b=h('button','padding:10px 16px','Continuar');b.onclick=()=>pantallaNodo();cont.append(b);
  }

  // ---------- Captura ----------
  async function pantallaCaptura(aviso){
    const c=run.pendCaptura;await cargarNombres([c.id]);
    limpiar();cont.append(cabecera('¡Está agotado!'));
    if(typeof aviso==='string')cont.append(h('p','color:#fbbf24;margin:6px 0',esc(aviso)));
    const r=rz(c.id);
    const box=h('div','text-align:center',`<img src="${SPR+c.id}.png" style="width:112px;height:112px;image-rendering:pixelated" alt="">
      <div><b>${esc(nm(c.id))}</b> Nv ${c.nv} <span style="background:${RC[r]};color:#0f172a;border-radius:8px;padding:0 8px;font-weight:700">${r}</span></div>`);
    box.className='av-box';
    let alguna=false;
    for(const k of BOLAS){
      const n=run.objetos[k]||0,pr=Math.round(Aventura.probCaptura(r,k)*100),b=h('button','margin:6px 4px;padding:8px 12px',`${objI(k)} ${esc(objN(k))} · ${pr} % <small>(tienes ${n})</small>`);
      b.disabled=n<=0;if(n>0)alguna=true;
      b.onclick=async()=>{
        const x=Aventura.lanzarBola(run,ctx(),k);await guardar();
        if(x.capturado){await nombreEs(x.poke.especieId);pantallaNodo(`¡${nm(x.poke.especieId)} capturado! ${x.enEquipo?'Se une a tu equipo.':'Va a la box (equipo completo).'}`)}
        else if(x.huyo)pantallaNodo('¡El Pokémon se ha escapado!');
        else pantallaCaptura('¡Se ha soltado! Puedes intentarlo otra vez (pero puede escapar).');
      };
      box.append(b);
    }
    if(!alguna)box.append(h('div','font-size:12px;opacity:.8','No te quedan bolas. Puedes comprar en un Poké Mart… pero este Pokémon se irá.'));
    const d=h('button','margin:6px 4px','Dejarlo marchar');d.onclick=async()=>{Aventura.soltarCaptura(run);await guardar();pantallaNodo()};
    box.append(h('br'),d);cont.append(box);
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
    cont.append(h('div','display:flex;gap:14px;flex-wrap:wrap;align-items:center',`<img src="${SPR+p.especieId}.png" style="width:112px;height:112px;image-rendering:pixelated" alt="">
      <div><div style="font-size:18px"><b>${esc(nm(p.especieId))}</b> <span style="background:${RC[r]};color:#0f172a;border-radius:8px;padding:0 8px;font-weight:700">${r}</span>${GN[p.genero]?` <b style="color:${GN[p.genero][1]}">${GN[p.genero][0]}</b>`:''}</div>
      <div>Nivel ${p.nivel}${sig?` · faltan ${sig} XP para el ${p.nivel+1}`:' · nivel máximo'}</div></div>`));
    // Caramelos
    cont.append(h('div','margin-top:12px','<b>🍬 Caramelos</b>'));
    for(const k of Object.keys(Experiencia.XP_CARAMELO)){
      const n=run.objetos[k]||0,f=h('div','display:flex;align-items:center;gap:6px;margin:4px 0;flex-wrap:wrap',`<span style="min-width:230px">${objI(k)} ${esc(objN(k))} <small>(+${Experiencia.XP_CARAMELO[k]} XP · tienes ${n})</small></span>`);
      for(const[t,c]of[['×1',1],['×10',10]]){
        const b=h('button','padding:2px 8px',t);b.disabled=n<=0||p.nivel>=Experiencia.NIVEL_MAX;
        b.onclick=async()=>{
          const x=Aventura.usarCaramelo(run,p,k,c,ctx());if(!x)return;await guardar();
          await cargarNombres(x.evol.flatMap(e=>[e.de,e.a]));
          pantallaPoke(uid,(x.despues>x.antes?`¡Sube del nivel ${x.antes} al ${x.despues}!`:`+${x.xp} XP`)+x.evol.map(e=>` ✨ ¡${nm(e.de)} evoluciona a ${nm(e.a)}!`).join(''));
        };
        f.append(b);
      }
      cont.append(f);
    }
    // Evolución
    cont.append(h('div','margin-top:12px','<b>🧬 Evolución</b>'));
    if(!ops.length)cont.append(h('p','opacity:.7;margin:6px 0','No tiene más evoluciones.'));
    for(const o of ops){
      const e=o.e,f=h('div','display:flex;align-items:center;gap:8px;border:1px solid #334155;border-radius:8px;padding:6px;margin:6px 0;max-width:520px');
      const req=e.t==='nivel'?`Nivel ${e.nivel} <small>(automática)</small>`:e.t==='objeto'?[[e.o,e.n],...(e.x||[])].map(([k,n])=>`${objI(k)} ${n} × ${esc(objN(k))} <small>(tienes ${run.objetos[k]||0})</small>`).join(' + '):'🔒 Próximamente';
      f.innerHTML=`<img src="${SPR+e.a}.png" style="width:48px;height:48px;image-rendering:pixelated" alt=""><div style="flex:1"><b>${esc(nm(e.a))}</b><br><span style="font-size:12px">${req}</span></div>`;
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

  // Punto de entrada: lo llama el menú de modos.
  async function abrir(contenedor,volver){cont=contenedor;salir=volver;estilo();pantallaMenu()}
  return{abrir};
})();