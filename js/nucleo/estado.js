// Estado global del combate.
let hs=0,cz=0,dim=0,bn=null,duelT=0,sd=0,shk=0,sfl=0,sfc='#fff',rg=[],scars=[];
const OB=[];
let mons=[],ents=[],ps=[],txt=[],logs=[],T=0,spd=1,paused=false,last=0,team=[[],[]],send=[0,0],over=true,inGame=false;
// Ganchos para los modos de juego:
//  alTerminarCombate(w): se llama al terminar un combate con el número del equipo ganador (0 o 1).
//  alSalirCombate(): si existe, el botón "Equipos" del combate la llama en vez de volver a la selección (la aventura lo usa para "Huir").
let alTerminarCombate=null,alSalirCombate=null;