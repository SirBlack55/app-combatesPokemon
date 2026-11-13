# Arena Pokémon — simulador de combates

Simulador web de combates Pokémon en vista aérea. Usa la PokéAPI (necesita internet), ataques con animación propia
y un laboratorio para probarlos. Todo es HTML + CSS + JavaScript normal: no hace falta instalar nada.

## Cómo abrirlo
* **Doble clic en `index.html`.**
* Para tener **un solo archivo** (compartirlo, subirlo a una web…): `python3 construir.py` crea `equipos-api.html`
  con todo incrustado. Hazlo cada vez que cambies algo y quieras ese archivo actualizado.

## Estructura
```
index.html              pantallas y lista de scripts (el ORDEN importa)
construir.py            junta todo en un único archivo
css/estilo.css          estilos (tema oscuro)
img/                    campo.jpg y tipos/<tipo>.png (iconos de tipo)
js/
  nucleo/               base (utilidades), aleatorio (semilla), estado (variables globales),
                        efectos (partículas, ondas, explosiones), dibujo (canvas), bucle (paso fijo 1/60 s)
  datos/                tipos (colores, tabla de efectividad), iconos, movimientos genéricos,
                        estadisticas (TY = Pokémon cargados), pokeapi (carga), conversor (ataque API → ataque del juego)
  combate/              luchadores (spawn), ia (elige ataque), movimiento (cada paso), ataque, dano,
                        estados (curar/subir stats), entidades (proyectiles, rayos, ondas…)
  ataques/              _ayudas.js (registro CUSTOM + ayudas) y UN archivo por ataque con animación propia
                        _plantilla.js = modelos para copiar (no se carga)
  ui/                   hud (cuadros de vida y panel de ataques), seleccion (equipos), buscador, laboratorio
  modos/                simulador.js (modo actual: combates automáticos por equipos)
  principal.js          arranque
docs/guia-animaciones.md   guía para crear ataques
```

## Añadir un ataque con animación propia
1. Copia un modelo de `js/ataques/_plantilla.js` a un archivo nuevo, p. ej. `js/ataques/bote.js`.
2. Cambia el ID (el nombre del ataque en la PokéAPI, en inglés y con guiones) y escribe tu animación.
3. Añade `<script src="js/ataques/bote.js"></script>` en `index.html`, junto a los demás ataques
   (antes de `ui/hud.js`).
4. Ábrelo, entra en **🧪 Laboratorio**, escribe el ID y pulsa **▶ Probar**.
Detalles, trucos y errores típicos: `docs/guia-animaciones.md`.

## Añadir un modo de juego (torneo, campaña, retos…)
Un modo es un archivo nuevo en `js/modos/`. Piezas que ya existen para apoyarse en ellas:
* `TM` = los dos equipos que se van a enfrentar: `[[{t:'p25',s:[0,1,2,3]},…],[…]]` (`t` = clave del Pokémon
  cargado con `loadSp(id)`, `s` = índices de sus 4 ataques). Un modo solo tiene que rellenarlo.
* `start()` arranca un combate con `TM`; `toSetup()` vuelve a la selección.
* `alTerminarCombate = (ganador)=>{…}` → gancho que se llama al terminar cada combate (0 = 🔵, 1 = 🔴).
  Ahí un torneo avanza de ronda, una campaña guarda el progreso, etc.
* `semilla(n)` fija la aleatoriedad de la simulación (ver abajo).
Datos de rivales, equipos de gimnasio o rutas deberían ir en archivos aparte (JSON o .js de datos).

## Reglas del motor
* **Tipos**: `normal fire water elec leaf ice fighting poison ground flying psychic bug rock ghost dark steel fairy dragon`.
  Ojo: `elec` y `leaf` (no `electric`/`grass`).
* **Aleatoriedad**: `R(a,b)` solo para lo visual. Todo lo que afecte al resultado (daño, críticos, precisión, IA,
  dónde cae un meteoro) usa `rnd()` / `RS(a,b)`. Con `semilla(42)` dos combates iguales dan exactamente el mismo
  resultado (comprobado), base para el modo online.
* **Tiempo**: la simulación avanza en pasos fijos de 1/60 s, vaya la pantalla a 60 o a 144 Hz.
* **Campo**: 800 × 450. Zona de juego x = 100…700, y = 100…350. Centro del sprite: `y - 34`.

## Qué cambió respecto al archivo único
* Dividido en archivos; imágenes sacadas a `img/` (el HTML pasó de 407 KB a ~4 KB).
* Trueno y Rayo: tipo `'elec'` en lugar de `'electric'` (ahora sí hacen súper eficaz al agua, respetan la
  inmunidad de Tierra y tienen bonus por tipo).
* `m.tilt` ya no estira el sprite con valores pequeños (solo en picados, |tilt| > 0.3).
* Cometa Draco incluido en `js/ataques/cometa-draco.js` (versión corregida).
* Quitado código sin uso (tabla `EFF`, `TK`, `DS`, `LEG`, dibujo vectorial antiguo, CSS antiguo).
* Aleatoriedad con semilla y paso de tiempo fijo.
* Gancho `alTerminarCombate` para modos de juego.
