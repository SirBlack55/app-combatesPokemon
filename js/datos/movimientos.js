// Ataques genéricos y constructores de ataques de estado.
const N0=['Placaje',38,1.1,1,55,0,0,1],N1=['Ataque Rápido',26,.7,1,55,0,0,1];
const mkmv=(t,a)=>!Array.isArray(a)?a:({n:a[0],p:a[1],cd:a[2]*1.4,c:a[3],r:a[4],u:a[5],k:a[6],tk:a[7],t:a[8]||(a[7]?'normal':t),cat:a[9]||((a[7]||a[6]=='c')?'phy':'spe'),ef:a[10]});
const SA=(n,s,d,cd=9)=>[n,0,cd,1,999,0,0,0,0,'sta',{s,d}],SH=(n,h,d,cd=18)=>[n,0,cd,1,999,0,0,0,0,'sta',{h,d}],SO=(n,o,d,cd=9)=>[n,0,cd,1,999,0,0,0,0,'sta',{o,d}];
