// SIMULADOR · elegir la FORMA de cada Pokémon (formas regionales, Magearna Color Original, Tatsugiri, Meowstic hembra, Rotom, Oricorio...
// y las formas solo de aspecto: Unown, Vivillon, Alcremie, Arceus...). Va DESPUÉS de seleccion.js, selector-ataques.js y buscador.js.
// En la ficha del Pokémon elegido aparece "Forma" si su especie tiene más de una. Las Mega, Gigamax y Primigenias no salen aquí
// (tienen su propia mecánica en combate). Las formas que en los juegos solo existen en combate salen marcadas.
const ESPC={},COSC={};
const DE_COMBATE=/-(zen|blade|school|busted|noice|gulping|gorging|hangry|hero|sunny|rainy|snowy|pirouette|terastal|stellar|complete|ultra|crowned|ash|eternamax|primal)$|^minior-(?!.*meteor)/;
const OCULTAS=/-(mega|mega-[a-z]+|gmax|primal|totem.*)$/;
const bonito=n=>n.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
// loadSp guarda también: nombre en la PokéAPI, especie y formas de aspecto
{const l0=loadSp;loadSp=async function(id){const k=await l0(id),y=TY[k];
 if(y&&!y.api){try{const p=await jf(API+'pokemon/'+id);y.api=p.name;y.esp=idOf(p.species.url);y.cos=p.forms.length>1?p.forms.map(f=>f.name):null;y.idp=+id}catch(e){}}
 return k}}
async function variedades(esp){if(ESPC[esp])return ESPC[esp];
 const s=await jf(API+'pokemon-species/'+esp);
 return ESPC[esp]=s.varieties.map(v=>({id:idOf(v.pokemon.url),n:v.pokemon.name,def:v.is_default})).filter(v=>!OCULTAS.test(v.n))}
async function formaCosmetica(baseKey,nombre){const key=baseKey+'~'+nombre;if(TY[key])return key;
 const f=COSC[nombre]||(COSC[nombre]=await jf(API+'pokemon-form/'+nombre)),Y=TY[baseKey],S=f.sprites||{},fi=new Image(),bi=new Image();
 if(S.front_default)fi.src=S.front_default;if(S.back_default)bi.src=S.back_default;
 const ty=(f.types||[]).map(x=>TN[x.type.name]||'normal');
 TY[key]={...Y,n:bonito(nombre),img:S.front_default||Y.img,fi:S.front_default?fi:Y.fi,bi:S.back_default?bi:Y.bi,types:ty.length?ty:Y.types,api:Y.api,esp:Y.esp,idp:Y.idp||parseInt(String(baseKey).slice(1)),cos:Y.cos};
 return key}
// Ficha: selector de forma
let formaPintando=0;
async function panelFormas(){
 const o=saCur(),fi=document.querySelector('#setup .fi');if(!o||!fi||fi.querySelector('#forma-box'))return;
 const y=TY[o.t];if(!y)return;
 const baseKey=String(o.t).split('~')[0],B=TY[baseKey]||y,esp=B.esp||parseInt(baseKey.slice(1));if(!esp)return;
 const box=document.createElement('div');box.id='forma-box';box.innerHTML='<div class="mh">Forma</div><small style="opacity:.7">Buscando formas…</small>';
 (fi.querySelector('.sb')||fi.firstChild).after(box);const yo=++formaPintando;
 let V=[];try{V=await variedades(esp)}catch(e){box.remove();return}
 if(yo!==formaPintando||!box.isConnected)return;
 const cos=(B.cos||[]).filter(n=>n!==B.api);
 if(V.length<=1&&!cos.length){box.remove();return}
 const act=String(o.t).includes('~')?'c:'+String(o.t).split('~')[1]:'v:'+(B.idp||parseInt(baseKey.slice(1)));
 const op=(v,t)=>`<option value="${v}"${v===act?' selected':''}>${t}</option>`;
 box.innerHTML=`<div class="mh">Forma</div><select id="forma-sel" style="width:100%;margin:6px 0">
  ${V.length>1?`<optgroup label="Formas (cambian tipos, estadísticas o ataques)">${V.map(v=>op('v:'+v.id,bonito(v.n)+(v.def?' (normal)':'')+(DE_COMBATE.test(v.n)?' · solo en combate en los juegos':''))).join('')}</optgroup>`:''}
  ${cos.length?`<optgroup label="Solo de aspecto">${op('v:'+(B.idp||parseInt(baseKey.slice(1))),bonito(B.api||y.n)+' (normal)')}${cos.map(n=>op('c:'+n,bonito(n))).join('')}</optgroup>`:''}
 </select>`;
}
{const r0=rend;rend=function(){r0();panelFormas()}}
$('#setup').addEventListener('change',async e=>{
 if(e.target.id!=='forma-sel')return;
 const o=saCur();if(!o)return;const [k,v]=e.target.value.split(/:(.+)/),s=sel[0],i=sel[1];
 setSt('Cargando forma…');
 try{let t;
  if(k==='v'){t=await loadSp(+v)}
  else{const baseKey=String(o.t).split('~')[0];t=await formaCosmetica(baseKey,v)}
  const mismoPool=String(t).split('~')[0]===String(o.t).split('~')[0];
  const nuevo={t,s:mismoPool?[...o.s]:[...TY[t].ds],hab:o.hab||null,obj:o.obj||null};
  const api=TY[t].api||'';if(/-female/.test(api))nuevo.genero='F';else if(/-male/.test(api))nuevo.genero='M';
  TM[s][i]=nuevo;setSt('');rend()}
 catch(err){setSt(ERR)}});
