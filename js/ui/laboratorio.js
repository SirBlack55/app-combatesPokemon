// Laboratorio de ataques: prueba cualquier ataque sobre dos Pokémon que no mueren.
let lab=0,labT=null,labSide=0,labAuto=true,labMv=null,labIdle=0;
const labBusy=()=>mons.some(m=>m.sc||m.lw>0||m.lunge>0||m.freeze>0)||ents.some(e=>e.k!='v');
function labFire(){if(!labMv)return;const m=mons[labSide],o=mons[1-labSide];if(!m||!o)return;m.tg=o;o.tg=m;const mv={...labMv,acc:100};m.mv=[mv];m.mc=[0];m.pi=0;m.plan=mv;m.freeze=0;m.cd=0;atk(m)}
async function labMove(name){name=name.trim().toLowerCase().replace(/\s+/g,'-');let mv=null;try{mv=await mvData({n:name,u:API+'move/'+name+'/'})}catch(e){}if(!mv&&CUSTOM[name])mv=CUSTOM[name].fallback();return mv}
async function labStart(){const a=+$('#la').value||18,b=+$('#lb').value||143;$('#setup').style.display=$('#go').style.display=$('#srch').style.display='none';$('#game').style.display='block';$('#game').classList.add('lab');$('#lst').textContent='Cargando Pokémon…';
 try{const ka=await loadSp(a),kb=await loadSp(b);mons=[];ents=[];ps=[];txt=[];rg=[];scars=[];logs=[];team=[[],[]];over=true;paused=false;inGame=true;lab=1;bn=null;$('#ban').style.display='none';rs();
  spawn(0,{t:ka,s:[0],used:false});spawn(1,{t:kb,s:[0],used:false});
  for(const m of mons){m.lab=1;m.enter=0;m.y=230;m.home={x:m.x,y:230};m.mv=[];m.mc=[];m.max=m.hp=99999}
  mons[0].tg=mons[1];mons[1].tg=mons[0];$('#lst').textContent=labMv?'Listo. Pulsa ▶ Probar para repetir.':'Escribe el ID de un ataque y pulsa ▶ Probar.';
  clearInterval(labT);labT=setInterval(()=>{if(!lab)return;if(labBusy()){labIdle=0;return}labIdle+=200;if(labAuto&&labMv&&labIdle>=1400){labIdle=0;labFire()}},200)}catch(e){$('#lst').textContent=ERR}}
$('#labb').onclick=labStart;$('#la').onchange=$('#lb').onchange=labStart;
$('#lq').innerHTML=Object.keys(CUSTOM).map(k=>`<button data-k="${k}">${CUSTOM[k].fallback().n}</button>`).join('');
$('#lq').onclick=e=>{const b=e.target.closest('button');if(b){$('#lm').value=b.dataset.k;$('#lgo').click()}};
$('#lgo').onclick=async()=>{$('#lst').textContent='Buscando ataque…';const mv=await labMove($('#lm').value);if(!mv){$('#lst').textContent='No se pudo cargar ese ataque (usa el nombre en inglés, ej: fly, flamethrower). Sin conexión solo funcionan los personalizados.';return}
 labMv=mv;$('#lst').textContent=`${mv.n} · ${mv.t} · ${mv.cat=='phy'?'físico':mv.cat=='sta'?'estado':'especial'} · animación: ${mv.cu?'PERSONALIZADA':mv.sty||'—'}${mv.u?' · final':''}`;labIdle=0;if(lab&&!labBusy())labFire()};
$('#lsw').onclick=()=>{labSide=1-labSide;$('#lsw').textContent='Atacante: '+(labSide?'🔴':'🔵')};
$('#lauto').onclick=()=>{labAuto=!labAuto;$('#lauto').textContent='🔁 Auto: '+(labAuto?'sí':'no')};
$('#lslow').onclick=()=>{spd=spd==1?.5:spd==.5?.25:1;$('#lslow').textContent='Velocidad x'+spd};
$('#lex').onclick=()=>{lab=0;clearInterval(labT);$('#game').classList.remove('lab');spd=1;$('#lslow').textContent='Velocidad x1';toSetup()};
