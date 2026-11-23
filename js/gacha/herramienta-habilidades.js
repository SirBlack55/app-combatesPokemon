// HERRAMIENTA TEMPORAL (se puede borrar cuando ya no haga falta).
// 1) Descarga de la PokéAPI las habilidades de cada especie (normales y oculta) con su nombre y descripción en español y genera habilidades-datos.js.
// 2) Auditoría: qué habilidades y objetos están hechos (HAB, OBJ_EQ), agrupados por tipo de efecto, y cuáles faltan (las habilidades, ordenadas por nº de especies que las tienen).
// Botón flotante "🧬 Habilidades". Necesita: pokeapi.js (API, jf, GEN, ERR) y los ganchos del motor (HAB, OBJ_EQ). Va después de pokeapi.js.
// HABILIDADES_ESP[id] = [[normales], oculta|null] · HABILIDADES_INFO[habilidad] = [nombre, descripción]
(function(){
const cap=n=>String(n).replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());

// ---------- Auditoría (pura, sin DOM ni red) ----------
// ESP = HABILIDADES_ESP · INFO = HABILIDADES_INFO · H = HAB · O = OBJ_EQ · holdables = claves de objetos equipables de la PokéAPI
function auditar(ESP,INFO,H,O,holdables=[]){
 const uso={};
 for(const id in ESP){const[n,o]=ESP[id];for(const a of new Set([...(n||[]),o].filter(Boolean)))uso[a]=(uso[a]||0)+1}
 const G={},pend=[];
 for(const a of Object.keys(uso)){
  const it={id:a,n:(H[a]&&H[a].n)||(INFO[a]||[])[0]||cap(a),especies:uso[a]};
  if(H[a]){const g=H[a].g||'Otras';(G[g]=G[g]||[]).push(it)}else pend.push(it);
 }
 pend.sort((a,b)=>b.especies-a.especies||a.n.localeCompare(b.n));
 const grupos=Object.entries(G).map(([g,l])=>({g,l:l.sort((a,b)=>b.especies-a.especies)})).sort((a,b)=>b.l.length-a.l.length);
 const OG={};
 for(const k of Object.keys(O)){const g=O[k].g||'Otros';(OG[g]=OG[g]||[]).push({id:k,n:O[k].n})}
 const objGrupos=Object.entries(OG).map(([g,l])=>({g,l}));
 const objPend=holdables.filter(k=>!O[k]).sort();
 const hechas=Object.keys(uso).length-pend.length;
 return{total:Object.keys(uso).length,hechas,grupos,pendientes:pend,objHechos:Object.keys(O).length,objGrupos,objPendientes:objPend};
}
if(typeof module!=='undefined'){module.exports={auditar};return}

// ---------- Carga desde la PokéAPI ----------
const MAX=GEN[GEN.length-1][1],KE='habilidades-especies-v1',KI='habilidades-info-v1',KH='habilidades-holdables-v1';
const rd=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}};
let CE=rd(KE,{}),CI=rd(KI,{}),CH=rd(KH,null);
const guardar=()=>{try{localStorage.setItem(KE,JSON.stringify(CE));localStorage.setItem(KI,JSON.stringify(CI));if(CH)localStorage.setItem(KH,JSON.stringify(CH))}catch(e){}};
async function lotes(items,fn,prog,txt){
 for(let i=0;i<items.length;i+=9){await Promise.all(items.slice(i,i+9).map(x=>fn(x).catch(()=>null)));prog(`${txt} ${Math.min(items.length,i+9)}/${items.length}`)}
}
async function cargar(prog){
 const ids=[];for(let i=1;i<=MAX;i++)if(!CE[i])ids.push(i);
 await lotes(ids,async id=>{
  const p=await jf(API+'pokemon/'+id),ab=p.abilities.slice().sort((a,b)=>a.slot-b.slot);
  const n=[...new Set(ab.filter(x=>!x.is_hidden).map(x=>x.ability.name))],o=(ab.find(x=>x.is_hidden)||{ability:{}}).ability.name||null;
  CE[id]=[n,o];
 },prog,'Especies');
 const nombres=[...new Set(Object.values(CE).flatMap(([n,o])=>[...n,o].filter(Boolean)))].filter(a=>!CI[a]);
 await lotes(nombres,async a=>{
  const j=await jf(API+'ability/'+a+'/'),es=j.names.find(x=>x.language.name==='es'),
   ft=j.flavor_text_entries.filter(x=>x.language.name==='es').pop()||j.flavor_text_entries.filter(x=>x.language.name==='en').pop(),
   ef=(j.effect_entries.find(x=>x.language.name==='en')||{}).short_effect;
  CI[a]=[es?es.name:cap(a),((ft&&ft.flavor_text)||ef||'').replace(/\s+/g,' ')];
 },prog,'Habilidades');
 if(!CH){prog('Objetos equipables…');CH=(await jf(API+'item-attribute/holdable')).items.map(x=>x.name)}
 guardar();
}
const espActual=()=>Object.keys(CE).length?CE:(typeof HABILIDADES_ESP!=='undefined'?HABILIDADES_ESP:{});
const infoActual=()=>Object.keys(CI).length?CI:(typeof HABILIDADES_INFO!=='undefined'?HABILIDADES_INFO:{});

// ---------- Pantalla ----------
const $$=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
const chip=(x,ex)=>`<span style="display:inline-block;border:1px solid #334155;border-radius:6px;padding:1px 6px;margin:2px;font-size:12px">${x.n} <small style="opacity:.55">${ex!=null?ex:x.id}</small></span>`;
function pintar(out){
 const A=auditar(espActual(),infoActual(),HAB,OBJ_EQ,CH||[]);
 let h=`<b>${A.total} habilidades distintas en ${Object.keys(espActual()).length} especies</b> · hechas: <b style="color:#4ade80">${A.hechas}</b> · pendientes: <b style="color:#fb923c">${A.pendientes.length}</b>`;
 h+='<h4>🟢 Habilidades hechas, por tipo de efecto</h4>';
 for(const g of A.grupos)h+=`<details style="margin:4px 0"><summary style="cursor:pointer"><b>${g.g}</b> <small>(${g.l.length})</small></summary><div>${g.l.map(x=>chip(x,x.especies+' esp.')).join('')}</div></details>`;
 h+=`<h4>🟠 Habilidades pendientes <small>(más usadas primero)</small></h4><details open><summary style="cursor:pointer">Las 40 con más especies</summary><div>${A.pendientes.slice(0,40).map(x=>chip(x,x.especies+' esp.')).join('')}</div></details>`;
 h+=`<details><summary style="cursor:pointer">Todas (${A.pendientes.length})</summary><div>${A.pendientes.map(x=>chip(x,x.especies+' esp.')).join('')}</div></details>`;
 h+=`<h4>🟢 Objetos hechos (${A.objHechos})</h4>`+A.objGrupos.map(g=>`<div><b>${g.g}</b> ${g.l.map(x=>chip(x)).join('')}</div>`).join('');
 h+=`<h4>🟠 Objetos equipables sin hacer (${A.objPendientes.length})</h4>`+(CH?`<details><summary style="cursor:pointer">Ver lista</summary><div>${A.objPendientes.map(k=>chip({n:cap(k),id:''},'')).join('')}</div></details>`:'<small>Pulsa cargar para descargar la lista de la PokéAPI.</small>');
 out.innerHTML=h;
 const d=$$('button','margin-top:10px','⬇ Descargar habilidades-datos.js');
 d.onclick=()=>{
  const txt='// Generado con la herramienta de habilidades. HABILIDADES_ESP[id]=[[normales],oculta|null] · HABILIDADES_INFO[habilidad]=[nombre, descripción]\nconst HABILIDADES_ESP='+JSON.stringify(espActual())+';\nconst HABILIDADES_INFO='+JSON.stringify(infoActual())+';\n';
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/javascript'}));a.download='habilidades-datos.js';a.click();
 };
 out.append(d);
}
function abrir(){
 const ov=$$('div','position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);overflow:auto;padding:12px;font:13px system-ui,sans-serif;color:#e2e8f0');
 const pn=$$('div','max-width:820px;margin:0 auto;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px');
 const go=$$('button','margin-right:6px','▶ Cargar de la PokéAPI'),x=$$('button','float:right','✕'),st=$$('div','margin:8px 0;min-height:18px'),out=$$('div');
 pn.append(x,$$('b','','🧬 Habilidades y objetos'),$$('div','margin:8px 0','Descarga las habilidades de las especies 1 a '+MAX+' (la 1ª vez ~1000 peticiones) y audita qué está hecho. Con los datos descargados, pulsa «Descargar habilidades-datos.js».'),go,st,out);
 ov.append(pn);document.body.append(ov);x.onclick=()=>ov.remove();
 go.onclick=async()=>{go.disabled=true;try{await cargar(t=>st.textContent=t);st.textContent='Listo.'}catch(e){st.textContent=ERR}pintar(out);go.disabled=false};
 st.textContent=Object.keys(CE).length?'Datos en caché.':(typeof HABILIDADES_ESP!=='undefined'?'Usando habilidades-datos.js.':'Sin datos: pulsa cargar.');
 pintar(out);
}
const b=$$('button','position:fixed;right:10px;bottom:226px;z-index:9998;opacity:.85','🧬 Habilidades');
b.onclick=abrir;document.body.append(b);
})();