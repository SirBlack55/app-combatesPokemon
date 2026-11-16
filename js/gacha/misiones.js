// Misiones y login diario del gacha (código PURO: sin red ni DOM). Los premios son objetos del inventario (partida.objetos).
// Todas las cantidades son de EJEMPLO para probar el ritmo: la Pokécoin tiene que ser difícil de conseguir.
//   Ritmo previsto: ~1 Pokécoin de login + 2 de misiones diarias al día, 6 el 7º día de racha, y 3-15 por cada hito general.
// "Diario" = por fecha LOCAL del dispositivo (no UTC). Lo guardado en la partida:
//   partida.login     = {racha, ultimoDia}
//   partida.misiones  = {dia, contDia:{evento:n}, hechasDia:{id:true}, cont:{evento:n}, hechas:{id:true}}
// Eventos que cuentan: 'entrenar' (veces que se entrena), 'caramelos' (caramelos gastados), 'evolucion', 'fusion', 'tirada' (tiradas en banners normales).
// Para añadir una misión: una entrada en DIARIAS/GENERALES con ev (contador de eventos) o est (función del estado de la partida).
const Misiones=(()=>{
  const hoyLocal=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  // Fecha que usa el juego: la del dispositivo, o la «fecha de prueba» (localStorage 'gacha-fecha-prueba', solo para probar días/celebraciones)
  const fechaJuego=()=>{try{const f=localStorage.getItem('gacha-fecha-prueba');if(/^\d{4}-\d{2}-\d{2}$/.test(f||''))return f}catch(e){}return hoyLocal()};
  const ayerDe=hoy=>{const[y,m,d]=hoy.split('-').map(Number);return hoyLocal(new Date(y,m-1,d-1))};

  // Login: premio de cada día de la racha (se repite cada 7 días; si faltas un día, vuelve al día 1)
  const LOGIN=[
    {pokecoin:1},{pokecoin:1,'caramelo-s':10},{pokecoin:1},{pokecoin:1,'caramelo-m':3},
    {pokecoin:1},{pokecoin:1,'caramelo-l':2},{pokecoin:6}];

  const maxDe=(p,f)=>p.box.reduce((x,c)=>Math.max(x,f(c)),0);
  const rarIdx=(p,x)=>p.box.some(c=>x.ORD.indexOf(x.rz(c.especieId))>=x.i)?1:0;
  const DIARIAS=[
    {id:'d-entrenar',nombre:'Entrena una carta',desc:'Usa caramelos en una carta.',ev:'entrenar',meta:1,premio:{pokecoin:1,'caramelo-s':5}},
    {id:'d-caramelos',nombre:'Gasta 5 caramelos',desc:'Usa 5 caramelos de cualquier tamaño.',ev:'caramelos',meta:5,premio:{pokecoin:1,'caramelo-s':5}},
    // (cuando haya banners normales: "Haz una tirada", y cuando haya combates: "Gana un combate")
  ].map(m=>({...m,tipo:'diaria'}));
  const GENERALES=[
    {id:'g-evo1',nombre:'Primera evolución',desc:'Evoluciona una carta.',ev:'evolucion',meta:1,premio:{pokecoin:3}},
    {id:'g-evo5',nombre:'Evolucionista',desc:'Evoluciona 5 cartas.',ev:'evolucion',meta:5,premio:{pokecoin:5}},
    {id:'g-fus1',nombre:'Primera fusión',desc:'Fusiona una carta.',ev:'fusion',meta:1,premio:{pokecoin:3}},
    {id:'g-fus5',nombre:'Fusionador',desc:'Haz 5 fusiones.',ev:'fusion',meta:5,premio:{pokecoin:5}},
    {id:'g-tir1',nombre:'Primera invocación',desc:'Haz una tirada en un banner.',ev:'tirada',meta:1,premio:{pokecoin:1,'caramelo-m':5}},
    {id:'g-tir30',nombre:'Invocador',desc:'Haz 30 tiradas en banners.',ev:'tirada',meta:30,premio:{pokecoin:5}},
    {id:'g-tir100',nombre:'Gran invocador',desc:'Haz 100 tiradas en banners.',ev:'tirada',meta:100,premio:{pokecoin:10}},
    {id:'g-nv20',nombre:'Entrenador novato',desc:'Sube una carta al nivel 20.',est:p=>maxDe(p,c=>c.nivel),meta:20,premio:{pokecoin:3,'caramelo-m':5}},
    {id:'g-nv50',nombre:'Entrenador experto',desc:'Sube una carta al nivel 50.',est:p=>maxDe(p,c=>c.nivel),meta:50,premio:{pokecoin:5,'caramelo-l':5}},
    {id:'g-nv100',nombre:'Maestro Pokémon',desc:'Sube una carta al nivel 100.',est:p=>maxDe(p,c=>c.nivel),meta:100,premio:{pokecoin:15,'caramelo-xl':3}},
    {id:'g-est3',nombre:'Tres estrellas',desc:'Consigue una carta con 3 estrellas.',est:p=>maxDe(p,c=>c.estrellas||0),meta:3,premio:{pokecoin:5}},
    {id:'g-est5',nombre:'Estrella máxima',desc:'Consigue una carta con 5 estrellas.',est:p=>maxDe(p,c=>c.estrellas||0),meta:5,premio:{pokecoin:15}},
    {id:'g-box20',nombre:'Coleccionista',desc:'Ten 20 cartas en la box.',est:p=>p.box.length,meta:20,premio:{pokecoin:3}},
    {id:'g-box50',nombre:'Gran coleccionista',desc:'Ten 50 cartas en la box.',est:p=>p.box.length,meta:50,premio:{pokecoin:10}},
    {id:'g-ssr',nombre:'Carta SSR',desc:'Consigue una carta SSR o superior.',est:(p,x)=>rarIdx(p,{...x,i:3}),meta:1,premio:{pokecoin:5}},
    {id:'g-ur',nombre:'Carta UR',desc:'Consigue una carta UR o superior.',est:(p,x)=>rarIdx(p,{...x,i:4}),meta:1,premio:{pokecoin:10}},
    {id:'g-lr',nombre:'Carta LR',desc:'Consigue una carta LR.',est:(p,x)=>rarIdx(p,{...x,i:5}),meta:1,premio:{pokecoin:15}},
  ].map(m=>({...m,tipo:'general'}));
  const TODAS=[...DIARIAS,...GENERALES];

  function estado(p,hoy=fechaJuego()){   // normaliza partida.misiones y reinicia las diarias si cambió el día
    const M=p.misiones||(p.misiones={});
    M.cont=M.cont||{};M.hechas=M.hechas||{};
    if(M.dia!==hoy||!M.contDia||!M.hechasDia){M.dia=hoy;M.contDia={};M.hechasDia={}}
    return M;
  }
  function dar(p,premio){p.objetos=p.objetos||{};for(const[k,n]of Object.entries(premio))p.objetos[k]=(p.objetos[k]||0)+n}

  // Al abrir el gacha: reinicia las diarias y da el login del día (una vez al día). cambio=true si hay que guardar.
  function entrar(p,hoy=fechaJuego()){
    const dia0=(p.misiones||{}).dia;estado(p,hoy);
    let cambio=dia0!==hoy,login=null;
    const L=p.login||(p.login={racha:0,ultimoDia:null});
    if(L.ultimoDia!==hoy){
      L.racha=L.ultimoDia===ayerDe(hoy)?L.racha+1:1;L.ultimoDia=hoy;
      const dia=(L.racha-1)%7+1,premio=LOGIN[dia-1];
      dar(p,premio);login={dia,racha:L.racha,premio};cambio=true;
    }
    return{cambio,login};
  }
  const diaLogin=p=>p.login&&p.login.racha?(p.login.racha-1)%7+1:0;

  function registrar(p,ev,n=1,hoy=fechaJuego()){const M=estado(p,hoy);M.cont[ev]=(M.cont[ev]||0)+n;M.contDia[ev]=(M.contDia[ev]||0)+n}

  function progreso(p,m,x,hoy=fechaJuego()){
    const M=estado(p,hoy),v=m.est?m.est(p,x):((m.tipo==='diaria'?M.contDia:M.cont)[m.ev]||0);
    return Math.min(v,m.meta);
  }
  const reclamada=(p,m,hoy=fechaJuego())=>{const M=estado(p,hoy);return!!(m.tipo==='diaria'?M.hechasDia:M.hechas)[m.id]};
  const completa=(p,m,x,hoy=fechaJuego())=>progreso(p,m,x,hoy)>=m.meta;
  const pendientes=(p,x,hoy=fechaJuego())=>TODAS.filter(m=>completa(p,m,x,hoy)&&!reclamada(p,m,hoy)).length;

  function reclamar(p,id,x,hoy=fechaJuego()){   // devuelve el premio o null
    const m=TODAS.find(t=>t.id===id);
    if(!m||reclamada(p,m,hoy)||!completa(p,m,x,hoy))return null;
    const M=estado(p,hoy);(m.tipo==='diaria'?M.hechasDia:M.hechas)[m.id]=true;dar(p,m.premio);return m.premio;
  }
  function reclamarTodas(p,x,hoy=fechaJuego()){   // premio total sumado o null
    const tot={};let hubo=false;
    for(const m of TODAS){const pr=reclamar(p,m.id,x,hoy);if(pr){hubo=true;for(const[k,n]of Object.entries(pr))tot[k]=(tot[k]||0)+n}}
    return hubo?tot:null;
  }
  return{hoyLocal,fechaJuego,LOGIN,DIARIAS,GENERALES,entrar,diaLogin,registrar,progreso,reclamada,completa,pendientes,reclamar,reclamarTodas};
})();
if(typeof module!=='undefined')module.exports=Misiones;