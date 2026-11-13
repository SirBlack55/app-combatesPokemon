# Guía: cómo crear animaciones personalizadas de ataques

Cada ataque con animación propia vive en **su propio archivo** dentro de `js/ataques/`.

| Dónde | Qué hay |
|---|---|
| `js/ataques/_plantilla.js` | Dos modelos para copiar (no se carga en el juego). |
| `js/ataques/_ayudas.js` | El registro `CUSTOM` y ayudas compartidas: `hpos`, `feathers`, `wind`, `scr`. |
| `js/ataques/vuelo.js`, `hidrobomba.js`, `hiperrayo.js`, `trueno.js`, `rayo.js`, `gigaimpacto.js`, `cometa-draco.js` | Los ataques ya hechos. |
| `js/datos/conversor.js` | Convierte un ataque de la PokéAPI al juego y le añade tus datos de `mv`. |
| `js/combate/ataque.js` (`atk`) | Lanza tu ataque (`CUSTOM[p.cu].start`). |
| `js/combate/movimiento.js` (`upM`) | Ejecuta tu guion `run` en cada paso. |
| `js/combate/entidades.js` (`upFx`) y `js/nucleo/dibujo.js` (`drawFx`) | Llaman a tu `eup` y `edraw`. |

**Para añadir un ataque nuevo:** crea `js/ataques/mi-ataque.js` y añade su `<script>` en `index.html`
(junto a los demás ataques, antes de `ui/hud.js`).

## Cómo funciona

1. La clave de la tabla es el **ID del ataque en la PokéAPI**: en inglés, minúsculas, con guiones (`fly`, `hydro-pump`, `flamethrower`, `dragon-claw`...).
2. Cuando un Pokémon tiene ese ataque, el juego lo marca como personalizado (`cu`) y usa tu código en vez de la animación general.
3. Tu ataque puede usar uno de estos dos patrones (o los dos a la vez):
   - **Guion sobre el Pokémon** (`start` + `run`): mueve al Pokémon atacante. Ejemplo: Vuelo, que sube al cielo y baja en picado.
   - **Entidad con dibujo propio** (`eup` + `edraw`): crea un efecto visual que tú mismo dibujas en el canvas. Ejemplo: el cañón de la Hidrobomba.
4. El poder, la precisión y el tipo vienen de la API. Tú solo decides **cómo se ve y cuándo hace daño**.

## Probarlo

En la pantalla de selección pulsa **🧪 Laboratorio**, escribe el ID del ataque y pulsa **▶ Probar**. Usa **Velocidad x0.25** para verlo en cámara lenta y **Auto** para que se repita solo.

---

## Campos de cada entrada de `CUSTOM`

```js
CUSTOM['id-del-ataque']={
  mv:{cu:'id-del-ataque', r:360, tk:0},   // datos que se sobreescriben. r = alcance en píxeles. tk:0 = no es embestida normal
  fallback:()=>({...}),                    // el ataque completo, para probarlo en el laboratorio sin conexión
  start(m,tg,p){...},                      // se llama UNA vez al lanzarlo
  run(m,dt,s){...},                        // cada frame; devuelve true cuando el ataque termina
  eup(e,dt){...},                          // (opcional) actualiza la entidad visual
  edraw(e){...}                            // (opcional) dibuja la entidad visual
}
```

* `m` = Pokémon atacante, `tg` = rival, `p` = datos del ataque (`p.p` poder, `p.t` tipo, `p.cat` categoría), `dt` = segundos del frame, `s` = tu estado (`s.t` = segundos transcurridos).
* `run` debe devolver `true` al terminar; si no, el Pokémon se queda bloqueado.

---

## Modelo A: guion sobre el Pokémon (salto con aplastamiento)

Probado y funcionando. Se agacha, salta en arco hacia el rival y cae encima.

```js
CUSTOM['bounce']={
  mv:{cu:'bounce',r:360,tk:0},
  fallback:()=>({n:'Bote',key:'bounce',p:85,cd:(1+85/45)*1.4,c:1,r:360,u:0,t:'normal',cat:'phy',acc:85,sty:'hit',cu:'bounce'}),
  start(m,tg,p){m.sc={id:'bounce',t:0,p}},
  run(m,dt,s){const tg=m.tg,t=s.t;if(!tg||tg.dead)return true;     // si el rival cae, termina
    if(t<.25){m.sqz=t/.25;return false}                              // 0 - 0.25 s: se agacha
    m.sqz=0;
    if(t<.85){const u=(t-.25)/.6;m.z=220*Math.sin(u*Math.PI);         // 0.25 - 0.85 s: arco de salto (m.z = altura)
      m.x+=(tg.x-m.x)*Math.min(1,dt*3);m.y+=(tg.y-m.y)*Math.min(1,dt*3);return false}
    if(!s.h){s.h=1;m.z=0;                                            // aterriza: UN solo golpe
      hit(tg,s.p.p,s.p.t,m,{cat:s.p.cat,f:true});
      imp(tg.x,tg.y-20,'normal',1.5);shk=Math.max(shk,8)}
    return t>1.1}                                                    // termina a 1.1 s
};
```

## Modelo B: entidad con dibujo propio (rayo psíquico)

Probado y funcionando. Un rayo continuo de 4 golpes. Es el mismo patrón que la Hidrobomba, pero mucho más corto.

```js
CUSTOM['psybeam']={
  mv:{cu:'psybeam'},
  fallback:()=>({n:'Psicorrayo',key:'psybeam',p:65,cd:(1+65/45)*1.4,c:1,r:300,u:0,t:'psychic',cat:'spe',acc:100,sty:'beam',cu:'psybeam'}),
  start(m,tg,p){m.sc={id:'psybeam',t:0};                              // el Pokémon se queda quieto mirando al rival
    ents.push({k:'u',cu:'psybeam',o:m,tg,cat:p.cat,dm:p.p/3,t:0,tk:0,n:0,life:1.3,delay:0})}, // crea la entidad visual
  run(m,dt,s){return s.t>=1.2},
  eup(e,dt){const o=e.o,t=e.tg;e.t+=dt;e.life=1.3-e.t;if(o.dead){e.life=0;return}
    if(e.t>.3&&e.t<1.1){e.tk+=dt;if(e.tk>=.2){e.tk=0;e.n++;          // un golpe cada 0.2 s
      if(!t.dead){hit(t,e.dm,'psychic',o,{cat:e.cat,f:e.n==1});imp(t.x,t.y-30,'psychic',.8)}}}},
  edraw(e){const o=e.o,t=e.tg;if(e.t<.3||e.t>1.15)return;
    const x1=o.x,y1=o.y-34,x2=t.x,y2=t.y-34,w=1+Math.sin(T*40)*.2;     // y-34 = centro del sprite
    cx.save();cx.lineCap='round';
    for(const [lw,c] of [[26,'rgba(244,114,182,.55)'],[12,'rgba(217,70,239,.9)'],[4,'#fff']]){
      cx.strokeStyle=c;cx.lineWidth=lw*w;cx.beginPath();cx.moveTo(x1,y1);cx.lineTo(x2,y2);cx.stroke()}
    cx.restore()}
};
```

Para añadirlos, guarda cada modelo en su archivo de `js/ataques/` y registra su `<script>` en `index.html` (los modelos listos están en `js/ataques/_plantilla.js`).

---

## Cosas que puedes usar

**Coordenadas.** El campo mide 800 × 450. La zona de juego va de x = 100 a 700 e y = 100 a 350. El centro del sprite de un Pokémon está en `y - 34`. El Pokémon vive en `m.x`, `m.y`; si quieres que se levante del suelo usa `m.z`.

**Cosas del Pokémon `m`:** `m.x m.y m.z m.a` (ángulo) · `m.sqz` (0-1, agacharse) · `m.tilt` (inclinación) · `m.kx m.ky` (empujón) · `m.tg` (su rival) · `m.sc` (tu guion). Mientras `m.z > 30` no se le puede golpear.

**Hacer daño:** `hit(rival, poder, tipo, atacante, {cat:'phy' o 'spe', f:true})`. `f:true` muestra "Súper eficaz" o "Poco eficaz" (ponlo solo en el primer golpe).

**Efectos rápidos:**
* `imp(x,y,tipo,tamaño)` explosión de partículas propia de cada tipo (`fire`, `water`, `elec`, `leaf`, `ice`, `psychic`, `ghost`, `dark`, `poison`, `ground`, `rock`, `bug`, `flying`, `fighting`, `steel`, `fairy`, `normal`, `dragon`).
* `blast(x,y,color,radio)` gran explosión con destello.
* `ring(x,y,color,radio,duración,grosor)` onda expansiva.
* `vfx(x,y,estilo,tipo)` marca de contacto: `'slash'` `'bite'` `'punch'` `'kick'` `'whip'` `'hit'`.
* `feathers(x,y,cantidad,velocidad)` plumas · `wind(x,y)` líneas de viento.
* `shk=8` temblor de pantalla (0-12) · `sfl=.3; sfc='#fff'` destello de pantalla · `cz=.06` zoom · `dim=.4` oscurecer el campo · `bn={s:'Nombre',c:'#fff',l:1.5}` cartel con el nombre del ataque.
* `T` = tiempo global del juego (úsalo en senos para animar cosas).
* `rnd()` / `RS(a,b)` = aleatoriedad que afecta al **resultado** (con semilla); `R(a,b)` = solo para lo **visual**.

**Partículas propias:** `ps.push({x,y,vx,vy,gy,l,m,c,s,g,sh,r,vr})`
`l` = vida restante y `m` = vida total (pon los dos iguales) · `c` = color · `s` = tamaño · `g:1` = brillo aditivo · `gy` = gravedad · `r`/`vr` = rotación y giro · `sw` = vaivén lateral.
`sh` = forma: `'c'` círculo, `'d'` rombo, `'s'` estrella, `'k'` línea, `'l'` hoja, `'r'` roca, `'o'` burbuja (solo borde), `'f'` pluma.
Mantén `ps.length < 900` para no ralentizar.

**Colores por tipo:** `TCOL.fire`, `TCOL.water`, etc.

## Consejos

* **`globalCompositeOperation='lighter'`** brilla mucho sobre fondo oscuro, pero sobre el pasto claro **quema el color hasta blanco**. Para cuerpos sólidos usa `'source-over'` con colores `rgba(...)` y deja `'lighter'` solo para destellos pequeños.
* Calcula los tamaños según la **distancia** entre atacante y rival: si no, con los Pokémon pegados salen manchas enormes (lo que pasó con la Hidrobomba).
* Cada paso de `run` tiene un tiempo; pon un indicador (`s.h=1`) para que el golpe se haga **una sola vez**.
* Comprueba siempre `tg.dead` y `o.dead`: si el rival o el atacante caen a media animación, termina.
* Si el ataque tiene varios golpes, divide el poder entre ellos (`p.p/golpes`) para no hacer demasiado daño.
* Prueba con **Velocidad x0.25** y con los Pokémon muy pegados (cambia los números de atacante y rival en el laboratorio).

## Errores típicos (todos vistos de verdad)

* **Tipos mal escritos:** el motor usa `'elec'` y `'leaf'`. Con `'electric'` o `'grass'` el ataque no tiene efectividad, inmunidades ni bonus por tipo.
* **Poder inesperado:** si el ataque es de tipo Dragón o Roca, especial y con poder ≥ 110, el conversor lo multiplica por 1.8. Fija `p` y `c` dentro de `mv` (por ejemplo `mv:{cu:'draco-meteor',r:420,tk:0,p:130,c:1}`).
* **El juego se congela al lanzar el ataque:** casi siempre es `edraw` usando una posición que todavía no existe (`undefined`) en `createRadialGradient`/`createLinearGradient`. `edraw` puede ejecutarse antes del primer `eup`: inicializa en `start()` todo lo que dibujes.
* **`delay` de una entidad:** lo gestiona el motor; `eup` empieza a llamarse cuando termina. No lo compares tú con `e.t`.
* **El sprite se ve estirado al vibrar:** `m.tilt` solo estira con valores grandes (picados). Para vibrar suma a `m.x`.
* **Daño duplicado o que nunca llega:** pon un indicador (`s.h=1`) y revisa `tg.dead` y `o.dead`.
* **`globalCompositeOperation='lighter'`** sobre el pasto claro quema el color: para cuerpos sólidos usa `'source-over'`.
