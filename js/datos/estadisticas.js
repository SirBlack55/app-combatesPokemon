// Estadísticas de combate y registro de Pokémon cargados (TY).
const MH=t=>TY[t].H||Math.round(TY[t].st.hp*2.2);
const mult=n=>n>=0?(2+n)/2:2/(2-n),stat=(m,k)=>m.st[k]*mult(m.stg[k]||0);
const ST=[['hp','PS'],['atk','ATQ'],['def','DEF'],['spa','AT.ESP'],['spd','DEF.ESP'],['spe','VEL']],CI={phy:'⚔️',spe:'✨',sta:'🛡️'};
const TY={};
