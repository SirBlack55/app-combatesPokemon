// Pantalla de selección de equipos.
let TM=[[],[]],sel=[0,0];
function focusFi(){const e=document.querySelector('.fi');if(e&&e.scrollIntoView)e.scrollIntoView({behavior:'smooth',block:'nearest'})}
const miHTML=o=>{const y=TY[o.t];return o.s.map(j=>TI(mkmv(o.t,y.pool[j]).t,12)).join('')+(o.s.length!=4?'<em>'+o.s.length+'/4</em>':'')};
function goState(){$('#go').disabled=!(TM[0].length&&TM[1].length)||TM.some(a=>a.some(o=>o.s.length!=4))}
// Actualiza solo la casilla del Pokémon seleccionado (iconos de ataque, borde naranja) y el botón de comenzar.
function slotUpd(){const o=saCur();if(!o)return;const b=document.querySelector(`.sc[data-s="${sel[0]}"][data-i="${sel[1]}"]`);if(b){b.querySelector('.mi').innerHTML=miHTML(o);b.classList.toggle('bad',o.s.length!=4)}goState()}
// Habilidad y objeto equipado del Pokémon seleccionado (se guardan en o.hab / o.obj y viajan al combate con start()).
// Habilidades: las de su especie (HABILIDADES_ESP) y, aparte, todas las que el juego ya sabe hacer (para probar).
function haPanel(o){
 if(typeof HAB==='undefined'||typeof OBJ_EQ==='undefined')return'';
 const id=parseInt(String(o.t).slice(1)),E=typeof HabCarta!=='undefined'?HabCarta.opciones(id):null,nm=k=>typeof HabCarta!=='undefined'?HabCarta.infoHab(k).n:k,
  esp=E?[...E.n,E.o].filter(Boolean):[],otras=Object.keys(HAB).filter(k=>!esp.includes(k)),
  op=(k,t)=>`<option value="${k}"${o.hab===k?' selected':''}>${t}</option>`;
 return `<div class="mh">Habilidad y objeto</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0">
  <select id="hab-sel" style="flex:1;min-width:150px"><option value="">Sin habilidad</option>
   ${esp.length?`<optgroup label="De la especie">${esp.map(k=>op(k,nm(k)+(E&&k===E.o?' (oculta)':'')+(HAB[k]?'':' · sin efecto aún'))).join('')}</optgroup>`:''}
   ${otras.length?`<optgroup label="Otras (para probar)">${otras.map(k=>op(k,nm(k))).join('')}</optgroup>`:''}</select>
  <select id="obj-sel" style="flex:1;min-width:150px"><option value="">Sin objeto</option>${Object.keys(OBJ_EQ).map(k=>`<option value="${k}"${o.obj===k?' selected':''}>${OBJ_EQ[k].i||''} ${OBJ_EQ[k].n}</option>`).join('')}</select></div>
  <small style="opacity:.7" id="ha-desc">${haDesc(o)}</small>`;
}
const haDesc=o=>[o.hab&&HAB[o.hab]?'🧬 '+HAB[o.hab].d:'',o.obj&&OBJ_EQ[o.obj]?'🎒 '+OBJ_EQ[o.obj].d:''].filter(Boolean).join(' · ');
$('#setup').addEventListener('change',e=>{
 if(e.target.id!='hab-sel'&&e.target.id!='obj-sel')return;
 const o=saCur();if(!o)return;
 if(e.target.id=='hab-sel')o.hab=e.target.value||null;else o.obj=e.target.value||null;
 const d=$('#ha-desc');if(d)d.textContent=haDesc(o)});
function rend(){const SC={hp:'#22c55e',atk:'#f97316',def:'#eab308',spa:'#38bdf8',spd:'#84cc16',spe:'#f472b6'};
 let h=TM.map((a,s)=>`<div class="tp" style="--c:${s?'#ef4444':'#3b82f6'}"><div class="th"><span>${s?'🔴':'🔵'} EQUIPO ${s+1}</span><span>${a.length}/6</span></div><div class="sg">${[0,1,2,3,4,5].map(i=>{const o=a[i];if(!o)return `<button class="sc em" data-s="${s}" data-i="${i}">+</button>`;const y=TY[o.t],bad=o.s.length!=4;
  return `<button class="sc${sel[0]==s&&sel[1]==i?' on':''}${bad?' bad':''}" data-s="${s}" data-i="${i}"><img class="sp" src="${y.img}"><b>${y.n}</b><span class="ty">${y.types.map(t=>TI(t,16)).join('')}</span><span class="mi">${miHTML(o)}</span></button>`}).join('')}</div><button class="clr" data-s="${s}" data-c="1">🗑️ Vaciar equipo</button></div>`).join('<div class="vs">VS</div>');
 const o=TM[sel[0]]&&TM[sel[0]][sel[1]];
 if(o){const y=TY[o.t],tot=Object.values(y.st).reduce((a,b)=>a+b,0);
  h+=`<div class="fi" style="--c:${sel[0]?'#ef4444':'#3b82f6'}"><div class="fh"><img class="fp" src="${y.img}"><div><div class="fn">${y.n}</div><div>${y.types.map(t=>TI(t,22)).join(' ')}</div><small>Total de stats ${tot} · PS en combate ${y.H}</small></div><div class="qa"><button data-rr="1">🎲 Re-sortear</button><button class="qb" data-q="1">Quitar</button></div></div>
  <div class="sb">${ST.map(([k,l])=>`<div class="sr"><span>${l}</span><div class="bt"><i style="width:${Math.min(100,y.st[k]/1.8)}%;background:${SC[k]}"></i></div><b>${y.st[k]}</b></div>`).join('')}</div>
  ${haPanel(o)}${saPanel(o,y)}</div>`}
 $('#setup').innerHTML=h;goState();saStart()}
$('#setup').onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 // Elegir / quitar ataque (d.m = índice del pool, d.mk = nombre del ataque aprendible o de la lista completa)
 if(d.m!==undefined||d.mk!==undefined){const o=saCur();if(o){const i=d.m!==undefined?+d.m:saIdx(o,d.mk);if(i>=0)saToggle(o,i);saDraw();slotUpd()}return}
 if(d.rr){resort(sel[0],sel[1]);return}
 if(d.md){saMode=d.md;saLim=40;rend();return}
 if(d.more){saLim+=40;saDraw();saMore();return}
 if(d.q){TM[sel[0]].splice(sel[1],1);sel=[sel[0],0]}
 else{const s=+d.s,a=TM[s];
  if(d.i!==undefined){if(a[+d.i]){sel=[s,+d.i];setTimeout(focusFi,60)}}
  else if(d.c){TM[s]=[];if(sel[0]==s)sel=[s,0]}}
 rend()};