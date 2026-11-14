// MODO GACHA (pantallas): perfil, menú, banners (banner inicial con reroll), box y partida.
// Necesita: guardado.js, banners.js + banners-datos.js, rarezas.js, arquetipos.js y pokeapi.js (API, SPR, jf).
// Es una primera versión sencilla: las opciones sin hacer salen como "Próximamente".
const Gacha=(()=>{
  const RC={N:'#94a3b8',R:'#4ade80',SR:'#60a5fa',SSR:'#c084fc',UR:'#fbbf24',LR:'#f472b6'},ORD=['N','R','SR','SSR','UR','LR'];
  const ST={hp:'PS',atk:'Ataque',def:'Defensa',spa:'At. Esp.',spd:'Def. Esp.',spe:'Velocidad'};
  const rz=id=>(typeof RAREZA_POR_ESPECIE!=='undefined'&&RAREZA_POR_ESPECIE[id]||['N'])[0];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const h=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
  let cont,salir,perfil=null,partida=null,hayEstilo=false;

  // Nombres en español (se descargan de la PokéAPI una vez y se guardan en el navegador)
  let NOM={};try{NOM=JSON.parse(localStorage.getItem('nombres-es-v1')||'{}')}catch(e){}
  async function nombreEs(id){
    if(NOM[id])return NOM[id];
    try{
      const s=await jf(API+'pokemon-species/'+id+'/');
      const n=(s.names.find(x=>x.language.name==='es')||s.names.find(x=>x.language.name==='en')||{name:s.name}).name;
      NOM[id]=n;try{localStorage.setItem('nombres-es-v1',JSON.stringify(NOM))}catch(e){}
      return n;
    }catch(e){return'#'+id}
  }
  const nombreArq=a=>(typeof ARQUETIPOS!=='undefined'&&ARQUETIPOS[a]?ARQUETIPOS[a].nombre:a);


  // Kit de 4 ataques de una carta: se calcula con especie + arquetipo (no se guarda en la partida).
  // El resultado se guarda en caché del navegador, porque la 1ª vez hay que descargar los ataques de la especie.
  const KC='kits-cartas-v1',KE='kits-especies-v1';
  let KITS={};try{KITS=JSON.parse(localStorage.getItem(KC)||'{}')}catch(_){}
  const CATN={phy:'Físico',spe:'Especial',sta:'Estado'},ESTN={contacto:'Contacto',distancia:'Distancia',area:'Área',utilidad:'Utilidad'};
  const TIPN={normal:'Normal',fire:'Fuego',water:'Agua',elec:'Eléctrico',leaf:'Planta',ice:'Hielo',fighting:'Lucha',poison:'Veneno',
    ground:'Tierra',flying:'Volador',psychic:'Psíquico',bug:'Bicho',rock:'Roca',ghost:'Fantasma',dragon:'Dragón',dark:'Siniestro',steel:'Acero',fairy:'Hada'};
  async function datosEsp(id){
    try{const c=JSON.parse(localStorage.getItem(KE)||'{}');if(c[id])return c[id]}catch(_){}   // reutiliza la caché de las herramientas
    const p=await jf(API+'pokemon/'+id),sm={};p.stats.forEach(x=>sm[x.stat.name]=x.base_stat);
    return{id,n:p.name,tipos:p.types.map(x=>TN[x.type.name]||'normal'),
      stats:{hp:sm.hp,atk:sm.attack,def:sm.defense,spa:sm['special-attack'],spd:sm['special-defense'],spe:sm.speed},
      moves:p.moves.map(m=>m.move.name)};
  }
  async function kitDe(c,prog){
    const k=c.especieId+'/'+c.arquetipo;
    if(KITS[k])return KITS[k];
    const e=await datosEsp(c.especieId),movs=[];
    for(let i=0;i<e.moves.length;i+=9){
      movs.push(...await Promise.all(e.moves.slice(i,i+9).map(n=>mvData({n,u:API+'move/'+n+'/'}).catch(()=>null))));
      if(prog)prog(Math.min(e.moves.length,i+9),e.moves.length);
    }
    const kit=generarKit(e,c.arquetipo,movs.filter(Boolean))
      .map(m=>({key:m.key,n:m.n,t:m.t,cat:m.cat,p:m.p||0,est:estiloAtaque(m)}));
    KITS[k]=kit;try{localStorage.setItem(KC,JSON.stringify(KITS))}catch(_){}
    return kit;
  }
  const filaAtaque=m=>`<div style="padding:3px 0;border-bottom:1px solid #1e293b"><b>${esc(String(m.n).replace(/-/g,' '))}</b>
    <small style="opacity:.75">· ${TIPN[m.t]||esc(m.t)} · ${CATN[m.cat]||esc(m.cat)}${m.p?' · Pot '+m.p:''} · ${ESTN[m.est]||esc(m.est)}</small></div>`;

  function estilo(){
    if(hayEstilo)return;hayEstilo=true;
    document.head.append(h('style','',`
      .gc-grid{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
      .gc-card{width:104px;border:2px solid var(--c);border-radius:10px;padding:6px 4px;text-align:center;background:#0f172a;color:#e2e8f0;cursor:pointer;font:12px system-ui,sans-serif}
      .gc-card img{width:72px;height:72px;image-rendering:pixelated}
      .gc-card .r{display:inline-block;padding:0 6px;border-radius:8px;background:var(--c);color:#0f172a;font-weight:700;font-size:11px}
      .gc-card small{display:block;opacity:.75}
      .gc-menu{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:10px 0}
      .gc-op{padding:14px 8px;text-align:center}
      .gc-op small{display:block;opacity:.7;font-weight:400}
      .gc-op[disabled]{opacity:.45}`));
  }

  function cabecera(titulo,atras){
    const d=h('div','display:flex;align-items:center;gap:8px;margin:8px 0;flex-wrap:wrap');
    if(atras){const b=h('button','','← Volver');b.onclick=atras;d.append(b)}
    d.append(h('b','font-size:16px',esc(titulo)));
    if(partida)d.append(h('span','margin-left:auto;font-size:13px',`👤 ${esc(partida.jugador.nombre)} · 💎 ${partida.monedas.gemas}`));
    return d;
  }
  const limpiar=()=>{cont.innerHTML='';window.scrollTo&&window.scrollTo(0,0)};
  async function guardar(){
    try{await Guardado.guardarPartida(perfil,partida)}
    catch(e){alert('No se pudo guardar la partida (¿sin espacio en el navegador?). Exporta tu partida para no perderla.')}
  }

  // Carta de la box o de una tirada
  function carta(c,{inicial,alClick}={}){
    const r=rz(c.especieId),d=h('div','','');d.className='gc-card';d.style.setProperty('--c',RC[r]);
    d.innerHTML=`<img src="${SPR+c.especieId}.png" alt=""><div class="n">#${c.especieId}</div><span class="r">${r}</span>
      <small>${esc(nombreArq(c.arquetipo))}</small>${inicial?'<small>⭐ Inicial</small>':''}${c.estrellas!=null?`<small>${'★'.repeat(c.estrellas)||'☆'} · Nv ${c.nivel}</small>`:''}`;
    nombreEs(c.especieId).then(n=>{d.querySelector('.n').textContent=n});
    if(alClick)d.onclick=alClick;
    return d;
  }

  // ---------- Pantallas ----------
  async function pantallaPerfil(){
    limpiar();partida=null;perfil=null;
    cont.append(cabecera('🎴 Gacha · ¿Quién juega?',salir));
    const ps=await Guardado.listarPerfiles(),l=h('div','display:flex;flex-direction:column;gap:6px;max-width:320px');
    for(const p of ps){
      const b=h('button','text-align:left','👤 '+esc(p.nombre));
      b.onclick=async()=>{perfil=p.id;await Guardado.elegirPerfil(p.id);partida=await Guardado.cargarPartida(p.id);menu()};
      l.append(b);
    }
    cont.append(l);
    const f=h('div','margin-top:12px','<b>Nuevo perfil</b><br>');
    const i=h('input','margin-right:6px');i.placeholder='Tu nombre';i.maxLength=20;
    const b=h('button','','Crear');
    b.onclick=async()=>{
      const n=i.value.trim();if(!n){i.focus();return}
      perfil=await Guardado.crearPerfil(n);partida=await Guardado.cargarPartida(perfil);menu();
    };
    f.append(i,b);cont.append(f);
  }

  function menu(){
    limpiar();cont.append(cabecera('🎴 Gacha',salir));
    const op=[['🎴','Banners','Invocaciones',pantallaBanners],['🗡️','Eventos','Próximamente',null],
      ['📦','Box',partida.box.length+' cartas',pantallaBox],['🛒','Tienda','Próximamente',null],
      ['🏋️','Entrenamiento','Próximamente',null],['📜','Misiones','Próximamente',null],
      ['💾','Partida','Perfil y copia de seguridad',pantallaPartida]];
    const g=h('div','');g.className='gc-menu';
    for(const[ic,n,d,f]of op){
      const b=h('button','',`<div style="font-size:22px">${ic}</div>${n}<small>${d}</small>`);b.className='gc-op';
      if(f)b.onclick=f;else b.disabled=true;
      g.append(b);
    }
    cont.append(g);
  }

  function pantallaBanners(){
    limpiar();cont.append(cabecera('🎴 Banners',menu));
    if(typeof BANNERS==='undefined'){cont.append(h('p','','Falta cargar banners-datos.js en index.html.'));return}
    const l=h('div','display:flex;flex-direction:column;gap:8px;max-width:420px');
    for(const b of BANNERS){
      if(b.tipo!=='tutorial')continue;     // los banners normales llegarán más adelante
      const hecho=partida.tutorial.inicial;
      const bt=h('button','text-align:left;padding:12px',`<b>${esc(b.nombre)}</b> · gratis<br><small>${hecho?'✔ Ya lo has usado':'1 inicial garantizado + 9 cartas · puedes repetir hasta que te guste'}</small>`);
      if(hecho)bt.disabled=true;else bt.onclick=()=>pantallaTirada(b);
      l.append(bt);
    }
    cont.append(l);
    if(!l.children.length)cont.append(h('p','','No hay banners disponibles ahora mismo.'));
  }

  function pantallaTirada(b,rerolls=0){
    limpiar();cont.append(cabecera(b.nombre,pantallaBanners));
    const t=tiradaInicial(b,rz);
    cont.append(h('p','margin:4px 0',`Tu tirada gratuita. Si no te gusta, haz reroll cuantas veces quieras. <small>(Rerolls: ${rerolls})</small>`));
    const g=h('div','');g.className='gc-grid';
    t.forEach((c,i)=>g.append(carta(c,{inicial:i===0})));
    cont.append(g);
    const rr=h('button','margin-right:8px','🔁 Reroll'),ok=h('button','','✅ Quedarme con estos');
    rr.onclick=()=>pantallaTirada(b,rerolls+1);
    ok.onclick=async()=>{
      if(!confirm('¿Quedarte con estas 10 cartas? El banner inicial no se puede repetir.'))return;
      for(const c of t)Guardado.nuevaCarta(partida,c,'banner:'+b.id);
      partida.tutorial.inicial=true;await guardar();pantallaBox('¡10 cartas nuevas en tu box!');
    };
    cont.append(rr,ok);
  }

  function pantallaBox(aviso){
    limpiar();cont.append(cabecera('📦 Box ('+partida.box.length+')',menu));
    if(typeof aviso==='string')cont.append(h('p','color:#4ade80',esc(aviso)));
    if(!partida.box.length){cont.append(h('p','','Tu box está vacía. Abre el banner inicial para conseguir tus primeras cartas.'));return}
    const o=[...partida.box].sort((a,b)=>ORD.indexOf(rz(b.especieId))-ORD.indexOf(rz(a.especieId))||b.estrellas-a.estrellas||a.especieId-b.especieId);
    const g=h('div','');g.className='gc-grid';
    for(const c of o)g.append(carta(c,{alClick:()=>pantallaDetalle(c)}));
    cont.append(g);
  }

  function pantallaDetalle(c){
    limpiar();cont.append(cabecera('Carta',()=>pantallaBox()));
    const r=rz(c.especieId),nat=Guardado.NATURALEZAS[c.naturaleza]||{n:c.naturaleza};
    const efecto=nat.u?`+${ST[nat.u]} / −${ST[nat.d]}`:'neutra';
    const d=h('div','display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start');
    const iv=Object.keys(ST).map(s=>`<tr><td style="padding-right:8px">${ST[s]}</td><td style="width:120px"><div style="background:#1e293b;height:6px;border-radius:3px"><div style="width:${c.ivs[s]/31*100}%;height:6px;background:#38bdf8;border-radius:3px"></div></div></td><td style="padding-left:8px">${c.ivs[s]}</td></tr>`).join('');
    d.innerHTML=`<div style="text-align:center"><img src="${SPR+c.especieId}.png" style="width:128px;height:128px;image-rendering:pixelated" alt=""></div>
      <div><div style="font-size:18px"><b class="nm">#${c.especieId}</b> <span style="background:${RC[r]};color:#0f172a;border-radius:8px;padding:0 8px;font-weight:700">${r}</span></div>
      <div>Arquetipo: <b>${esc(nombreArq(c.arquetipo))}</b></div>
      <div>Nivel ${c.nivel} · ${'★'.repeat(c.estrellas)||'☆ sin estrellas'}</div>
      <div>Naturaleza: <b>${esc(nat.n)}</b> <small>(${efecto})</small></div>
      <div style="margin-top:8px"><b>IVs</b><table style="font-size:12px;margin-top:4px">${iv}</table></div>
      <div style="margin-top:8px"><b>Ataques</b><div class="kit" style="font-size:12px;margin-top:4px;min-width:220px"><small style="opacity:.7">Cargando ataques…</small></div></div>
      <div style="margin-top:8px;opacity:.7;font-size:12px">Conseguida el ${esc(c.obtenidoEn)} · ${esc(c.origen)}</div></div>`;
    nombreEs(c.especieId).then(n=>{const e=d.querySelector('.nm');if(e)e.textContent=n});
    const kz=d.querySelector('.kit');
    kitDe(c,(a,t)=>{kz.innerHTML=`<small style="opacity:.7">Cargando ataques ${a}/${t}…</small>`})
      .then(kit=>{kz.innerHTML=kit.length?kit.map(filaAtaque).join(''):'<small>Sin ataques disponibles</small>'})
      .catch(()=>{kz.innerHTML='<small style="color:#f87171">No se pudieron cargar los ataques (¿sin conexión?)</small>'});
    cont.append(d);
  }

  function pantallaPartida(){
    limpiar();cont.append(cabecera('💾 Partida',menu));
    const l=h('div','display:flex;flex-direction:column;gap:8px;max-width:320px');
    const ex=h('button','','⬇ Exportar mi partida (copia de seguridad)');
    ex.onclick=()=>{
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([Guardado.exportarPartida(partida)],{type:'application/json'}));
      a.download='gacha-'+partida.jugador.nombre.replace(/[^\w-]+/g,'_')+'.json';a.click();
    };
    const fi=h('input','display:none');fi.type='file';fi.accept='.json,application/json';
    const im=h('button','','⬆ Importar una partida (crea un perfil nuevo)');
    im.onclick=()=>fi.click();
    fi.onchange=async()=>{
      try{const id=await Guardado.importarPartida(await fi.files[0].text());perfil=id;partida=await Guardado.cargarPartida(id);menu()}
      catch(e){alert('No se pudo importar: el archivo no es una partida válida.')}
    };
    const cp=h('button','','👤 Cambiar de perfil');cp.onclick=pantallaPerfil;
    const bo=h('button','color:#f87171','🗑 Borrar este perfil');
    bo.onclick=async()=>{
      if(!confirm('¿Borrar el perfil "'+partida.jugador.nombre+'" y toda su partida? No se puede deshacer.'))return;
      await Guardado.borrarPerfil(perfil);pantallaPerfil();
    };
    l.append(ex,im,fi,cp,bo);cont.append(l);
  }

  // Punto de entrada: lo llama el menú de modos.
  async function abrir(contenedor,volver){
    cont=contenedor;salir=volver;estilo();
    perfil=await Guardado.perfilActivo();
    partida=perfil?await Guardado.cargarPartida(perfil):null;
    if(partida)menu();else pantallaPerfil();
  }
  return{abrir};
})();