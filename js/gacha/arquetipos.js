// Arquetipos del gacha: generan los 4 ataques de un Pokémon a partir de
// especie + arquetipo + ataques disponibles. Es código PURO (sin DOM ni PokéAPI).
//
// Entradas:
//   esp  = { tipos:['fire',...] (códigos del juego, los mismos que mv.t),
//            stats:{hp,atk,def,spa,spd,spe} }
//   movs = ataques ya convertidos con conv() (sin nulos): los que esa especie
//          puede usar en esa etapa (sugeridos/aprendibles del selector).
// El kit NO se guarda en la partida: se calcula con especie + etapa + arquetipo.

// Estilo de un ataque. Un custom puede forzarlo con est:'distancia' en su mv.
function estiloAtaque(mv){
  if(mv.est)return mv.est;
  if(mv.cat==='sta')return 'utilidad';
  if(mv.tk===1||mv.r<=100)return 'contacto';
  if(['storm','quake','wave'].includes(mv.sty))return 'area';
  return 'distancia';
}

const esDano=m=>m.cat!=='sta'&&m.p>0;
const FILTROS={
  phy:m=>m.cat==='phy',
  spe:m=>m.cat==='spe',
  contacto:m=>estiloAtaque(m)==='contacto',
  lejos:m=>['distancia','area'].includes(estiloAtaque(m)),
};
const cuenta=(movs,f)=>movs.filter(m=>esDano(m)&&f(m)).length;

// 'stab' = daño del tipo propio · 'cob' = cobertura (otro tipo) · 'util' = estado
const ARQUETIPOS={
  fisico:{nombre:'Físico',filtro:'phy',stat:'atk',
    huecos:['stab','stab','cob','util'],
    viable:(e,mv)=>e.stats.atk>=e.stats.spa*.75&&cuenta(mv,FILTROS.phy)>=3},
  especial:{nombre:'Especial',filtro:'spe',stat:'spa',
    huecos:['stab','stab','cob','util'],
    viable:(e,mv)=>e.stats.spa>=e.stats.atk*.75&&cuenta(mv,FILTROS.spe)>=3},
  artillero:{nombre:'Artillero',filtro:'lejos',stat:null,
    huecos:['stab','stab','cob','util'],
    viable:(e,mv)=>cuenta(mv,FILTROS.lejos)>=3},
  asaltante:{nombre:'Asaltante',filtro:'contacto',stat:'atk',
    huecos:['stab','stab','cob','util'],
    viable:(e,mv)=>e.stats.atk>=e.stats.spa*.75&&cuenta(mv,FILTROS.contacto)>=3},
};

// Tabla de tipos (solo lo necesario para elegir cobertura). Códigos = los de mv.t.
const ESTIPOS={ // a qué tipos golpea con ventaja (x2)
  fire:['leaf','ice','bug','steel'],water:['fire','ground','rock'],elec:['water','flying'],
  leaf:['water','ground','rock'],ice:['leaf','ground','flying','dragon'],
  fighting:['normal','ice','rock','dark','steel'],poison:['leaf','fairy'],
  ground:['fire','elec','poison','rock','steel'],flying:['leaf','fighting','bug'],
  psychic:['fighting','poison'],bug:['leaf','psychic','dark'],rock:['fire','ice','flying','bug'],
  ghost:['psychic','ghost'],dragon:['dragon'],dark:['psychic','ghost'],
  steel:['ice','rock','fairy'],fairy:['fighting','dragon','dark'],normal:[]};
const EPOCO={ // a qué tipos les hace poco o nada
  normal:['rock','steel','ghost'],fire:['fire','water','rock','dragon'],water:['water','leaf','dragon'],
  elec:['elec','leaf','dragon','ground'],leaf:['fire','leaf','poison','flying','bug','dragon','steel'],
  ice:['fire','water','ice','steel'],fighting:['poison','flying','psychic','bug','fairy','ghost'],
  poison:['poison','ground','rock','ghost','steel'],ground:['leaf','bug','flying'],
  flying:['elec','rock','steel'],psychic:['psychic','steel','dark'],
  bug:['fire','fighting','poison','flying','ghost','steel','fairy'],rock:['fighting','ground','steel'],
  ghost:['dark','normal'],dragon:['steel','fairy'],dark:['fighting','dark','fairy'],
  steel:['fire','water','elec','steel'],fairy:['fire','poison','steel']};
// Cuánto mejora la cobertura un ataque de tipo t respecto a los tipos ya cubiertos.
function factorCob(t,cubiertos){
  const ya=new Set();for(const c of cubiertos)for(const d of ESTIPOS[c]||[])ya.add(d);
  const nuevos=(ESTIPOS[t]||[]).filter(d=>!ya.has(d)).length,malos=(EPOCO[t]||[]).length;
  return Math.max(.3,1+.25*(nuevos-.35*malos));
}

// Daño aproximado por segundo: potencia, precisión, enfriamiento, STAB y la
// estadística de ataque de la especie para esa categoría (atk si físico, spa si especial).
const puntos=(m,e)=>(m.p*(m.acc||100)/100)/m.cd*(e.tipos.includes(m.t)?1.5:1)
  *Math.max(20,m.cat==='phy'?e.stats.atk:e.stats.spa)/100;

function arquetiposViables(esp,movs){
  return Object.keys(ARQUETIPOS).filter(k=>ARQUETIPOS[k].viable(esp,movs));
}

// Solo los arquetipos viables cuyo kit se diferencia de los ya aceptados
// (parecido < umbral, 0 = nada en común, 1 = idénticos). Evita ofrecer dos cartas casi iguales.
function arquetiposDistintos(esp,movs,umbral=.5){
  const ok=[],ks=[];
  for(const a of arquetiposViables(esp,movs)){
    const k=new Set(generarKit(esp,a,movs).map(m=>m.key));
    const repetido=ks.some(o=>[...k].filter(x=>o.has(x)).length/new Set([...k,...o]).size>=umbral);
    if(!repetido){ok.push(a);ks.push(k)}
  }
  return ok;
}

function generarKit(esp,arq,movs){
  const A=ARQUETIPOS[arq];if(!A)return [];
  const dano=movs.filter(esDano),usados=new Set(),tipos=new Set(),kit=[];
  let ult=false;
  const stat=A.stat||(esp.stats.atk>=esp.stats.spa?'atk':'spa');
  const libre=m=>!usados.has(m.key)&&!(m.u&&ult);
  const tomar=m=>{usados.add(m.key);tipos.add(m.t);if(m.u)ult=true;return m};

  function elegirDano(hueco){
    const f=FILTROS[A.filtro];
    // intentos de más a menos estricto; el último acepta cualquier ataque de daño
    const intentos=[[f,hueco],[f,'libre'],[()=>true,'libre']];
    for(const[fil,modo]of intentos){
      let c=dano.filter(m=>libre(m)&&fil(m));
      if(modo==='stab'){
        const s=c.filter(m=>esp.tipos.includes(m.t));
        if(s.length){const n=s.filter(m=>!tipos.has(m.t));c=n.length?n:s}else continue;
      }else if(modo==='cob'){
        const s=c.filter(m=>!tipos.has(m.t)&&!esp.tipos.includes(m.t));
        if(s.length)c=s;
      }
      if(c.length){
        const cub=[...esp.tipos,...tipos],val=m=>puntos(m,esp)*(modo==='cob'?factorCob(m.t,cub):1);
        return tomar(c.sort((a,b)=>val(b)-val(a))[0]);
      }
    }
    return null;
  }
  function elegirUtil(){
    const val=m=>{const e=m.ef||{};
      if(e.s)return e.s[stat]>0?3:e.s.spe>0?2:1;
      if(e.o)return 1.2;
      if(e.h)return .8;return 0};
    const c=movs.filter(m=>m.cat==='sta'&&!usados.has(m.key)&&val(m)>0)
      .sort((a,b)=>val(b)-val(a));
    return c.length?tomar(c[0]):null;
  }
  for(const h of A.huecos){
    const m=h==='util'?(elegirUtil()||elegirDano('cob')):elegirDano(h);
    if(m)kit.push(m);
  }
  return kit;
}

// MTs: sustituyen un hueco del kit. mts=[{slot:3,mv:<ataque ya convertido>}]
function aplicarMT(kit,mts=[]){
  const k=kit.slice();
  for(const t of mts)if(t.slot>=0&&t.slot<k.length)k[t.slot]=t.mv;
  return k;
}

// Cuenta qué ataques salen más en los kits de todas las especies y arquetipos
// viables. Esa lista es el orden recomendado para hacer ataques custom.
// lista = [{esp, movs}, ...]
function contarUsoAtaques(lista){
  const c={};
  for(const{esp,movs}of lista)
    for(const a of arquetiposViables(esp,movs))
      for(const m of generarKit(esp,a,movs))c[m.key]=(c[m.key]||0)+1;
  return Object.entries(c).sort((a,b)=>b[1]-a[1]);
}

if(typeof module!=='undefined')module.exports={estiloAtaque,ARQUETIPOS,arquetiposViables,arquetiposDistintos,generarKit,aplicarMT,contarUsoAtaques};