// Capa de guardado LOCAL del modo gacha: perfiles + partida de cada perfil.
// Todas las funciones son async a propósito: si algún día se guarda en un servidor,
// solo habría que cambiar este archivo y los modos seguirían igual.
//
// Lo que se guarda por perfil (localStorage, una clave por perfil):
//   { version, jugador:{nombre,creado}, contador, monedas:{gemas}, objetos:{}, box:[cartas],
//     equipo:[], pity:{}, tutorial:{inicial}, misiones:{}, login:{}, eventos:{} }
// Una carta de la box es una INSTANCIA: {id, especieId, arquetipo, nivel, xp, estrellas, ivs,
//   naturaleza, ataquesMT, bloqueado, obtenidoEn, origen}. La rareza y el kit NO se guardan: se calculan.

const Guardado=(()=>{
  const VERSION=1;
  const K={perfiles:'gacha-perfiles',activo:'gacha-perfil-activo',partida:id=>'gacha-partida-'+id};
  const hoy=()=>new Date().toISOString().slice(0,10);
  const leer=(k,def)=>{try{const v=localStorage.getItem(k);return v==null?def:JSON.parse(v)}catch(e){return def}};
  const escribir=(k,v)=>localStorage.setItem(k,JSON.stringify(v));   // puede lanzar si no queda espacio

  // Naturalezas: nombre en español, estadística que sube (u) y la que baja (d)
  const NATURALEZAS={
    hardy:{n:'Fuerte'},lonely:{n:'Huraña',u:'atk',d:'def'},brave:{n:'Audaz',u:'atk',d:'spe'},adamant:{n:'Firme',u:'atk',d:'spa'},
    naughty:{n:'Pícara',u:'atk',d:'spd'},bold:{n:'Osada',u:'def',d:'atk'},docile:{n:'Dócil'},relaxed:{n:'Plácida',u:'def',d:'spe'},
    impish:{n:'Agitada',u:'def',d:'spa'},lax:{n:'Floja',u:'def',d:'spd'},timid:{n:'Miedosa',u:'spe',d:'atk'},
    hasty:{n:'Activa',u:'spe',d:'def'},serious:{n:'Seria'},jolly:{n:'Alegre',u:'spe',d:'spa'},naive:{n:'Ingenua',u:'spe',d:'spd'},
    modest:{n:'Modesta',u:'spa',d:'atk'},mild:{n:'Afable',u:'spa',d:'def'},quiet:{n:'Mansa',u:'spa',d:'spe'},bashful:{n:'Tímida'},
    rash:{n:'Alocada',u:'spa',d:'spd'},calm:{n:'Serena',u:'spd',d:'atk'},gentle:{n:'Amable',u:'spd',d:'def'},
    sassy:{n:'Grosera',u:'spd',d:'spe'},careful:{n:'Cauta',u:'spd',d:'spa'},quirky:{n:'Rara'}};

  function nuevaPartida(nombre){
    return{version:VERSION,jugador:{nombre,creado:hoy()},contador:0,monedas:{gemas:0},objetos:{},box:[],equipo:[],
      pity:{},tutorial:{inicial:false},misiones:{},login:{racha:0,ultimoDia:null},eventos:{}};
  }
  // Valida una partida y la pone al día (aquí irán las migraciones cuando cambie el formato).
  function migrar(d){
    if(!d||typeof d!=='object'||!Array.isArray(d.box))throw new Error('Partida no válida');
    return{...nuevaPartida((d.jugador&&d.jugador.nombre)||'Jugador'),...d,version:VERSION};
  }
  const nuevoId=()=>'j'+Date.now().toString(36)+Math.floor(Math.random()*46656).toString(36);

  const listarPerfiles=async()=>leer(K.perfiles,[]);
  async function crearPerfil(nombre,datos){
    const id=nuevoId(),ps=leer(K.perfiles,[]);
    ps.push({id,nombre,creado:hoy()});
    escribir(K.partida(id),datos||nuevaPartida(nombre));escribir(K.perfiles,ps);escribir(K.activo,id);
    return id;
  }
  async function borrarPerfil(id){
    escribir(K.perfiles,leer(K.perfiles,[]).filter(p=>p.id!==id));
    localStorage.removeItem(K.partida(id));
    if(leer(K.activo,null)===id)localStorage.removeItem(K.activo);
  }
  async function perfilActivo(){
    const id=leer(K.activo,null);
    return leer(K.perfiles,[]).some(p=>p.id===id)?id:null;
  }
  const elegirPerfil=async id=>escribir(K.activo,id);
  async function cargarPartida(id){const d=leer(K.partida(id),null);return d?migrar(d):null}
  const guardarPartida=async(id,d)=>escribir(K.partida(id),d);

  const exportarPartida=d=>JSON.stringify(d,null,1);
  // Importa como perfil NUEVO (nunca pisa uno existente).
  async function importarPartida(texto){
    const d=migrar(JSON.parse(texto)),nombre=d.jugador.nombre+' (importado)';
    d.jugador={...d.jugador,nombre};
    return crearPerfil(nombre,d);
  }

  // Crea la instancia de una carta tirada ({especieId, arquetipo}) y la mete en la box.
  function nuevaCarta(partida,carta,origen,rng=Math.random){
    const ivs={};for(const s of['hp','atk','def','spa','spd','spe'])ivs[s]=Math.floor(rng()*32);
    const nat=Object.keys(NATURALEZAS);
    const c={id:'p'+(++partida.contador),especieId:carta.especieId,arquetipo:carta.arquetipo,nivel:1,xp:0,estrellas:0,
      ivs,naturaleza:nat[Math.floor(rng()*nat.length)],ataquesMT:[],bloqueado:false,obtenidoEn:hoy(),origen};
    partida.box.push(c);
    return c;
  }

  return{VERSION,NATURALEZAS,nuevaPartida,migrar,listarPerfiles,crearPerfil,borrarPerfil,perfilActivo,elegirPerfil,
    cargarPartida,guardarPartida,exportarPartida,importarPartida,nuevaCarta};
})();

if(typeof module!=='undefined')module.exports=Guardado;