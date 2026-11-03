// Piezas comunes a todas las páginas: muro de fotos vivo, apariciones, nombre gigante y pie con carrusel.
const MEDIA = 'assets/media/';
const TOTAL_FOTOS = 426;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pad = (n, l = 2) => String(n).padStart(l, '0');
const $ = id => document.getElementById(id);

function barajar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Las fotos más fuertes salen primero (barajadas); después, el resto en orden aleatorio.
// 372–425 son las del export de VSCO de 2026 (Bruselas, Brujas, Berlín, Autoworld…).
const DESTACADAS = [0, 1, 9, 13, 15, 19, 20, 28, 43, 63, 64, 67, 73, 74, 80, 81, 84, 99, 111, 127, 131, 134, 142, 148,
  160, 170, 171, 198, 202, 241, 245, 252, 257, 276, 293, 297, 303, 306, 314, 320, 324, 329, 341, 345, 353, 355, 363, 371,
  373, 381, 383, 384, 387, 389, 391, 394, 396, 397, 399, 400, 402, 403, 406, 408, 409, 413, 416, 417, 419, 421, 422, 424];
function ordenFotos(destacadasPrimero = true) {
  const resto = [...Array(TOTAL_FOTOS).keys()].filter(n => !DESTACADAS.includes(n));
  return destacadasPrimero ? [...barajar(DESTACADAS), ...barajar(resto)] : barajar([...Array(TOTAL_FOTOS).keys()]);
}

/* Muro de fotos de fondo. No es fijo: cada foto tiene un punto de scroll en el que entra.
   Con `tope`, al pasar de ese número las más antiguas se van y el fondo cambia mientras bajas;
   sin tope, las fotos se acumulan. umbral(k) devuelve el scrollY (px) en que entra la foto k (creciente).
   Usa las versiones de 800 px (gm_) para que el fondo se vea nítido. */
function crearMuro({ fotos, umbral, tope = Infinity, min = 15, max = 26 }) {
  const wall = document.createElement('div'); wall.id = 'wall';
  const veil = document.createElement('div'); veil.id = 'veil';
  document.body.prepend(veil); document.body.prepend(wall);
  const COLS = 8, ROWS = 6;
  let celdas = [];
  const els = [];
  let umbrales = [];
  function calcular() { umbrales = fotos.map((_, k) => umbral(k)); }
  function crear(k) {
    if (!celdas.length) celdas = barajar([...Array(COLS * ROWS).keys()]);
    const c = celdas.pop();
    const cx = (c % COLS + .35 + Math.random() * .3) / COLS, cy = (Math.floor(c / COLS) + .35 + Math.random() * .3) / ROWS;
    const w = min + Math.random() * (max - min), ratio = [.75, 1, 1.33, .66][Math.floor(Math.random() * 4)];
    const el = document.createElement('div');
    el.className = 'ph';
    el.style.cssText = `left:calc(${(cx * 100).toFixed(1)}% - ${w / 2}vw); top:calc(${(cy * 100).toFixed(1)}% - ${(w * ratio / 2).toFixed(1)}vw); width:${w.toFixed(1)}vw; height:${(w * ratio).toFixed(1)}vw; --r:${((Math.random() - .5) * 12).toFixed(1)}deg; z-index:${k}`;
    el.innerHTML = `<div><img src="${MEDIA}gm_${pad(fotos[k], 3)}.jpg" alt=""></div>`;
    el.vel = .03 + Math.random() * .07;
    wall.appendChild(el);
    return el;
  }
  function update() {
    const y = scrollY;
    let n = 0;
    while (n < umbrales.length && umbrales[n] <= y) n++;
    for (let k = 0; k < Math.min(umbrales.length, n + 2); k++) {
      const el = els[k] || (els[k] = crear(k));
      el.classList.toggle('in', k < n && k >= n - tope);
      el.classList.toggle('old', k < n - tope);
      if (k < n && k >= n - tope) el.style.transform = `translateY(${(-(y - umbrales[k]) * el.vel).toFixed(1)}px)`;
    }
    for (let k = n + 2; k < els.length; k++) if (els[k]) els[k].classList.remove('in', 'old');
    return n;
  }
  calcular();
  addEventListener('resize', () => { calcular(); update(); });
  return { update, recalcular: calcular, veil, wall };
}

// Nombre gigante ajustado al ancho
function ajustarNombres() {
  document.querySelectorAll('.name').forEach(el => {
    el.style.fontSize = '100px';
    el.style.fontSize = (100 * (innerWidth * .96) / el.firstElementChild.offsetWidth) + 'px';
  });
}
document.fonts.ready.then(ajustarNombres); addEventListener('resize', ajustarNombres);

// Apariciones al hacer scroll
const vistos = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); vistos.unobserve(e.target); } }), { threshold: .15 });
function observarApariciones() { document.querySelectorAll('[data-rev]:not(.vis)').forEach(el => vistos.observe(el)); }

// Carrusel de diseños definitivos (la última versión de cada logo): varias filas en sentidos
// alternos; cada diseño sale una sola vez entre todas las filas.
let archivoCache = null;
const cargarArchivo = async () => archivoCache || (archivoCache = await fetch(MEDIA + 'archivo.json').then(r => r.json()));
async function montarCarrusel(cont, filas = 2) {
  if (!cont) return;
  const archivo = barajar(await cargarArchivo());
  const tam = Math.ceil(archivo.length / filas);
  for (let i = 0; i < filas; i++) {
    const imgs = archivo.slice(i * tam, (i + 1) * tam).map(d => `<img loading="lazy" src="${MEDIA}tv_${pad(d.id, 3)}.png" alt="Diseño GET A LIFE ${d.anio}" title="GET A LIFE · ${d.anio}">`).join('');
    cont.insertAdjacentHTML('beforeend', `<div class="reel-d${i % 2 ? ' rev' : ''}"><div class="row-d">${imgs}${imgs}</div></div>`);
  }
}

document.addEventListener('DOMContentLoaded', () => { ajustarNombres(); observarApariciones(); montarCarrusel($('pie')); });
