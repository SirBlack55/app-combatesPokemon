// Protección (protect): una esfera de hexágonos azules que gira alrededor del Pokémon.
// La mecánica (bloquear golpes, efectos de contacto...) está en campo.js (protege / protegido); esto es solo la animación.
// Cada ataque de barrera tiene su PROPIO archivo con su propia animación (ver _plantilla-barrera.js); los que aún no lo tienen usan una burbuja sencilla.
// Cada golpe bloqueado ilumina los hexágonos del lado por el que ha llegado (m.pbT = cuándo, m.pbA = desde qué ángulo).
(()=>{
// Centros de los hexágonos sobre la esfera: filas de latitud con menos hexágonos cerca de los polos (y los dos polos)
const HEX=[{lat:PI/2,lon:0},{lat:-PI/2,lon:0}];
[-72,-48,-24,0,24,48,72].forEach((la,i)=>{
 const lat=la*PI/180,n=Math.max(3,Math.round(360*Math.cos(lat)/26)),off=i%2?.5:0;
 for(let j=0;j<n;j++)HEX.push({lat,lon:(j+off)/n*2*PI});
});
const rgbDe=c=>{const n=parseInt(c.slice(1),16);return[n>>16,(n>>8)&255,n&255].join(',')};
const TILT=.38,S=.235;   // inclinación de la esfera y tamaño angular de cada hexágono

const base={
 // Lo llama atk() justo después de aplicar el efecto: solo hay esfera si la protección se ha activado de verdad
 visual(m,tg,p,antes){
  if(!m.prot||m.prot===antes)return;
  const col='#38bdf8';
  ents.push({k:'u',cu:'protect',o:m,tg,t:0,life:1,pr:m.prot,rgb:rgbDe(col),col});
  ring(m.x,m.y-28,col,70,.55,5);ring(m.x,m.y-28,'#fff',40,.3,3);
  for(let i=0;i<22&&ps.length<900;i++){const a=R(0,6.28),v=R(60,200);ps.push({x:m.x,y:m.y-28,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:R(.3,.6),m:.6,c:i%2?col:'#fff',s:R(2,5),g:1,sh:'d',r:a})}
 },
 eup(e,dt){
  e.t+=dt;
  const o=e.o;
  e.life=(!o.dead&&o.prot&&o.prot===e.pr)?1:0;   // desaparece cuando acaba la protección (o si el Pokémon cae)
 },
 edraw(e){
  const o=e.o;if(!o||!o.prot||o.prot!==e.pr)return;
  const k=Math.max(0,Math.min(1,e.t/.2)),back=Math.max(0,1+2.7*(k-1)**3+1.7*(k-1)**2);   // entrada con rebote (nunca negativo: en k=0 la fórmula da -2e-16)
  const R0=45*back;if(R0<1)return;
  const cxo=o.x,cyo=o.y-28-(o.z||0);
  const fade=Math.min(1,o.prot.l/.3)*Math.min(1,e.t/.08);        // se apaga en el último .3 s
  const fl=Math.max(0,1-(T-(o.pbT==null?-9:o.pbT))/.4),ang=o.pbA||0;
  const p0=[Math.cos(ang)*.85,-Math.sin(ang)*.85,Math.sqrt(1-.7225)];   // punto de la esfera donde ha llegado el último golpe
  const yaw=T*1.15,ct=Math.cos(TILT),st=Math.sin(TILT),rgb=e.rgb;
  const rot=v=>{const y=v[1]*ct-v[2]*st,z=v[1]*st+v[2]*ct;return[v[0],y,z]};
  const pol=[],lista=[];
  cx.save();cx.translate(cxo,cyo);cx.lineJoin='round';cx.globalCompositeOperation='lighter';

  // Resplandor del borde (más intenso en el contorno, como una burbuja) y del impacto
  let g=cx.createRadialGradient(0,0,R0*.55,0,0,R0*1.05);
  g.addColorStop(0,`rgba(${rgb},0)`);g.addColorStop(.8,`rgba(${rgb},${.14*fade})`);g.addColorStop(1,`rgba(${rgb},${.5*fade})`);
  cx.fillStyle=g;cx.beginPath();cx.arc(0,0,R0*1.05,0,7);cx.fill();
  if(fl>0){
   const gx=p0[0]*R0,gy=p0[1]*-R0;g=cx.createRadialGradient(gx,gy,0,gx,gy,R0*.8);
   g.addColorStop(0,`rgba(255,255,255,${.7*fl*fade})`);g.addColorStop(.4,`rgba(${rgb},${.4*fl*fade})`);g.addColorStop(1,`rgba(${rgb},0)`);
   cx.fillStyle=g;cx.beginPath();cx.arc(0,0,R0,0,7);cx.fill();
  }

  // Hexágonos: primero los de atrás (tenues), después los de delante
  HEX.forEach((h,i)=>{
   const lon=h.lon+yaw,cl=Math.cos(h.lat),sl=Math.sin(h.lat),sn=Math.sin(lon),cn=Math.cos(lon);
   const n=[cl*sn,sl,cl*cn],eLon=[cn,0,-sn],eLat=[-sl*sn,cl,-sl*cn];
   const c=rot(n);
   const vs=[];
   for(let j=0;j<6;j++){
    const a=j*PI/3+PI/6,ca=Math.cos(a)*S,sa=Math.sin(a)*S;
    let v=[n[0]+ca*eLon[0]+sa*eLat[0],n[1]+ca*eLon[1]+sa*eLat[1],n[2]+ca*eLon[2]+sa*eLat[2]];
    const L=Math.hypot(v[0],v[1],v[2]);v=rot([v[0]/L,v[1]/L,v[2]/L]);
    vs.push([v[0]*R0,-v[1]*R0]);
   }
   lista.push({c,vs,i});
  });
  lista.sort((a,b)=>a.c[2]-b.c[2]);
  for(const q of lista){
   const z=q.c[2],frente=z>0,sh=.5+.5*Math.sin(T*5+q.i*1.9);
   const dot=q.c[0]*p0[0]+q.c[1]*p0[1]+q.c[2]*p0[2],hit=Math.pow(Math.max(0,dot),4)*fl*(frente?1:.3);
   const al=(frente?.4+.45*z:.1)*fade;
   cx.beginPath();q.vs.forEach((v,j)=>j?cx.lineTo(v[0],v[1]):cx.moveTo(v[0],v[1]));cx.closePath();
   cx.fillStyle=`rgba(${rgb},${(frente?.08+.14*z:.03)*fade+hit*.5})`;cx.fill();
   if(hit>.05){cx.fillStyle=`rgba(255,255,255,${Math.min(.8,hit*.9)*fade})`;cx.fill()}
   cx.strokeStyle=hit>.1?`rgba(255,255,255,${Math.min(1,al+hit)})`:`rgba(${rgb},${Math.min(1,al*(.75+.25*sh))})`;
   cx.lineWidth=frente?1.7:.8;cx.stroke();
  }
  // Contorno exterior
  cx.strokeStyle=`rgba(${rgb},${.55*fade})`;cx.lineWidth=2;cx.beginPath();cx.arc(0,0,R0,0,7);cx.stroke();
  cx.restore();
 }
};
CUSTOM['protect']={...base,mv:{cu:'protect'},
 fallback:()=>({n:'Protección',key:'protect',p:0,cd:12.6,c:1,r:999,u:0,t:'normal',cat:'sta',ef:EFX['protect'],acc:0,cu:'protect'})};
})();