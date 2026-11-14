// HERRAMIENTA TEMPORAL (se puede borrar cuando ya no haga falta).
// Descarga las líneas evolutivas de la PokéAPI y calcula la rareza de todas las especies
// con los cortes que tú pongas. Añade un botón flotante "🎚 Rareza".
// Necesita: pokeapi.js y rareza.js. Los datos se guardan en caché local (la 1ª vez tarda).
(function(){
const RK='rareza-datos-v1',KC='kits-especies-v1',MAX=GEN[GEN.length-1][1];
let RC={};try{RC=JSON.parse(localStorage.getItem(RK)||'{}')}catch(e){}
RC.sp=RC.sp||{};RC.ch=RC.ch||{};RC.bst=RC.bst||{};
let kits={};try{kits=JSON.parse(localStorage.getItem(KC)||'{}')}catch(e){}   // reutiliza lo que bajó la herramienta de kits
const idDe=u=>+u.split('/').filter(Boolean).pop();
const nom=id=>{const n=(RC.sp[id]||[])[2];return n?n.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase()):'#'+id};

async function cargarSp(id){
  if(RC.sp[id])return;
  const s=await jf(API+'pokemon-species/'+id+'/');
  RC.sp[id]=[(s.is_legendary||s.is_mythical)?1:0,idDe(s.evolution_chain.url),s.name];
}
async function cargarCh(cid){
  if(RC.ch[cid])return;
  const c=await jf(API+'evolution-chain/'+cid+'/');
  const conv=n=>({id:idDe(n.species.url),hijos:n.evolves_to.map(conv)});
  RC.ch[cid]=conv(c.chain);
}
async function cargarBst(id){
  if(RC.bst[id])return;
  if(kits[id]){RC.bst[id]=Object.values(kits[id].stats).reduce((a,b)=>a+b,0);return}
  const p=await jf(API+'pokemon/'+id);RC.bst[id]=p.stats.reduce((a,x)=>a+x.base_stat,0);
}
async function lotes(items,fn,prog,txt){
  for(let i=0;i<items.length;i+=9){
    await Promise.all(items.slice(i,i+9).map(x=>fn(x).catch(()=>null)));
    prog(`${txt} ${Math.min(items.length,i+9)}/${items.length}`);
  }
}
async function cargarTodo(prog){
  const ids=Array.from({length:MAX},(_,i)=>i+1);
  await lotes(ids,cargarSp,prog,'Especies');
  const cids=[...new Set(ids.map(i=>RC.sp[i]&&RC.sp[i][1]).filter(Boolean))];
  await lotes(cids,cargarCh,prog,'Líneas evolutivas');
  await lotes(ids,cargarBst,prog,'Estadísticas');
  try{localStorage.setItem(RK,JSON.stringify(RC))}catch(e){}
}
function calcular(cortes,leg){
  const info={};for(const id in RC.sp)info[id]={bst:RC.bst[id]||0,legendario:!!RC.sp[id][0]};
  const cfg={...RAREZA_CFG,cortes,legendarioLR:leg};
  return construirRarezas(Object.values(RC.ch),info,cfg);
}

const $$=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
function abrir(){
  const ov=$$('div','position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);overflow:auto;padding:12px;font:13px system-ui,sans-serif;color:#e2e8f0');
  const pn=$$('div','max-width:760px;margin:0 auto;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px');
  const inp=v=>`<input type="number" value="${v}" style="width:64px">`;
  const f=$$('div','margin:8px 0',`R si el final tiene menos de ${inp(RAREZA_CFG.cortes[0])} · SR menos de ${inp(RAREZA_CFG.cortes[1])} · SSR menos de ${inp(RAREZA_CFG.cortes[2])} · UR a partir de ahí (suma de estadísticas base). Legendarios y míticos: UR si tienen menos de ${inp(RAREZA_CFG.legendarioLR)}, LR si no.`);
  const go=$$('button','margin-right:6px','▶ Cargar y calcular'),x=$$('button','float:right','✕'),st=$$('div','margin:8px 0;min-height:18px'),out=$$('div');
  pn.append(x,$$('b','','🎚 Rareza por línea evolutiva'),f,go,st,out);ov.append(pn);document.body.append(ov);x.onclick=()=>ov.remove();
  const ins=f.querySelectorAll('input'),cortes=()=>[...ins].slice(0,3).map(i=>+i.value||0),leg=()=>+ins[3].value||0;
  ins.forEach(i=>i.onchange=()=>RC.ch&&Object.keys(RC.ch).length&&pintar(out,calcular(cortes(),leg())));
  go.onclick=async()=>{
    go.disabled=true;
    try{await cargarTodo(t=>st.textContent=t);st.textContent='Listo. Cambia los cortes y se recalcula al instante.';pintar(out,calcular(cortes(),leg()))}
    catch(e){st.textContent=ERR}
    go.disabled=false;
  };
  if(Object.keys(RC.ch).length>400&&Object.keys(RC.sp).length>=MAX-5){st.textContent='Datos en caché.';pintar(out,calcular(cortes(),leg()))}
}
function pintar(out,R){
  const tb='width:100%;border-collapse:collapse;margin:6px 0 14px',tr=c=>`<tr>${c.map(v=>`<td style="padding:3px 6px;border-bottom:1px solid #1e293b;vertical-align:top">${v}</td>`).join('')}</tr>`;
  let h='<h4>Especies por rareza</h4><table style="'+tb+'">'+tr(['<b>Rareza</b>','<b>Todas</b>','<b>Primera etapa (salen en tiradas)</b>'])
   +resumenRarezas(R).map(r=>tr([r.rareza,r.todas,r.primeraEtapa])).join('')+'</table>';
  h+='<h4>Etapas finales por rareza <small>(para comprobar los cortes)</small></h4><table style="'+tb+'">';
  RAREZAS.forEach((n,i)=>{
    const ids=Object.keys(R).filter(id=>R[id].final==id&&R[id].idx===i).map(Number).sort((a,b)=>a-b);
    if(ids.length)h+=tr([`<b>${n}</b> (${ids.length})`,`<small>${ids.slice(0,40).map(nom).join(', ')}${ids.length>40?'…':''}</small>`]);
  });
  h+='</table>';out.innerHTML=h;
  const d=$$('button','','⬇ Descargar rarezas.js');
  d.onclick=()=>{
    const o={};for(const id of Object.keys(R).map(Number).sort((a,b)=>a-b))o[id]=[R[id].rareza,R[id].etapa,R[id].final];
    const txt='// Generado con la herramienta de rareza. [rareza, etapa en su línea, id de su evolución final]\nconst RAREZA_POR_ESPECIE='+JSON.stringify(o)+';\n';
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/javascript'}));a.download='rarezas.js';a.click();
  };
  out.append(d);
}
const b=$$('button','position:fixed;right:10px;bottom:46px;z-index:9998;opacity:.85','🎚 Rareza');
b.onclick=abrir;document.body.append(b);
})();