// MODO GACHA (pantallas): perfil, menú, banners (banner inicial con reroll), box y partida.
// Necesita: guardado.js, misiones.js, celebraciones.js + celebraciones-datos.js, banners-normales.js, banners.js + banners-datos.js, rarezas.js, evoluciones-datos.js, generos.js, experiencia.js + experiencia-datos.js, fusion.js, arquetipos.js y pokeapi.js (API, SPR, jf).
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
  // Género: ♂ ♀ o sin género ('N'). Se sortea al conseguir la carta con la proporción de su especie (GENERO_RATE de generos.js:
  // -1 sin género · 0 siempre macho · 8 siempre hembra · n = octavos de hembra). Al evolucionar se conserva (salvo especies de un solo género).
  const GN={M:['♂','Macho','#60a5fa'],F:['♀','Hembra','#f472b6']};
  const rateDe=id=>typeof GENERO_RATE!=='undefined'?GENERO_RATE[id]:undefined;
  function sortearGenero(id){
    const r=rateDe(id);if(r===undefined)return null;
    return r<0?'N':r===0?'M':r>=8?'F':Math.random()*8<r?'F':'M';
  }
  const simboloG=g=>GN[g]?` <b style="color:${GN[g][2]}">${GN[g][0]}</b>`:'';
  const grupoDe=id=>(typeof GRUPO_EXP!=='undefined'&&GRUPO_EXP[id])||'m';   // curva de XP de la especie ('m' si falta experiencia-datos.js)
  function asegurar(){   // pone al día las cartas: género y XP coherente con el nivel (cartas nuevas, de prueba o de partidas antiguas)
    if(!partida)return;
    let cambio=false;
    for(const c of partida.box){
      if(!c.genero&&typeof GENERO_RATE!=='undefined'){c.genero=sortearGenero(c.especieId);cambio=true}
      if(typeof Experiencia!=='undefined'){const m=Experiencia.xpTotal(grupoDe(c.especieId),c.nivel);if((c.xp||0)<m){c.xp=m;cambio=true}}
    }
    if(cambio)guardar();
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
    if(partida)d.append(h('span','margin-left:auto;font-size:13px',`👤 ${esc(partida.jugador.nombre)} · ${typeof objetoIcono==='function'?objetoIcono('pokecoin'):'🪙'} <b>${(partida.objetos&&partida.objetos.pokecoin)||0}</b>`));
    return d;
  }
  const limpiar=()=>{cont.innerHTML='';window.scrollTo&&window.scrollTo(0,0)};
  async function guardar(){
    try{await Guardado.guardarPartida(perfil,partida)}
    catch(e){alert('No se pudo guardar la partida (¿sin espacio en el navegador?). Exporta tu partida para no perderla.')}
  }

  // Carta de la box o de una tirada
  function carta(c,{inicial,alClick,etiqueta}={}){
    const r=rz(c.especieId),d=h('div','','');d.className='gc-card';d.style.setProperty('--c',RC[r]);
    d.innerHTML=`<img src="${SPR+c.especieId}.png" alt=""><div class="n">#${c.especieId}</div><span class="r">${r}</span>${simboloG(c.genero)}
      <small>${esc(nombreArq(c.arquetipo))}</small>${inicial?'<small>⭐ Inicial</small>':''}${etiqueta?`<small>${etiqueta}</small>`:''}${c.estrellas!=null?`<small>${'★'.repeat(c.estrellas)||'☆'} · Nv ${c.nivel}</small>`:''}`;
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

  // ---------- Celebraciones ----------
  const celOk=()=>typeof Celebraciones!=='undefined'&&typeof CELEBRACIONES!=='undefined';
  const hoyJ=()=>typeof Misiones!=='undefined'?Misiones.fechaJuego():new Date().toISOString().slice(0,10);   // fecha del juego (o fecha de prueba)
  const fechaBonita=s=>{const[y,m,d]=s.split('-');return `${d}/${m}/${y}`};
  let avisosCel=[];

  // ---------- Misiones y login diario ----------
  let avisoLogin=null;
  const ctxM=()=>({rz,ORD});
  const reg=(ev,n)=>{if(typeof Misiones!=='undefined'&&partida)Misiones.registrar(partida,ev,n)};   // cuenta un evento para las misiones (se guarda con la partida)
  const premioHtml=p=>Object.entries(p).map(([k,n])=>`<span title="${esc(objetoNombre(k))}" style="white-space:nowrap">${objetoIcono(k)}×${n}</span>`).join(' ');

  function menu(){
    asegurar();
    if(typeof Misiones!=='undefined'){   // login del día + reinicio de las misiones diarias
      const r=Misiones.entrar(partida);
      if(r.login)avisoLogin=r.login;
      if(r.cambio)guardar();
    }
    if(celOk()){   // inicio de las celebraciones relativas y regalo de entrada de las activas
      const r=Celebraciones.entrar(CELEBRACIONES,partida,hoyJ());
      if(r.cambio)guardar();
      avisosCel.push(...r.mensajes);
    }
    limpiar();cont.append(cabecera('🎴 Gacha',salir));
    for(const m of avisosCel)cont.append(h('div','background:#14532d;border:1px solid #4ade80;border-radius:8px;padding:8px 10px;margin:8px 0;max-width:520px;font-size:13px',
      `🎉 <b>${esc(m.celebracion.nombre)}</b> · ¡ya ha empezado! Regalo: ${premioHtml(m.premio)}`));
    avisosCel=[];
    if(avisoLogin){
      cont.append(h('div','background:#14532d;border:1px solid #4ade80;border-radius:8px;padding:8px 10px;margin:8px 0;max-width:520px;font-size:13px',
        `🎁 <b>Login diario</b> · día ${avisoLogin.dia} de 7 (racha de ${avisoLogin.racha}): ${premioHtml(avisoLogin.premio)}`));
      avisoLogin=null;
    }
    const pend=typeof Misiones!=='undefined'?Misiones.pendientes(partida,ctxM()):0;
    const celAct=celOk()?Celebraciones.activas(CELEBRACIONES,partida,hoyJ()):[];
    const textoCel=celAct.length?celAct.map(c=>c.nombre.replace('Celebración de ','')+' · '+Celebraciones.estado(c,partida,hoyJ()).quedan+' d').join(' + '):'Próximamente';
    const op=[['🎉','Celebraciones',textoCel,celOk()?pantallaCelebraciones:null],['🎴','Banners','Invocaciones',pantallaBanners],['🗡️','Eventos','Próximamente',null],
      ['📦','Box',partida.box.length+' cartas',pantallaBox],['🛒','Tienda','Próximamente',null],
      ['🏋️','Entrenamiento','Desde el detalle de cada carta',pantallaBox],['📜','Misiones',pend?`🔴 ${pend} por reclamar`:'Diarias y logros',typeof Misiones!=='undefined'?pantallaMisiones:null],
      ['💾','Partida','Perfil y copia de seguridad',pantallaPartida]];
    const g=h('div','');g.className='gc-menu';
    for(const[ic,n,d,f]of op){
      const b=h('button','',`<div style="font-size:22px">${ic}</div>${n}<small>${d}</small>`);b.className='gc-op';
      if(f)b.onclick=f;else b.disabled=true;
      g.append(b);
    }
    cont.append(g);
  }

  function pantallaMisiones(aviso){
    limpiar();cont.append(cabecera('📜 Misiones',menu));
    const x=ctxM();
    if(typeof aviso==='string')cont.append(h('p','color:#4ade80;margin:6px 0',aviso));
    // Login: los 7 días de la racha
    const hoyDia=Misiones.diaLogin(partida);
    const lg=h('div','margin:8px 0;max-width:560px',`<b>🎁 Login diario</b> <small style="opacity:.7">· racha de ${(partida.login&&partida.login.racha)||0} día${partida.login&&partida.login.racha===1?'':'s'} · si faltas un día, vuelve al 1</small>`);
    const fila7=h('div','display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:6px');
    Misiones.LOGIN.forEach((pr,i)=>{
      const d=i+1,hecho=d<hoyDia,hoy=d===hoyDia;
      fila7.append(h('div',`border:1px solid ${hoy?'#4ade80':'#334155'};background:${hoy?'#14532d':'#0f172a'};border-radius:6px;padding:4px 2px;text-align:center;font-size:11px;${hecho?'opacity:.5':''}`,
        `<div>Día ${d}${hecho?' ✔':''}</div><div style="margin-top:2px">${premioHtml(pr)}</div>`));
    });
    lg.append(fila7);cont.append(lg);
    // Reclamar todo
    const pend=Misiones.pendientes(partida,x);
    if(pend){
      const b=h('button','margin:8px 0',`🔴 Reclamar todas (${pend})`);
      b.onclick=async()=>{const t=Misiones.reclamarTodas(partida,x);await guardar();pantallaMisiones(t?'Recibes: '+Object.entries(t).map(([k,n])=>n+' × '+objetoNombre(k)).join(', '):null)};
      cont.append(b);
    }
    const seccion=(titulo,lista)=>{
      cont.append(h('div','margin:12px 0 4px','<b>'+titulo+'</b>'));
      const l=h('div','display:flex;flex-direction:column;gap:6px;max-width:560px');
      for(const m of lista){
        const pr=Misiones.progreso(partida,m,x),ok=pr>=m.meta,hecha=Misiones.reclamada(partida,m);
        const f=h('div',`display:flex;align-items:center;gap:8px;border:1px solid ${ok&&!hecha?'#4ade80':'#334155'};border-radius:8px;padding:6px 8px;${hecha?'opacity:.55':''}`,
          `<div style="flex:1"><b>${esc(m.nombre)}</b> <small style="opacity:.7">· ${esc(m.desc)}</small>
           <div style="background:#1e293b;height:6px;border-radius:3px;margin:4px 0;max-width:260px"><div style="width:${pr/m.meta*100}%;height:6px;background:${ok?'#4ade80':'#38bdf8'};border-radius:3px"></div></div>
           <small>${pr}/${m.meta} · ${premioHtml(m.premio)}</small></div>`);
        const b=h('button','',hecha?'✔':'Reclamar');b.disabled=hecha||!ok;
        b.onclick=async()=>{const p=Misiones.reclamar(partida,m.id,x);await guardar();pantallaMisiones(p?'Recibes: '+Object.entries(p).map(([k,n])=>n+' × '+objetoNombre(k)).join(', '):null)};
        f.append(b);l.append(f);
      }
      cont.append(l);
    };
    seccion('📅 Diarias <small style="opacity:.7">(se reinician cada día a las 00:00 de tu dispositivo)</small>',Misiones.DIARIAS);
    seccion('🏆 Generales <small style="opacity:.7">(se hacen una sola vez)</small>',Misiones.GENERALES);
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
    if(celOk())for(const c of Celebraciones.activas(CELEBRACIONES,partida,hoyJ()))for(const b of c.banners||[]){
      const bt=h('button','text-align:left;padding:12px',`<b>${esc(b.nombre)}</b> · ${esc(c.nombre)}<br><small>${b.precio.una} ${objetoIcono('pokecoin')} la tirada · ${b.precio.multi} ${objetoIcono('pokecoin')} ×10 · garantía a las ${b.pity}</small>`);
      bt.onclick=()=>pantallaBannerNormal(b,c);l.append(bt);
    }
    cont.append(l);
    if(!l.children.length)cont.append(h('p','','No hay banners disponibles ahora mismo.'));
  }

  function pantallaCelebraciones(){
    limpiar();cont.append(cabecera('🎉 Celebraciones',menu));
    const hoy=hoyJ(),act=Celebraciones.activas(CELEBRACIONES,partida,hoy),prox=Celebraciones.proximas(CELEBRACIONES,partida,hoy);
    if(!act.length&&!prox.length)cont.append(h('p','','No hay celebraciones ahora mismo.'));
    for(const c of act){
      const st=Celebraciones.estado(c,partida,hoy);
      const box=h('div','border:1px solid #4ade80;border-radius:10px;padding:10px;margin:10px 0;max-width:560px',
        `<div style="font-size:16px"><b>${esc(c.nombre)}</b></div>
         <div style="font-size:12px;opacity:.8;margin:2px 0">${esc(c.desc||'')}</div>
         <div style="font-size:12px;margin:4px 0">⏳ Quedan <b>${st.quedan}</b> día${st.quedan===1?'':'s'} (hasta el ${fechaBonita(st.fin)})</div>`);
      for(const b of c.banners||[]){
        const bt=h('button','display:block;text-align:left;padding:10px;margin:6px 0;width:100%',
          `🎴 <b>${esc(b.nombre)}</b><br><small>${b.precio.una} ${objetoIcono('pokecoin')} la tirada · ${b.precio.multi} ${objetoIcono('pokecoin')} ×10 · garantía a las ${b.pity}</small>`);
        bt.onclick=()=>pantallaBannerNormal(b,c);box.append(bt);
      }
      if(!(c.banners||[]).length)box.append(h('div','font-size:12px;opacity:.7;margin:4px 0','🎴 Banner: próximamente'));
      box.append(h('div','font-size:12px;opacity:.6;margin-top:6px','🗡️ Eventos, misiones y login de celebración: próximamente'));
      cont.append(box);
    }
    for(const c of prox){
      const st=Celebraciones.estado(c,partida,hoy);
      cont.append(h('div','border:1px solid #334155;border-radius:10px;padding:10px;margin:10px 0;max-width:560px;opacity:.8',
        `<b>${esc(c.nombre)}</b> <small>· próximamente</small><div style="font-size:12px;margin-top:2px">${esc(c.desc||'')}</div>
         <div style="font-size:12px;margin-top:4px">📅 Empieza en <b>${st.empieza}</b> día${st.empieza===1?'':'s'} (${fechaBonita(st.inicio)}) y dura hasta el ${fechaBonita(st.fin)}</div>`));
    }
  }

  function pantallaBannerNormal(b,c){
    asegurar();limpiar();cont.append(cabecera(b.nombre,pantallaCelebraciones));
    const pc=tengo('pokecoin'),pity=(partida.pity&&partida.pity[b.id])||0,pr=BannersNormales.probabilidades(b,rz),dest=b.destacados||[];
    cont.append(h('div','font-size:12px;opacity:.8;margin:2px 0',esc(c.nombre)));
    if(dest.length){
      cont.append(h('div','margin-top:8px','<b>⭐ Destacados</b>'));
      const g=h('div','');g.className='gc-grid';
      for(const e of dest)g.append(carta({especieId:e.id,arquetipo:e.arq},{etiqueta:'⭐ Destacado'}));
      cont.append(g);
    }
    cont.append(h('div','font-size:12px;margin:8px 0;max-width:560px',
      '<b>Probabilidades</b> por tirada: '+Object.entries(pr.porRareza).map(([r,p])=>`<span style="color:${RC[r]}"><b>${r}</b></span> ${p.toFixed(1)} %`).join(' · ')
      +(dest.length?`<br>Destacado: <b>${pr.destacado.toFixed(1)} %</b> por tirada`:'')));
    if(b.pity&&dest.length){
      const falta=b.pity-pity;
      cont.append(h('div','font-size:12px;margin:8px 0;max-width:560px;border:1px solid #fbbf24;border-radius:8px;padding:6px 8px',
        `🛡️ <b>Garantía:</b> ${pity} / ${b.pity} tiradas sin destacado. Tu tirada nº <b>${falta}</b> desde ahora será un destacado seguro <small>(${falta*b.precio.una} ${objetoIcono('pokecoin')} si no sale antes)</small>.`));
    }
    cont.append(h('div','margin:8px 0',`Tienes ${objetoIcono('pokecoin')} <b>${pc}</b> Pokécoin`));
    cont.append(botonesTirada(b,c));
    const d=h('details','margin-top:12px;font-size:12px',`<summary style="cursor:pointer;opacity:.8">Cartas del banner (${(b.pool||[]).length+dest.length})</summary>`);
    d.addEventListener('toggle',()=>{
      if(!d.open||d.dataset.ok)return;d.dataset.ok='1';
      const g=h('div','');g.className='gc-grid';
      const todas=[...dest.map(e=>({e,d:true})),...(b.pool||[]).map(e=>({e,d:false}))].sort((a,b2)=>ORD.indexOf(rz(b2.e.id))-ORD.indexOf(rz(a.e.id)));
      for(const{e,d:x}of todas)g.append(carta({especieId:e.id,arquetipo:e.arq},{etiqueta:x?'⭐ Destacado':''}));
      d.append(g);
    });
    cont.append(d);
  }

  function botonesTirada(b,c){
    const pc=tengo('pokecoin'),w=h('div','display:flex;gap:8px;flex-wrap:wrap;margin:8px 0');
    for(const[n,precio]of[[1,b.precio.una],[10,b.precio.multi]]){
      const bt=h('button','padding:10px 14px',`🎴 ×${n} · ${precio} ${objetoIcono('pokecoin')}`);
      bt.disabled=pc<precio;bt.onclick=()=>tirar(b,c,n,precio);w.append(bt);
    }
    if(pc<b.precio.una)w.append(h('small','align-self:center;opacity:.7','No tienes Pokécoin suficientes.'));
    return w;
  }

  async function tirar(b,c,veces,precio){
    if(tengo('pokecoin')<precio)return;
    let r;
    try{r=BannersNormales.tiradas(b,rz,(partida.pity&&partida.pity[b.id])||0,veces)}
    catch(e){alert('No se pudo hacer la tirada: el banner no tiene cartas.');return}
    partida.objetos.pokecoin=tengo('pokecoin')-precio;if(partida.objetos.pokecoin<=0)delete partida.objetos.pokecoin;
    partida.pity=partida.pity||{};partida.pity[b.id]=r.pity;
    for(const t of r.cartas)t.inst=Guardado.nuevaCarta(partida,t,'banner:'+b.id);
    reg('tirada',veces);
    asegurar();   // da género a las cartas nuevas
    await guardar();
    pantallaResultado(b,c,r.cartas);
  }

  function pantallaResultado(b,c,cartas){
    limpiar();cont.append(cabecera('Resultado · '+b.nombre,()=>pantallaBannerNormal(b,c)));
    const nd=cartas.filter(t=>t.destacado).length,pity=(partida.pity&&partida.pity[b.id])||0;
    cont.append(h('p','margin:6px 0',nd?`⭐ ¡${nd===1?'Ha salido un destacado':'Han salido '+nd+' destacados'}!`:'Esta vez no ha salido ningún destacado.'));
    const g=h('div','');g.className='gc-grid';
    for(const t of cartas)g.append(carta(t.inst,{etiqueta:t.destacado?(t.porPity?'⭐ Destacado (garantía)':'⭐ Destacado'):''}));
    cont.append(g);
    if(b.pity&&(b.destacados||[]).length)cont.append(h('div','font-size:12px;margin:6px 0',`🛡️ Garantía: ${pity} / ${b.pity} tiradas sin destacado.`));
    cont.append(h('div','margin:6px 0',`Te quedan ${objetoIcono('pokecoin')} <b>${tengo('pokecoin')}</b> Pokécoin`));
    cont.append(botonesTirada(b,c));
    const v=h('button','margin-top:4px','← Volver al banner');v.onclick=()=>pantallaBannerNormal(b,c);cont.append(v);
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
    asegurar();limpiar();cont.append(cabecera('📦 Box ('+partida.box.length+')',menu));
    if(typeof aviso==='string')cont.append(h('p','color:#4ade80',esc(aviso)));
    if(!partida.box.length){cont.append(h('p','','Tu box está vacía. Abre el banner inicial para conseguir tus primeras cartas.'));return}
    const o=[...partida.box].sort((a,b)=>ORD.indexOf(rz(b.especieId))-ORD.indexOf(rz(a.especieId))||b.estrellas-a.estrellas||a.especieId-b.especieId);
    const g=h('div','');g.className='gc-grid';
    for(const c of o)g.append(carta(c,{alClick:()=>pantallaDetalle(c)}));
    cont.append(g);
  }

  function pantallaDetalle(c,aviso){
    asegurar();limpiar();cont.append(cabecera('Carta',()=>pantallaBox()));
    if(typeof aviso==='string')cont.append(h('p','color:#4ade80;margin:6px 0',esc(aviso)));
    const r=rz(c.especieId),nat=Guardado.NATURALEZAS[c.naturaleza]||{n:c.naturaleza};
    const efecto=nat.u?`+${ST[nat.u]} / −${ST[nat.d]}`:'neutra';
    const d=h('div','display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start');
    const iv=Object.keys(ST).map(s=>`<tr><td style="padding-right:8px">${ST[s]}</td><td style="width:120px"><div style="background:#1e293b;height:6px;border-radius:3px"><div style="width:${c.ivs[s]/31*100}%;height:6px;background:#38bdf8;border-radius:3px"></div></div></td><td style="padding-left:8px">${c.ivs[s]}</td></tr>`).join('');
    d.innerHTML=`<div style="text-align:center"><img src="${SPR+c.especieId}.png" style="width:128px;height:128px;image-rendering:pixelated" alt=""></div>
      <div><div style="font-size:18px"><b class="nm">#${c.especieId}</b> <span style="background:${RC[r]};color:#0f172a;border-radius:8px;padding:0 8px;font-weight:700">${r}</span></div>
      <div>Arquetipo: <b>${esc(nombreArq(c.arquetipo))}</b></div>
      <div>Género: ${c.genero==='N'?'<b>sin género</b>':GN[c.genero]?`<b style="color:${GN[c.genero][2]}">${GN[c.genero][0]} ${GN[c.genero][1]}</b>`:'<small>sin definir</small>'}</div>
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
    cont.append(seccionEntrenar(c));
    cont.append(seccionEvolucion(c));
    cont.append(seccionFusion(c));
  }

  // ---------- Fusión ----------
  function seccionFusion(c){
    const box=h('div','margin-top:16px;max-width:520px','<b>🔀 Fusión</b>');
    if(typeof Fusion==='undefined'||typeof EVOLUCIONES==='undefined'){box.append(h('p','opacity:.7;margin:6px 0','Falta cargar fusion.js en index.html.'));return box}
    const MAX=Fusion.MAX_ESTRELLAS,est=c.estrellas||0;
    box.append(h('div','font-size:13px;margin:6px 0',`Estrellas: <b>${'★'.repeat(est)}${'☆'.repeat(MAX-est)}</b> <small style="opacity:.7">(las suben las copias: la carta que fusionas desaparece)</small>`));
    if(est>=MAX){box.append(h('p','opacity:.7;margin:6px 0','Esta carta ya tiene todas las estrellas.'));return box}
    const ok=[],no=[];
    for(const m of partida.box){
      if(m.id===c.id)continue;
      const r=Fusion.puedeFusionar(c,m,EVOLUCIONES);
      if(r.ok)ok.push(m);else if(Fusion.mismaLinea(c,m,EVOLUCIONES))no.push([m,r.motivo]);
    }
    const nom=m=>NOM[m.especieId]||'#'+m.especieId;
    const fila=(m,tag,extra)=>{
      const f=h(tag,'display:flex;align-items:center;gap:6px;margin:3px 0;font-size:12px',
        `<img src="${SPR+m.especieId}.png" style="width:36px;height:36px;image-rendering:pixelated" alt="">
         <span><b class="nm">#${m.especieId}</b> <small>${rz(m.especieId)} · ${esc(nombreArq(m.arquetipo))} · Nv ${m.nivel} · ${'★'.repeat(m.estrellas||0)||'☆'}</small>${simboloG(m.genero)}${extra||''}</span>`);
      nombreEs(m.especieId).then(n=>{const e=f.querySelector('.nm');if(e)e.textContent=n});
      return f;
    };
    if(!ok.length)box.append(h('p','opacity:.8;margin:6px 0;font-size:12px','No tienes cartas compatibles. Sirven copias de esta misma especie o de una etapa anterior de su línea, con el mismo arquetipo (y el mismo sexo si el sexo decide una evolución de la línea).'));
    else{
      ok.sort((a,b)=>a.nivel-b.nivel||(a.estrellas||0)-(b.estrellas||0)||a.especieId-b.especieId);
      const marcas=[],lista=h('div','margin:6px 0');
      for(const m of ok){
        const cb=h('input','');cb.type='checkbox';cb.onchange=actualizar;marcas.push([cb,m]);
        const f=fila(m,'label');f.prepend(cb);lista.append(f);
      }
      const resumen=h('div','font-size:12px;margin:6px 0;min-height:18px'),go=h('button','','🔀 Fusionar');
      function actualizar(){
        const sel=marcas.filter(([cb])=>cb.checked).map(([,m])=>m);
        go.disabled=!sel.length;
        if(!sel.length){resumen.innerHTML='<small style="opacity:.7">Marca las cartas que quieras fusionar.</small>';return}
        const r=Fusion.resultado(c,sel),pierde=sel.filter(m=>m.nivel>1||(m.estrellas||0)>0);
        resumen.innerHTML=`Resultado: <b>${'★'.repeat(est)||'☆'} → ${'★'.repeat(r.estrellas)}</b> · se usan ${sel.length} carta${sel.length>1?'s':''}`
          +(r.perdidas?`<br><span style="color:#fbbf24">⚠ Te pasas del máximo: se pierden ${r.perdidas} estrella${r.perdidas>1?'s':''}.</span>`:'')
          +(pierde.length?`<br><span style="color:#fbbf24">⚠ Se perderá su nivel y estrellas: ${pierde.map(m=>`${esc(nom(m))} Nv ${m.nivel}${m.estrellas?' ★'+m.estrellas:''}`).join(', ')}.</span>`:'');
      }
      go.onclick=async()=>{
        const sel=marcas.filter(([cb])=>cb.checked).map(([,m])=>m);if(!sel.length)return;
        const r=Fusion.resultado(c,sel),n=await nombreEs(c.especieId);
        if(!confirm(`¿Fusionar ${sel.length} carta${sel.length>1?'s':''} en ${n}? Las cartas usadas desaparecen (se pierden su nivel, XP, IVs y naturaleza).`))return;
        c.estrellas=r.estrellas;
        const ids=new Set(sel.map(m=>m.id));
        partida.box=partida.box.filter(m=>!ids.has(m.id));
        partida.equipo=(partida.equipo||[]).filter(x=>!ids.has(x&&x.id||x));
        reg('fusion',1);
        await guardar();
        pantallaDetalle(c,`¡Fusión hecha! ${n} sube a ${r.estrellas} ★ (${sel.length} carta${sel.length>1?'s usadas':' usada'}).`);
      };
      box.append(lista,resumen,go);actualizar();
    }
    if(no.length){
      const d=h('details','margin-top:8px;font-size:12px',`<summary style="cursor:pointer;opacity:.8">Misma línea, no compatibles (${no.length})</summary>`);
      for(const[m,motivo]of no)d.append(fila(m,'div',`<br><small style="color:#f87171">${esc(motivo)}</small>`));
      box.append(d);
    }
    return box;
  }

  // ---------- Entrenamiento ----------
  const CARAMELOS=['caramelo-s','caramelo-m','caramelo-l','caramelo-xl'];
  function seccionEntrenar(c){
    const box=h('div','margin-top:16px;max-width:520px','<b>🏋️ Entrenamiento</b>');
    if(typeof Experiencia==='undefined'){box.append(h('p','opacity:.7;margin:6px 0','Falta cargar experiencia.js en index.html.'));return box}
    const g=grupoDe(c.especieId),max=Experiencia.NIVEL_MAX,lv=c.nivel,info=h('div','font-size:12px;margin:6px 0');
    const curva=Experiencia.GRUPOS[g]+(typeof GRUPO_EXP==='undefined'?' (falta experiencia-datos.js)':'');
    if(lv>=max)info.innerHTML=`Nivel ${lv} · <b>nivel máximo</b> <small>(curva ${curva})</small>`;
    else{
      const a=Experiencia.xpTotal(g,lv),b=Experiencia.xpTotal(g,lv+1),pc=Math.max(0,Math.min(100,(c.xp-a)/(b-a)*100));
      info.innerHTML=`Nivel ${lv} → ${lv+1}: faltan <b>${b-c.xp}</b> XP <small>(XP total ${c.xp} · curva ${curva})</small>
        <div style="background:#1e293b;height:6px;border-radius:3px;margin-top:4px;max-width:260px"><div style="width:${pc}%;height:6px;background:#4ade80;border-radius:3px"></div></div>`;
    }
    box.append(info);
    if(lv<max){   // subir N niveles: elige solos los caramelos justos (ver Experiencia.planCaramelos)
      let k=1,plan=null;
      const ctl=h('div','margin:8px 0;padding:8px;border:1px solid #334155;border-radius:8px;max-width:440px'),
        fila=h('div','display:flex;align-items:center;gap:6px;flex-wrap:wrap','<b>Subir</b>'),
        num=h('b','display:inline-block;min-width:28px;text-align:center','1'),
        menos=h('button','padding:2px 10px','−'),mas=h('button','padding:2px 10px','+'),mx=h('button','padding:2px 8px','Máx'),
        prev=h('div','font-size:12px;margin:6px 0;min-height:32px'),go=h('button','','⬆ Entrenar');
      const inv=()=>Object.fromEntries(CARAMELOS.map(x=>[x,tengo(x)]));
      const alcanzable=()=>Experiencia.nivelPorXp(g,c.xp+CARAMELOS.reduce((s,x)=>s+tengo(x)*Experiencia.XP_CARAMELO[x],0));
      const calc=()=>{
        k=Math.max(1,Math.min(k,max-lv));num.textContent=k;
        const obj=lv+k;plan=Experiencia.planCaramelos(g,c.xp,obj,inv());
        if(plan.ok){
          const l=Object.entries(plan.usar).map(([x,n])=>`${n} × ${objetoIcono(x)} ${esc(objetoNombre(x))}`).join(', ');
          prev.innerHTML=`Nivel <b>${lv} → ${obj}</b>: ${l||'—'}<br><small>XP extra: ${plan.sobrante} (se queda como progreso hacia el siguiente nivel)</small>`;
        }else prev.innerHTML=`<span style="color:#f87171">No tienes caramelos suficientes para el nivel ${obj}.</span> <small>Con todos los que tienes llegarías al ${alcanzable()}.</small>`;
        go.disabled=!plan.ok||!Object.keys(plan.usar).length;
      };
      menos.onclick=()=>{k--;calc()};mas.onclick=()=>{k++;calc()};
      mx.onclick=()=>{k=Math.max(1,alcanzable()-lv);calc()};
      go.onclick=()=>entrenarPlan(c,plan);
      fila.append(menos,num,mas,document.createTextNode(' niveles '),mx);
      ctl.append(fila,prev,go);box.append(ctl,h('div','font-size:12px;opacity:.7;margin-top:4px','O elige los caramelos a mano:'));
      calc();
    }
    for(const k of CARAMELOS){
      const n=tengo(k),f=h('div','display:flex;align-items:center;gap:6px;margin:4px 0;flex-wrap:wrap',
        `<span style="min-width:230px">${objetoIcono(k)} ${esc(objetoNombre(k))} <small>(+${Experiencia.XP_CARAMELO[k]} XP · tienes ${n})</small></span>`);
      for(const[txt,cant]of[['×1',1],['×10',10],['Todos',Infinity]]){
        const b=h('button','padding:2px 8px',txt);b.disabled=n<=0||lv>=max;b.onclick=()=>entrenar(c,k,cant);f.append(b);
      }
      box.append(f);
    }
    return box;
  }
  async function entrenarPlan(c,plan){
    if(!plan||!plan.ok)return;
    const g=grupoDe(c.especieId),antes=c.nivel;
    for(const[k,n]of Object.entries(plan.usar)){partida.objetos[k]=tengo(k)-n;if(partida.objetos[k]<=0)delete partida.objetos[k]}
    c.xp+=plan.xp;c.nivel=Experiencia.nivelPorXp(g,c.xp);
    reg('entrenar',1);reg('caramelos',Object.values(plan.usar).reduce((a,b)=>a+b,0));
    await guardar();
    pantallaDetalle(c,`¡Sube del nivel ${antes} al ${c.nivel}! (${Object.entries(plan.usar).map(([k,n])=>n+' × '+objetoNombre(k)).join(', ')})`);
  }
  async function entrenar(c,k,cant){
    const g=grupoDe(c.especieId),xpc=Experiencia.XP_CARAMELO[k],falta=Experiencia.xpTotal(g,Experiencia.NIVEL_MAX)-c.xp;
    const n=Math.min(cant,tengo(k),Math.ceil(falta/xpc));   // no gasta caramelos de más al llegar al 100
    if(n<=0)return;
    const antes=c.nivel;
    c.xp+=n*xpc;partida.objetos[k]=tengo(k)-n;if(partida.objetos[k]<=0)delete partida.objetos[k];
    c.nivel=Experiencia.nivelPorXp(g,c.xp);
    reg('entrenar',1);reg('caramelos',n);
    await guardar();
    pantallaDetalle(c,c.nivel>antes?`¡Sube del nivel ${antes} al ${c.nivel}! (${n} × ${objetoNombre(k)})`:`+${n*xpc} XP (${n} × ${objetoNombre(k)})`);
  }

  // ---------- Evolución ----------
  const tengo=k=>(partida.objetos&&partida.objetos[k])||0;
  const costes=e=>[[e.o,e.n],...(e.x||[])];   // objetos que gasta una evolución
  const BASE={};   // estadísticas base por especie (undefined = sin pedir, null = fallo), para comparar Ataque y Defensa
  function statsCarta(c){   // fórmula de los juegos, sin EVs: ((2·base + IV)·nivel/100 + 5) × naturaleza
    const b=BASE[c.especieId],nat=Guardado.NATURALEZAS[c.naturaleza]||{};
    const f=s=>{const v=Math.floor((2*b[s]+c.ivs[s])*c.nivel/100)+5;return Math.floor(v*(nat.u===s?110:nat.d===s?90:100)/100)};
    return{atk:f('atk'),def:f('def')};
  }
  function estadoEvo(c,e){
    if(e.t==='bloqueado')return{ok:false,txt:'🔒 Próximamente · requisito: '+esc(e.req)};
    const p=[];let ok=true;
    if(e.nivel!=null){p.push(`Nivel ${e.nivel} <small>(tu carta: ${c.nivel})</small>`);ok=ok&&c.nivel>=e.nivel}
    if(e.t==='objeto'){
      const cs=costes(e);
      p.push(cs.map(([k,n])=>`${objetoIcono(k)} ${n} × ${esc(objetoNombre(k))} <small>(tienes ${tengo(k)})</small>`).join(' + '));
      ok=ok&&cs.every(([k,n])=>tengo(k)>=n);
    }
    if(e.t==='stats'){
      if(BASE[c.especieId]===undefined){p.push('<small>Calculando estadísticas…</small>');ok=false}
      else if(!BASE[c.especieId]){p.push('<small>No se pudieron cargar las estadísticas</small>');ok=false}
      else{
        const s=statsCarta(c),rel=s.atk>s.def?'>':s.atk<s.def?'<':'=';
        p.push(`Ataque ${s.atk} ${rel} Defensa ${s.def} <small>(hace falta ${e.cmp})</small>`);ok=ok&&rel===e.cmp;
      }
    }
    if(e.g){
      const q=GN[e.g],mia=c.genero==='N'?'sin género':GN[c.genero]?GN[c.genero][1].toLowerCase():'sin definir';
      p.push(`${q[0]} Solo ${q[1].toLowerCase()} <small>(tu carta: ${mia})</small>`);ok=ok&&c.genero===e.g;
    }
    return{ok,txt:p.join('<br>')};
  }
  function seccionEvolucion(c){
    const box=h('div','margin-top:16px;max-width:520px','<b>🧬 Evolución</b>');
    const ops=(typeof EVOLUCIONES!=='undefined'&&EVOLUCIONES[c.especieId])||[];
    if(!ops.length){box.append(h('p','opacity:.7;margin:6px 0','Esta carta no tiene más evoluciones.'));return box}
    if(ops.some(e=>e.t==='stats')&&BASE[c.especieId]===undefined)
      datosEsp(c.especieId).then(d=>{BASE[c.especieId]=d.stats}).catch(()=>{BASE[c.especieId]=null})
        .then(()=>{if(box.isConnected)box.replaceWith(seccionEvolucion(c))});
    for(const e of ops){
      const st=estadoEvo(c,e),f=h('div','display:flex;align-items:center;gap:8px;border:1px solid #334155;border-radius:8px;padding:6px;margin:6px 0');
      f.innerHTML=`<img src="${SPR+e.a}.png" style="width:56px;height:56px;image-rendering:pixelated" alt="">
        <div style="flex:1"><b class="nm">#${e.a}</b> <span style="background:${RC[rz(e.a)]};color:#0f172a;border-radius:8px;padding:0 6px;font-weight:700;font-size:11px">${rz(e.a)}</span><br>
        <span style="font-size:12px;${st.ok?'':'opacity:.8'}">${st.txt}</span></div>`;
      nombreEs(e.a).then(n=>{f.querySelector('.nm').textContent=n});
      const b=h('button','',e.t==='bloqueado'?'🔒':'Evolucionar');
      b.disabled=!st.ok;if(st.ok)b.onclick=()=>evolucionar(c,e);
      f.append(b);box.append(f);
    }
    return box;
  }
  async function evolucionar(c,e){
    if(!estadoEvo(c,e).ok)return;
    const nom=await nombreEs(e.a),coste=e.t==='objeto'?` Se gastarán ${costes(e).map(([k,n])=>n+' × '+objetoNombre(k)).join(' + ')}.`:'';
    if(!confirm(`¿Evolucionar a ${nom}?${coste}`))return;
    if(e.t==='objeto')for(const[k,n]of costes(e)){partida.objetos[k]=tengo(k)-n;if(partida.objetos[k]<=0)delete partida.objetos[k]}
    // Solo cambia la especie: id, IVs, naturaleza, estrellas, nivel y arquetipo se conservan; el kit se calcula con la especie.
    const g1=grupoDe(c.especieId);
    c.especieId=e.a;
    if(typeof Experiencia!=='undefined'&&grupoDe(e.a)!==g1)c.xp=Experiencia.xpTotal(grupoDe(e.a),c.nivel);   // otra curva de XP: se conserva el nivel
    const r=rateDe(e.a);if(r===-1)c.genero='N';else if(r===0)c.genero='M';else if(r>=8)c.genero='F';   // especies de un solo género
    reg('evolucion',1);
    await guardar();pantallaDetalle(c,`¡Tu carta ha evolucionado a ${nom}!`);
  }

  // [especie, nivel, arquetipo, género?, estrellas?] → cartas de prueba en la box (género y estrellas opcionales)
  function darCartas(lista){
    for(const[sp,nv,aq,gen,est]of lista){const c=Guardado.nuevaCarta(partida,{especieId:sp,arquetipo:aq},'prueba');c.nivel=nv;if(gen)c.genero=gen;if(est)c.estrellas=est}
  }

  function pantallaPartida(){
    limpiar();cont.append(cabecera('💾 Partida',menu));
    const l=h('div','display:flex;flex-direction:column;gap:8px;max-width:380px');
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
    const inv=Object.entries(partida.objetos||{});
    cont.append(h('p','margin:6px 0;font-size:13px','<b>🎒 Objetos:</b> '+(inv.length?inv.map(([k,n])=>`${objetoIcono(k)} ${esc(objetoNombre(k))} ×${n}`).join(' · '):'ninguno')));
    const pr=h('button','','🧪 Datos de prueba (cartas y objetos para evolucionar)');
    pr.onclick=async()=>{
      if(!confirm('Esto añade a tu box unas cartas de prueba y objetos de ejemplo. ¿Seguir?'))return;
      darCartas(CARTAS_PRUEBA);
      for(const[k,n]of Object.entries(OBJETOS_PRUEBA))partida.objetos[k]=tengo(k)+n;
      await guardar();pantallaBox(`Añadidas ${CARTAS_PRUEBA.length} cartas de prueba y objetos.`);
    };
    const pf=h('button','','🔀 Cartas de prueba para fusionar');
    pf.onclick=async()=>{darCartas(CARTAS_PRUEBA_FUSION);await guardar();pantallaBox(`Añadidas ${CARTAS_PRUEBA_FUSION.length} cartas de prueba para fusionar.`)};
    const po=h('button','','🍬 Solo objetos de prueba (sin cartas)');
    po.onclick=async()=>{for(const[k,n]of Object.entries(OBJETOS_PRUEBA))partida.objetos[k]=tengo(k)+n;await guardar();pantallaPartida()};
    l.prepend(pf);l.prepend(po);l.prepend(pr);
    l.append(ex,im,fi,cp,bo);cont.append(l);
    if(typeof Misiones!=='undefined'){   // fecha de prueba: para ver login, misiones diarias y celebraciones sin esperar días
      const real=Misiones.hoyLocal(),act=Misiones.fechaJuego(),fp=h('div','margin-top:16px;font-size:12px;max-width:380px',
        `<b>🕒 Fecha de prueba</b> <small style="opacity:.7">(solo para probar: cambia el login, las misiones diarias y las celebraciones)</small>`
        +(act!==real?`<div style="color:#fbbf24;margin:4px 0">⚠ Estás usando la fecha ${fechaBonita(act)} (hoy es ${fechaBonita(real)})</div>`:''));
      const inp=h('input','margin:6px 6px 0 0');inp.type='date';inp.value=act;
      const ap=h('button','margin-right:6px','Aplicar'),rs=h('button','','Usar la fecha real');
      ap.onclick=()=>{try{localStorage.setItem('gacha-fecha-prueba',inp.value)}catch(e){}pantallaPartida()};
      rs.onclick=()=>{try{localStorage.removeItem('gacha-fecha-prueba')}catch(e){}pantallaPartida()};
      fp.append(h('br'),inp,ap,rs);cont.append(fp);
    }
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