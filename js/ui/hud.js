// Registro del combate, cuadros de vida y panel de ataques.
function log(s){logs.unshift(s);logs.length=Math.min(logs.length,6);$('#log').innerHTML=logs.join('<br>')||'Esperando el primer combate...'}
function ui(){mvui()}
let lu=0,showMv=true;
function mvui(){for(let s=0;s<2;s++){const m=mons.find(x=>x.side==s&&!x.dead),h=$('#h'+s),el=$('#mv'+s),balls=team[s].map(u=>`<span class="pb ${u.dead?'d':u.used?'a':''}"></span>`).join('');
 h.style.setProperty('--c',s?'#ef4444':'#3b82f6');
 if(!m){if(h._m!==0){h._m=0;h.innerHTML=`<div class="hi"><div class="hn"><b>${s?'🔴':'🔵'} Equipo ${s+1}</b></div><div class="hv">Esperando relevo…</div><div class="balls"></div></div>`}h.querySelector('.balls').innerHTML=balls;el.innerHTML='';continue}
 const y=TY[m.t],q=Math.max(0,m.hp)/m.max;
 if(h._m!==m){h._m=m;h.innerHTML=`<img class="hs" src="${y.img}"><div class="hi"><div class="hn"><b>${y.n}</b><span>${y.types.map(t=>TI(t,16)).join('')}</span></div><div class="hp"><em>PS</em><div class="hbar"><i style="width:100%"></i></div></div><div class="hv"></div><div class="hst"></div><div class="balls"></div></div>`}
 const bi=h.querySelector('.hbar i');bi.style.width=q*100+'%';bi.style.background=q<.2?'#ef4444':q<.5?'#eab308':'#22c55e';
 h.querySelector('.hv').textContent=Math.max(0,Math.round(m.hp))+' / '+m.max;
 h.querySelector('.hst').innerHTML=ST.slice(1).filter(([k])=>m.stg[k]).map(([k,l])=>`<span class="ch ${m.stg[k]>0?'up':'dn'}">${l} ${m.stg[k]>0?'▲':'▼'}${Math.abs(m.stg[k])}</span>`).join('');
 h.querySelector('.balls').innerHTML=balls;
 el.innerHTML=`<div class="ph"><b>${s?'🔴':'🔵'} ${y.n}</b><div class="pst">${ST.slice(1).map(([k,l])=>{const g=m.stg[k];return `<span class="${g>0?'up':g<0?'dn':''}"><small>${l}</small>${Math.round(stat(m,k))}${g>0?'▲':g<0?'▼':''}</span>`}).join('')}</div></div><div class="pm">${m.mv.map((v,i)=>{const r=Math.max(0,m.mc[i]),rd=r<=0;return `<div class="mv${rd?' rd':''}${m.plan===v?' pl':''}" style="--t:${TC[v.t]}"><div class="mn">${TI(v.t,16)}<b>${v.u?'★ ':''}${v.n}</b><span>${CI[v.cat]}</span></div><div class="cb"><i style="width:${rd?100:(1-r/v.cd)*100}%"></i></div><div class="cs">${rd?'¡Listo!':r.toFixed(1)+'s'}</div></div>`}).join('')}</div>`}}
