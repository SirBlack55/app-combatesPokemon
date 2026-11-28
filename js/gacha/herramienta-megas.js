// HERRAMIENTA TEMPORAL 💎 Megas: busca en la PokéAPI todas las formas Mega / Primigenias y las megapiedras (incluidas las de Leyendas Z-A
// si ya están), las empareja y genera megas-datos.js (MEGA_EXTRA) con las que el juego aún no tiene. Se puede borrar cuando ya no haga falta.
// megas-datos.js va en js/combate/, con su <script> justo ANTES de megas.js.
(()=>{
const $$=(t,s,h)=>{const e=document.createElement(t);if(s)e.style.cssText=s;if(h!=null)e.innerHTML=h;return e};
const pref=(a,b)=>{let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;return i};
const es=d=>((d.names||[]).find(n=>n.language.name==='es')||{}).name;
async function enTandas(L,f,cada,aviso){const R=[];for(let i=0;i<L.length;i+=cada){R.push(...await Promise.all(L.slice(i,i+cada).map(x=>f(x).catch(()=>null))));aviso&&aviso(Math.min(L.length,i+cada),L.length)}return R}
async function buscar(st){
 st('Buscando formas Mega…');
 const lp=await jf(API+'pokemon?limit=3000'),formas=lp.results.filter(r=>/-mega(-[a-z]+)?$|-primal$/.test(r.name));
 const F=(await enTandas(formas,async r=>{const p=await jf(r.url);const id=+(/\/(\d+)\/?$/.exec(p.species.url)||[])[1];
  return{forma:p.name,id,especie:p.species.name,tipos:p.types.map(x=>TN[x.type.name]||x.type.name),hab:((p.abilities.slice().sort((a,b)=>a.slot-b.slot)[0]||{}).ability||{}).name,img:p.sprites.front_default}},10,(a,b)=>st(`Formas: ${a}/${b}`))).filter(Boolean);
 st('Buscando megapiedras…');
 let cat=null;try{cat=await jf(API+'item-category/mega-stones')}catch(e){}
 const lista=cat?cat.items:(await jf(API+'item?limit=3000')).results.filter(r=>/ite(-[xyz])?$/.test(r.name));
 const P=(await enTandas(lista,async r=>{const d=await jf(r.url);return{piedra:d.name,n:es(d)||d.name,img:(d.sprites||{}).default}},10,(a,b)=>st(`Piedras: ${a}/${b}`))).filter(Boolean);
 // emparejar: misma variante (X/Y) y el prefijo común más largo con el nombre de la especie
 const usadas=new Set();
 for(const f of F.sort((a,b)=>a.forma.localeCompare(b.forma))){
  if(/-primal$/.test(f.forma)){f.piedra=f.id===383?'red-orb':f.id===382?'blue-orb':null;f.pn=f.id===383?'Esfera Roja':'Esfera Azul';continue}
  const v=(/-mega-([a-z]+)$/.exec(f.forma)||[])[1]||'';let mejor=null,mp=3;
  for(const p of P){if(usadas.has(p.piedra))continue;const pv=(/-([xyz])$/.exec(p.piedra)||[])[1]||'';if(pv!==v)continue;
   const n=pref(p.piedra,f.especie);if(n>mp){mp=n;mejor=p}}
  if(mejor){usadas.add(mejor.piedra);f.piedra=mejor.piedra;f.pn=mejor.n;f.pimg=mejor.img}
 }
 return{F,sueltas:P.filter(p=>!usadas.has(p.piedra))};
}
function abrir(){
 const ov=$$('div','position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);overflow:auto;padding:12px;font:13px system-ui,sans-serif;color:#e2e8f0');
 const pn=$$('div','max-width:860px;margin:0 auto;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px');
 const x=$$('button','float:right','✕'),go=$$('button','','▶ Buscar en la PokéAPI'),st=$$('div','margin:8px 0;min-height:18px'),out=$$('div');
 pn.append(x,$$('b','','💎 Megas de la PokéAPI'),$$('div','margin:8px 0','Busca todas las formas Mega y Primigenias y las megapiedras, y genera <b>megas-datos.js</b> con las que el juego aún no tiene (por ejemplo, las de Leyendas Z-A si la PokéAPI ya las trae).'),go,st,out);
 ov.append(pn);document.body.append(ov);x.onclick=()=>ov.remove();
 go.onclick=async()=>{go.disabled=true;try{const R=await buscar(t=>st.textContent=t);pintar(R)}catch(e){st.textContent=typeof ERR!=='undefined'?ERR:String(e)}go.disabled=false};
 function pintar({F,sueltas}){
  const yaPiedra=new Set(Object.keys(MEGA)),yaForma=new Set([...Object.values(MEGA).map(v=>v[1]),'rayquaza-mega','groudon-primal','kyogre-primal']);
  if(typeof MEGA_VARIANTES!=='undefined')for(const L of Object.values(MEGA_VARIANTES))for(const v of L)yaForma.add(v);   // variantes que comparten piedra (las resuelve megas.js)
  const nuevas=F.filter(f=>!yaForma.has(f.forma)),conPiedra=nuevas.filter(f=>f.piedra&&!yaPiedra.has(f.piedra)),sin=nuevas.filter(f=>!f.piedra);
  const sinHab=F.filter(f=>f.hab&&typeof HAB!=='undefined'&&!HAB[f.hab]);
  st.textContent=`Listo: ${F.length} formas Mega/Primigenias en la PokéAPI · el juego ya tiene ${F.length-nuevas.length} · nuevas con piedra: ${conPiedra.length} · nuevas sin piedra encontrada: ${sin.length} · con habilidad que el juego no tiene: ${sinHab.length}`;
  const fila=f=>`<tr><td><img src="${f.img||''}" width="56" height="56" style="image-rendering:pixelated"></td><td><b>${f.forma}</b><br><small>#${f.id} ${f.especie}</small></td>
   <td>${(f.tipos||[]).map(t=>`<span style="background:${(typeof TC!=='undefined'&&TC[t])||'#475569'};border-radius:5px;padding:0 5px;margin-right:3px">${typeof NT!=='undefined'&&NT[t]||t}</span>`).join('')}</td>
   <td><small>${f.hab||'—'}${f.hab&&typeof HAB!=='undefined'&&!HAB[f.hab]?' <b style="color:#fb923c">(no existe en el juego)</b>':''}</small></td>
   <td>${f.piedra?`${f.pimg?`<img src="${f.pimg}" width="24" style="vertical-align:middle">`:''} ${f.pn} <small style="opacity:.6">${f.piedra}</small>`:'<span style="color:#fb923c">sin piedra</span>'}</td></tr>`;
  const tabla=(t,L)=>L.length?`<details open style="margin:8px 0"><summary><b>${t}</b> (${L.length})</summary><table style="border-collapse:collapse;width:100%">${L.map(fila).join('')}</table></details>`:'';
  out.innerHTML=tabla('🧩 Con una habilidad que el juego aún no tiene',sinHab)+tabla('🆕 Nuevas con megapiedra (se añadirán)',conPiedra)+tabla('⚠️ Nuevas sin megapiedra encontrada (revísalas)',sin)
   +(sueltas.length?`<details style="margin:8px 0"><summary><b>Piedras sin forma emparejada</b> (${sueltas.length})</summary>${sueltas.map(p=>`<span style="display:inline-block;border:1px solid #334155;border-radius:6px;padding:1px 6px;margin:2px">${p.n} <small>${p.piedra}</small></span>`).join('')}</details>`:'')
   +tabla('✅ Ya están en el juego',F.filter(f=>yaForma.has(f.forma)));
  const d=$$('button','margin:8px 0',`⬇ Descargar megas-datos.js (${conPiedra.length} nuevas)`);
  d.onclick=()=>{const o={};for(const f of conPiedra)o[f.piedra]=[f.id,f.forma,f.pn];
   const txt=`// Generado con la herramienta 💎 Megas (PokéAPI). Megas que megas.js añade a las clásicas: piedra: [especie, forma, nombre]\nconst MEGA_EXTRA=${JSON.stringify(o)};\n`;
   const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/javascript'}));a.download='megas-datos.js';a.click()};
  out.prepend(d);
 }
}
const b=$$('button','position:fixed;right:10px;bottom:262px;z-index:9998;opacity:.85','💎 Megas');
b.onclick=abrir;document.body.append(b);
})();
