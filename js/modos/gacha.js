// MODO GACHA (pantallas): perfil, menú, banners (banner inicial con reroll), box y partida.
// Necesita: guardado.js, eventos.js + eventos-datos.js + eventos-pantallas.js, misiones.js, celebraciones.js + celebraciones-datos.js, banners-normales.js, banners.js + banners-datos.js, rarezas.js, evoluciones-datos.js, generos.js, experiencia.js + experiencia-datos.js, fusion.js, arquetipos.js y pokeapi.js (API, SPR, jf).
// Es una primera versión sencilla: las opciones sin hacer salen como "Próximamente".
const Gacha=(()=>{
  const RC={N:'#94a3b8',R:'#4ade80',SR:'#60a5fa',SSR:'#c084fc',UR:'#fbbf24',LR:'#f472b6'},ORD=['N','R','SR','SSR','UR','LR'];
  const ST={hp:'PS',atk:'Ataque',def:'Defensa',spa:'At. Esp.',spd:'Def. Esp.',spe:'Velocidad'};
  const rz=id=>(typeof RAREZA_POR_ESPECIE!=='undefined'&&RAREZA_POR_ESPECIE[id]||['N'])[0];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const h=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
  const SPRA=SPR+'other/showdown/';   // sprites animados (gif)
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
  const KC='kits-cartas-v4',KE='kits-especies-v1';
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
  // Ataques de una carta: SOLO los que su especie aprende por nivel (MT, tutor y huevo no entran: son para los objetos de MT).
  // Mientras la especie pueda evolucionar hay tope: solo hasta el nivel al que evoluciona (Chimchar: 14; Monferno: 36) y sin
  // ataques finales (poder >= 110). La etapa final (o sin evolución) no tiene tope de nivel. Si la evolución no pide nivel
  // (piedra, cable link, bloqueada...) se usa NIVEL_SIN_NIVEL. Si el kit queda con menos de 4, se rellena con ataques normales básicos.
  const NIVEL_SIN_NIVEL=25,KN='ataques-nivel-v1',RELLENO=['tackle','quick-attack','headbutt','take-down'];
  let NIV={};try{NIV=JSON.parse(localStorage.getItem(KN)||'{}')}catch(_){}
  async function nivelesAtaques(id){   // {ataque: nivel más bajo al que lo aprende por nivel}
    if(NIV[id])return NIV[id];
    const p=await jf(API+'pokemon/'+id),o={};
    for(const m of p.moves)for(const d of m.version_group_details)if(d.move_learn_method.name==='level-up'){
      const lv=Math.max(1,d.level_learned_at);if(!(m.move.name in o)||lv<o[m.move.name])o[m.move.name]=lv}
    NIV[id]=o;try{localStorage.setItem(KN,JSON.stringify(NIV))}catch(_){}
    return o;
  }
  function topeEtapa(id){
    const ops=(typeof EVOLUCIONES!=='undefined'&&EVOLUCIONES[id])||[];
    if(!ops.length)return Infinity;
    const lv=ops.filter(o=>o.nivel!=null).map(o=>o.nivel);
    return lv.length?Math.min(...lv):NIVEL_SIN_NIVEL;
  }
  async function kitDe(c,prog){
    const k=c.especieId+'/'+(c.arquetipo||'auto');
    if(KITS[k])return KITS[k];
    const e=await datosEsp(c.especieId),tope=topeEtapa(c.especieId),niv=await nivelesAtaques(c.especieId);
    const nombres=e.moves.filter(n=>niv[n]!==undefined&&niv[n]<=tope);
    const cargar=async lista=>{
      const r=[];
      for(let i=0;i<lista.length;i+=9){
        r.push(...await Promise.all(lista.slice(i,i+9).map(n=>mvData({n,u:API+'move/'+n+'/'}).catch(()=>null))));
        if(prog)prog(Math.min(lista.length,i+9),lista.length);
      }
      return r.filter(Boolean);
    };
    let ms=await cargar(nombres);
    if(tope<Infinity)ms=ms.filter(m=>!(m.u||m.p>=110));   // nada de ataques finales antes de la etapa final
    let arq=c.arquetipo;   // sin arquetipo (rivales de eventos): el primer viable
    if(!arq)arq=arquetiposDistintos(e,ms)[0]||arquetiposViables(e,ms)[0]||'fisico';
    let kit=generarKit(e,arq,ms);
    if(!kit.length)kit=ms.filter(m=>m.cat!=='sta'&&m.p>0).sort((a,b)=>b.p-a.p).slice(0,4);
    if(kit.length<4){   // relleno con ataques normales básicos
      const usados=new Set(kit.map(m=>m.key));
      for(const m of await cargar(RELLENO.filter(n=>!usados.has(n))))if(kit.length<4)kit.push(m);
    }
    kit=kit.map(m=>({...m,est:estiloAtaque(m)}));   // ataque completo (el combate necesita cd, alcance...)
    KITS[k]=kit;try{localStorage.setItem(KC,JSON.stringify(KITS))}catch(_){}
    return kit;
  }
  const filaAtaque=m=>{
    const col=TC[m.t]||'#64748b',st=m.cat==='sta',pot=Math.round(m.p||0);
    const dato=(l,v)=>`<div><small>${l}</small><b>${v}</b></div>`;
    return `<div class="gm" style="--t:${col}">
      <div class="gm-h"><b class="gm-n">${m.u?'★ ':''}${esc(String(m.n).replace(/-/g,' '))}</b><span class="gm-t">${TIPN[m.t]||esc(m.t)}</span></div>
      <div class="gm-tags"><span>${CI[m.cat]||''} ${CATN[m.cat]||esc(m.cat)}</span><span>${ESTN[m.est]||esc(m.est)}</span>${m.u?'<span class="ul">Final</span>':''}</div>
      ${st?`<div class="gm-ef">${m.ef&&m.ef.d?esc(m.ef.d):'Ataque de estado'}</div>`:''}
      <div class="gm-d">${st?'':dato('Potencia',pot)}${dato('Precisión',m.acc?m.acc+'%':'—')}${dato('Recarga',(m.cd||0).toFixed(1)+'s')}</div>
    </div>`;
  };

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
      .gc-op[disabled]{opacity:.45}
      .gd{display:flex;flex-direction:column;gap:14px;max-width:560px}
      .gd-top{display:flex;gap:14px;align-items:center}
      .gd-sprite{flex:none;width:140px;height:140px;display:flex;align-items:center;justify-content:center;border-radius:12px;border:1px solid #1e293b;background:radial-gradient(circle at 50% 60%,#1e293b,#0f172a)}
      .gd-img{image-rendering:pixelated;max-width:128px;max-height:128px}
      .gd-info{flex:1;min-width:0;font-size:14px;line-height:1.5}
      .gd-title{font-size:18px}
      .gd-r{color:#0f172a;border-radius:8px;padding:0 8px;font-weight:700}
      .gd-types{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 6px}
      .gd-t{color:#fff;font-weight:700;font-size:12px;letter-spacing:.5px;padding:3px 14px;border-radius:999px;text-transform:uppercase;text-shadow:0 1px 2px rgba(0,0,0,.4)}
      .gd-stats{border:1px solid #1e293b;border-radius:12px;padding:8px;background:#0f172a}
      .gd-tabs{display:flex;gap:6px}
      .gd-tabs button{flex:1;padding:10px 6px}
      .gd-tabs button.on{border-color:#38bdf8;color:#38bdf8}
      .gd-tabs2{display:flex;gap:4px}
      .gd-tabs2 button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 2px;font-size:11px;background:#0f172a;border:1px solid #1e293b;border-radius:10px}
      .gd-tabs2 button span{font-size:18px;line-height:1.2}
      .gd-tabs2 button.on{border-color:#38bdf8;color:#38bdf8;background:#0c1a2e}
      .gd-body>*{margin-top:6px!important}
      .gd-datos{font-size:14px;line-height:1.6}
      .ge{display:flex;flex-direction:column;gap:8px}
      .ge-card{border:1px solid #1e293b;border-radius:12px;padding:10px;background:#0f172a}
      .ge-lv{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:6px}
      .ge-lv b{font-size:26px}.ge-lv small{margin-left:auto;opacity:.6}
      .ge-bar{height:10px;background:#1e293b;border-radius:5px;overflow:hidden}
      .ge-bar i{display:block;height:10px;background:linear-gradient(90deg,#22c55e,#4ade80)}
      .ge-nums{display:flex;justify-content:space-between;font-size:11px;opacity:.75;margin-top:3px}
      .ge-big{text-align:center;font-size:16px;margin:6px 0}.ge-big b{font-size:28px}
      .ge-row{display:flex;align-items:center;gap:8px}
      .ge-row input{flex:1;min-width:0}
      .ge-row button{width:42px;padding:6px 0;font-size:18px}
      .ge-quick{display:flex;gap:6px;margin:8px 0}.ge-quick button{flex:1;padding:6px 0}
      .ge-prev{font-size:12px;margin:6px 0;min-height:34px}
      .ge-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px}
      .ge-chip{background:#1e293b;border-radius:8px;padding:3px 8px;font-size:13px}
      .ge-sts{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0;font-size:12px}
      .ge-sts div{background:#0b1220;border-radius:8px;padding:4px 6px;display:flex;flex-direction:column}
      .ge-sts small{opacity:.6;font-size:10px}.ge-sts em{color:#4ade80;font-style:normal;font-size:11px}
      .ge-go{width:100%;padding:12px;font-size:15px;font-weight:700;margin-top:4px}
      .ge-cand{display:flex;flex-direction:column;gap:8px;margin-top:8px}
      .ge-c{display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#0b1220;border-radius:10px;padding:6px 8px;font-size:13px}
      .ge-ci{font-size:22px;width:28px;text-align:center}
      .ge-cb{display:flex;gap:4px;margin-left:auto}.ge-cb button{padding:4px 10px}
      @media(max-width:520px){.ge-sts{grid-template-columns:repeat(2,1fr)}.ge-cb{width:100%;margin-left:0}.ge-cb button{flex:1}}
      .gf-big{font-size:26px;letter-spacing:2px;line-height:1.2}
      .gf-s{color:#334155}.gf-s.on{color:#fbbf24}.gf-s.nw{color:#4ade80}
      .gf-acts{display:flex;gap:6px;margin:8px 0}.gf-acts button{flex:1;padding:6px 0}
      .gf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}
      .gf-m{position:relative;border:2px solid #1e293b;border-radius:10px;padding:6px 4px;text-align:center;cursor:pointer;background:#0b1220;font-size:12px;min-width:0}
      .gf-m img{width:56px;height:56px;image-rendering:pixelated}
      .gf-m .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .gf-ms{color:#fbbf24;font-size:11px;min-height:14px}
      .gf-m .ck{display:none;position:absolute;top:2px;right:5px;color:#fbbf24;font-weight:700}
      .gf-m .wa{position:absolute;top:2px;left:4px;font-size:12px}
      .gf-m.on{border-color:#fbbf24;background:#2a2108}.gf-m.on .ck{display:block}
      .ev-top{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
      .ev-p{text-align:center;font-size:12px}.ev-p img{width:80px;height:80px;image-rendering:pixelated}
      .ev-arrow{font-size:24px;opacity:.7}
      .ev-r{width:100%;text-align:center;font-size:11px}
      .ev-req{list-style:none;padding:0;margin:10px 0 0;display:flex;flex-direction:column;gap:4px}
      .ev-req li{display:flex;gap:8px;align-items:flex-start;font-size:13px;background:#0b1220;border-radius:8px;padding:5px 8px}
      .ev-req li span{flex:none;width:18px;text-align:center;font-weight:700}
      .ev-req li.ok span{color:#4ade80}.ev-req li.no span{color:#f87171}.ev-req li.lk{opacity:.75}
      .ev.lock{opacity:.85}
      .gd-svg{display:block;width:100%;max-width:320px;margin:6px auto 0}
      .gd-nota{text-align:center;font-size:11px;opacity:.65;margin-top:2px}

      .gd .kit{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
      .gd .kit>small{grid-column:1/-1}
      .gm{border:1px solid #1e293b;border-left:5px solid var(--t);border-radius:10px;padding:8px 10px;background:linear-gradient(135deg,color-mix(in srgb,var(--t) 22%,#0f172a),#0f172a 65%);min-width:0}
      .gm-h{display:flex;align-items:center;justify-content:space-between;gap:6px}
      .gm-n{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .gm-t{flex:none;background:var(--t);color:#fff;font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;padding:1px 9px;border-radius:999px}
      .gm-tags{display:flex;flex-wrap:wrap;gap:4px;margin:5px 0;font-size:11px}
      .gm-tags span{background:#1e293b;border-radius:6px;padding:1px 6px;opacity:.9}
      .gm-tags .ul{background:#fbbf24;color:#0f172a;font-weight:700}
      .gm-ef{font-size:12px;opacity:.85;margin:4px 0;min-height:18px}
      .gm-d{display:flex;gap:12px;font-size:12px}
      .gm-d div{display:flex;flex-direction:column;line-height:1.2}
      .gm-d small{opacity:.6;font-size:10px}
      @media(max-width:520px){.gd .kit{grid-template-columns:1fr}}
      @media(max-width:520px){
        .gd-top{flex-direction:column;text-align:center}
        .gd-types{justify-content:center}
        .gd-sprite{width:100%;height:150px}
        .gc-grid{justify-content:center}
        .gc-menu{grid-template-columns:repeat(2,1fr)}
        main button{min-height:38px}
      }`));
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
    const op=[['🎉','Celebraciones',textoCel,celOk()?pantallaCelebraciones:null],['🎴','Banners','Invocaciones',pantallaBanners],['🗡️','Eventos','Farmeo, historia y desafíos',eventosOk()?pantallaEventos:null],
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

  // ---------- Eventos (pantallas en eventos-pantallas.js) ----------
  let EVG=null;
  const eventosOk=()=>typeof GachaEventos!=='undefined'&&typeof EVENTOS!=='undefined'&&typeof Eventos!=='undefined';
  function pantallaEventos(){
    EVG=EVG||GachaEventos.crear({h,esc,limpiar,cabecera,guardar,volver:menu,carta,nombreEs,datosEsp,kitDe,premioHtml,reg,
      partida:()=>partida,cont:()=>cont,hoy:hoyJ,NAT:Guardado.NATURALEZAS});
    EVG.abrir();
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
    for(const c of o)g.append(carta(c,{alClick:()=>{pestana='datos';pantallaDetalle(c)}}));
    cont.append(g);
  }

  // ---------- Estadísticas en hexágono (como en los juegos) ----------
  const STO=['hp','atk','def','spe','spd','spa'];   // sentido horario desde arriba
  const STN={hp:'PS',atk:'ATAQUE',def:'DEFENSA',spe:'VELOCIDAD',spd:'DEF. ESP.',spa:'AT. ESP.'};
  function hexagono(vals,max,color,nat={}){
    const X=130,Y=118,R=78,pt=(i,k)=>{const a=(-90+i*60)*Math.PI/180;return[X+Math.cos(a)*R*k,Y+Math.sin(a)*R*k]};
    const poly=k=>STO.map((_,i)=>pt(i,k).map(n=>n.toFixed(1)).join(',')).join(' ');
    let s=`<svg class="gd-svg" viewBox="0 0 260 236" xmlns="http://www.w3.org/2000/svg">`;
    for(const k of[1/3,2/3,1])s+=`<polygon points="${poly(k)}" fill="${k===1?'#0b1220':'none'}" stroke="#334155" stroke-width="1"/>`;
    STO.forEach((_,i)=>{const[x,y]=pt(i,1);s+=`<line x1="${X}" y1="${Y}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#1e293b"/>`});
    const dat=STO.map((k,i)=>pt(i,Math.max(.04,Math.min(1,vals[k]/max))).map(n=>n.toFixed(1)).join(',')).join(' ');
    s+=`<polygon points="${dat}" fill="${color}" fill-opacity=".4" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>`;
    STO.forEach((k,i)=>{
      const a=(-90+i*60)*Math.PI/180,lx=X+Math.cos(a)*102,ly=Y+Math.sin(a)*102;
      const fl=nat.u===k?'<tspan fill="#4ade80"> ▲</tspan>':nat.d===k?'<tspan fill="#f87171"> ▼</tspan>':'';
      s+=`<text x="${lx.toFixed(1)}" y="${(ly-2).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#94a3b8">${STN[k]}${fl}</text>`
        +`<text x="${lx.toFixed(1)}" y="${(ly+12).toFixed(1)}" text-anchor="middle" font-size="14" font-weight="800" fill="#f1f5f9">${vals[k]}</text>`;
    });
    return s+'</svg>';
  }
  function panelStats(box,c,pe){
    let modo='stats';const nat=Guardado.NATURALEZAS[c.naturaleza]||{};
    const tabs=h('div','');tabs.className='gd-tabs';
    const bs=h('button','','Estadísticas'),bi=h('button','','IVs'),gr=h('div','');
    bs.onclick=()=>{modo='stats';pintar()};bi.onclick=()=>{modo='iv';pintar()};
    tabs.append(bs,bi);box.append(tabs,gr);
    function pintar(){
      bs.className=modo==='stats'?'on':'';bi.className=modo==='iv'?'on':'';
      if(modo==='iv'){
        gr.innerHTML=hexagono(c.ivs,31,'#4ade80')+`<div class="gd-nota">IVs: de 0 a 31 en cada estadística</div>`;return;
      }
      const base=BASE[c.especieId];
      if(base===undefined){gr.innerHTML='<small style="opacity:.7">Calculando estadísticas…</small>';return}
      if(!base){gr.innerHTML='<small style="color:#f87171">No se pudieron cargar las estadísticas (¿sin conexión?). Los IVs sí se pueden ver.</small>';return}
      const v=statsCarta(c),max=Math.max(60,...STO.map(k=>v[k]))*1.1;
      gr.innerHTML=hexagono(v,max,'#38bdf8',nat)+`<div class="gd-nota">Estadísticas a nivel ${c.nivel}</div>`;
    }
    pintar();
    if(BASE[c.especieId]===undefined)pe.then(e=>{BASE[c.especieId]=e.stats}).catch(()=>{BASE[c.especieId]=null}).then(()=>{if(box.isConnected)pintar()});
    else pintar();
  }

  let pestana='datos';   // pestaña abierta del detalle (se recuerda al volver a pintar tras entrenar, fusionar...)
  const PEST=[['datos','📋','Datos'],['ataques','⚔️','Ataques'],['entrenar','🏋️','Entrenar'],['fusion','🔀','Fusión'],['evolucion','🧬','Evolución']];
  function pantallaDetalle(c,aviso){
    asegurar();limpiar();cont.append(cabecera('Carta',()=>pantallaBox()));
    if(typeof aviso==='string')cont.append(h('p','color:#4ade80;margin:6px 0',esc(aviso)));
    const r=rz(c.especieId),nat=Guardado.NATURALEZAS[c.naturaleza]||{n:c.naturaleza};
    const efecto=nat.u?`+${ST[nat.u]} / −${ST[nat.d]}`:'neutra';
    const d=h('div','');d.className='gd';
    d.innerHTML=`<div class="gd-top">
      <div class="gd-sprite"><img class="gd-img" src="${SPRA+c.especieId}.gif" alt=""></div>
      <div class="gd-info">
        <div class="gd-title"><b class="nm">#${c.especieId}</b> <span class="gd-r" style="background:${RC[r]}">${r}</span></div>
        <div class="gd-types"><small style="opacity:.6">…</small></div>
        <div>Nivel <b>${c.nivel}</b> · ${'★'.repeat(c.estrellas)||'☆ sin estrellas'}</div>
      </div></div>
      <div class="gd-tabs2"></div><div class="gd-body"></div>`;
    // Sprite animado (Showdown, hasta la gen 9); si no existe, el sprite estático. Se escala en enteros para que no se vea borroso.
    const im=d.querySelector('.gd-img');
    im.onload=()=>{im.style.width=im.naturalWidth+'px';im.style.imageRendering='pixelated'};   // tamaño original del GIF, sin ampliar
    im.onerror=()=>{im.onerror=null;im.src=SPR+c.especieId+'.png'};
    // Tipos y estadísticas: necesitan las estadísticas base de la especie (caché de las herramientas)
    const pe=datosEsp(c.especieId);
    pe.then(e=>{d.querySelector('.gd-types').innerHTML=e.tipos.map(t=>`<span class="gd-t" style="background:${TC[t]||'#64748b'}">${TIPN[t]||esc(t)}</span>`).join('')})
      .catch(()=>{d.querySelector('.gd-types').innerHTML=''});
    nombreEs(c.especieId).then(n=>{const e=d.querySelector('.nm');if(e)e.textContent=n});

    const tabs=d.querySelector('.gd-tabs2'),body=d.querySelector('.gd-body'),bts={};
    function mostrar(){
      for(const[k]of PEST)bts[k].className=k===pestana?'on':'';
      body.innerHTML='';
      if(pestana==='datos'){
        body.innerHTML=`<div class="gd-datos">
          <div>Arquetipo: <b>${esc(nombreArq(c.arquetipo))}</b></div>
          <div>Género: ${c.genero==='N'?'<b>sin género</b>':GN[c.genero]?`<b style="color:${GN[c.genero][2]}">${GN[c.genero][0]} ${GN[c.genero][1]}</b>`:'<small>sin definir</small>'}</div>
          <div>Naturaleza: <b>${esc(nat.n)}</b> <small>(${efecto})</small></div>
          <div style="opacity:.7;font-size:12px">Conseguida el ${esc(c.obtenidoEn)} · ${esc(c.origen)}</div></div>
          <div class="gd-stats"></div>`;
        panelStats(body.querySelector('.gd-stats'),c,pe);
      }else if(pestana==='ataques'){
        const kz=h('div','');kz.className='kit';kz.innerHTML='<small style="opacity:.7">Cargando ataques…</small>';body.append(kz);
        kitDe(c,(a,t)=>{if(kz.isConnected)kz.innerHTML=`<small style="opacity:.7">Cargando ataques ${a}/${t}…</small>`})
          .then(kit=>{if(kz.isConnected)kz.innerHTML=kit.length?kit.map(filaAtaque).join(''):'<small>Sin ataques disponibles</small>'})
          .catch(()=>{if(kz.isConnected)kz.innerHTML='<small style="color:#f87171">No se pudieron cargar los ataques (¿sin conexión?)</small>'});
      }
      else if(pestana==='entrenar')body.append(seccionEntrenar(c));
      else if(pestana==='fusion')body.append(seccionFusion(c));
      else body.append(seccionEvolucion(c));
    }
    for(const[k,ic,tx]of PEST){
      const b=h('button','',`<span>${ic}</span>${tx}`);
      b.onclick=()=>{pestana=k;mostrar()};bts[k]=b;tabs.append(b);
    }
    cont.append(d);mostrar();
  }

  // ---------- Fusión ----------
  function seccionFusion(c){
    const box=h('div','max-width:520px');box.className='ge';
    if(typeof Fusion==='undefined'||typeof EVOLUCIONES==='undefined'){box.append(h('p','opacity:.7;margin:6px 0','Falta cargar fusion.js en index.html.'));return box}
    const MAX=Fusion.MAX_ESTRELLAS,est=c.estrellas||0;
    const estr=(n,nuevas=0)=>'<span class="gf-s on">★</span>'.repeat(n)+'<span class="gf-s nw">★</span>'.repeat(nuevas)+'<span class="gf-s">★</span>'.repeat(Math.max(0,MAX-n-nuevas));
    const hdr=h('div','');hdr.className='ge-card';
    hdr.innerHTML=`<div class="gf-big">${estr(est)}</div><small style="opacity:.7">${est}/${MAX} estrellas · las suben las copias: la carta que fusionas desaparece</small>`;
    box.append(hdr);
    if(est>=MAX){hdr.append(h('div','margin-top:6px;color:#fbbf24','⭐ Esta carta ya tiene todas las estrellas.'));return box}
    const ok=[],no=[];
    for(const m of partida.box){
      if(m.id===c.id)continue;
      const r=Fusion.puedeFusionar(c,m,EVOLUCIONES);
      if(r.ok)ok.push(m);else if(Fusion.mismaLinea(c,m,EVOLUCIONES))no.push([m,r.motivo]);
    }
    const nom=m=>NOM[m.especieId]||'#'+m.especieId;
    const mini=(m,extra)=>{
      const f=h('div','');f.className='gf-m';
      f.innerHTML=`<img src="${SPR+m.especieId}.png" alt=""><div class="nm"><b>#${m.especieId}</b></div>
        <div><small>Nv ${m.nivel}${simboloG(m.genero)}</small></div><div class="gf-ms">${'★'.repeat(m.estrellas||0)||'<small style="opacity:.5">☆</small>'}</div>${extra||''}`;
      nombreEs(m.especieId).then(n=>{const e=f.querySelector('.nm');if(e)e.innerHTML='<b>'+esc(n)+'</b>'});
      return f;
    };
    if(!ok.length)box.append(h('div','font-size:12px;opacity:.8;padding:4px','No tienes cartas compatibles. Sirven copias de esta misma especie o de una etapa anterior de su línea, con el mismo arquetipo (y el mismo sexo si el sexo decide una evolución de la línea).'));
    else{
      ok.sort((a,b)=>a.nivel-b.nivel||(a.estrellas||0)-(b.estrellas||0)||a.especieId-b.especieId);
      const sel=new Set(),panel=h('div','');panel.className='ge-card';
      panel.innerHTML=`<b>Cartas compatibles (${ok.length})</b> <small style="opacity:.65">· toca para elegir</small>`;
      const acts=h('div','');acts.className='gf-acts';
      const auto=h('button','','⚡ Auto hasta ★'+MAX),nada=h('button','','Ninguna');acts.append(auto,nada);
      const grid=h('div','');grid.className='gf-grid';
      const els=new Map();
      for(const m of ok){
        const pierde=m.nivel>1||(m.estrellas||0)>0,f=mini(m,pierde?'<span class="wa" title="Perderá su nivel y estrellas">⚠</span><span class="ck">✓</span>':'<span class="ck">✓</span>');
        f.onclick=()=>{sel.has(m.id)?sel.delete(m.id):sel.add(m.id);actualizar()};
        els.set(m.id,f);grid.append(f);
      }
      const res=h('div','');res.className='ge-card';
      const go=h('button','','🔀 Fusionar');go.className='ge-go';
      auto.onclick=()=>{sel.clear();let s=est;for(const m of ok){if(s>=MAX)break;sel.add(m.id);s+=(m.estrellas||0)+1}actualizar()};
      nada.onclick=()=>{sel.clear();actualizar()};
      function actualizar(){
        for(const[id,f]of els)f.classList.toggle('on',sel.has(id));
        const s=ok.filter(m=>sel.has(m.id));
        go.disabled=!s.length;
        if(!s.length){res.innerHTML='<small style="opacity:.7">Elige las cartas que quieras fusionar para ver el resultado.</small>';return}
        const r=Fusion.resultado(c,s),pierde=s.filter(m=>m.nivel>1||(m.estrellas||0)>0),ganadas=r.estrellas-est;
        res.innerHTML=`<div class="gf-big">${estr(est,ganadas)}</div>
          <div>${est}★ → <b>${r.estrellas}★</b> <span style="color:#4ade80">(+${ganadas})</span> · se usan ${s.length} carta${s.length>1?'s':''}</div>`
          +(r.perdidas?`<div style="color:#fbbf24;font-size:12px;margin-top:4px">⚠ Te pasas del máximo: se pierden ${r.perdidas} estrella${r.perdidas>1?'s':''}.</div>`:'')
          +(pierde.length?`<div style="color:#fbbf24;font-size:12px;margin-top:4px">⚠ Se perderá su nivel y estrellas: ${pierde.map(m=>`${esc(nom(m))} Nv ${m.nivel}${m.estrellas?' ★'+m.estrellas:''}`).join(', ')}.</div>`:'');
      }
      go.onclick=async()=>{
        const s=ok.filter(m=>sel.has(m.id));if(!s.length)return;
        const r=Fusion.resultado(c,s),n=await nombreEs(c.especieId);
        if(!confirm(`¿Fusionar ${s.length} carta${s.length>1?'s':''} en ${n}? Las cartas usadas desaparecen (se pierden su nivel, XP, IVs y naturaleza).`))return;
        c.estrellas=r.estrellas;
        const ids=new Set(s.map(m=>m.id));
        partida.box=partida.box.filter(m=>!ids.has(m.id));
        partida.equipo=(partida.equipo||[]).filter(x=>!ids.has(x&&x.id||x));
        reg('fusion',1);
        await guardar();
        pantallaDetalle(c,`¡Fusión hecha! ${n} sube a ${r.estrellas} ★ (${s.length} carta${s.length>1?'s usadas':' usada'}).`);
      };
      panel.append(acts,grid);box.append(panel,res,go);actualizar();
    }
    if(no.length){
      const d=h('details','');d.className='ge-card';d.innerHTML=`<summary style="cursor:pointer;opacity:.85">Misma línea, no compatibles (${no.length})</summary>`;
      const g2=h('div','');g2.className='gf-grid';g2.style.marginTop='8px';
      for(const[m,motivo]of no){const f=mini(m,`<div style="color:#f87171;font-size:10px;margin-top:3px">${esc(motivo)}</div>`);f.style.cursor='default';f.style.opacity='.75';g2.append(f)}
      d.append(g2);box.append(d);
    }
    return box;
  }

  // ---------- Entrenamiento ----------
  const CARAMELOS=['caramelo-s','caramelo-m','caramelo-l','caramelo-xl'];
  function seccionEntrenar(c){
    const box=h('div','max-width:520px');box.className='ge';
    if(typeof Experiencia==='undefined'){box.append(h('p','opacity:.7;margin:6px 0','Falta cargar experiencia.js en index.html.'));return box}
    const g=grupoDe(c.especieId),max=Experiencia.NIVEL_MAX,lv=c.nivel;
    const curva=Experiencia.GRUPOS[g]+(typeof GRUPO_EXP==='undefined'?' (falta experiencia-datos.js)':'');
    const hdr=h('div','');hdr.className='ge-card';
    if(lv>=max)hdr.innerHTML=`<div class="ge-lv"><b>Nv ${lv}</b><span>⭐ Nivel máximo</span><small>curva ${curva}</small></div>`;
    else{
      const a=Experiencia.xpTotal(g,lv),b=Experiencia.xpTotal(g,lv+1),pc=Math.max(0,Math.min(100,(c.xp-a)/(b-a)*100));
      hdr.innerHTML=`<div class="ge-lv"><b>Nv ${lv}</b><span>→ Nv ${lv+1}</span><small>curva ${curva}</small></div>
        <div class="ge-bar"><i style="width:${pc}%"></i></div>
        <div class="ge-nums"><span>${c.xp-a} / ${b-a} XP</span><span>faltan ${b-c.xp}</span></div>`;
    }
    box.append(hdr);

    if(lv<max){   // subir N niveles: elige solos los caramelos justos (ver Experiencia.planCaramelos)
      let k=1,plan=null;
      const sel=h('div','');sel.className='ge-card';
      sel.innerHTML=`<b>Subir de nivel</b>
        <div class="ge-big"></div>
        <div class="ge-row"><button class="mn">−</button><input type="range" min="1" max="${max-lv}" value="1"><button class="ms">+</button></div>
        <div class="ge-quick"></div><div class="ge-prev"></div><div class="ge-sts"></div>`;
      const big=sel.querySelector('.ge-big'),rng=sel.querySelector('input'),prev=sel.querySelector('.ge-prev'),sts=sel.querySelector('.ge-sts'),
        go=h('button','','⬆ Entrenar');go.className='ge-go';
      const inv=()=>Object.fromEntries(CARAMELOS.map(x=>[x,tengo(x)]));
      const alcanzable=()=>Experiencia.nivelPorXp(g,c.xp+CARAMELOS.reduce((s,x)=>s+tengo(x)*Experiencia.XP_CARAMELO[x],0));
      const calc=()=>{
        k=Math.max(1,Math.min(k,max-lv));rng.value=k;
        const obj=lv+k;plan=Experiencia.planCaramelos(g,c.xp,obj,inv());
        big.innerHTML=`Nv <b>${lv}</b> → Nv <b style="color:${plan.ok?'#4ade80':'#f87171'}">${obj}</b>`;
        if(plan.ok){
          const l=Object.entries(plan.usar).map(([x,n])=>`<span class="ge-chip">${objetoIcono(x)} ×${n} <small>${esc(objetoNombre(x))}</small></span>`).join('');
          prev.innerHTML=`<div class="ge-chips">${l||'—'}</div><small style="opacity:.65">XP sobrante: ${plan.sobrante} (se queda como progreso hacia el siguiente nivel)</small>`;
        }else prev.innerHTML=alcanzable()<=lv
          ?`<span style="color:#f87171">No tienes caramelos para subir de nivel.</span>`
          :`<span style="color:#f87171">No tienes caramelos suficientes para el nivel ${obj}.</span> <small>Con todos los que tienes llegarías al ${alcanzable()}.</small>`;
        go.disabled=!plan.ok||!Object.keys(plan.usar).length;
        // Estadísticas antes → después (necesita las estadísticas base de la especie)
        const bs=BASE[c.especieId];
        if(bs){
          const a=statsCarta(c),z=statsCarta({...c,nivel:obj});
          sts.innerHTML=Object.keys(ST).map(s=>`<div><small>${ST[s]}</small><span>${a[s]} → <b>${z[s]}</b> <em>+${z[s]-a[s]}</em></span></div>`).join('');
        }else sts.innerHTML='';
      };
      sel.querySelector('.mn').onclick=()=>{k--;calc()};sel.querySelector('.ms').onclick=()=>{k++;calc()};
      rng.oninput=()=>{k=+rng.value;calc()};
      const q=sel.querySelector('.ge-quick');
      for(const n of[1,5,10]){const b=h('button','',`+${n}`);b.onclick=()=>{k=n;calc()};q.append(b)}
      const mx=h('button','','Máx');mx.onclick=()=>{k=Math.max(1,alcanzable()-lv);calc()};q.append(mx);
      go.onclick=()=>entrenarPlan(c,plan);
      sel.append(go);box.append(sel);
      if(BASE[c.especieId]===undefined)datosEsp(c.especieId).then(d=>{BASE[c.especieId]=d.stats}).catch(()=>{BASE[c.especieId]=null}).then(()=>{if(sel.isConnected)calc()});
      calc();
    }

    // Caramelos a mano
    const det=h('details','margin-top:2px');det.className='ge-card';
    det.innerHTML='<summary style="cursor:pointer"><b>🍬 Elegir caramelos a mano</b></summary>';
    const gr=h('div','');gr.className='ge-cand';
    for(const k of CARAMELOS){
      const n=tengo(k),f=h('div','');f.className='ge-c';
      f.innerHTML=`<div class="ge-ci">${objetoIcono(k)}</div><div><b>${esc(objetoNombre(k))}</b><br><small>+${Experiencia.XP_CARAMELO[k]} XP · tienes ${n}</small></div>`;
      const bb=h('div','');bb.className='ge-cb';
      for(const[txt,cant]of[['×1',1],['×10',10],['Todos',Infinity]]){
        const b=h('button','',txt);b.disabled=n<=0||lv>=max;b.onclick=()=>entrenar(c,k,cant);bb.append(b);
      }
      f.append(bb);gr.append(f);
    }
    det.append(gr);box.append(det);
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
    function statsCarta(c){   // fórmula de los juegos, sin EVs: PS = ((2·base+IV)·nivel/100)+nivel+10 · resto = (((2·base+IV)·nivel/100)+5) × naturaleza
    const b=BASE[c.especieId],nat=Guardado.NATURALEZAS[c.naturaleza]||{},o={};
    for(const s of Object.keys(ST)){
      const v=Math.floor((2*b[s]+c.ivs[s])*c.nivel/100);
      o[s]=s==='hp'?v+c.nivel+10:Math.floor((v+5)*(nat.u===s?110:nat.d===s?90:100)/100);
    }
    return o;
  }

    const SCOL={hp:'#22c55e',atk:'#f97316',def:'#eab308',spa:'#38bdf8',spd:'#84cc16',spe:'#f472b6'};
  function pintarStats(c,z){
    const b=BASE[c.especieId];
    if(b===undefined){
      z.innerHTML='<small style="opacity:.7">Cargando estadísticas…</small>';
      datosEsp(c.especieId).then(d=>{BASE[c.especieId]=d.stats}).catch(()=>{BASE[c.especieId]=null})
        .then(()=>{if(z.isConnected)pintarStats(c,z)});
      return;
    }
    if(!b){z.innerHTML='<small style="color:#f87171">No se pudieron cargar las estadísticas (¿sin conexión?)</small>';return}
    const s=statsCarta(c),nat=Guardado.NATURALEZAS[c.naturaleza]||{},tot=Object.values(b).reduce((x,y)=>x+y,0);
    const filas=Object.keys(ST).map(k=>{
      const m=nat.u===k?' <b style="color:#4ade80">▲</b>':nat.d===k?' <b style="color:#f87171">▼</b>':'';
      return `<tr><td style="padding-right:8px">${ST[k]}</td>
        <td style="width:120px"><div style="background:#1e293b;height:6px;border-radius:3px"><div style="width:${Math.min(100,b[k]/1.8)}%;height:6px;background:${SCOL[k]};border-radius:3px"></div></div></td>
        <td style="padding-left:8px;text-align:right"><b>${s[k]}</b>${m}</td>
        <td style="padding-left:6px;opacity:.6"><small>base ${b[k]}</small></td></tr>`;
    }).join('');
    z.innerHTML=`<table style="font-size:12px;margin-top:4px">${filas}</table><small style="opacity:.6">Total base ${tot} · valores a nivel ${c.nivel}</small>`;
  }

  function estadoEvo(c,e){   // devuelve {ok, lock, reqs:[{ok,html}], txt}
    if(e.t==='bloqueado')return{ok:false,lock:true,reqs:[{ok:false,html:'Requisito: '+esc(e.req)}],txt:'🔒 Próximamente · requisito: '+esc(e.req)};
    const reqs=[],add=(ok,html)=>reqs.push({ok,html});
    if(e.nivel!=null)add(c.nivel>=e.nivel,`Nivel ${e.nivel} <small>(tu carta: ${c.nivel})</small>`);
    if(e.t==='objeto')for(const[k,n]of costes(e))add(tengo(k)>=n,`${objetoIcono(k)} ${n} × ${esc(objetoNombre(k))} <small>(tienes ${tengo(k)})</small>`);
    if(e.t==='stats'){
      if(BASE[c.especieId]===undefined)add(false,'<small>Calculando estadísticas…</small>');
      else if(!BASE[c.especieId])add(false,'<small>No se pudieron cargar las estadísticas</small>');
      else{
        const s=statsCarta(c),rel=s.atk>s.def?'>':s.atk<s.def?'<':'=';
        add(rel===e.cmp,`Ataque ${s.atk} ${rel} Defensa ${s.def} <small>(hace falta ${e.cmp})</small>`);
      }
    }
    if(e.g){
      const q=GN[e.g],mia=c.genero==='N'?'sin género':GN[c.genero]?GN[c.genero][1].toLowerCase():'sin definir';
      add(c.genero===e.g,`${q[0]} Solo ${q[1].toLowerCase()} <small>(tu carta: ${mia})</small>`);
    }
    return{ok:reqs.every(r=>r.ok),reqs,txt:reqs.map(r=>r.html).join('<br>')};
  }
  function seccionEvolucion(c){
    const box=h('div','max-width:520px');box.className='ge';
    const ops=(typeof EVOLUCIONES!=='undefined'&&EVOLUCIONES[c.especieId])||[];
    if(!ops.length){const f=h('div','','🌟 Esta carta no tiene más evoluciones.');f.className='ge-card';box.append(f);return box}
    if(ops.some(e=>e.t==='stats')&&BASE[c.especieId]===undefined)
      datosEsp(c.especieId).then(d=>{BASE[c.especieId]=d.stats}).catch(()=>{BASE[c.especieId]=null})
        .then(()=>{if(box.isConnected)box.replaceWith(seccionEvolucion(c))});
    const lista=ops.map(e=>({e,st:estadoEvo(c,e)})).sort((a,b)=>(b.st.ok-a.st.ok)||((a.e.t==='bloqueado')-(b.e.t==='bloqueado')));   // primero las que ya puedes hacer
    const badge=r=>`<span style="background:${RC[r]};color:#0f172a;border-radius:8px;padding:0 7px;font-weight:700">${r}</span>`;
    for(const{e,st}of lista){
      const card=h('div','');card.className='ge-card ev'+(st.lock?' lock':'');
      card.innerHTML=`<div class="ev-top">
        <div class="ev-p"><img src="${SPR+c.especieId}.png" alt=""><div class="n0"><small>#${c.especieId}</small></div></div>
        <div class="ev-arrow">➜</div>
        <div class="ev-p"><img src="${SPR+e.a}.png" alt=""><div class="n1"><b>#${e.a}</b></div></div>
        <div class="ev-r">${badge(rz(c.especieId))} → ${badge(rz(e.a))}</div></div>
        <ul class="ev-req">${st.reqs.map(q=>`<li class="${q.ok?'ok':st.lock?'lk':'no'}"><span>${q.ok?'✓':st.lock?'🔒':'✗'}</span><div>${q.html}</div></li>`).join('')}</ul>`;
      nombreEs(c.especieId).then(n=>{const x=card.querySelector('.n0');if(x)x.innerHTML='<small>'+esc(n)+'</small>'});
      nombreEs(e.a).then(n=>{const x=card.querySelector('.n1');if(x)x.innerHTML='<b>'+esc(n)+'</b>'});
      const b=h('button','',st.lock?'🔒 Próximamente':'🧬 Evolucionar');b.className='ge-go';
      b.disabled=!st.ok;if(st.ok)b.onclick=()=>evolucionar(c,e);
      card.append(b);box.append(card);
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
    await guardar();pestana='datos';pantallaDetalle(c,`¡Tu carta ha evolucionado a ${nom}!`);
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