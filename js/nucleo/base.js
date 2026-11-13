// Utilidades base: selector, tamaño del campo y canvas.
const $=s=>document.querySelector(s),W=800,H=450,PI=Math.PI;
// En la versión de un solo archivo (construir.py) las imágenes van incrustadas en window.ASSETS
const asset=p=>(window.ASSETS&&ASSETS[p])||p;
const cv=$('#cv'),cx=cv.getContext('2d');let sc=1;
const turn=(a,b,r)=>{const d=((b-a+PI*3)%(PI*2))-PI;return a+Math.max(-r,Math.min(r,d))};
