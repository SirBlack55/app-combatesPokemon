// HERRAMIENTA TEMPORAL (se puede borrar cuando ya no haga falta).
// Descarga todas las líneas evolutivas de la PokéAPI (con sus requisitos), clasifica cada evolución
// (nivel / objeto / intercambio / felicidad / especial) y las muestra con el sprite de cada Pokémon.
// Las de felicidad y especial son las "Próximamente": la tabla de requisitos dice qué habría que meter en el juego.
// Las formas regionales (Alola, Galar, Hisui, Paldea) salen en líneas aparte, con el sprite de su forma.
// Añade un botón flotante "🧬 Evoluciones". Necesita: pokeapi.js (API, SPR, jf, ERR).
(function(){
const cap=n=>String(n).replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
const idDe=u=>+u.split('/').filter(Boolean).pop();

// ---------- Clasificación (puro, sin DOM ni red) ----------
// Una "entrada" = una forma de cumplir una evolución (una evolución puede tener varias). Formato simplificado:
// {trigger:'level-up', min_level:16, item:'fire-stone', held_item:..., min_happiness:..., time_of_day:..., ...} (solo campos con valor)
const ORDEN=['nivel','objeto','intercambio','felicidad','especial'];
const FEL=['min_happiness','min_affection','min_beauty'];
const TRG={shed:'Hueco libre en el equipo y una Poké Ball',spin:'Girar con un dulce','tower-of-darkness':'Torre Oscura',
  'tower-of-waters':'Torre Agua','three-critical-hits':'3 golpes críticos en un combate','take-damage':'Recibir daño',
  other:'Condición especial','agile-style-move':'Usar un ataque en estilo ágil','strong-style-move':'Usar un ataque en estilo fuerte',
  'recoil-damage':'Daño por retroceso','use-move':'Usar un ataque muchas veces','three-defeated-bisharp':'Derrotar 3 Bisharp líder',
  'gimmighoul-coins':'Llevar 999 monedas'};
const KL={min_level:'nivel',item:'objeto',held_item:'objeto equipado',min_happiness:'felicidad',min_affection:'cariño',min_beauty:'belleza',
  time_of_day:'hora del día',known_move:'conocer un ataque',known_move_type:'conocer un ataque de un tipo',location:'lugar',gender:'género',
  relative_physical_stats:'ataque vs defensa',needs_overworld_rain:'lluvia',party_species:'otra especie en el equipo',party_type:'un tipo en el equipo',
  turn_upside_down:'consola del revés',trade_species:'intercambio con una especie concreta',min_damage_taken:'daño recibido',
  min_move_count:'usos de un ataque',min_steps:'pasos',region:'región',base_form:'forma base',used_move:'ataque usado'};
const MANEJADOS=['trigger','item','min_level','held_item','min_happiness','min_affection','min_beauty','time_of_day','known_move',
  'known_move_type','location','gender','relative_physical_stats','needs_overworld_rain','party_species','party_type','trade_species','turn_upside_down'];

// La PokéAPI añade a cada entrada datos que no son requisitos (version_group, is_default y las formas que
// requiere/produce la evolución): no se muestran como requisito. Las formas sí se usan para repartir las entradas.
const META=['version_group','is_default','required_pokemon_form','evolved_pokemon_form'];
const limpiar=d=>{const o={};for(const[k,v]of Object.entries(d))if(!META.includes(k))o[k]=v;return o};
// Quita metadatos y entradas repetidas (la API repite la misma evolución por cada grupo de versiones).
function limpiarEntradas(ds){
  const vistos=new Set(),out=[];
  for(const d of ds.map(limpiar)){const k=JSON.stringify(d);if(!vistos.has(k)){vistos.add(k);out.push(d)}}
  return out;
}

function clasEntrada(d){
  const ks=Object.keys(d).filter(k=>k!=='trigger'),t=d.trigger,solo=a=>ks.every(k=>a.includes(k));
  if(t==='level-up'){
    if(ks.some(k=>FEL.includes(k)))return'felicidad';
    return ks.length&&solo(['min_level'])?'nivel':'especial';
  }
  if(t==='use-item')return ks.includes('item')&&solo(['item'])?'objeto':'especial';
  if(t==='trade')return solo(['held_item','trade_species'])?'intercambio':'especial';
  return'especial';
}
function textoEntrada(d){
  const p=[],t=d.trigger;
  if(t==='trade')p.push('Intercambio');
  else if(t==='use-item')p.push('Usar '+cap(d.item||'?'));
  else if(t!=='level-up')p.push(TRG[t]||cap(t||'?'));
  if(d.min_level!=null)p.push('nivel '+d.min_level);
  if(d.held_item)p.push('con '+cap(d.held_item)+' equipado');
  if(d.trade_species)p.push('por '+cap(d.trade_species));
  if(d.min_happiness!=null)p.push('felicidad ≥ '+d.min_happiness);
  if(d.min_affection!=null)p.push('cariño ≥ '+d.min_affection);
  if(d.min_beauty!=null)p.push('belleza ≥ '+d.min_beauty);
  if(d.time_of_day)p.push({day:'de día',night:'de noche',dusk:'al atardecer'}[d.time_of_day]||d.time_of_day);
  if(d.known_move)p.push('conociendo '+cap(d.known_move));
  if(d.known_move_type)p.push('conociendo un ataque de tipo '+cap(d.known_move_type));
  if(d.location)p.push('en '+cap(d.location));
  if(d.gender!=null)p.push(d.gender===1?'solo hembra':d.gender===2?'solo macho':'género '+d.gender);
  if(d.relative_physical_stats!=null)p.push({1:'Ataque > Defensa',[-1]:'Ataque < Defensa',0:'Ataque = Defensa'}[d.relative_physical_stats]||'ataque vs defensa');
  if(d.needs_overworld_rain)p.push('con lluvia');
  if(d.party_species)p.push('con '+cap(d.party_species)+' en el equipo');
  if(d.party_type)p.push('con un Pokémon de tipo '+cap(d.party_type)+' en el equipo');
  if(d.turn_upside_down)p.push('con la consola del revés');
  for(const[k,v]of Object.entries(d))if(!MANEJADOS.includes(k))p.push(k.replace(/_/g,' ')+': '+v);
  if(t==='level-up'&&d.min_level==null&&p.length===0)p.push('Sube de nivel (sin dato en la PokéAPI)');
  const s=p.join(' · ');return s.charAt(0).toUpperCase()+s.slice(1);
}
// Clasifica una evolución (lista de entradas): vale la mejor de sus formas (nivel > objeto > intercambio > felicidad > especial).
function clasArista(ds){
  ds=ds&&limpiarEntradas(ds);
  if(!ds||!ds.length)return{cat:'especial',d:{},txt:['Sin datos en la PokéAPI'],ds:[]};
  const cs=ds.map(clasEntrada),mejor=ORDEN.find(c=>cs.includes(c));
  return{cat:mejor,d:ds[cs.indexOf(mejor)],txt:ds.map(textoEntrada),ds};
}
function claveReq(cat,d){
  const t=d.trigger,ks=Object.keys(d).filter(k=>k!=='trigger');
  const pre=['level-up','use-item','trade'].includes(t)?(t==='trade'?'intercambio · ':''):(TRG[t]||cap(t||'?'))+' · ';
  return cat+': '+pre+(ks.map(k=>KL[k]||k).join(' + ')||'sin condición');
}
// ---------- Formas regionales ----------
// La PokéAPI mete las formas regionales dentro de la línea normal (Raticate de Alola es otro requisito de "Raticate").
// Aquí se separan en líneas propias. Los sprites de las formas salen de la lista de Pokémon de la API (ids 10001+).
const REGIONES={alola:'Alola',galar:'Galar',hisui:'Hisui',paldea:'Paldea'};
// Especies que solo existen como evolución de una forma regional (la API las cuelga de la especie normal).
const EXCLUSIVAS={perrserker:'galar',cursola:'galar',sirfetchd:'galar','mr-rime':'galar',runerigus:'galar',obstagoon:'galar',
  sneasler:'hisui',overqwil:'hisui',basculegion:'hisui',clodsire:'paldea'};

// lista = [{name,url}] de /pokemon → {base:{region:{id,n}}}
function parsearFormas(lista){
  const mejor={};
  for(const r of lista){
    const m=r.name.match(/^(.+?)-(alola|galar|hisui|paldea)(-.+)?$/);
    if(!m||/cap|totem/.test(m[3]||''))continue;
    const id=idDe(r.url),rest=m[3]||'',rango=rest===''?0:rest==='-standard'?1:2;
    const o=(mejor[m[1]]=mejor[m[1]]||{}),v=o[m[2]];
    if(!v||rango<v.rango||(rango===v.rango&&id<v.id))o[m[2]]={id,n:r.name,rango};
  }
  const out={};
  for(const b in mejor){out[b]={};for(const r in mejor[b])out[b][r]={id:mejor[b][r].id,n:mejor[b][r].n}}
  return out;
}
// Devuelve [{tipo:'normal'|'alola'|..., raiz, hayVariantes}] : por cada línea de la API, la normal y una por cada región con forma.
// Cuando una evolución tiene varios requisitos y la especie tiene forma regional, la API no dice cuál es de cada forma:
// se asume el orden de la API (el 1º es el de la forma normal y el último el de la forma regional).
function construirLineas(cadenas,formas){
  // Elige las entradas de una evolución para una línea (reg = null para la normal, o 'alola'/'galar'/...).
  // La API marca con required/evolved_pokemon_form qué entradas son de una forma regional. Si no trae esos datos
  // y hay varios requisitos, se asume el orden de la API (el 1º es el normal y el último el regional).
  const esReg=d=>/-(alola|galar|hisui|paldea)/.test((d.required_pokemon_form||'')+' '+(d.evolved_pokemon_form||''));
  const deReg=(d,R)=>((d.required_pokemon_form||'')+' '+(d.evolved_pokemon_form||'')).includes('-'+R);
  const pos=(ds,R)=>{
    ds=ds||[];
    if(ds.some(d=>d.required_pokemon_form||d.evolved_pokemon_form)){
      const base=ds.filter(d=>!esReg(d)),r=R?ds.filter(d=>deReg(d,R)):[];
      return limpiarEntradas(r.length?r:base.length?base:ds);
    }
    ds=limpiarEntradas(ds);
    return ds.length>1?[R?ds[ds.length-1]:ds[0]]:ds;
  };
  const normal=n=>{
    if(EXCLUSIVAS[n.n])return null;
    return{id:n.id,n:n.n,d:pos(n.d,null),h:n.h.map(normal).filter(Boolean)};
  };
  const variante=(n,R)=>{
    const f=(formas[n.n]||{})[R],ex=EXCLUSIVAS[n.n]===R,hs=n.h.map(h=>variante(h,R)).filter(Boolean);
    if(!f&&!ex&&!hs.length)return null;
    return{id:f?f.id:n.id,n:f?f.n:n.n,d:pos(n.d,f||ex?R:null),h:hs};
  };
  const out=[];
  for(const c of cadenas){
    const vs=[];
    for(const R in REGIONES){const v=variante(c,R);if(v&&v.h.length)vs.push({tipo:R,raiz:v})}
    out.push({tipo:'normal',raiz:normal(c),hayVariantes:vs.length>0},...vs.map(v=>({...v,hayVariantes:true})));
  }
  return out;
}

// cadenas = [{id,n,d:[entradas con las que se llega a esta especie],h:[hijos]}]
function analizar(cadenas){
  const ar=[],vistas=new Set();
  const rec=n=>{
    for(const h of n.h){
      const c=clasArista(h.d),k=n.id+'>'+h.id+'>'+c.txt.join('|');
      if(!vistas.has(k)){vistas.add(k);
      ar.push({de:n.id,dn:n.n,a:h.id,an:h.n,cat:c.cat,txt:c.txt,ent:c.ds,clave:claveReq(c.cat,c.d),rama:n.h.length>1})}
      rec(h);
    }
  };
  cadenas.forEach(rec);
  const conteo={};ORDEN.forEach(c=>conteo[c]=0);ar.forEach(a=>conteo[a.cat]++);
  const g={};
  for(const a of ar)if(a.cat==='felicidad'||a.cat==='especial')(g[a.clave]=g[a.clave]||[]).push(cap(a.dn)+' → '+cap(a.an));
  const grupos=Object.entries(g).map(([clave,l])=>({clave,n:l.length,ej:l.slice(0,8)})).sort((a,b)=>b.n-a.n);
  // Evoluciones que piden un lugar o una región (da igual qué otros requisitos tengan además: nivel, objeto, hora...).
  // 'alt' = otras formas de cumplirla que ya no piden lugar. Una entrada con 'region' pide toda una región (p. ej. Alola).
  const lug={},vl=new Set();
  for(const a of ar)for(const d of a.ent){
    const lk=Object.keys(d).find(k=>/location|region/.test(k)&&typeof d[k]==='string');
    if(!lk)continue;
    const esReg=lk!=='location',key=esReg?'región: '+d[lk]:d[lk],k=key+'|'+a.de+'|'+a.a;
    if(vl.has(k))continue;vl.add(k);
    (lug[key]=lug[key]||{region:esReg?d[lk]:'',evos:[]}).evos.push({de:a.de,dn:a.dn,a:a.a,an:a.an,req:textoEntrada(d),
      alt:a.ent.filter(x=>!Object.keys(x).some(y=>/location|region/.test(y))).map(x=>clasEntrada(x)+': '+textoEntrada(x))});
  }
  const lugares=Object.entries(lug).map(([lugar,o])=>({lugar,region:o.region,evos:o.evos})).sort((x,y)=>y.evos.length-x.evos.length);
  // Evoluciones hacia una forma regional (o hacia una especie exclusiva de una región) cuya entrada no dice ningún lugar:
  // la API no indica "estando en Alola", pero la evolución es propia de esa región.
  const regDe=a=>{const m=a.an.match(/-(alola|galar|hisui|paldea)/);return m?m[1]:EXCLUSIVAS[a.an]||''};
  const formasRegionales=ar.filter(a=>(a.a>=10000||EXCLUSIVAS[a.an])&&regDe(a)
    &&!a.ent.some(d=>Object.keys(d).some(y=>/location|region/.test(y))))
    .map(a=>({de:a.de,dn:a.dn,a:a.a,an:a.an,region:regDe(a),cat:a.cat,req:a.txt.join(' / ')}));
  const intercambioConObjeto=ar.filter(a=>a.cat==='intercambio'&&a.txt.some(t=>/equipado|por /.test(t))).length;
  return{aristas:ar,conteo,grupos,lugares,formasRegionales,intercambioConObjeto,ramasSinObjeto:ar.filter(a=>a.rama&&a.cat!=='objeto').length};
}

if(typeof module!=='undefined'){module.exports={clasEntrada,textoEntrada,clasArista,analizar,limpiarEntradas,parsearFormas,construirLineas};return}

// ---------- Carga desde la PokéAPI ----------
const EK='evoluciones-datos-v1';let EC={};try{EC=JSON.parse(localStorage.getItem(EK)||'{}')}catch(e){}
const simp=det=>{const o={};for(const[k,v]of Object.entries(det)){if(META.includes(k)||v==null||v===''||v===false)continue;o[k]=typeof v==='object'?v.name:v}return o};
const conv=n=>({id:idDe(n.species.url),n:n.species.name,d:(n.evolution_details||[]).map(simp),h:n.evolves_to.map(conv)});
async function cargar(prog){
  const l=await jf(API+'evolution-chain/?limit=1000'),ids=l.results.map(r=>idDe(r.url)).filter(i=>!EC[i]);
  for(let i=0;i<ids.length;i+=9){
    await Promise.all(ids.slice(i,i+9).map(async cid=>{try{EC[cid]=conv((await jf(API+'evolution-chain/'+cid+'/')).chain)}catch(e){}}));
    prog(`Líneas evolutivas ${Math.min(ids.length,i+9)}/${ids.length}`);
  }
  try{localStorage.setItem(EK,JSON.stringify(EC))}catch(e){}
}

const FK='evoluciones-formas-v1';let FORMAS={};try{FORMAS=JSON.parse(localStorage.getItem(FK)||'{}')}catch(e){}
async function cargarFormas(){
  if(Object.keys(FORMAS).length)return;
  FORMAS=parsearFormas((await jf(API+'pokemon/?limit=3000')).results);
  try{localStorage.setItem(FK,JSON.stringify(FORMAS))}catch(e){}
}

// Los lugares de la API (eterna-forest, mt-lanakila...) no dicen su región: se consulta cada lugar una vez (/location/<lugar>).
const LK='evoluciones-lugares-v1';let LR={};try{LR=JSON.parse(localStorage.getItem(LK)||'{}')}catch(e){}
async function cargarRegiones(lugares){
  const falta=lugares.filter(g=>!g.region).map(g=>g.lugar).filter(l=>!(l in LR));
  for(let i=0;i<falta.length;i+=9)
    await Promise.all(falta.slice(i,i+9).map(async l=>{try{const r=await jf(API+'location/'+l+'/');LR[l]=r.region?r.region.name:''}catch(e){}}));
  try{localStorage.setItem(LK,JSON.stringify(LR))}catch(e){}
}
const REGN={kanto:'Kanto',johto:'Johto',hoenn:'Hoenn',sinnoh:'Sinnoh',unova:'Teselia',kalos:'Kalos',alola:'Alola',galar:'Galar',hisui:'Hisui',paldea:'Paldea'};
const REGORD=Object.keys(REGN);

// ---------- Pantalla ----------
const $$=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
const COL={nivel:'#4ade80',objeto:'#60a5fa',intercambio:'#c084fc',felicidad:'#fbbf24',especial:'#f87171'};
const NOMC={nivel:'Nivel',objeto:'Objeto',intercambio:'Intercambio (cable link)',felicidad:'Felicidad 🔒',especial:'Especial 🔒'};

function nodo(n){
  const box=`<div style="text-align:center;width:76px;flex:none"><img src="${SPR+n.id}.png" width="56" height="56" loading="lazy" alt="" style="image-rendering:pixelated"><div style="font-size:10px">${cap(n.n)}</div><div style="font-size:9px;opacity:.5">#${n.id}</div></div>`;
  if(!n.h.length)return `<div style="display:flex;align-items:center">${box}</div>`;
  const ramas=n.h.map(h=>{
    const c=clasArista(h.d),bloq=c.cat==='felicidad'||c.cat==='especial',aviso=n.h.length>1&&c.cat!=='objeto';
    const fl=`<div style="width:150px;flex:none;font-size:10px;text-align:center;line-height:1.25;color:${COL[c.cat]};padding:0 4px">→<br><b>${NOMC[c.cat]}</b><br>${bloq?'Próximamente:<br>':''}<span style="color:#e2e8f0">${c.txt.join('<br>o ')}</span>${aviso?'<br><span style="color:#fb923c">⚠ rama sin objeto</span>':''}</div>`;
    return `<div style="display:flex;align-items:center">${fl}${nodo(h)}</div>`;
  }).join('');
  return `<div style="display:flex;align-items:center">${box}<div style="display:flex;flex-direction:column;gap:6px">${ramas}</div></div>`;
}
const recorrer=(n,f)=>{f(n);n.h.forEach(h=>recorrer(h,f))};

function abrir(){
  const ov=$$('div','position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);overflow:auto;padding:12px;font:13px system-ui,sans-serif;color:#e2e8f0');
  const pn=$$('div','max-width:900px;margin:0 auto;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px');
  const go=$$('button','margin-right:6px','▶ Cargar líneas evolutivas'),x=$$('button','float:right','✕'),st=$$('div','margin:8px 0;min-height:18px'),
    resumen=$$('div'),lugDiv=$$('div'),barra=$$('div','margin:10px 0;display:none'),out=$$('div');
  barra.innerHTML=`Mostrar: <select id="ev-f"><option value="todas">Todas las líneas</option><option value="ramas">Solo con ramas</option><option value="lugar">Con requisito de lugar</option>${ORDEN.map(c=>`<option value="${c}">Con alguna de ${NOMC[c]}</option>`).join('')}</select>
    · Buscar: <input id="ev-q" placeholder="nombre o nº" style="width:130px"> <span id="ev-n" style="opacity:.7"></span>`;
  pn.append(x,$$('b','','🧬 Líneas evolutivas y requisitos'),$$('div','margin:8px 0','La 1ª vez descarga todas las líneas (unas 540 peticiones) y las guarda en el navegador.'),go,st,resumen,lugDiv,barra,out);
  ov.append(pn);document.body.append(ov);x.onclick=()=>ov.remove();

  let A=null,cadenas=[],lineas=[];
  function pintar(){
    cadenas=Object.values(EC).sort((a,b)=>a.id-b.id);lineas=construirLineas(cadenas,FORMAS);A=analizar(lineas.map(l=>l.raiz));
    const tb='width:100%;border-collapse:collapse;margin:6px 0 14px',tr=c=>`<tr>${c.map(v=>`<td style="padding:3px 6px;border-bottom:1px solid #1e293b;vertical-align:top">${v}</td>`).join('')}</tr>`;
    let h=`<b>${lineas.length} líneas (${cadenas.length} de la API + formas regionales) · ${A.aristas.length} evoluciones distintas</b>`;
    h+='<h4>Evoluciones por requisito</h4><table style="'+tb+'">'+ORDEN.map(c=>tr([`<b style="color:${COL[c]}">${NOMC[c]}</b>`,A.conteo[c],c==='intercambio'&&A.intercambioConObjeto?`<small>(${A.intercambioConObjeto} piden además un objeto equipado o una especie concreta)</small>`:''])).join('')+'</table>';
    h+=`<div style="margin-bottom:10px">⚠ Evoluciones de una rama (la especie evoluciona a varias) que <b>no</b> se resuelven con un objeto propio: <b>${A.ramasSinObjeto}</b></div>`;
    h+=`<h4>Requisitos "Próximamente" <small>(lo que habría que meter en el juego)</small></h4><table style="${tb}">`+A.grupos.map(g=>tr([g.clave,g.n,`<small style="opacity:.8">${g.ej.join(', ')}${g.n>g.ej.length?'…':''}</small>`])).join('')+'</table>';
    resumen.innerHTML=h;
    const d=$$('button','margin-bottom:6px','⬇ Descargar clasificación (JSON)');
    d.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(A.aristas.map(e=>({de:e.de,a:e.a,cat:e.cat,requisito:e.txt.join(' | ')})),null,1)],{type:'application/json'}));a.download='evoluciones-clasificadas.json';a.click()};
    resumen.append(d);
    barra.style.display='block';lista();
    pintarLugares();cargarRegiones(A.lugares).then(pintarLugares);
  }
  function pintarLugares(){
    const spr=id=>`<img src="${SPR+id}.png" width="32" height="32" loading="lazy" alt="" style="image-rendering:pixelated;vertical-align:middle">`;
    const tb='width:100%;border-collapse:collapse;margin:6px 0 14px',tr=c=>`<tr>${c.map(v=>`<td style="padding:3px 6px;border-bottom:1px solid #1e293b;vertical-align:top">${v}</td>`).join('')}</tr>`;
    const reg=g=>g.region||LR[g.lugar]||'',regiones=[...new Set(A.lugares.map(reg))].sort((a,b)=>(REGORD.indexOf(a)<0?99:REGORD.indexOf(a))-(REGORD.indexOf(b)<0?99:REGORD.indexOf(b)));
    const nEv=A.lugares.reduce((t,g)=>t+g.evos.length,0);
    let h=`<h4>Requisitos de lugar <small>(${A.lugares.length} lugares · ${nEv} evoluciones)</small></h4>`;
    for(const r of regiones){
      const ls=A.lugares.filter(g=>reg(g)===r),n=ls.reduce((t,g)=>t+g.evos.length,0);
      h+=`<div style="margin:10px 0 2px"><b style="color:#38bdf8">${r?(REGN[r]||cap(r)):'Sin región en la API'}</b> <small style="opacity:.7">· ${ls.length} lugares · ${n} evoluciones</small></div><table style="${tb}">`
        +ls.map(g=>tr([`<b>${cap(g.lugar)}</b>`,g.evos.length,g.evos.map(e=>`<div style="margin:2px 0">${spr(e.de)}→${spr(e.a)} ${cap(e.dn)} → ${cap(e.an)} <small style="opacity:.75">${e.req}${e.alt.length?' · <span style="color:#4ade80">ya tiene otra forma: '+e.alt.join(' / ')+'</span>':''}</small></div>`).join('')])).join('')+'</table>';
    }
    const fr=A.formasRegionales;
    if(fr.length){
      h+=`<h4>Evoluciones hacia formas regionales <small>(${fr.length} · la API no dice "estando en la región", pero son propias de ella)</small></h4>`;
      for(const r of REGORD.filter(r=>fr.some(e=>e.region===r))){
        const ls=fr.filter(e=>e.region===r);
        h+=`<div style="margin:10px 0 2px"><b style="color:#38bdf8">${REGN[r]}</b> <small style="opacity:.7">· ${ls.length} evoluciones</small></div><table style="${tb}">`
          +ls.map(e=>tr([`${spr(e.de)}→${spr(e.a)}`,`${cap(e.dn)} → ${cap(e.an)}`,`<small style="color:${COL[e.cat]}">${NOMC[e.cat]}</small>`,`<small style="opacity:.85">${e.req}</small>`])).join('')+'</table>';
      }
    }
    lugDiv.innerHTML=h;
    const dl=$$('button','margin:0 0 6px','⬇ Descargar lugares (JSON)');
    dl.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({lugares:A.lugares.map(g=>({...g,region:g.region||LR[g.lugar]||''})),formasRegionales:A.formasRegionales},null,1)],{type:'application/json'}));a.download='evoluciones-lugares.json';a.click()};
    lugDiv.append(dl);
  }
  function lista(){
    const f=barra.querySelector('#ev-f').value,q=barra.querySelector('#ev-q').value.trim().toLowerCase();
    const ok=l=>{const c=l.raiz;
      let cats=new Set(),rama=false,lugar=false,coincide=!q;
      recorrer(c,n=>{
        if(n.h.length>1)rama=true;
        if(q&&(n.n.includes(q)||String(n.id)===q))coincide=true;
        n.h.forEach(h=>{const c=clasArista(h.d);cats.add(c.cat);if(c.ds.some(d=>d.location))lugar=true});
      });
      if(!coincide)return false;
      return f==='todas'||(f==='ramas'?rama:f==='lugar'?lugar:cats.has(f));
    };
    const sel=lineas.filter(ok);
    barra.querySelector('#ev-n').textContent=sel.length+' líneas';
    const et=l=>l.tipo!=='normal'?`<div style="font-size:11px;margin-bottom:2px"><b style="color:#38bdf8">Forma de ${REGIONES[l.tipo]}</b></div>`
      :l.hayVariantes?'<div style="font-size:11px;margin-bottom:2px"><b style="opacity:.6">Línea normal</b></div>':'';
    out.innerHTML=sel.map(l=>`<div style="overflow-x:auto;border:1px solid #1e293b;border-radius:8px;padding:6px;margin:6px 0">${et(l)}${nodo(l.raiz)}</div>`).join('');
  }
  barra.addEventListener('change',lista);barra.addEventListener('input',e=>{if(e.target.id==='ev-q')lista()});
  go.onclick=async()=>{
    go.disabled=true;
    try{await cargar(t=>st.textContent=t);st.textContent='Cargando formas regionales…';await cargarFormas();st.textContent='Listo.';pintar()}
    catch(e){st.textContent=ERR;if(Object.keys(EC).length)pintar()}
    go.disabled=false;
  };
  if(Object.keys(EC).length>400){
    st.textContent='Datos en caché.';
    cargarFormas().catch(()=>{st.textContent='No se pudieron cargar las formas regionales: se muestran las líneas sin separar.'}).then(pintar);
  }
}
const b=$$('button','position:fixed;right:10px;bottom:118px;z-index:9998;opacity:.85','🧬 Evoluciones');
b.onclick=abrir;document.body.append(b);
})();