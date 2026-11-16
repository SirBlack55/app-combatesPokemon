// PANTALLAS DE EVENTOS del gacha: lista por tipo, fases, elección de equipo y combate.
// El combate usa el simulador: monta las cartas como Pokémon temporales (TY['ev-...']), cambia a su pantalla,
// y al terminar (gancho alTerminarCombate) vuelve aquí, da el premio y guarda.
// Necesita: eventos.js + eventos-datos.js, y que gacha.js le pase sus funciones (ver Gacha → eventosGacha()).
const GachaEventos=(()=>{
  function crear(X){
    const{h,esc,limpiar,cabecera,guardar,volver,carta,nombreEs,datosEsp,kitDe}=X;
    const P=()=>X.partida(),C=()=>X.cont(),hoy=()=>X.hoy();
    const ico=k=>typeof objetoIcono==='function'?objetoIcono(k):'📦';
    let tipoActual='farmeo',combate=null;

    const dropHtml=f=>(f.drop||[]).map(d=>`<span style="white-space:nowrap">${ico(d.o)} ${d.min===d.max?d.min:d.min+'-'+d.max}${(d.prob??1)<1?` <small>(${Math.round(d.prob*100)} %)</small>`:''}</span>`).join(' · ');
    const nombres=el=>el.querySelectorAll('.nm').forEach(e=>nombreEs(+e.dataset.id).then(n=>{e.textContent=n}));

    // ---------- Lista de eventos por tipo ----------
    function pantallaEventos(tipo){
      tipoActual=tipo||tipoActual;
      limpiar();C().append(cabecera('🗡️ Eventos',volver));
      const tabs=h('div','display:flex;gap:6px;flex-wrap:wrap;margin:8px 0');
      for(const[k,t]of Object.entries(Eventos.TIPOS)){
        const b=h('button',`padding:6px 10px;${k===tipoActual?'border-color:#4ade80':''}`,`${t.icono} ${t.nombre}`);
        b.onclick=()=>pantallaEventos(k);tabs.append(b);
      }
      C().append(tabs,h('div','font-size:12px;opacity:.75;margin:4px 0;max-width:520px',esc(Eventos.TIPOS[tipoActual].desc)));
      const lista=EVENTOS.filter(e=>e.tipo===tipoActual),l=h('div','display:flex;flex-direction:column;gap:8px;max-width:520px');
      for(const ev of lista){
        const dis=Eventos.disponible(ev,hoy());
        const b=h('button','text-align:left;padding:12px',`<b>${ev.icono||''} ${esc(ev.nombre)}</b><br><small>${dis?esc(ev.desc):'Hoy no disponible · abre: '+Eventos.diasTexto(ev)}</small>`);
        b.onclick=()=>pantallaEvento(ev);l.append(b);
      }
      C().append(l);
      if(!lista.length)C().append(h('p','opacity:.7','Próximamente.'));
    }

    // ---------- Fases de un evento ----------
    function pantallaEvento(ev,aviso){
      limpiar();C().append(cabecera(`${ev.icono||''} ${ev.nombre}`,()=>pantallaEventos(ev.tipo)));
      if(aviso)C().append(h('div','background:#14532d;border:1px solid #4ade80;border-radius:8px;padding:8px 10px;margin:8px 0;max-width:520px;font-size:13px',aviso));
      C().append(h('div','font-size:12px;opacity:.8;margin:4px 0;max-width:520px',esc(ev.desc)));
      const dis=Eventos.disponible(ev,hoy());
      if(!dis)C().append(h('div','color:#fbbf24;font-size:13px;margin:6px 0','Hoy no está disponible. Abre: '+Eventos.diasTexto(ev)));
      ev.fases.forEach((f,i)=>{
        const lock=!Eventos.desbloqueada(P(),ev,i,hoy()),rest=Eventos.intentosRestantes(P(),ev,f,hoy()),
          vic=Eventos.estado(P(),ev,hoy()).victorias[f.id]||0;
        const riv=f.rivales.map(r=>`<span style="display:inline-block;text-align:center;font-size:10px"><img src="${SPR+r.esp}.png" style="width:40px;height:40px;image-rendering:pixelated" alt=""><br><span class="nm" data-id="${r.esp}">#${r.esp}</span><br>Nv ${r.nivel}</span>`).join(' ');
        const d=h('div',`display:flex;align-items:center;gap:8px;border:1px solid #334155;border-radius:8px;padding:8px;margin:8px 0;max-width:520px;${lock?'opacity:.55':''}`,
          `<div style="flex:1"><b>${esc(f.nombre)}</b> ${vic?'<small style="color:#4ade80">✔ superada</small>':''}${lock?' <small>🔒 supera la fase anterior</small>':''}
           <div style="margin:4px 0">${riv}</div>
           <div style="font-size:12px">Premios: ${dropHtml(f)}</div>
           ${!vic&&f.primera?`<div style="font-size:12px">Primera vez: ${X.premioHtml(f.primera)}</div>`:''}
           <small style="opacity:.75">${f.intentosDia==null?'Intentos ilimitados':`Intentos hoy: ${rest}/${f.intentosDia}`} · llevas hasta ${f.equipo} carta${f.equipo>1?'s':''}</small></div>`);
        const b=h('button','padding:8px 12px','⚔️ Combatir');b.disabled=lock||!dis||rest<=0;
        b.onclick=()=>pantallaEquipo(ev,f);d.append(b);nombres(d);C().append(d);
      });
    }

    // ---------- Elegir equipo ----------
    function pantallaEquipo(ev,f){
      limpiar();C().append(cabecera(`${f.nombre} · ${ev.nombre}`,()=>pantallaEvento(ev)));
      const box=[...P().box].sort((a,b)=>b.nivel-a.nivel||a.especieId-b.especieId);
      if(!box.length){C().append(h('p','','No tienes cartas. Consigue algunas en un banner.'));return}
      const max=f.equipo,ids=new Set(),info=h('div','margin:8px 0;font-size:13px'),go=h('button','padding:10px 14px','⚔️ Combatir'),g=h('div','');
      g.className='gc-grid';
      const upd=()=>{info.innerHTML=`Elige hasta <b>${max}</b> carta${max>1?'s':''}: <b>${ids.size}/${max}</b> <small style="opacity:.7">(se gasta 1 intento al empezar)</small>`;go.disabled=!ids.size};
      for(const c of box){
        const d=carta(c,{alClick:()=>{
          if(ids.has(c.id)){ids.delete(c.id);d.style.outline=''}
          else if(ids.size<max){ids.add(c.id);d.style.outline='3px solid #4ade80'}
          upd();
        }});
        g.append(d);
      }
      go.onclick=()=>combatir(ev,f,box.filter(c=>ids.has(c.id)));
      C().append(info,go,g);upd();
    }

    // ---------- Combate ----------
    // Convierte una carta (o un rival) en un Pokémon temporal del simulador y devuelve su casilla de equipo {t,s}.
    async function montar(key,esp,nivel,ivs,natKey,arq){
      const e=await datosEsp(esp),kit=await kitDe({especieId:esp,arquetipo:arq}),nm=await nombreEs(esp),
        st=Eventos.estadisticas(e.stats,ivs,nivel,X.NAT[natKey]),pool=kit.length?kit.slice(0,4):[N0],fi=new Image();
      fi.src=SPR+esp+'.png';
      TY[key]={n:nm,e:'',c:[TCOL[e.tipos[0]],'#fff','#334155'],st,H:Eventos.vidaCombate(st.hp),types:e.tipos,pool,
        ds:pool.map((_,i)=>i),api:1,learn:null,sg:pool.length,img:fi.src,fi,bi:new Image()};
      return{t:key,s:pool.map((_,i)=>i)};
    }
    async function combatir(ev,f,cartas){
      if(typeof start!=='function'||typeof TY==='undefined'||typeof irA!=='function'){alert('Falta cargar el simulador.');return}
      if(!Eventos.gastarIntento(P(),ev,f,hoy())){pantallaEvento(ev);return}
      await guardar();
      limpiar();C().append(cabecera('Preparando combate…'));
      const st=h('p','','Cargando ataques de los Pokémon (la primera vez tarda un poco)…');C().append(st);
      try{
        const mios=[],riv=[];
        for(let i=0;i<cartas.length;i++){const c=cartas[i];mios.push(await montar('ev-m'+i,c.especieId,c.nivel,c.ivs,c.naturaleza,c.arquetipo))}
        for(let i=0;i<f.rivales.length;i++){const r=f.rivales[i];riv.push(await montar('ev-r'+i,r.esp,r.nivel,Eventos.IVS_RIVAL,null,r.arq))}
        const claves=new Set([...mios,...riv].map(x=>x.t));
        combate={ev,f,claves};TM=[mios,riv];
        alTerminarCombate=w=>{
          if(!combate||document.body.dataset.modo!=='simulador'||!team[0].some(u=>claves.has(u.t)))return;   // no es nuestro combate
          const vic=w===0;
          $('#ban').innerHTML=`${vic?'🏆<br>¡Victoria!':'💀<br>Derrota'}<div style="margin-top:10px"><button id="evfin">Continuar</button></div>`;
          $('#evfin').onclick=()=>terminar(vic);
        };
        $('#rs').style.display='none';
        irA('simulador');start();
      }catch(e){
        combate=null;
        // el intento ya está gastado: se devuelve si el fallo fue al preparar (nunca llegó a empezar el combate)
        const E=Eventos.estado(P(),ev,hoy());E.intentos[f.id]=Math.max(0,(E.intentos[f.id]||0)-1);await guardar();
        limpiar();C().append(cabecera('Error',()=>pantallaEvento(ev)),h('p','color:#f87171',typeof ERR!=='undefined'?ERR:'No se pudo preparar el combate.'),h('small','opacity:.7','No se ha gastado ningún intento.'));
      }
    }
    async function terminar(vic){
      const c=combate;combate=null;alTerminarCombate=null;
      $('#rs').style.display='';
      TM=[[],[]];toSetup();                      // deja el simulador limpio para cuando se use de verdad
      document.body.dataset.modo='gacha';window.scrollTo&&window.scrollTo(0,0);
      if(!c)return;
      let aviso;
      if(vic){
        const r=Eventos.resolver(P(),c.ev,c.f,hoy());X.reg('evento',1);await guardar();
        aviso=`🏆 <b>¡Victoria!</b> Recibes: ${X.premioHtml(r.premio)||'nada esta vez'}${r.primera&&c.f.primera?' <small>(incluye el premio de primera vez)</small>':''}`;
      }else aviso='💀 <b>Derrota.</b> Has perdido el intento. Prueba con cartas de más nivel o con otro equipo.';
      pantallaEvento(c.ev,aviso);
    }

    return{abrir:()=>pantallaEventos(tipoActual)};
  }
  return{crear};
})();