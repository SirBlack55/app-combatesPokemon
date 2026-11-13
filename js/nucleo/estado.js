// Estado global del combate.
let hs=0,cz=0,dim=0,bn=null,duelT=0,sd=0,shk=0,sfl=0,sfc='#fff',rg=[],scars=[];
const OB=[];
let mons=[],ents=[],ps=[],txt=[],logs=[],T=0,spd=1,paused=false,last=0,team=[[],[]],send=[0,0],over=true,inGame=false;
// Gancho para los modos de juego: se llama al terminar un combate con el número del equipo ganador (0 o 1).
let alTerminarCombate=null;
