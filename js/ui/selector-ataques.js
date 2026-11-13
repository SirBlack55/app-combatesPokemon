// Selector de ataques: ⭐ sugeridos · 📚 aprendibles (nivel/MT/tutor/huevo) · 🌐 todos.
// Los ataques elegidos se añaden a TY[pokemon].pool y se guarda su índice en o.s,
// así que el combate (spawn) no necesita cambios.
const SA_TIPOS={normal:'Normal',fire:'Fuego',water:'Agua',electric:'Eléctrico',grass:'Planta',ice:'Hielo',fighting:'Lucha',poison:'Veneno',ground:'Tierra',flying:'Volador',psychic:'Psíquico',bug:'Bicho',rock:'Roca',ghost:'Fantasma',dragon:'Dragón',dark:'Siniestro',steel:'Acero',fairy:'Hada'};
let saMode='sug',saF={q:'',ty:'',cat:'',me:'',so:'nivel'},saLim=40,saTok=0,saDb=0,saAll=null,saMC={};
const saNz=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s-]+/g,'');
const saCur=()=>TM[sel[0]]&&TM[sel[0]][sel[1]];
const saEff=y=>saMode=='learn'&&!y.learn?'sug':saMode;
const saOpt=(L,cur)=>L.map(([k,l])=>`<option value="${k}"${cur==k?' selected':''}>${l}</option>`).join('');
const saTags=e=>[e.m.nivel?`<span class="tag">${e.lv>0?'Nv '+e.lv:'Evol.'}</span>`:'',e.m.mt?'<span class="tag">MT</span>':'',e.m.tutor?'<span class="tag">Tutor</span>':'',e.m.egg?'<span class="tag">Huevo</span>':'',(e.m.otro&&!e.m.nivel&&!e.m.mt&&!e.m.tutor&&!e.m.egg)?'<span class="tag">Especial</span>':''].join('');

// Lista completa de ataques con su tipo (18 peticiones la primera vez; luego localStorage).
async function saLoadList(){if(saAll)return saAll;
 try{const c=JSON.parse(localStorage.getItem('sa-ataques')||'null');if(c&&c.length>500){saAll=c;return saAll}}catch(e){}
 const L=[];await Promise.all(Object.keys(SA_TIPOS).map(async t=>{const j=await jf(API+'type/'+t);for(const m of j.moves)L.push({n:m.name,t})}));
 L.sort((a,b)=>a.n<b.n?-1:a.n>b.n?1:0);saAll=L;try{localStorage.setItem('sa-ataques',JSON.stringify(L))}catch(e){}return L}
function saNames(){const q=saNz(saF.q);return(saAll||[]).filter(m=>(!saF.ty||m.t==saF.ty)&&(!q||saNz(m.n).includes(q)))}

// Carga los detalles de los ataques (lotes de 9, con la caché mvc de pokeapi.js).
async function saEnsure(names,tok){const todo=names.filter(n=>saMC[n]===undefined);
 for(let i=0;i<todo.length;i+=9){if(tok!=saTok)return;const b=todo.slice(i,i+9),r=await Promise.all(b.map(n=>mvData({n,u:API+'move/'+n+'/'})));if(tok!=saTok)return;
  b.forEach((n,k)=>{if(r[k]||mvc[n]!==undefined)saMC[n]=r[k]});saDraw()}}

function saIdx(o,k){const y=TY[o.t],v=saMC[k];if(!v)return -1;let i=y.pool.findIndex(x=>x&&!Array.isArray(x)&&x.key==v.key);if(i<0){y.pool.push(v);i=y.pool.length-1}return i}
function saToggle(o,i){const k=o.s.indexOf(i);if(k>=0)o.s.splice(k,1);else if(o.s.length<4)o.s.push(i)}

function saPanel(o,y){const md=saEff(y),tab=(k,l)=>`<button data-md="${k}" class="${md==k?'on':''}">${l}</button>`,
 ty=`<select id="mty"><option value="">Todos los tipos</option>${saOpt(Object.entries(SA_TIPOS),saF.ty)}</select>`,
 ex=md=='learn'?`<select id="mcat">${saOpt([['','Toda categoría'],['phy','Físico'],['spe','Especial'],['sta','Estado']],saF.cat)}</select><select id="mme">${saOpt([['','Cualquier forma'],['nivel','Por nivel'],['mt','MT'],['tutor','Tutor'],['egg','Huevo']],saF.me)}</select><select id="mso">${saOpt([['nivel','Orden: nivel'],['poder','Orden: poder'],['nombre','Orden: nombre']],saF.so)}</select>`:'',
 fl=md=='sug'?'':`<div class="mfl"><input id="ms" placeholder="${md=='all'?'Buscar (nombre en inglés)…':'Buscar ataque…'}" value="${saF.q.replace(/"/g,'&quot;')}">${ty}${ex}</div>`;
 return `<div class="mh">Ataques · elige 4 <b id="mcnt" class="${o.s.length==4?'ok':'no'}">${o.s.length}/4</b><small>⚔️ Físico · ✨ Especial · 🛡️ Estado</small></div><div id="meq" class="meq"></div><div class="mtabs">${tab('sug','⭐ Sugeridos')}${y.learn?tab('learn','📚 Aprendibles'):''}${tab('all','🌐 Todos')}</div>${fl}<div id="mnote"></div><div class="mg" id="mlist"></div><button id="mmore" data-more="1" style="display:none">Ver más</button>`}

function saItems(o,y,md){
 if(md=='sug')return{L:y.pool.slice(0,y.sg||y.pool.length).map((a,i)=>({v:mkmv(o.t,a),at:`data-m="${i}"`,on:o.s.includes(i)})),more:false};
 const q=saNz(saF.q),mk=(n,tags)=>{const v=saMC[n];if(!v)return null;const i=y.pool.findIndex(x=>x&&!Array.isArray(x)&&x.key==v.key);return{v,tags,at:`data-mk="${n}"`,on:i>=0&&o.s.includes(i)}};
 if(md=='learn'){
  const L=Object.values(y.learn).map(e=>({e,v:saMC[e.n]})).filter(x=>x.v&&(!q||saNz(x.e.n).includes(q)||saNz(x.v.n).includes(q))&&(!saF.ty||x.v.t==TN[saF.ty])&&(!saF.cat||x.v.cat==saF.cat)&&(!saF.me||x.e.m[saF.me])),so=saF.so,lv=x=>x.e.m.nivel?(x.e.lv||0):999;
  L.sort((a,b)=>so=='poder'?(b.v.p-a.v.p)||a.v.n.localeCompare(b.v.n):so=='nombre'?a.v.n.localeCompare(b.v.n):(lv(a)-lv(b))||a.v.n.localeCompare(b.v.n));
  return{L:L.map(x=>mk(x.e.n,saTags(x.e))),more:false}}
 const A=saNames();return{L:A.slice(0,saLim).map(m=>mk(m.n,'')).filter(Boolean),more:A.length>saLim}}

const saCard=x=>{const v=x.v;return `<button class="mc${x.on?' on':''}" ${x.at} style="--t:${TC[v.t]}"><div class="mt">${TI(v.t,18)}<b>${v.n}</b>${x.on?'<span class="ck">✓</span>':''}</div><div class="mm"><span>${CI[v.cat]} ${v.cat=='phy'?'Físico':v.cat=='sta'?'Estado':'Especial'}</span>${v.p?`<span>Poder ${Math.round(v.p)}</span>`:''}${v.acc?`<span>${v.acc}%</span>`:''}<span>⏱ ${v.cd.toFixed(1)}s</span>${v.u?'<span class="ul">★ Final</span>':''}</div>${x.tags?`<div class="tg">${x.tags}</div>`:''}${v.ef?`<div class="ef">${v.ef.d}</div>`:''}</button>`};

// Redibuja SOLO las zonas del selector (no toda la pantalla), para no perder el foco al escribir.
function saDraw(){const o=saCur(),box=$('#mlist');if(!o||!box)return;const y=TY[o.t],md=saEff(y);
 $('#meq').innerHTML=o.s.length?o.s.map(i=>{const v=mkmv(o.t,y.pool[i]);return `<button class="mq" data-m="${i}" style="--t:${TC[v.t]}">${TI(v.t,16)}<b>${v.n}</b><span>✕</span></button>`}).join(''):'<small>Aún no has elegido ataques</small>';
 const c=$('#mcnt');c.textContent=o.s.length+'/4';c.className=o.s.length==4?'ok':'no';
 const{L,more}=saItems(o,y,md),st=box.scrollTop;box.innerHTML=L.map(saCard).join('')||'<small>Sin resultados</small>';box.scrollTop=st;
 let note='';
 if(md=='learn'){const T=Object.keys(y.learn),d=T.filter(n=>saMC[n]!==undefined).length;note=d<T.length?`Cargando ataques… ${d}/${T.length}`:`${L.length} ataques que puede aprender (se ocultan los que el juego aún no puede simular)`}
 else if(md=='all')note=saAll?`${saNames().length} ataques en la lista (se ocultan los que el juego aún no puede simular)`:'Cargando lista de ataques…';
 $('#mnote').textContent=note;$('#mmore').style.display=more?'block':'none'}

function saMore(){const o=saCur();if(o&&saEff(TY[o.t])=='all')saEnsure(saNames().slice(0,saLim).map(m=>m.n),saTok)}
async function saLoadAll(tok){try{await saLoadList()}catch(e){const n=$('#mnote');if(n)n.textContent=ERR;return}if(tok!=saTok)return;saDraw();saMore()}
function saStart(){saTok++;const o=saCur();if(!o)return;const y=TY[o.t],md=saEff(y),tok=saTok;saDraw();
 if(md=='learn')saEnsure(Object.values(y.learn).sort((a,b)=>(b.m.nivel?1:0)-(a.m.nivel?1:0)).map(e=>e.n),tok);
 else if(md=='all')saLoadAll(tok)}
function saFilt(){const o=saCur();if(!o)return;saLim=40;saDraw();if(saEff(TY[o.t])=='all'){clearTimeout(saDb);saDb=setTimeout(saMore,250)}}

$('#setup').addEventListener('input',e=>{if(e.target.id=='ms'){saF.q=e.target.value;saFilt()}});
$('#setup').addEventListener('change',e=>{const k={mty:'ty',mcat:'cat',mme:'me',mso:'so'}[e.target.id];if(k){saF[k]=e.target.value;saFilt()}});