// MENÚ DE MODOS: pantalla inicial para elegir a qué jugar.
// No toca el simulador: solo lo oculta o lo muestra con una clase en <body> (data-modo).
// Para añadir un modo nuevo: añade una entrada a MODOS (con `abrir` si dibuja pantallas propias: recibe su contenedor).
// Va el ÚLTIMO en la lista de scripts de index.html.
const MODOS=[
  {id:'simulador',icono:'⚔️',nombre:'Simulador',desc:'Combates por equipos en la arena'},
  {id:'gacha',icono:'🎴',nombre:'Gacha',desc:'Banners, box, eventos y entrenamiento',
   abrir:c=>Gacha.abrir(c,()=>irA('menu'))},
  {id:'aventura',icono:'🗺️',nombre:'Aventura',desc:'Rutas, capturas, gimnasios y la Liga',
   abrir:c=>ModoAventura.abrir(c,()=>irA('menu'))},
];

(function(){
  const main=document.querySelector('main')||document.body;
  const conAbrir=MODOS.filter(m=>m.abrir);
  document.head.append(Object.assign(document.createElement('style'),{textContent:`
    body[data-modo]:not([data-modo="simulador"]) main>*:not(script):not(.mm){display:none!important}
    .mm{display:none}
    body[data-modo="menu"] #mm-menu{display:block}
    ${conAbrir.map(m=>`body[data-modo="${m.id}"] #mm-${m.id}`).join(',')}{display:block}
    body[data-modo="simulador"] #mm-volver,body[data-modo="gacha"] #mm-volver{display:block}
    #mm-volver{position:fixed;left:10px;bottom:10px;z-index:9990;opacity:.9}
    /* Combate dentro de la aventura: se oculta el mapa y se enseña la arena del simulador */
    body[data-modo="aventura"].av-combate #mm-aventura{display:none!important}
    body[data-modo="aventura"].av-combate main>#game{display:block!important}
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

  const conts={};   // un contenedor por cada modo con pantallas propias
  for(const m of conAbrir){const d=document.createElement('div');d.id='mm-'+m.id;d.className='mm';conts[m.id]=d}
  const volver=document.createElement('button');volver.id='mm-volver';volver.textContent='⌂ Modos';
  volver.onclick=()=>irA('menu');
  volver.className='mm';   // solo se ve en el simulador y en el gacha (lo controla el CSS de arriba)
  main.append(menu,...Object.values(conts),volver);

  window.irA=id=>{
    document.body.dataset.modo=id;
    const m=MODOS.find(x=>x.id===id);
    if(m&&m.abrir)m.abrir(conts[id]);
    window.scrollTo&&window.scrollTo(0,0);
  };
  irA('menu');
})();