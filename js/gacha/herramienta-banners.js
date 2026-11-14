// HERRAMIENTA TEMPORAL (se puede borrar cuando ya no haga falta).
// Crea el BANNER INICIAL: elige los iniciales garantizados (27), sortea el relleno (con semilla,
// cuotas por rareza y variedad de tipos), deja quitar especies a mano, simula tiradas con reroll
// y descarga banners-datos.js. Botón flotante "🎴 Banners".
// Necesita: pokeapi.js, conversor.js, rarezas.js (RAREZA_POR_ESPECIE), arquetipos.js y banners.js.
// Usa la caché de la herramienta de kits (si falta alguna especie, la descarga).
(function(){
const KC='kits-especies-v1';let kits={};try{kits=JSON.parse(localStorage.getItem(KC)||'{}')}catch(e){}
const cap=n=>String(n).replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
const RAR=['N','R','SR','SSR'];   // el banner inicial no da UR ni LR
const S={iniciales:null,relleno:null,semilla:1,cuotas:{N:10,R:9,SR:4,SSR:2}};

async function esp(id){
  if(kits[id])return kits[id];
  const p=await jf(API+'pokemon/'+id),sm={};p.stats.forEach(x=>sm[x.stat.name]=x.base_stat);
  return kits[id]={id,n:p.name,tipos:p.types.map(x=>TN[x.type.name]||'normal'),
    stats:{hp:sm.hp,atk:sm.attack,def:sm.defense,spa:sm['special-attack'],spd:sm['special-defense'],spe:sm.speed},
    moves:p.moves.map(m=>m.move.name)};
}
async function espMuchos(ids,prog){
  const falta=ids.filter(i=>!kits[i]);
  for(let i=0;i<falta.length;i+=9){
    await Promise.all(falta.slice(i,i+9).map(esp));
    if(prog)prog(`Descargando especies ${Math.min(falta.length,i+9)}/${falta.length}`);
  }
}
async function arqsDe(id){
  const e=await esp(id),movs=[];
  for(let i=0;i<e.moves.length;i+=9)
    movs.push(...await Promise.all(e.moves.slice(i,i+9).map(n=>mvData({n,u:API+'move/'+n+'/'}))));
  return arquetiposDistintos(e,movs.filter(Boolean));
}
const rz=id=>RAREZA_POR_ESPECIE[id][0];

// Genera iniciales (1ª vez) y sortea el relleno con la semilla y cuotas actuales.
async function generar(prog=()=>{}){
  if(typeof RAREZA_POR_ESPECIE==='undefined')throw new Error('Falta rarezas.js');
  if(!S.iniciales){
    await espMuchos(INICIALES_IDS,prog);S.iniciales=[];
    for(const id of INICIALES_IDS){prog(`Arquetipos de iniciales ${S.iniciales.length+1}/${INICIALES_IDS.length}`);S.iniciales.push({id,arqs:await arqsDe(id)})}
  }
  // especies ya reservadas por otros banners (el relleno debe ser exclusivo)
  const usados=new Set([...INICIALES_IDS,...EXCLUIDOS_DEL_INICIAL]);
  if(typeof BANNERS!=='undefined')for(const b of BANNERS)if(b.id!=='inicial')
    for(const p of[b.garantizado,b.relleno,b])if(p&&p.pool)p.pool.forEach(e=>usados.add(e.id));
  const ids=Object.keys(RAREZA_POR_ESPECIE).map(Number)
    .filter(id=>RAREZA_POR_ESPECIE[id][1]===1&&RAR.includes(rz(id))&&!usados.has(id));
  await espMuchos(ids,prog);
  const cands=ids.map(id=>({id,rareza:rz(id),tipos:kits[id].tipos})),rng=crearRng(S.semilla);
  const total=Object.values(S.cuotas).reduce((a,b)=>a+b,0),malas=new Set();
  S.relleno=[];
  let cuotas={...S.cuotas};
  for(let ronda=0;ronda<6;ronda++){
    const ocupados=new Set([...S.relleno.map(e=>e.id),...malas]);
    const pedir=sortearRelleno(cands.filter(c=>!ocupados.has(c.id)),cuotas,rng);
    if(!pedir.length)break;
    for(const id of pedir){
      prog(`Calculando arquetipos del relleno ${S.relleno.length+1}/${total}`);
      const a=await arqsDe(id);
      if(a.length)S.relleno.push({id,arqs:a});else malas.add(id);   // sin arquetipo viable: se descarta y se repone
    }
    cuotas={};for(const r of RAR){const f=S.cuotas[r]-S.relleno.filter(e=>rz(e.id)===r).length;if(f>0)cuotas[r]=f}
    if(!Object.keys(cuotas).length)break;
  }
}

// ---------- Pantalla ----------
const $$=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
function chip(e,quitable){
  const k=kits[e.id];
  return `<span style="display:inline-block;border:1px solid #334155;border-radius:6px;padding:2px 6px;margin:2px;font-size:12px">${cap(k.n)} <small style="opacity:.7">${k.tipos.join('/')} · ${e.arqs.join('/')}</small>${quitable?` <a href="#" data-x="${e.id}" style="color:#f87171;text-decoration:none">✕</a>`:''}</span>`;
}
function abrir(){
  const ov=$$('div','position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);overflow:auto;padding:12px;font:13px system-ui,sans-serif;color:#e2e8f0');
  const pn=$$('div','max-width:760px;margin:0 auto;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px');
  const inp=(id,v,w=56)=>`<input id="${id}" type="number" value="${v}" style="width:${w}px">`;
  const f=$$('div','margin:8px 0',`Relleno (cuántas especies de cada rareza): N ${inp('b-N',S.cuotas.N)} R ${inp('b-R',S.cuotas.R)} SR ${inp('b-SR',S.cuotas.SR)} SSR ${inp('b-SSR',S.cuotas.SSR)} · Semilla ${inp('b-s',S.semilla,70)}`);
  const go=$$('button','margin-right:6px','🎲 Sortear relleno'),sim=$$('button','margin-right:6px','🎰 Simular tirada'),x=$$('button','float:right','✕'),
    st=$$('div','margin:8px 0;min-height:18px'),out=$$('div'),ts=$$('div','margin:8px 0');
  pn.append(x,$$('b','','🎴 Banner inicial'),f,go,sim,st,ts,out);ov.append(pn);document.body.append(ov);x.onclick=()=>ov.remove();

  const leer=()=>{for(const r of RAR)S.cuotas[r]=+f.querySelector('#b-'+r).value||0;S.semilla=+f.querySelector('#b-s').value||1};
  function pintar(){
    if(!S.relleno)return;
    const falta=S.relleno.length-9;
    let h=`<h4>Iniciales garantizados (${S.iniciales.length}) <small>· sale 1 al azar por tirada</small></h4>`+S.iniciales.map(e=>chip(e)).join('');
    h+=`<h4>Relleno (${S.relleno.length} especies) <small>· cada tirada saca 9 distintas${falta<0?' · <b style="color:#f87171">¡hacen falta al menos 9!</b>':''}</small></h4>`;
    for(const r of RAR){
      const l=S.relleno.filter(e=>rz(e.id)===r);
      if(l.length)h+=`<div><b>${r}</b> (${l.length}) ${l.map(e=>chip(e,true)).join('')}</div>`;
    }
    out.innerHTML=h;
    const d=$$('button','margin-top:12px','⬇ Descargar banners-datos.js');
    d.onclick=()=>{
      const b=crearBannerInicial(S.iniciales,S.relleno);
      const otros=typeof BANNERS!=='undefined'?BANNERS.filter(x=>x.id!=='inicial'):[];
      const txt='// Generado con la herramienta de banners.\nconst BANNERS='+JSON.stringify([b,...otros])+';\n';
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/javascript'}));a.download='banners-datos.js';a.click();
    };
    out.append(d);
  }
  go.onclick=async()=>{
    go.disabled=true;leer();ts.innerHTML='';
    try{await generar(t=>st.textContent=t);st.textContent='Listo. Cambia la semilla para otro sorteo o quita especies con ✕.';pintar()}
    catch(e){st.textContent=e.message==='Falta rarezas.js'?'Falta cargar rarezas.js en index.html.':ERR}
    go.disabled=false;
  };
  out.addEventListener('click',e=>{
    const id=e.target.dataset&&e.target.dataset.x;if(!id)return;
    e.preventDefault();S.relleno=S.relleno.filter(x=>x.id!=+id);pintar();
  });
  sim.onclick=()=>{
    if(!S.relleno||S.relleno.length<9){st.textContent='Primero sortea el relleno (mínimo 9 especies).';return}
    const t=tiradaInicial(crearBannerInicial(S.iniciales,S.relleno),rz);
    ts.innerHTML='<b>Tirada simulada</b> <small>(pulsa otra vez para hacer reroll)</small><br>'+t.map((c,i)=>
      `<div>${i?'':'⭐ '}${cap(kits[c.especieId].n)} <small style="opacity:.75">${c.arquetipo} · ${c.rareza}</small></div>`).join('');
  };
  if(S.relleno)pintar();
}
const b=$$('button','position:fixed;right:10px;bottom:82px;z-index:9998;opacity:.85','🎴 Banners');
b.onclick=abrir;document.body.append(b);
window.herramientaBanners={S,generar};
})();