// Buscador de Pokémon (PokéAPI) con filtros de tipo/generación y sorteo configurable.
let ALL=[],tgt=0,loading=false,TYMAP=null,fT=new Set(),fMode='any',shown=120;
const TYPES=['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s_]+/g,'-').replace(/[^a-z0-9-]/g,'');
const idOf=u=>+u.split('/').filter(Boolean).pop();

async function addSp(id,s){if(loading)return;if(TM[s].length>=6){setSt('Ese equipo ya tiene 6.');return}loading=true;setSt('Cargando Pokémon y sus ataques…');
 try{const k=await loadSp(id);TM[s].push({t:k,s:[...TY[k].ds]});sel=[s,TM[s].length-1];setSt('');rend()}catch(e){setSt(ERR)}loading=false}

function rng(){const g=$('#gen').value;return g=='all'?[1,1025]:GEN[+g]}

// Mapa id -> tipos. Son 18 peticiones, solo la primera vez (luego queda en localStorage).
async function loadTypes(){
 if(TYMAP)return TYMAP;
 try{const c=JSON.parse(localStorage.getItem('tymap')||'null');if(c){TYMAP=c;return TYMAP}}catch(e){}
 const m={};
 await Promise.all(TYPES.map(async t=>{const j=await(await fetch(API+'type/'+t)).json();
  for(const p of j.pokemon){const id=idOf(p.pokemon.url);if(id>1025)continue;(m[id]=m[id]||[]).push(t)}}));
 TYMAP=m;try{localStorage.setItem('tymap',JSON.stringify(m))}catch(e){}
 return m}

function okType(id){if(!fT.size)return true;const t=TYMAP&&TYMAP[id];if(!t)return false;
 if(fMode=='mono')return t.length==1&&fT.has(t[0]);
 if(fMode=='all')return[...fT].every(x=>t.includes(x));
 return[...fT].some(x=>t.includes(x))}

// Pokémon que cumplen generación + tipo (sin texto de búsqueda). También lo usa el sorteo.
function pool(){const[a,b]=rng();return ALL.filter(x=>x.id>=a&&x.id<=b&&okType(x.id))}

function sample(L,n){const A=[...L];for(let i=0;i<n;i++){const j=i+Math.floor(Math.random()*(A.length-i));[A[i],A[j]]=[A[j],A[i]]}return A.slice(0,n)}

function buildUI(){if($('#filt'))return;const d=document.createElement('div');d.id='filt';d.style.cssText='width:100%;margin:6px 0;display:flex;flex-direction:column;gap:6px';
 d.innerHTML=`<div id="tch" style="display:flex;flex-wrap:wrap;gap:4px">${TYPES.map(t=>`<button class="tc" data-t="${t}" title="${t}" style="padding:2px;border-radius:8px;border:2px solid transparent;background:none;cursor:pointer">${TI(TN[t]||t,22)}</button>`).join('')}</div>
 <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
  <select id="fm"><option value="any">Cualquiera de los tipos</option><option value="mono">Solo monotipo</option><option value="all">Con todos los tipos elegidos</option></select>
  <label>Sorteo: <select id="rn"><option value="r">3-6 al azar</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}"${n==6?' selected':''}>${n}</option>`).join('')}</select></label>
  <button id="rnd2">🎲 Sortear ambos equipos</button><button id="fclr">Limpiar filtros</button></div>`;
 $('#res').parentNode.insertBefore(d,$('#res'));
 $('#tch').onclick=e=>{const b=e.target.closest('.tc');if(!b)return;const t=b.dataset.t;fT.has(t)?fT.delete(t):fT.add(t);shown=120;showRes()};
 $('#fm').onchange=()=>{fMode=$('#fm').value;shown=120;showRes()};
 $('#rnd2').onclick=()=>sortear([0,1]);
 $('#fclr').onclick=()=>{fT.clear();fMode='any';$('#fm').value='any';$('#q').value='';$('#gen').value='all';shown=120;showRes()}}

function chips(){document.querySelectorAll('#tch .tc').forEach(b=>{const on=fT.has(b.dataset.t);b.style.borderColor=on?'#3b82f6':'transparent';b.style.opacity=!fT.size||on?1:.45})}

function showRes(){buildUI();chips();
 if(fT.size&&!TYMAP){setSt('Cargando tipos…');loadTypes().then(()=>{setSt('');showRes()}).catch(()=>setSt(ERR));return}
 const q=norm($('#q').value.trim().replace(/^#/,'')),P=pool();
 let L=!q?P:P.filter(x=>x.name.includes(q)||String(x.id)==q);
 if(q)L.sort((x,y)=>(y.name.startsWith(q)-x.name.startsWith(q))||x.id-y.id);
 const V=L.slice(0,shown);
 $('#res').innerHTML=`<small style="width:100%">${L.length} Pokémon</small>`+(V.length?V.map(x=>`<button class="rs" data-id="${x.id}"><img src="${SPR}${x.id}.png" width="48" height="48" loading="lazy" style="image-rendering:pixelated"><small>#${x.id} ${x.name}</small></button>`).join('')+(L.length>V.length?`<button id="more" style="width:100%">Ver más (${L.length-V.length})</button>`:''):'<small>Sin resultados</small>')}

function dst(){$('#d0').style.borderColor=tgt?'':'#3b82f6';$('#d1').style.borderColor=tgt?'#ef4444':''}
$('#gen').onchange=()=>{shown=120;showRes()};$('#q').oninput=()=>{shown=120;showRes()};
$('#res').onclick=e=>{if(e.target.closest('#more')){shown+=120;showRes();return}const b=e.target.closest('.rs');if(b)addSp(+b.dataset.id,tgt)};
$('#d0').onclick=()=>{tgt=0;dst()};$('#d1').onclick=()=>{tgt=1;dst()};

async function okTypes(){if(!fT.size||TYMAP)return true;try{setSt('Cargando tipos…');await loadTypes();return true}catch(e){setSt(ERR);return false}}
// Sorteo: sides = [0], [1] o [0,1]. Con dos equipos no se repite ningún Pokémon entre ellos.
async function sortear(sides){if(loading||!await okTypes())return;
 const P=pool(),v=$('#rn')?$('#rn').value:'r',k=sides.length;let n=v=='r'?3+Math.floor(Math.random()*4):+v;n=Math.min(n,Math.floor(P.length/k));
 if(!n){setSt(P.length?'Hay muy pocos Pokémon con esos filtros para sortear '+k+' equipos.':'Ningún Pokémon cumple los filtros.');return}
 loading=true;const ids=sample(P,n*k).map(x=>x.id),ks=[];
 try{for(const id of ids){setSt(`Cargando… ${ks.length+1}/${ids.length}`);ks.push(await loadSp(id))}
  sides.forEach((s,j)=>{TM[s]=ks.slice(j*n,(j+1)*n).map(t=>({t,s:[...TY[t].ds]}))});sel=[sides[0],0];setSt('');rend()}catch(e){setSt(ERR)}loading=false}
// Cambia solo un Pokémon del equipo por otro al azar (respeta los filtros y no repite ninguno de los dos equipos).
async function resort(s,i){if(loading||!TM[s]||!TM[s][i]||!await okTypes())return;
 const used=new Set(TM.flat().map(o=>+String(o.t).slice(1))),C=pool().filter(x=>!used.has(x.id));
 if(!C.length){setSt('No quedan Pokémon distintos con esos filtros.');return}
 loading=true;
 try{setSt('Cargando Pokémon…');const t=await loadSp(C[Math.floor(Math.random()*C.length)].id);TM[s][i]={t,s:[...TY[t].ds]};sel=[s,i];setSt('');rend()}catch(e){setSt(ERR)}loading=false}
$('#rnd').onclick=()=>sortear([tgt]);

setSt('Cargando lista de Pokémon…');
fetch(API+'pokemon?limit=1025').then(r=>r.json()).then(j=>{ALL=j.results.map(x=>({id:idOf(x.url),name:x.name}));setSt('Toca un Pokémon para añadirlo al equipo elegido (→ 🔵 / → 🔴).');showRes()}).catch(()=>setSt(ERR));