// MENÚ DE MODOS: pantalla inicial para elegir a qué jugar.
// No toca el simulador: solo lo oculta o lo muestra con una clase en <body> (data-modo).
// Para añadir un modo nuevo: añade una entrada a MODOS (y su `abrir` si dibuja pantallas propias).
// Va el ÚLTIMO en la lista de scripts de index.html.
const MODOS=[
  {id:'simulador',icono:'⚔️',nombre:'Simulador',desc:'Combates por equipos en la arena'},
  {id:'gacha',icono:'🎴',nombre:'Gacha',desc:'Banners, box, eventos y entrenamiento',
   abrir:c=>Gacha.abrir(c,()=>irA('menu'))},
];

(function(){
  const main=document.querySelector('main')||document.body;
  document.head.append(Object.assign(document.createElement('style'),{textContent:`
    body[data-modo]:not([data-modo="simulador"]) main>*:not(script):not(.mm){display:none!important}
    .mm{display:none}
    body[data-modo="menu"] #mm-menu,body[data-modo="gacha"] #mm-gacha{display:block}
    body[data-modo="simulador"] #mm-volver,body[data-modo="gacha"] #mm-volver{display:block}
    #mm-volver{position:fixed;left:10px;bottom:10px;z-index:9990;opacity:.9}
    #mm-menu h1{margin:14px 0 4px}
    .mm-modos{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:16px 0;max-width:620px}
    .mm-modos button{padding:22px 12px;text-align:center;font-size:16px}
    .mm-modos small{display:block;opacity:.7;font-weight:400;margin-top:4px}`}));

  const menu=document.createElement('div');menu.id='mm-menu';menu.className='mm';
  menu.innerHTML='<h1>🌿 Arena Aérea</h1><p style="opacity:.8;margin:0">¿A qué quieres jugar?</p>';
  const g=document.createElement('div');g.className='mm-modos';
  for(const m of MODOS){
    const b=document.createElement('button');
    b.innerHTML=`<div style="font-size:34px">${m.icono}</div>${m.nombre}<small>${m.desc}</small>`;
    b.onclick=()=>irA(m.id);g.append(b);
  }
  menu.append(g);

  const gacha=document.createElement('div');gacha.id='mm-gacha';gacha.className='mm';
  const volver=document.createElement('button');volver.id='mm-volver';volver.textContent='⌂ Modos';
  volver.onclick=()=>irA('menu');
  volver.className='mm';   // solo se ve en el simulador y en el gacha (lo controla el CSS de arriba)
  main.append(menu,gacha,volver);

  window.irA=id=>{
    document.body.dataset.modo=id;
    const m=MODOS.find(x=>x.id===id);
    if(m&&m.abrir)m.abrir(id==='gacha'?gacha:menu);
    window.scrollTo&&window.scrollTo(0,0);
  };
  irA('menu');
})();