// HERRAMIENTA TEMPORAL (se puede borrar cuando ya no haga falta).
// Descarga de la PokéAPI la proporción de géneros de cada especie y genera generos.js.
// Botón flotante "⚥ Géneros". Necesita: pokeapi.js (API, jf, GEN, ERR). Va después de pokeapi.js.
// GENERO_RATE[id]: -1 sin género · 0 siempre macho · 8 siempre hembra · 1..7 = octavos de hembra (p. ej. 1 = 87,5 % macho).
(function(){
const GC='generos-datos-v1',MAX=GEN[GEN.length-1][1];
let C={};try{C=JSON.parse(localStorage.getItem(GC)||'{}')}catch(e){}
async function cargar(prog){
  const falta=[];for(let i=1;i<=MAX;i++)if(C[i]===undefined)falta.push(i);
  for(let i=0;i<falta.length;i+=9){
    await Promise.all(falta.slice(i,i+9).map(async id=>{
      try{C[id]=(await jf(API+'pokemon-species/'+id+'/')).gender_rate}catch(e){}
    }));
    prog(`Especies ${Math.min(falta.length,i+9)}/${falta.length}`);
  }
  try{localStorage.setItem(GC,JSON.stringify(C))}catch(e){}
}
const $$=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
function resumen(){
  const n={sin:0,macho:0,hembra:0,mixto:0,falta:0};
  for(let i=1;i<=MAX;i++){const r=C[i];
    if(r===undefined)n.falta++;else if(r<0)n.sin++;else if(r===0)n.macho++;else if(r>=8)n.hembra++;else n.mixto++}
  return n;
}
function abrir(){
  const ov=$$('div','position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);overflow:auto;padding:12px;font:13px system-ui,sans-serif;color:#e2e8f0');
  const pn=$$('div','max-width:560px;margin:0 auto;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px');
  const go=$$('button','margin-right:6px','▶ Cargar géneros'),x=$$('button','float:right','✕'),st=$$('div','margin:8px 0;min-height:18px'),out=$$('div');
  pn.append(x,$$('b','','⚥ Géneros por especie'),$$('div','margin:8px 0','Descarga la proporción de géneros de las especies 1 a '+MAX+' (la 1ª vez tarda un poco).'),go,st,out);
  ov.append(pn);document.body.append(ov);x.onclick=()=>ov.remove();
  function pintar(){
    const n=resumen();
    out.innerHTML=`<table style="border-collapse:collapse;margin:6px 0">${[['Sin género',n.sin],['Siempre macho',n.macho],['Siempre hembra',n.hembra],['Los dos géneros',n.mixto],['Sin datos',n.falta]]
      .map(([a,b])=>`<tr><td style="padding:3px 10px 3px 0">${a}</td><td>${b}</td></tr>`).join('')}</table>`;
    if(n.falta>MAX/2)return;
    const d=$$('button','','⬇ Descargar generos.js');
    d.onclick=()=>{
      const o={};for(let i=1;i<=MAX;i++)if(C[i]!==undefined)o[i]=C[i];
      const txt='// Generado con la herramienta de géneros. GENERO_RATE[id]: -1 sin género · 0 siempre macho · 8 siempre hembra · 1..7 octavos de hembra\nconst GENERO_RATE='+JSON.stringify(o)+';\n';
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/javascript'}));a.download='generos.js';a.click();
    };
    out.append(d);
  }
  go.onclick=async()=>{
    go.disabled=true;
    try{await cargar(t=>st.textContent=t);st.textContent='Listo.'}catch(e){st.textContent=ERR}
    pintar();go.disabled=false;
  };
  if(Object.keys(C).length){st.textContent='Datos en caché.';pintar()}
}
const b=$$('button','position:fixed;right:10px;bottom:118px;z-index:9998;opacity:.85','⚥ Géneros');
b.onclick=abrir;document.body.append(b);
})();