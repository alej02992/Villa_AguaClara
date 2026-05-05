/* ═══════════════════════════════════════
   VILLA AGUACLARA — script.js
   Lightbox para galería de fotos
   ═══════════════════════════════════════ */

const imgs       = document.querySelectorAll('#grid-galeria img');
const lb         = document.getElementById('lightbox');
const lbImg      = document.getElementById('lb-img');
const lbContador = document.getElementById('lb-contador');
let idx = 0;

/* Muestra la imagen en el índice dado */
function mostrar(i) {
    idx = i;
    lbImg.src = imgs[idx].src;
    lbContador.textContent = (idx + 1) + ' / ' + imgs.length;
}

/* Abrir lightbox al hacer clic en una foto */
imgs.forEach((img, i) => {
    img.addEventListener('click', () => {
        mostrar(i);
        lb.classList.add('active');
    });
});

/* Botones cerrar / flechas */
document.getElementById('lb-cerrar').addEventListener('click', () => lb.classList.remove('active'));
document.getElementById('lb-der').addEventListener('click',    () => mostrar((idx + 1) % imgs.length));
document.getElementById('lb-izq').addEventListener('click',    () => mostrar((idx - 1 + imgs.length) % imgs.length));

/* Cerrar al hacer clic fuera de la imagen */
lb.addEventListener('click', e => {
    if (e.target === lb) lb.classList.remove('active');
});

/* Navegación con teclado */
document.addEventListener('keydown', e => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'ArrowRight') mostrar((idx + 1) % imgs.length);
    if (e.key === 'ArrowLeft')  mostrar((idx - 1 + imgs.length) % imgs.length);
    if (e.key === 'Escape')     lb.classList.remove('active');
});

/* Deslizar en móvil (swipe) */
let startX = 0;
lb.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
lb.addEventListener('touchend',   e => {
    const dx = startX - e.changedTouches[0].clientX;
    if (dx >  50) mostrar((idx + 1) % imgs.length);
    if (dx < -50) mostrar((idx - 1 + imgs.length) % imgs.length);
});