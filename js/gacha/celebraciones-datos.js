// Celebraciones del gacha (datos). Ver celebraciones.js para cómo funcionan.
// Cada celebración: { id, nombre, desc, tipo:'relativa'|'fechas', dias | inicio+fin, regalo?, banners:[...] }
// Banner normal: { id, nombre, tipo:'normal', precio:{una,multi}, prob, rateUp, pity, destacados:[{id,arq}], pool:[{id,arq}] } (ver banners-normales.js)
// Todas las cantidades son de ejemplo para probar.
const CELEBRACIONES=[
  { id:'bienvenida', nombre:'Celebración de bienvenida', tipo:'relativa', dias:10,
    desc:'Para empezar con buen pie: Pokécoin de regalo y un banner con pity corto.',
    regalo:{pokecoin:30},
    banners:[
      // PROVISIONAL: pool hecha con las especies del banner inicial (arquetipo fijo elegido al azar entre los viables).
      // Se sustituirá por un banner generado con la herramienta de banners.
      {"id":"bienvenida-1","nombre":"Banner de bienvenida","tipo":"normal","precio":{"una":3,"multi":30},"prob":{"N":15,"R":40,"SR":30,"SSR":3,"UR":4,"LR":1},"rateUp":0.5,"pity":20,"destacados":[{"id":884,"arq":"especial"},{"id":703,"arq":"especial"}],"pool":[{"id":1,"arq":"especial"},{"id":4,"arq":"fisico"},{"id":7,"arq":"fisico"},{"id":152,"arq":"especial"},{"id":155,"arq":"fisico"},{"id":158,"arq":"fisico"},{"id":252,"arq":"especial"},{"id":255,"arq":"especial"},{"id":258,"arq":"fisico"},{"id":387,"arq":"fisico"},{"id":390,"arq":"artillero"},{"id":393,"arq":"fisico"},{"id":495,"arq":"artillero"},{"id":498,"arq":"artillero"},{"id":501,"arq":"especial"},{"id":650,"arq":"artillero"},{"id":653,"arq":"especial"},{"id":656,"arq":"fisico"},{"id":722,"arq":"fisico"},{"id":725,"arq":"fisico"},{"id":728,"arq":"fisico"},{"id":810,"arq":"fisico"},{"id":813,"arq":"fisico"},{"id":816,"arq":"especial"},{"id":906,"arq":"artillero"},{"id":909,"arq":"especial"},{"id":912,"arq":"especial"},{"id":574,"arq":"especial"},{"id":165,"arq":"especial"},{"id":298,"arq":"especial"},{"id":401,"arq":"especial"},{"id":543,"arq":"fisico"},{"id":187,"arq":"fisico"},{"id":270,"arq":"especial"},{"id":74,"arq":"asaltante"},{"id":921,"arq":"especial"},{"id":821,"arq":"fisico"},{"id":971,"arq":"artillero"},{"id":440,"arq":"especial"},{"id":833,"arq":"fisico"},{"id":322,"arq":"especial"},{"id":607,"arq":"especial"},{"id":316,"arq":"fisico"},{"id":236,"arq":"artillero"},{"id":318,"arq":"fisico"},{"id":599,"arq":"especial"},{"id":885,"arq":"fisico"},{"id":712,"arq":"artillero"},{"id":774,"arq":"asaltante"},{"id":935,"arq":"fisico"}]}
    ] },
  { id:'kanto', nombre:'Celebración de Kanto', tipo:'fechas', inicio:'2026-12-01', fin:'2026-12-31',
    desc:'Un mes dedicado a la primera generación: banner de Kanto y, más adelante, eventos y combates.',
    regalo:{pokecoin:10},
    banners:[] },   // pendiente: banner de Kanto (se generará con la herramienta)
];