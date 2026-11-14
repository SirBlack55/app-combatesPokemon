// HERRAMIENTA TEMPORAL (se puede borrar cuando ya no haga falta).
// Carga las especies de la PokéAPI, genera los kits de todos los arquetipos viables
// y muestra: ranking de ataques más usados (orden para hacer customs),
// cuántas especies admiten cada arquetipo y cuánto se solapan entre sí.
// Añade un botón flotante "🧮 Kits". Necesita: pokeapi.js, conversor.js y arquetipos.js.
(function(){
const AQ=typeof module!=='undefined'?require('./arquetipos.js'):{arquetiposViables,arquetiposDistintos,generarKit,estiloAtaque,ARQUETIPOS};

// ---------- Análisis (puro, sin DOM ni red) ----------
// lista = [{esp:{tipos,stats,...}, movs:[ataques convertidos]}]
function analizarKits(lista){
  const uso={},mvs={},viab={},sol={},dist={};let kits=0,cortos=0,sinUtil=0;
  for(const{esp,movs}of lista){
    const via=AQ.arquetiposViables(esp,movs),ks={};
    for(const a of AQ.arquetiposDistintos(esp,movs))dist[a]=(dist[a]||0)+1;
    for(const a of via){
      const k=AQ.generarKit(esp,a,movs);ks[a]=new Set(k.map(m=>m.key));
      viab[a]=(viab[a]||0)+1;kits++;
      if(k.length<4)cortos++;
      if(!k.some(m=>m.cat==='sta'))sinUtil++;
      for(const m of k){uso[m.key]=(uso[m.key]||0)+1;mvs[m.key]=m}
    }
    for(let i=0;i<via.length;i++)for(let j=i+1;j<via.length;j++){
      const A=ks[via[i]],B=ks[via[j]],inter=[...A].filter(x=>B.has(x)).length,uni=new Set([...A,...B]).size;
      const id=via[i]+'/'+via[j];(sol[id]=sol[id]||{s:0,n:0});sol[id].s+=inter/uni;sol[id].n++;
    }
  }
  const ranking=Object.entries(uso).sort((a,b)=>b[1]-a[1]).map(([key,n])=>({key,n,mv:mvs[key]}));
  const solape=Object.entries(sol).map(([id,o])=>({id,media:o.s/o.n,n:o.n}));
  return{especies:lista.length,kits,cortos,sinUtil,viables:viab,distintos:dist,ranking,solape};
}

if(typeof module!=='undefined'){module.exports={analizarKits};return}

// ---------- Carga desde la PokéAPI ----------
const KC='kits-especies-v1';let cache={};try{cache=JSON.parse(localStorage.getItem(KC)||'{}')}catch(e){}
async function cargarEsp(id){
  if(cache[id])return cache[id];
  const p=await jf(API+'pokemon/'+id),sm={};p.stats.forEach(x=>sm[x.stat.name]=x.base_stat);
  return cache[id]={id,n:p.name,tipos:p.types.map(x=>TN[x.type.name]||'normal'),
    stats:{hp:sm.hp,atk:sm.attack,def:sm.defense,spa:sm['special-attack'],spd:sm['special-defense'],spe:sm.speed},
    moves:p.moves.map(m=>m.move.name)};
}
async function lotes(items,fn,tam,prog){
  const out=[];
  for(let i=0;i<items.length;i+=tam){
    out.push(...await Promise.all(items.slice(i,i+tam).map(x=>fn(x).catch(()=>null))));
    prog(Math.min(items.length,i+tam),items.length);
  }
  return out;
}
async function ejecutar(a,b,prog){
  const ids=[];for(let i=a;i<=b;i++)ids.push(i);
  prog('Cargando especies…');
  const esps=(await lotes(ids,cargarEsp,9,(d,t)=>prog(`Especies ${d}/${t}`))).filter(Boolean);
  try{localStorage.setItem(KC,JSON.stringify(cache))}catch(e){}
  const nombres=[...new Set(esps.flatMap(e=>e.moves))],mv={};
  const r=await lotes(nombres,n=>mvData({n,u:API+'move/'+n+'/'}),9,(d,t)=>prog(`Ataques ${d}/${t}`));
  nombres.forEach((n,i)=>{if(r[i])mv[n]=r[i]});
  return analizarKits(esps.map(e=>({esp:e,movs:e.moves.map(n=>mv[n]).filter(Boolean)})));
}

// ---------- Pantalla ----------
const $$=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
function abrir(){
  const ov=$$('div','position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);overflow:auto;padding:12px;font:13px system-ui,sans-serif;color:#e2e8f0');
  const pn=$$('div','max-width:760px;margin:0 auto;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px');
  const sel=$$('select','',GEN.map((g,i)=>`<option value="${i}">Gen ${i+1} (${g[0]}-${g[1]})</option>`).join('')+'<option value="all">Todas (lento)</option>');
  const go=$$('button','margin-left:6px','▶ Analizar'),x=$$('button','float:right','✕'),st=$$('div','margin:8px 0;min-height:18px'),out=$$('div');
  pn.append(x,$$('b','','🧮 Kits de arquetipos'),$$('div','margin:8px 0','Elige las generaciones y pulsa analizar. La primera vez tarda (descarga todos los ataques).'),sel,go,st,out);
  ov.append(pn);document.body.append(ov);x.onclick=()=>ov.remove();
  go.onclick=async()=>{
    go.disabled=true;out.innerHTML='';
    const[a,b]=sel.value=='all'?[1,GEN[GEN.length-1][1]]:GEN[+sel.value];
    try{const R=await ejecutar(a,b,t=>st.textContent=t);st.textContent='Listo.';pintar(out,R)}
    catch(e){st.textContent=ERR}
    go.disabled=false;
  };
}
function pintar(out,R){
  const pct=n=>Math.round(100*n/R.especies)+'%',tb='width:100%;border-collapse:collapse;margin:6px 0 14px';
  const tr=c=>`<tr>${c.map(v=>`<td style="padding:3px 6px;border-bottom:1px solid #1e293b">${v}</td>`).join('')}</tr>`;
  const nom=k=>AQ.ARQUETIPOS[k]?AQ.ARQUETIPOS[k].nombre:k;
  let h=`<b>Especies analizadas:</b> ${R.especies} · <b>kits generados:</b> ${R.kits}<br>
   Kits con menos de 4 ataques: ${R.cortos} · kits sin ataque de utilidad: ${R.sinUtil} (${Math.round(100*R.sinUtil/Math.max(1,R.kits))}%)`;
  h+=`<h4>Especies que admiten cada arquetipo</h4><table style="${tb}">`+Object.entries(R.viables).map(([k,n])=>tr([nom(k),n,pct(n)])).join('')+'</table>';
  h+=`<h4>Especies que lo ofrecerían tras quitar kits repetidos <small>(parecido ≥ 50% con otro arquetipo)</small></h4><table style="${tb}">`+Object.entries(R.distintos).map(([k,n])=>tr([nom(k),n,pct(n)])).join('')+'</table>';
  h+=`<h4>Solapamiento entre arquetipos <small>(100% = mismo kit)</small></h4><table style="${tb}">`+R.solape.sort((a,b)=>b.media-a.media).map(s=>tr([s.id.split('/').map(nom).join(' ↔ '),Math.round(s.media*100)+'%',s.n+' especies'])).join('')+'</table>';
  h+=`<h4>Ataques más usados <small>(✓ = ya es custom)</small></h4><table style="${tb}">`+R.ranking.slice(0,80).map((r,i)=>tr([i+1,`${r.mv.n} <small style="opacity:.6">${r.key}</small>`,`${r.mv.cat}/${AQ.estiloAtaque(r.mv)}`,r.n+' kits',typeof CUSTOM!='undefined'&&CUSTOM[r.key]?'✓':''])).join('')+'</table>';
  out.innerHTML=h;
  const d=$$('button','','⬇ Descargar ranking completo (JSON)');
  d.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(R.ranking.map(r=>({key:r.key,nombre:r.mv.n,kits:r.n,cat:r.mv.cat,estilo:AQ.estiloAtaque(r.mv),custom:!!(typeof CUSTOM!='undefined'&&CUSTOM[r.key])})),null,1)],{type:'application/json'}));a.download='ranking-ataques.json';a.click()};
  out.append(d);
}
const b=$$('button','position:fixed;right:10px;bottom:10px;z-index:9998;opacity:.85','🧮 Kits');
b.onclick=abrir;document.body.append(b);
window.analizarKits=analizarKits;
})();