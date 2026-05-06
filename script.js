/* ═══════════════════════════════════════
   VILLA AGUACLARA — script.js
   Lightbox · Alojamientos · Calendario
   ═══════════════════════════════════════ */

/* ── LIGHTBOX ── */
const imgs       = document.querySelectorAll('#grid-galeria img');
const lb         = document.getElementById('lightbox');
const lbImg      = document.getElementById('lb-img');
const lbContador = document.getElementById('lb-contador');
let idx = 0;

function mostrar(i) {
    idx = i;
    lbImg.src = imgs[idx].src;
    lbContador.textContent = (idx + 1) + ' / ' + imgs.length;
}

imgs.forEach((img, i) => {
    img.addEventListener('click', () => { mostrar(i); lb.classList.add('active'); });
});

document.getElementById('lb-cerrar').addEventListener('click', () => lb.classList.remove('active'));
document.getElementById('lb-der').addEventListener('click',    () => mostrar((idx + 1) % imgs.length));
document.getElementById('lb-izq').addEventListener('click',    () => mostrar((idx - 1 + imgs.length) % imgs.length));

lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('active'); });

document.addEventListener('keydown', e => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'ArrowRight') mostrar((idx + 1) % imgs.length);
    if (e.key === 'ArrowLeft')  mostrar((idx - 1 + imgs.length) % imgs.length);
    if (e.key === 'Escape')     lb.classList.remove('active');
});

let startX = 0;
lb.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
lb.addEventListener('touchend',   e => {
    const dx = startX - e.changedTouches[0].clientX;
    if (dx >  50) mostrar((idx + 1) % imgs.length);
    if (dx < -50) mostrar((idx - 1 + imgs.length) % imgs.length);
});

/* ── PANELES DE ALOJAMIENTO ── */
let detalleActivo = null;

function abrirAlojamiento(id) {
    // Cerrar el anterior si hay uno abierto
    if (detalleActivo && detalleActivo !== id) {
        cerrarAlojamiento(detalleActivo, false);
    }

    const panel = document.getElementById('detalle-' + id);
    const card  = document.querySelector('[data-id="' + id + '"]');

    if (!panel) return;

    // Toggle: si ya está abierto, lo cierra
    if (panel.classList.contains('visible')) {
        cerrarAlojamiento(id);
        return;
    }

    panel.classList.add('visible');
    if (card) card.classList.add('activa');
    detalleActivo = id;

    // Scroll suave al panel
    setTimeout(() => {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
}

function cerrarAlojamiento(id, scroll = true) {
    const panel = document.getElementById('detalle-' + id);
    const card  = document.querySelector('[data-id="' + id + '"]');
    if (panel) panel.classList.remove('visible');
    if (card)  card.classList.remove('activa');
    if (detalleActivo === id) detalleActivo = null;

    if (scroll) {
        setTimeout(() => {
            document.getElementById('alojamientos').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
    }
}

/* Cambiar foto principal en el panel */
function cambiarFoto(idImg, thumb) {
    const principal = document.getElementById(idImg);
    if (!principal) return;
    principal.src = thumb.src;
    // Actualizar thumb activo
    const thumbs = thumb.parentElement.querySelectorAll('img');
    thumbs.forEach(t => t.classList.remove('thumb-activo'));
    thumb.classList.add('thumb-activo');
}

/* ── CALENDARIO ── */
let calAnio  = new Date().getFullYear();
let calMes   = new Date().getMonth();   // mes izquierdo
let calInicio = null;
let calFin    = null;
let calAlojamiento = '';

function abrirCalendario(nombre) {
    calAlojamiento = nombre;
    calInicio = null;
    calFin    = null;
    calAnio   = new Date().getFullYear();
    calMes    = new Date().getMonth();

    document.getElementById('cal-titulo').textContent = nombre;
    document.getElementById('cal-checkin').textContent  = '—';
    document.getElementById('cal-checkout').textContent = '—';

    const btnWa = document.getElementById('cal-btn-wa');
    btnWa.classList.remove('listo');
    btnWa.href = '#';

    renderCalendario();

    document.getElementById('cal-overlay').classList.add('visible');
    document.getElementById('cal-modal').classList.add('visible');
}

function cerrarCalendario() {
    document.getElementById('cal-overlay').classList.remove('visible');
    document.getElementById('cal-modal').classList.remove('visible');
}

function renderCalendario() {
    const contenedor = document.getElementById('cal-meses');
    contenedor.innerHTML = '';

    // Renderizar dos meses consecutivos
    for (let offset = 0; offset < 2; offset++) {
        let m = calMes + offset;
        let a = calAnio;
        if (m > 11) { m -= 12; a++; }
        contenedor.appendChild(crearMes(a, m, offset));
    }
}

function crearMes(anio, mes, offset) {
    const nombres  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const diasSem  = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
    const hoy      = new Date(); hoy.setHours(0,0,0,0);

    const div = document.createElement('div');
    div.className = 'cal-mes';

    // Header con navegación solo en el mes izquierdo
    div.innerHTML = `
        <div class="cal-mes__header">
            ${offset === 0 ? `<button class="cal-mes__nav" onclick="navegarCal(-1)">&#8249;</button>` : `<span></span>`}
            <span class="cal-mes__nombre">${nombres[mes]} ${anio}</span>
            ${offset === 1 ? `<button class="cal-mes__nav" onclick="navegarCal(1)">&#8250;</button>` : `<span></span>`}
        </div>
        <div class="cal-grid">
            ${diasSem.map(d => `<div class="cal-dia-nombre">${d}</div>`).join('')}
        </div>`;

    const grid = div.querySelector('.cal-grid');
    const primerDia = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();

    // Espacios vacíos antes del primer día
    for (let i = 0; i < primerDia; i++) {
        const vacio = document.createElement('div');
        vacio.className = 'cal-dia cal-dia--vacio';
        grid.appendChild(vacio);
    }

    for (let d = 1; d <= diasEnMes; d++) {
        const fecha = new Date(anio, mes, d);
        fecha.setHours(0,0,0,0);
        const celda = document.createElement('div');
        celda.className = 'cal-dia';
        celda.textContent = d;

        const esHoy    = fecha.getTime() === hoy.getTime();
        const esPasado = fecha < hoy;

        if (esPasado)  celda.classList.add('cal-dia--pasado');
        if (esHoy)     celda.classList.add('cal-dia--hoy');

        if (!esPasado) {
            celda.addEventListener('click', () => seleccionarDia(fecha));
        }

        // Coloreado de rango
        if (calInicio && fecha.getTime() === calInicio.getTime()) celda.classList.add('cal-dia--checkin');
        if (calFin    && fecha.getTime() === calFin.getTime())    celda.classList.add('cal-dia--checkout');
        if (calInicio && calFin && fecha > calInicio && fecha < calFin) celda.classList.add('cal-dia--rango');

        grid.appendChild(celda);
    }

    return div;
}

function navegarCal(dir) {
    calMes += dir;
    if (calMes < 0)  { calMes = 11; calAnio--; }
    if (calMes > 11) { calMes = 0;  calAnio++; }
    renderCalendario();
}

function seleccionarDia(fecha) {
    if (!calInicio || (calInicio && calFin)) {
        // Primera selección o reset
        calInicio = fecha;
        calFin = null;
    } else {
        // Segunda selección
        if (fecha <= calInicio) {
            calInicio = fecha;
            calFin = null;
        } else {
            calFin = fecha;
        }
    }

    // Actualizar display
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    document.getElementById('cal-checkin').textContent =
        calInicio ? `${calInicio.getDate()} ${meses[calInicio.getMonth()]} ${calInicio.getFullYear()}` : '—';
    document.getElementById('cal-checkout').textContent =
        calFin ? `${calFin.getDate()} ${meses[calFin.getMonth()]} ${calFin.getFullYear()}` : '—';

    // Activar botón WhatsApp si hay rango completo
    const btnWa = document.getElementById('cal-btn-wa');
    if (calInicio && calFin) {
        const texto = encodeURIComponent(
            `Hola, quiero reservar *${calAlojamiento}* en Villa AguaClara.\n` +
            `📅 Check-in: ${calInicio.toLocaleDateString('es-CO')}\n` +
            `📅 Check-out: ${calFin.toLocaleDateString('es-CO')}`
        );
        btnWa.href = `https://wa.me/573102879726?text=${texto}`;
        btnWa.classList.add('listo');
    } else {
        btnWa.href = '#';
        btnWa.classList.remove('listo');
    }

    renderCalendario();
}

// Cerrar calendario con Escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarCalendario();
});