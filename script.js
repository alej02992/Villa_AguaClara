/* ═══════════════════════════════════════
   VILLA AGUACLARA — script.js
   Lightbox · Alojamientos · Calendario
   ═══════════════════════════════════════ */

const API = 'https://villa-aguaclara-1.onrender.com';
// El fetch a reservas se hace solo cuando se necesita, no aquí

async function cargarReservas() {
    try {
        const res = await fetch(`${API}/api/reservas`);
        return await res.json();
    } catch(e) {
        console.error('Error cargando reservas:', e);
    }
}

// Llamamos a la función
cargarReservas();


document.addEventListener('DOMContentLoaded', function () {

    /* ── LIGHTBOX ── */
    const imgs       = document.querySelectorAll('#grid-galeria img');
    const lb         = document.getElementById('lightbox');
    const lbImg      = document.getElementById('lb-img');
    const lbContador = document.getElementById('lb-contador');
    let idx = 0;

    function mostrar(i) {
        idx = i;
        if (lbImg)      lbImg.src = imgs[idx].src;
        if (lbContador) lbContador.textContent = (idx + 1) + ' / ' + imgs.length;
    }

    imgs.forEach((img, i) => {
        img.addEventListener('click', () => {
            mostrar(i);
            if (lb) lb.classList.add('active');
        });
    });

    const btnCerrar = document.getElementById('lb-cerrar');
    const btnDer    = document.getElementById('lb-der');
    const btnIzq    = document.getElementById('lb-izq');

    if (btnCerrar) btnCerrar.addEventListener('click', () => lb.classList.remove('active'));
    if (btnDer)    btnDer.addEventListener('click',    () => mostrar((idx + 1) % imgs.length));
    if (btnIzq)    btnIzq.addEventListener('click',    () => mostrar((idx - 1 + imgs.length) % imgs.length));

    if (lb) {
        lb.addEventListener('click', e => {
            if (e.target === lb) lb.classList.remove('active');
        });
        let startX = 0;
        lb.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
        lb.addEventListener('touchend',   e => {
            const dx = startX - e.changedTouches[0].clientX;
            if (dx >  50) mostrar((idx + 1) % imgs.length);
            if (dx < -50) mostrar((idx - 1 + imgs.length) % imgs.length);
        });
    }

    document.addEventListener('keydown', e => {
        if (!lb || !lb.classList.contains('active')) return;
        if (e.key === 'ArrowRight') mostrar((idx + 1) % imgs.length);
        if (e.key === 'ArrowLeft')  mostrar((idx - 1 + imgs.length) % imgs.length);
        if (e.key === 'Escape')     lb.classList.remove('active');
    });

}); // fin DOMContentLoaded


/* ═══════════════════════════════════════
   PANELES DE ALOJAMIENTO
   ═══════════════════════════════════════ */
var detalleActivo = null;

function abrirAlojamiento(id) {
    if (detalleActivo && detalleActivo !== id) {
        cerrarAlojamiento(detalleActivo, false);
    }
    var panel = document.getElementById('detalle-' + id);
    var card  = document.querySelector('[data-id="' + id + '"]');
    if (!panel) return;

    if (panel.classList.contains('visible')) {
        cerrarAlojamiento(id);
        return;
    }

    panel.classList.add('visible');
    if (card) card.classList.add('activa');
    detalleActivo = id;

    setTimeout(function() {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
}

function cerrarAlojamiento(id, scroll) {
    if (scroll === undefined) scroll = true;
    var panel = document.getElementById('detalle-' + id);
    var card  = document.querySelector('[data-id="' + id + '"]');
    if (panel) panel.classList.remove('visible');
    if (card)  card.classList.remove('activa');
    if (detalleActivo === id) detalleActivo = null;

    if (scroll) {
        setTimeout(function() {
            var sec = document.getElementById('alojamientos');
            if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
    }
}

function cambiarFoto(idImg, thumb) {
    var principal = document.getElementById(idImg);
    if (!principal) return;
    principal.src = thumb.src;
    var thumbs = thumb.parentElement.querySelectorAll('img');
    thumbs.forEach(function(t) { t.classList.remove('thumb-activo'); });
    thumb.classList.add('thumb-activo');
}


/* ═══════════════════════════════════════
   CALENDARIO
   ═══════════════════════════════════════ */
var calAnio  = new Date().getFullYear();
var calMes   = new Date().getMonth();
var calInicio = null;
var calFin    = null;
var calAlojamiento = '';
var PRECIO_NOCHE   = 250000;

var meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatCOP(valor) {
    return '$' + valor.toLocaleString('es-CO');
}


function abrirCalendario(nombre) {
    calAlojamiento = nombre;
    calInicio = null;
    calFin    = null;
    calDecoActiva = false;
    calAnio   = new Date().getFullYear();
    calMes    = new Date().getMonth();

    var titulo    = document.getElementById('cal-titulo');
    var checkin   = document.getElementById('cal-checkin');
    var checkout  = document.getElementById('cal-checkout');
    var btnWa     = document.getElementById('cal-btn-wa');
    var precio    = document.getElementById('cal-precio');

    if (titulo)   titulo.textContent   = nombre;
    if (checkin)  checkin.textContent  = '—';
    if (checkout) checkout.textContent = '—';
    if (btnWa)  { btnWa.classList.remove('listo'); btnWa.href = '#'; }
    if (precio)   precio.classList.remove('visible');

    renderCalendario();

    var overlay = document.getElementById('cal-overlay');
    var modal   = document.getElementById('cal-modal');
    if (overlay) overlay.classList.add('visible');
    if (modal)   modal.classList.add('visible');
}

function cerrarCalendario() {
    var overlay = document.getElementById('cal-overlay');
    var modal   = document.getElementById('cal-modal');
    if (overlay) overlay.classList.remove('visible');
    if (modal)   modal.classList.remove('visible');
}

function renderCalendario() {
    var contenedor = document.getElementById('cal-meses');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    for (var offset = 0; offset < 2; offset++) {
        var m = calMes + offset;
        var a = calAnio;
        if (m > 11) { m -= 12; a++; }
        contenedor.appendChild(crearMes(a, m, offset));
    }
}

function crearMes(anio, mes, offset) {
    var nombresMes = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var diasSem    = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
    var hoy = new Date(); hoy.setHours(0,0,0,0);

    var div = document.createElement('div');
    div.className = 'cal-mes';

    div.innerHTML =
        '<div class="cal-mes__header">' +
            (offset === 0 ? '<button class="cal-mes__nav" onclick="navegarCal(-1)">&#8249;</button>' : '<span></span>') +
            '<span class="cal-mes__nombre">' + nombresMes[mes] + ' ' + anio + '</span>' +
            (offset === 1 ? '<button class="cal-mes__nav" onclick="navegarCal(1)">&#8250;</button>' : '<span></span>') +
        '</div>' +
        '<div class="cal-grid">' +
            diasSem.map(function(d) { return '<div class="cal-dia-nombre">' + d + '</div>'; }).join('') +
        '</div>';

    var grid = div.querySelector('.cal-grid');
    var primerDia = new Date(anio, mes, 1).getDay();
    var diasEnMes = new Date(anio, mes + 1, 0).getDate();

    for (var i = 0; i < primerDia; i++) {
        var vacio = document.createElement('div');
        vacio.className = 'cal-dia cal-dia--vacio';
        grid.appendChild(vacio);
    }

    for (var d = 1; d <= diasEnMes; d++) {
        (function(dia) {
            var fecha = new Date(anio, mes, dia);
            fecha.setHours(0,0,0,0);
            var celda = document.createElement('div');
            celda.className = 'cal-dia';
            celda.textContent = dia;

            var esHoy    = fecha.getTime() === hoy.getTime();
            var esPasado = fecha < hoy;

            if (esPasado) celda.classList.add('cal-dia--pasado');
            if (esHoy)    celda.classList.add('cal-dia--hoy');

            if (!esPasado) {
                celda.addEventListener('click', function() { seleccionarDia(fecha); });
            }

            if (calInicio && fecha.getTime() === calInicio.getTime()) celda.classList.add('cal-dia--checkin');
            if (calFin    && fecha.getTime() === calFin.getTime())    celda.classList.add('cal-dia--checkout');
            if (calInicio && calFin && fecha > calInicio && fecha < calFin) celda.classList.add('cal-dia--rango');

            grid.appendChild(celda);
        })(d);
    }

    return div;
}

function navegarCal(dir) {
    calMes += dir;
    if (calMes < 0)  { calMes = 11; calAnio--; }
    if (calMes > 11) { calMes = 0;  calAnio++; }
    renderCalendario();
}

function actualizarPrecio() {
    if (!calInicio || !calFin) return;

    var noches   = Math.round((calFin - calInicio) / (1000 * 60 * 60 * 24));
    var subtotal = noches * PRECIO_NOCHE;
    var total    = subtotal;

    var detalleEl  = document.getElementById('cal-precio-detalle');
    var subtotalEl = document.getElementById('cal-precio-subtotal');
    var totalEl    = document.getElementById('cal-total');
    var precioEl   = document.getElementById('cal-precio');

    if (detalleEl)  detalleEl.textContent  = noches + ' noche' + (noches > 1 ? 's' : '') + ' × ' + formatCOP(PRECIO_NOCHE);
    if (subtotalEl) subtotalEl.textContent = formatCOP(subtotal);
    if (totalEl)    totalEl.textContent    = formatCOP(total);
    if (precioEl)   precioEl.classList.add('visible');
}

function seleccionarDia(fecha) {
    if (!calInicio || (calInicio && calFin)) {
        calInicio = fecha;
        calFin    = null;
        var precioEl  = document.getElementById('cal-precio');
        if (precioEl)   precioEl.classList.remove('visible');
    } else {
        if (fecha <= calInicio) { calInicio = fecha; calFin = null; }
        else                    { calFin = fecha; }
    }

    var checkin  = document.getElementById('cal-checkin');
    var checkout = document.getElementById('cal-checkout');
    if (checkin)  checkin.textContent  = calInicio ? (calInicio.getDate() + ' ' + meses[calInicio.getMonth()] + ' ' + calInicio.getFullYear()) : '—';
    if (checkout) checkout.textContent = calFin    ? (calFin.getDate()    + ' ' + meses[calFin.getMonth()]    + ' ' + calFin.getFullYear())    : '—';

    var noches = (calInicio && calFin) ? Math.round((calFin - calInicio) / (1000 * 60 * 60 * 24)) : 0;

    var btnWa = document.getElementById('cal-btn-wa');
    if (btnWa) {
        if (calInicio && calFin) {
            actualizarPrecio();
            var ciStr = calInicio.getDate() + ' ' + meses[calInicio.getMonth()] + ' ' + calInicio.getFullYear();
            var coStr = calFin.getDate()    + ' ' + meses[calFin.getMonth()]    + ' ' + calFin.getFullYear();
            var data  = encodeURIComponent(JSON.stringify({
                aloj: calAlojamiento,
                ci:   ciStr,
                co:   coStr,
                n:    noches
            }));
            btnWa.href = 'reservar.html?d=' + data;
            btnWa.classList.add('listo');
        } else {
            btnWa.href = '#';
            btnWa.classList.remove('listo');
        }
    }
    renderCalendario();
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') cerrarCalendario();
});