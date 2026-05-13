/* ═══════════════════════════════════════
   VILLA AGUACLARA — script.js
   Lightbox · Alojamientos · Calendario
   ═══════════════════════════════════════ */

const API = 'https://villa-aguaclara-1.onrender.com';
// El fetch a reservas se hace solo cuando se necesita, no aquí


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

/* ═══════════════════════════════════════════════════════
   ANIMACIONES DE SCROLL — VILLA AGUACLARA
   IntersectionObserver · Reveal · Stagger
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── 1. MARCAR ELEMENTOS PARA ANIMAR ── */
    function marcarElementos() {

        /* Section labels */
        document.querySelectorAll('.section-label').forEach(function (el) {
            el.classList.add('reveal');
        });

        /* Títulos de sección */
        document.querySelectorAll('.section-title').forEach(function (el) {
            el.classList.add('reveal');
            el.style.transitionDelay = '0.12s';
        });

        /* Cards de alojamiento — stagger */
        document.querySelectorAll('.card-aloj').forEach(function (el, i) {
            el.classList.add('reveal-scale', 'delay-' + (i + 1));
        });

        /* Tours — alternando izquierda / derecha */
        document.querySelectorAll('.tour-item').forEach(function (el, i) {
            var invertido = el.classList.contains('tour-item--invertido');
            el.classList.add(invertido ? 'reveal-right' : 'reveal-left');
        });

        /* Fotos de galería — stagger */
        document.querySelectorAll('#grid-galeria img').forEach(function (el, i) {
            el.classList.add('reveal-scale', 'delay-' + Math.min(i + 1, 6));
        });

        /* Sección contacto */
        var secContacto = document.querySelector('.section-contacto');
        if (secContacto) {
            secContacto.querySelectorAll('p, h2, .btn-wa').forEach(function (el, i) {
                el.classList.add('reveal');
                el.style.transitionDelay = (0.1 * (i + 1)) + 's';
            });
        }

        /* Sección ubicación */
        var secUbicacion = document.querySelector('.section-ubicacion');
        if (secUbicacion) {
            secUbicacion.querySelectorAll('iframe').forEach(function (el) {
                el.classList.add('reveal-scale');
                el.style.transitionDelay = '0.2s';
            });
        }

        /* Top bar */
        var topBar = document.querySelector('.top-bar');
        if (topBar) {
            topBar.style.opacity = '0';
            topBar.style.transform = 'translateY(-12px)';
            topBar.style.transition = 'opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s';
            requestAnimationFrame(function () {
                topBar.style.opacity = '1';
                topBar.style.transform = 'translateY(0)';
            });
        }
    }

    /* ── 2. INTERSECTION OBSERVER ── */
    function initObserver() {
        if (!('IntersectionObserver' in window)) {
            /* Fallback: mostrar todo de inmediato */
            document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
                .forEach(function (el) { el.classList.add('visible'); });
            return;
        }

        var opciones = {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        };

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); /* una sola vez */
                }
            });
        }, opciones);

        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
            .forEach(function (el) { observer.observe(el); });
    }

    /* ── 3. SMOOTH IMAGE LOADING ── */
    function initImageLoad() {
        document.querySelectorAll('img').forEach(function (img) {
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', function () {
                    img.classList.add('loaded');
                });
            }
        });
    }

    /* ── 4. PARALLAX SUAVE EN EL HERO ── */
    function initParallaxHero() {
        var hero = document.querySelector('.hero-galeria');
        if (!hero) return;

        var ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(function () {
                    var scrollY = window.pageYOffset;
                    var factor  = scrollY * 0.25;
                    hero.querySelectorAll('.hero-slide img').forEach(function (img) {
                        img.style.transform = 'translateY(' + factor + 'px) scale(1.04)';
                    });
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    /* ── 5. NAV — resaltar sección activa ── */
    function initNavActiva() {
        var enlaces = document.querySelectorAll('nav.main-nav a[href^="#"]');
        var secciones = [];

        enlaces.forEach(function (a) {
            var id  = a.getAttribute('href').substring(1);
            var sec = document.getElementById(id);
            if (sec) secciones.push({ el: sec, a: a });
        });

        var tickNav = false;
        window.addEventListener('scroll', function () {
            if (tickNav) return;
            tickNav = true;
            requestAnimationFrame(function () {
                var scrollMid = window.pageYOffset + window.innerHeight / 2;
                secciones.forEach(function (s) {
                    var top = s.el.offsetTop;
                    var bot = top + s.el.offsetHeight;
                    if (scrollMid >= top && scrollMid < bot) {
                        enlaces.forEach(function (a) { a.style.color = ''; });
                        s.a.style.color = '#fff';
                        s.a.style.fontWeight = '500';
                    } else {
                        s.a.style.fontWeight = '';
                    }
                });
                tickNav = false;
            });
        });
    }

    /* ── 6. NÚMERO ANIMADO AL ENTRAR EN VISTA ── */
    /* (preparado para futuras stats/métricas) */

    /* ── INIT ── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            marcarElementos();
            initObserver();
            initImageLoad();
            initParallaxHero();
            initNavActiva();
        });
    } else {
        marcarElementos();
        initObserver();
        initImageLoad();
        initParallaxHero();
        initNavActiva();
    }

})();