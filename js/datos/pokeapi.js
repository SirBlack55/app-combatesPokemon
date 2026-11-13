// Conexión con la PokéAPI: lista de Pokémon, carga de Pokémon y ataques.
const API='https://pokeapi.co/api/v2/',SPR='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/',GEN=[[1,151],[152,251],[252,386],[387,493],[494,649],[650,721],[722,809],[810,905],[906,1025]];
const TN={normal:'normal',fire:'fire',water:'water',electric:'elec',grass:'leaf',ice:'ice',fighting:'fighting',poison:'poison',ground:'ground',flying:'flying',psychic:'psychic',bug:'bug',rock:'rock',ghost:'ghost',dragon:'dragon',dark:'dark',steel:'steel',fairy:'fairy'};
const ERR='⚠️ No se pudo conectar con PokéAPI. Necesita internet y abrir este archivo en tu navegador (no funciona dentro de claude.ai).';
const mvc={};
const jf=async u=>{const r=await fetch(u);if(!r.ok)throw new Error(r.status);return r.json()},setSt=t=>{$('#st').textContent=t};
const mvData=c=>mvc[c.n]||(mvc[c.n]=jf(c.u).then(conv).catch(()=>{delete mvc[c.n];return null}));
async function loadSp(id){const key='p'+id;if(TY[key])return key;
 const p=await jf(API+'pokemon/'+id),types=p.types.map(x=>TN[x.type.name]||'normal'),sm={};p.stats.forEach(x=>sm[x.stat.name]=x.base_stat);
 const LM={'level-up':'nivel',machine:'mt',tutor:'tutor',egg:'egg'},learn={};
 for(const m of p.moves){const e={n:m.move.name,m:{}};for(const d of m.version_group_details){const k=LM[d.move_learn_method.name]||'otro';e.m[k]=1;if(k=='nivel')e.lv=d.level_learned_at}learn[e.n]=e}
 const cand=p.moves.map(m=>({n:m.move.name,u:m.move.url,sc:m.version_group_details.filter(d=>d.move_learn_method.name=='level-up'||d.move_learn_method.name=='machine').length})).filter(m=>m.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,36);
 const ms=[];for(let i=0;i<cand.length;i+=9)ms.push(...await Promise.all(cand.slice(i,i+9).map(mvData)));
 const ok=[...new Map(ms.filter(Boolean).map(x=>[x.n,x])).values()],sv=m=>m.p*(types.includes(m.t)?1.4:1),rk=m=>m.ef.h?3:m.ef.s?2:1;
 const att=ok.filter(m=>m.cat!='sta').sort((a,b)=>sv(b)-sv(a)),sta=ok.filter(m=>m.cat=='sta').sort((a,b)=>rk(b)-rk(a)),pa=[],cn={};
 for(const m of att)if((cn[m.t]||0)<2&&pa.length<7){pa.push(m);cn[m.t]=(cn[m.t]||0)+1}
 const pool=[...pa,...sta.slice(0,3)];for(const g of [N0,N1,['Golpe Cuerpo',60,1.8,1,55,0,0,1],['Embestida',45,1.3,1,55,0,0,1]])if(pool.length<4)pool.push(g);
 const ds=[],add=i=>{if(i>=0&&i<pool.length&&!ds.includes(i))ds.push(i)};add(0);add(1);add(2);add(pa.length);add(3);for(let i=0;ds.length<4&&i<pool.length;i++)add(i);
 const fr=p.sprites.front_default||SPR+id+'.png',bk=p.sprites.back_default,fi=new Image(),bi=new Image();fi.src=fr;if(bk)bi.src=bk;
 TY[key]={n:p.name.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase()),e:'',c:[TCOL[types[0]],'#fff','#334155'],st:{hp:sm.hp,atk:sm.attack,def:sm.defense,spa:sm['special-attack'],spd:sm['special-defense'],spe:sm.speed},H:Math.round(sm.hp*1.6+60),types,pool,ds:ds.slice(0,4),api:1,learn,sg:pool.length,img:fr,fi,bi};return key}