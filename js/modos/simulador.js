// Modo simulador: combates automáticos por equipos.
// iniciarCombate(equipos): arranca un combate con dos listas de {t,s,...} (los demás modos lo reutilizan; las unidades guardan sus campos extra).
function iniciarCombate(eq){mons=[];ents=[];ps=[];txt=[];logs=[];rg=[];scars=[];shk=0;sfl=0;over=false;paused=false;$('#pa').textContent='Pausa';send=[0,0];$('#ban').style.display='none';team=eq.map(a=>a.map(o=>({...o,used:false,dead:false})));
 $('#setup').style.display=$('#go').style.display=$('#srch').style.display='none';$('#game').style.display='block';inGame=true;rs();spawn(0,team[0][0]);spawn(1,team[1][0])}
function start(){iniciarCombate(TM)}
function toSetup(){$('#game').style.display='none';$('#setup').style.display='flex';$('#go').style.display='block';$('#srch').style.display='block';over=true;inGame=false;rend()}
$('#bar').onclick=e=>{const b=e.target.closest('button');if(!b)return;
 if(b.id=='sp'){spd=spd==1?2:spd==2?.5:1;b.textContent='Velocidad x'+spd}
 else if(b.id=='pa'){paused=!paused;b.textContent=paused?'Seguir':'Pausa'}
 else if(b.id=='tg'){showMv=!showMv;$('#mvp').style.display=showMv?'flex':'none';b.textContent=showMv?'Ocultar ataques':'Mostrar ataques'}else if(b.id=='rs'){if(alSalirCombate)alSalirCombate();else toSetup()}};
$('#ban').onclick=e=>{if(e.target.id=='rv')start();if(e.target.id=='ch')toSetup()};
$('#go').onclick=start;