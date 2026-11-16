// HERRAMIENTA TEMPORAL (se puede borrar cuando ya no haga falta).
// Descarga de la PokéAPI el grupo de experiencia (curva de XP) de cada especie y genera experiencia-datos.js.
// Botón flotante "📈 Experiencia". Necesita: pokeapi.js (API, jf, GEN, ERR). Va después de pokeapi.js.
// GRUPO_EXP[id]: r Rápido · m Medio · p Parabólico · l Lento · e Errático · f Fluctuante
(function(){
const XC='experiencia-datos-v1',MAX=GEN[GEN.length-1][1];
const COD={fast:'r',medium:'m','medium-slow':'p',slow:'l','slow-then-very-fast':'e','fast-then-very-slow':'f'};
const NOM={r:'Rápido',m:'Medio',p:'Parabólico',l:'Lento',e:'Errático',f:'Fluctuante'};
let C={};try{C=JSON.parse(localStorage.getItem(XC)||'{}')}catch(e){}
async function cargar(prog){
  const falta=[];for(let i=1;i<=MAX;i++)if(!C[i])falta.push(i);
  for(let i=0;i<falta.length;i+=9){
    await Promise.all(falta.slice(i,i+9).map(async id=>{
      try{const c=COD[(await jf(API+'pokemon-species/'+id+'/')).growth_rate.name];if(c)C[id]=c}catch(e){}
    }));
    prog(`Especies ${Math.min(falta.length,i+9)}/${falta.length}`);
  }
  try{localStorage.setItem(XC,JSON.stringify(C))}catch(e){}
}
const $$=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
function abrir(){
  const ov=$$('div','position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);overflow:auto;padding:12px;font:13px system-ui,sans-serif;color:#e2e8f0');
  const pn=$$('div','max-width:560px;margin:0 auto;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px');
  const go=$$('button','margin-right:6px','▶ Cargar grupos de experiencia'),x=$$('button','float:right','✕'),st=$$('div','margin:8px 0;min-height:18px'),out=$$('div');
  pn.append(x,$$('b','','📈 Grupos de experiencia por especie'),$$('div','margin:8px 0','Descarga el grupo de experiencia de las especies 1 a '+MAX+' (la 1ª vez tarda un poco).'),go,st,out);
  ov.append(pn);document.body.append(ov);x.onclick=()=>ov.remove();
  function pintar(){
    const n={};let falta=0;
    for(let i=1;i<=MAX;i++){if(C[i])n[C[i]]=(n[C[i]]||0)+1;else falta++}
    out.innerHTML=`<table style="border-collapse:collapse;margin:6px 0">${Object.entries(NOM).map(([k,v])=>`<tr><td style="padding:3px 10px 3px 0">${v}</td><td>${n[k]||0}</td></tr>`).join('')}<tr><td style="padding:3px 10px 3px 0">Sin datos</td><td>${falta}</td></tr></table>`;
    if(falta>MAX/2)return;
    const d=$$('button','','⬇ Descargar experiencia-datos.js');
    d.onclick=()=>{
      const o={};for(let i=1;i<=MAX;i++)if(C[i])o[i]=C[i];
      const txt='// Generado con la herramienta de experiencia. GRUPO_EXP[id]: r Rápido · m Medio · p Parabólico · l Lento · e Errático · f Fluctuante\nconst GRUPO_EXP='+JSON.stringify(o)+';\n';
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/javascript'}));a.download='experiencia-datos.js';a.click();
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
const b=$$('button','position:fixed;right:10px;bottom:154px;z-index:9998;opacity:.85','📈 Experiencia');
b.onclick=abrir;document.body.append(b);
})();