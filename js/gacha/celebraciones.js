// Celebraciones del gacha (código PURO: sin red ni DOM). Una celebración es un paquete temporal: banners propios,
// regalo de entrada y (más adelante) eventos, misiones y login propios. Al acabar, sus banners dejan de estar disponibles.
//   { id, nombre, desc, tipo:'relativa', dias, ... }       → empieza cuando el jugador la ve por primera vez y dura `dias` días (p. ej. bienvenida)
//   { id, nombre, desc, tipo:'fechas', inicio, fin, ... }  → fechas reales 'AAAA-MM-DD' (ambas incluidas), iguales para todos
//   resto: regalo:{objeto:n} (se da una vez al empezar) · banners:[banner normal, ver banners-normales.js]
// Se guarda en la partida: partida.celebraciones = { id: {inicio, regalo:true} }.
// Las fechas son locales (las del dispositivo); `hoy` se pasa de fuera para poder probar con una fecha de prueba.
const Celebraciones=(()=>{
  const aFecha=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
  const aTexto=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const sumar=(s,n)=>{const d=aFecha(s);d.setDate(d.getDate()+n);return aTexto(d)};
  const dias=(a,b)=>Math.round((aFecha(b)-aFecha(a))/86400000);   // días de a hasta b

  // Estado de una celebración ese día: {fase:'proxima'|'activa'|'terminada', inicio, fin, quedan (activa: incluido hoy), empieza (próxima: días que faltan)}
  function estado(c,p,hoy){
    let inicio,fin;
    if(c.tipo==='relativa'){
      const r=p.celebraciones&&p.celebraciones[c.id];
      inicio=r?r.inicio:hoy;fin=sumar(inicio,c.dias-1);          // aún sin empezar: empezaría hoy
    }else{inicio=c.inicio;fin=c.fin}
    if(hoy<inicio)return{fase:'proxima',inicio,fin,empieza:dias(hoy,inicio)};
    if(hoy>fin)return{fase:'terminada',inicio,fin};
    return{fase:'activa',inicio,fin,quedan:dias(hoy,fin)+1};
  }
  const activas=(lista,p,hoy)=>lista.filter(c=>estado(c,p,hoy).fase==='activa');
  const proximas=(lista,p,hoy)=>lista.filter(c=>estado(c,p,hoy).fase==='proxima').sort((a,b)=>estado(a,p,hoy).empieza-estado(b,p,hoy).empieza);

  // Al abrir el gacha: apunta el inicio de las relativas, y da el regalo de cada celebración activa (una sola vez).
  // Devuelve {cambio, mensajes:[{celebracion, premio}]}
  function entrar(lista,p,hoy){
    const reg=p.celebraciones||(p.celebraciones={});let cambio=false;const mensajes=[];
    for(const c of lista){
      if(c.tipo==='relativa'&&!reg[c.id]){reg[c.id]={inicio:hoy};cambio=true}
      if(estado(c,p,hoy).fase!=='activa')continue;
      const r=reg[c.id]||(reg[c.id]={inicio:hoy});
      if(c.regalo&&!r.regalo){
        p.objetos=p.objetos||{};for(const[k,n]of Object.entries(c.regalo))p.objetos[k]=(p.objetos[k]||0)+n;
        r.regalo=true;cambio=true;mensajes.push({celebracion:c,premio:c.regalo});
      }
    }
    return{cambio,mensajes};
  }
  return{estado,activas,proximas,entrar,sumar,dias};
})();
if(typeof module!=='undefined')module.exports=Celebraciones;