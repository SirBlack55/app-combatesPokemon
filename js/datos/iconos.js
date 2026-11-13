// Iconos de tipo (img/tipos/<tipo>.png).
const ICO={},ICI={};
for(const k of ["normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost", "steel", "fire", "water", "leaf", "elec", "psychic", "ice", "dragon", "dark", "fairy"]){ICO[k]=asset('img/tipos/'+k+'.png');ICI[k]=new Image();ICI[k].src=ICO[k]}
const TI=(t,h=16)=>ICO[t]?`<img src="${ICO[t]}" width="${h}" height="${h}" style="vertical-align:middle;border-radius:3px">`:'',tn=k=>TI(TY[k].types[0],14)+' '+TY[k].n;
