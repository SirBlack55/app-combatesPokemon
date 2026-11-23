// HERRAMIENTA TEMPORAL (se puede borrar cuando ya no haga falta).
// Descarga TODOS los ataques de la PokéAPI, los pasa por el conversor del juego y te dice, agrupados por motivo:
//   🔴 cuáles siguen ocultos (el conversor los descarta) · ⚪ cuáles no hacen nada (a propósito)
//   🟠 cuáles están disponibles pero les falta su mecánica · 🟢 qué ya está hecho a medida
// Botón flotante "🧾 Ataques". Necesita: pokeapi.js (API, jf, ERR), conversor.js, datos/ataques-especiales.js (ESP, EFX, AIL) y los ataques (CUSTOM).
// Los ataques se guardan reducidos en el navegador (la 1ª vez descarga ~900 peticiones).
// ¡OJO! Los grupos 🟠 salen de las listas a mano de abajo (la PokéAPI no dice qué ataques cargan, cambian de estadística, etc.):
// si falta alguno, añádelo ahí. Un ataque sale como pendiente solo si el juego aún no lo trata (sin fx, dt, rep, hits, efecto extra, animación propia...).
// Los que sí vienen de la API son: varios golpes, prioridad y crítico alto.
(function(){
const cap=n=>String(n).replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
const idDe=u=>+u.split('/').filter(Boolean).pop();

// ---------- Listas a mano (editables) ----------
const DOS_TURNOS=['solar-beam','solar-blade','razor-wind','skull-bash','sky-attack','freeze-shock','ice-burn','meteor-beam','electro-shot','dig','dive','bounce','phantom-force','shadow-force','sky-drop','geomancy','fly'];
const OTRA_ESTAD=['psyshock','psystrike','secret-sword','foul-play','body-press','photon-geyser','shell-side-arm','tera-blast','light-that-burns-the-sky'];
const POT_CONDICIONAL=['weather-ball','hex','venoshock','facade','brine','acrobatics','assurance','revenge','avalanche','payback','retaliate','stomping-tantrum','knock-off','smelling-salts','wake-up-slap','round','fusion-bolt','fusion-flare','echoed-voice','fury-cutter','triple-kick','triple-axel','pursuit','bolt-beak','fishious-rend','lash-out','rage-fist','last-respects','terrain-pulse','expanding-force','rising-voltage','collision-course','electro-drift','hydro-steam','stored-power','power-trip','barb-barrage','infernal-parade','temper-flare'];
const REPITE_TURNOS=['outrage','thrash','petal-dance','uproar','rollout','ice-ball','raging-fury','rage'];
const EFECTO_EXTRA=['rapid-spin','mortal-spin','brick-break','psychic-fangs','raging-bull','clear-smog','smack-down','thousand-arrows','sparkling-aria','tidy-up','steel-roller','ice-spinner'];
// Se pueden usar, pero el simulador no tiene la condición (objetos, aliados, formas): se queda la potencia/efecto base
const APROX=['covet','thief','round','fusion-flare','fusion-bolt','pursuit','poltergeist','relic-song','tera-starstorm','supercell-slam'];
const LISTAS=[
 ['dos','Dos turnos (cargan o son invulnerables en el primero)',DOS_TURNOS],
 ['otra','Daño con otra estadística (p. ej. ataca con Def. en vez de Def. Esp.)',OTRA_ESTAD],
 ['cond','Potencia condicional (clima, estado, objeto, daño recibido...)',POT_CONDICIONAL],
 ['rep','Se repite varios turnos seguidos',REPITE_TURNOS],
 ['extra','Efecto extra pendiente (rompe pantallas, quita trampas, roba objetos...)',EFECTO_EXTRA],
];

// ---------- Análisis (puro, sin DOM ni red) ----------
// lista = ataques reducidos (mismo formato que usa conv0). Devuelve {total, ok, grupos:[{id,tipo,titulo,moves:[{id,n}]}]}
function auditar(lista){
 const G={};
 const meter=(id,tipo,titulo,d)=>{(G[id]=G[id]||{id,tipo,titulo,moves:[]}).moves.push({id:d.name,n:((d.names||[])[0]||{}).name||cap(d.name)})};
 let ok=0;
 for(const d of lista){
  const meta=d.meta||{},cl=d.damage_class.name,cat=(meta.category||{}).name||'?',ail=(meta.ailment||{}).name||'none';
  let mv=null;try{mv=conv0(d)}catch(e){}
  if(!mv){
   if(cl==='status'){
    if(ail!=='none'&&ail!=='unknown'&&!AIL[ail])meter('o-ail','oculto','🔴 Estado alterado que aún no existe ('+ail+')',d);
    else meter('o-st-'+cat,'oculto','🔴 Ataque de estado sin efecto reconocido · categoría "'+cat+'"',d);
   }else meter('o-pot','oculto','🔴 Ataque con daño pero sin potencia en la PokéAPI',d);
   continue;
  }
  if(mv.ef&&mv.ef.nada){meter('sin','sin','⚪ Disponible pero no hace nada (a propósito)',d);continue}
  let pend=false;
  const p=(id,t)=>{meter(id,'pend',t,d);pend=true};
  // ¿el juego ya trata este ataque? (mecánica especial, dos turnos, repetición, efecto extra, animación propia o ataque de estado con efecto)
  const hecho=!!(mv.fx||mv.dt||mv.rep||mv.hits||(mv.sec&&mv.sec.x)||(typeof TRAMPA_DANO!=='undefined'&&TRAMPA_DANO.includes(d.name))||(typeof ESP!=='undefined'&&ESP[d.name])||(typeof CUSTOM!=='undefined'&&CUSTOM[d.name])||(typeof EFX!=='undefined'&&EFX[d.name]));
  if((meta.max_hits||0)>1&&!mv.hits&&!(mv.c>1)&&!hecho)p('p-hits','🟠 Varios golpes (hoy da un solo golpe)');
  if(!hecho)for(const[id,t,l]of LISTAS)if(l.includes(d.name))p('p-'+id,'🟠 '+t);
  if(cl!=='status'&&(meta.crit_rate||0)>0&&!mv.cr)p('p-crit','🟠 Índice de crítico alto (sin tratar)');
  if(cl!=='status'&&ail!=='none'&&ail!=='unknown'&&!AIL[ail]&&!(mv.ef&&mv.ef.a))p('p-ail','🟠 Provoca un estado que aún no existe ('+ail+')');
  if(APROX.includes(d.name)){meter('a-aprox','aprox','🟡 Potencia o efecto base: la condición real no existe en el simulador',d);pend=false}
  if(!pend)ok++;
  if(typeof CUSTOM!=='undefined'&&CUSTOM[d.name])meter('i-cu','info','🟢 Con animación propia (custom)',d);
  if(mv.hits)meter('i-hits','info','🟢 Varios golpes',d);
  if(mv.dt)meter('i-dt','info','🟢 Dos turnos (carga o se esconde)',d);
  if(mv.rep)meter('i-rep','info','🟢 Se repite varios turnos',d);
  if(mv.pr)meter('i-pr','info','🟢 Con prioridad (golpea más rápido, la IA lo usa para rematar)',d);
  if(mv.cr)meter('i-cr','info','🟢 Con índice de crítico alto',d);
  if(mv.sec&&mv.sec.x)meter('i-x','info','🟢 Con efecto extra (quita trampas, rompe pantallas...)',d);
  if(typeof ESP!=='undefined'&&ESP[d.name])meter('i-esp','info','🟢 Con mecánica especial (daño fijo, KO, potencia variable, contraataque, se debilita...)',d);
  if(typeof EFX!=='undefined'&&EFX[d.name]&&!EFX[d.name].nada)meter('i-efx','info','🟢 Ataque de estado con efecto propio (campo, protección, control, cambios...)',d);
 }
 const ord={oculto:0,sin:1,pend:2,aprox:3,info:4};
 const grupos=Object.values(G).sort((a,b)=>ord[a.tipo]-ord[b.tipo]||b.moves.length-a.moves.length);
 for(const g of grupos)g.moves.sort((a,b)=>a.n.localeCompare(b.n));
 return{total:lista.length,ok,grupos};
}
if(typeof module!=='undefined'){module.exports={auditar,LISTAS};return}

// ---------- Carga desde la PokéAPI ----------
const AK='ataques-auditoria-v1';let AC={};try{AC=JSON.parse(localStorage.getItem(AK)||'{}')}catch(e){}
const reducir=j=>({name:j.name,names:(j.names||[]).filter(x=>x.language.name==='es').slice(0,1),type:{name:j.type.name},damage_class:{name:j.damage_class.name},
 power:j.power,accuracy:j.accuracy,priority:j.priority,stat_changes:j.stat_changes||[],target:j.target&&{name:j.target.name},
 meta:j.meta&&{ailment:j.meta.ailment,ailment_chance:j.meta.ailment_chance,flinch_chance:j.meta.flinch_chance,drain:j.meta.drain,healing:j.meta.healing,
  stat_chance:j.meta.stat_chance,min_hits:j.meta.min_hits,max_hits:j.meta.max_hits,crit_rate:j.meta.crit_rate,category:j.meta.category}});
async function cargar(prog){
 const l=await jf(API+'move?limit=2000'),nombres=l.results.filter(r=>idDe(r.url)<=10000).map(r=>r.name),falta=nombres.filter(n=>!AC[n]);
 for(let i=0;i<falta.length;i+=9){
  await Promise.all(falta.slice(i,i+9).map(async n=>{try{AC[n]=reducir(await jf(API+'move/'+n+'/'))}catch(e){}}));
  prog(`Ataques ${Math.min(falta.length,i+9)}/${falta.length}`);
 }
 try{localStorage.setItem(AK,JSON.stringify(AC))}catch(e){}
 return nombres.map(n=>AC[n]).filter(Boolean);
}

// ---------- Pantalla ----------
const $$=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
const COL={oculto:'#f87171',sin:'#94a3b8',pend:'#fb923c',aprox:'#facc15',info:'#4ade80'};
function pintar(out,R,filtro){
 const q=(filtro||'').trim().toLowerCase();
 const cuenta=t=>R.grupos.filter(g=>g.tipo===t).reduce((s,g)=>s+g.moves.length,0);
 let h=`<b>${R.total} ataques analizados</b> · completos y sin pendientes: <b style="color:#4ade80">${R.ok}</b><br>
  <small>Un ataque puede salir en varios grupos 🟠 a la vez. Los números de cada grupo cuentan ataques, no repeticiones.</small>
  <table style="border-collapse:collapse;margin:8px 0">${[['oculto','🔴 Ocultos'],['sin','⚪ No hacen nada'],['pend','🟠 Entradas pendientes (suma por grupo)'],['info','🟢 Hechos a medida (suma por grupo)']]
  .map(([t,l])=>`<tr><td style="padding:2px 12px 2px 0">${l}</td><td><b style="color:${COL[t]}">${cuenta(t)}</b></td></tr>`).join('')}</table>`;
 for(const g of R.grupos){
  const m=q?g.moves.filter(x=>x.n.toLowerCase().includes(q)||x.id.includes(q)):g.moves;
  if(!m.length)continue;
  h+=`<details style="margin:6px 0" ${q?'open':''}><summary style="cursor:pointer;color:${COL[g.tipo]}"><b>${g.titulo}</b> <small>(${m.length}${q?' de '+g.moves.length:''})</small></summary>
   <div style="padding:4px 0 6px">${m.map(x=>`<span style="display:inline-block;border:1px solid #334155;border-radius:6px;padding:1px 6px;margin:2px;font-size:12px">${x.n} <small style="opacity:.55">${x.id}</small></span>`).join('')}</div></details>`;
 }
 out.innerHTML=h;
}
function abrir(){
 const ov=$$('div','position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);overflow:auto;padding:12px;font:13px system-ui,sans-serif;color:#e2e8f0');
 const pn=$$('div','max-width:820px;margin:0 auto;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px');
 const go=$$('button','margin-right:6px','▶ Cargar y auditar'),x=$$('button','float:right','✕'),st=$$('div','margin:8px 0;min-height:18px'),
  bus=$$('input','margin:6px 6px 6px 0;width:180px;display:none'),out=$$('div'),acc=$$('div','margin:8px 0;display:none');
 bus.placeholder='Buscar ataque…';
 pn.append(x,$$('b','','🧾 Auditoría de ataques'),$$('div','margin:8px 0','Pasa todos los ataques de la PokéAPI por el conversor del juego y los agrupa por lo que les falta. La 1ª vez descarga unos 900 ataques.'),go,st,acc,bus,out);
 ov.append(pn);document.body.append(ov);x.onclick=()=>ov.remove();
 let R=null;
 const mostrar=lista=>{
  R=auditar(lista);pintar(out,R);bus.style.display='inline-block';acc.style.display='block';acc.innerHTML='';
  const d=$$('button','margin-right:6px','⬇ Descargar informe (JSON)');
  d.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(R,null,1)],{type:'application/json'}));a.download='auditoria-ataques.json';a.click()};
  const c=$$('button','','📋 Copiar ocultos (ids)');
  c.onclick=()=>{const t=R.grupos.filter(g=>g.tipo==='oculto').flatMap(g=>g.moves.map(m=>m.id)).join('\n');navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>{st.textContent='Copiados '+t.split('\n').length+' ids de ataques ocultos.'})};
  acc.append(d,c);
 };
 bus.oninput=()=>R&&pintar(out,R,bus.value);
 go.onclick=async()=>{
  go.disabled=true;
  try{const l=await cargar(t=>st.textContent=t);st.textContent='Listo.';mostrar(l)}catch(e){st.textContent=ERR}
  go.disabled=false;
 };
 if(Object.keys(AC).length>700){st.textContent='Datos en caché.';mostrar(Object.values(AC))}
}
const b=$$('button','position:fixed;right:10px;bottom:190px;z-index:9998;opacity:.85','🧾 Ataques');
b.onclick=abrir;document.body.append(b);
})();