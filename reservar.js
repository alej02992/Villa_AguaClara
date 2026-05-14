/* ══════════════════════════════════════════════════════
   reservar.js  —  Villa AguaClara
   Integración completa con Wompi Checkout Widget
   ══════════════════════════════════════════════════════ */

var PRECIO_NOCHE = 250000;
var PRECIO_DECO  = 100000;
var decoActiva   = false;

/* ── IMPORTANTE: reemplaza con tu llave pública real de Wompi ──
   Pruebas:     pub_test_XXXXXXXXXXXXXXXX
   Producción:  pub_prod_EDGKnGR5aiuG1n3XmYesXEVjNZeZEe6g
   La encuentras en: https://dashboard.wompi.co → Desarrolladores → Llaves de API
   ─────────────────────────────────────────────────────────────── */
var WOMPI_PUBLIC_KEY = 'pub_prod_EDGKnGR5aiuG1n3XmYesXEVjNZeZEe6g';

/* URL del backend en Render */
var BACKEND_URL = 'https://villa-aguaclara.onrender.com';

/* ── IMÁGENES POR ALOJAMIENTO ── */
var imagenes = {
    'Glamping Montana': [
        'Imagenes/glamping1.jpg',
        'Imagenes/portada_2.jpg',
        'Imagenes/foto1.jpg',
        'Imagenes/foto2.jpg',
        'Imagenes/foto3.jpg'
    ],
    'Glamping Bosque': [
        'Imagenes/glamping2.jpg',
        'Imagenes/portada_3.jpeg',
        'Imagenes/foto4.jpg',
        'Imagenes/foto5.jpeg',
        'Imagenes/foto1.jpg'
    ],
    'Cabanas Alpinas': [
        'Imagenes/cabanas.jpg',
        'Imagenes/portada_2.jpg',
        'Imagenes/foto2.jpg',
        'Imagenes/foto3.jpg',
        'Imagenes/foto5.jpeg'
    ]
};

/* ══ CARRUSEL ══ */
var carIdx    = 0;
var carFotos  = [];
var carTimer  = null;
var carManual = false;

function initCarrusel(fotos) {
    carFotos = fotos;
    carIdx   = 0;
    var track = document.getElementById('res-carrusel-track');
    var dots  = document.getElementById('car-dots');
    if (!track || !dots) return;

    track.innerHTML = '';
    dots.innerHTML  = '';

    fotos.forEach(function(src, i) {
        var slide = document.createElement('div');
        slide.className = 'res-carrusel__slide';
        var img = document.createElement('img');
        img.src = src;
        img.alt = 'Foto ' + (i + 1);
        slide.appendChild(img);
        track.appendChild(slide);

        var dot = document.createElement('button');
        dot.className = 'res-carrusel__dot' + (i === 0 ? ' activo' : '');
        dot.setAttribute('aria-label', 'Foto ' + (i + 1));
        (function(idx) {
            dot.addEventListener('click', function() { irA(idx, true); });
        })(i);
        dots.appendChild(dot);
    });

    moverA(0);
    iniciarAuto();

    var btnIzq = document.getElementById('car-izq');
    var btnDer = document.getElementById('car-der');
    if (btnIzq) btnIzq.onclick = function() { irA(carIdx - 1, true); };
    if (btnDer) btnDer.onclick = function() { irA(carIdx + 1, true); };

    var startX = 0;
    var carEl  = document.getElementById('res-carrusel');
    if (carEl) {
        carEl.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, { passive: true });
        carEl.addEventListener('touchend', function(e) {
            var dx = startX - e.changedTouches[0].clientX;
            if (dx >  40) irA(carIdx + 1, true);
            if (dx < -40) irA(carIdx - 1, true);
        });
    }
}

function moverA(i) {
    var track = document.getElementById('res-carrusel-track');
    if (track) track.style.transform = 'translateX(-' + (i * 100) + '%)';
    document.querySelectorAll('.res-carrusel__dot').forEach(function(d, j) {
        d.classList.toggle('activo', j === i);
    });
    carIdx = i;
}

function irA(i, manual) {
    var total = carFotos.length;
    if (total === 0) return;
    i = ((i % total) + total) % total;
    moverA(i);
    if (manual) { carManual = true; reiniciarAuto(); }
}

function iniciarAuto() {
    if (carTimer) clearInterval(carTimer);
    carTimer = setInterval(function() {
        if (!carManual) irA(carIdx + 1, false);
    }, 5000);
}

function reiniciarAuto() {
    clearInterval(carTimer);
    carTimer = setInterval(function() {
        carManual = false;
        irA(carIdx + 1, false);
    }, 8000);
}

document.addEventListener('keydown', function(e) {
    if (carFotos.length === 0) return;
    if (e.key === 'ArrowRight') irA(carIdx + 1, true);
    if (e.key === 'ArrowLeft')  irA(carIdx - 1, true);
});

/* ══ DECORACIÓN ══ */
function formatCOP(v) {
    return '$' + v.toLocaleString('es-CO');
}

function toggleDeco() {
    decoActiva = !decoActiva;
    var toggle    = document.getElementById('deco-toggle');
    var lineaDeco = document.getElementById('res-linea-deco');
    if (decoActiva) {
        toggle.classList.add('activo');
        if (lineaDeco) lineaDeco.classList.add('visible');
    } else {
        toggle.classList.remove('activo');
        if (lineaDeco) lineaDeco.classList.remove('visible');
    }
    actualizarTotal();
}

function actualizarTotal() {
    var noches   = parseInt(document.getElementById('res-noches-texto').dataset.noches || '0');
    var subtotal = noches * PRECIO_NOCHE;
    var total    = subtotal + (decoActiva ? PRECIO_DECO : 0);
    document.getElementById('res-total').textContent = formatCOP(total);
}

/* ══ WOMPI ══════════════════════════════════════════════════════════════════

   FLUJO COMPLETO:
   1. Usuario llena formulario → se valida en tiempo real
   2. Al ser válido → se guarda reserva en backend (estado: pendiente)
                   → se habilita el botón de pago Wompi
   3. Usuario hace clic en botón Wompi → abre checkout de Wompi
   4. Wompi redirige a ?redirect_url con parámetros de resultado
   5. Wompi envía webhook al backend → actualiza estado a 'pagada'/'cancelada'
   6. La página de confirmación lee los parámetros de la URL y muestra resultado

   ══════════════════════════════════════════════════════════════════════════ */

function generarReferencia(aloj, ci, co) {
    /* Referencia única para esta transacción — Wompi la exige */
    var str  = (aloj + ci + co + Date.now()).replace(/\s/g, '');
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return 'AGUACLARA-' + Math.abs(hash).toString(36).toUpperCase();
}

var wompiReferencia   = '';
var wompiCentavos     = 0;
var wompiMontado      = false;
var guardadoEnBackend = false;

/* ── Overlay que bloquea el botón Wompi mientras los datos no son válidos ── */
function actualizarOverlayWompi(habilitado) {
    var overlay = document.getElementById('wompi-overlay');
    if (!overlay) return;
    if (habilitado) {
        overlay.classList.add('habilitado');   /* habilitado → oculta el overlay */
    } else {
        overlay.classList.remove('habilitado');
    }
}

/* ── Monta el widget de Wompi dentro del popup ───────────────────────────── */
function montarWompiEnPopup(totalCOP) {
    if (wompiMontado) return;
    wompiMontado = true;

    var params = {};
    try {
        params = JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('d') || '{}'));
    } catch(e) {}

    wompiCentavos   = totalCOP * 100;           /* Wompi trabaja en centavos */
    wompiReferencia = generarReferencia(params.aloj || '', params.ci || '', params.co || '');

    var container = document.getElementById('popup-wompi-container');
    if (!container) return;

    /* Wrapper con position:relative para poder poner el overlay encima */
    container.style.position = 'relative';

    /* ── Botón oficial de Wompi (script externo lo convierte en checkout) ── */
    var script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';

    /* Atributos requeridos por Wompi */
    script.setAttribute('data-render',           'button');
    script.setAttribute('data-public-key',        WOMPI_PUBLIC_KEY);
    script.setAttribute('data-currency',          'COP');
    script.setAttribute('data-amount-in-cents',   String(wompiCentavos));
    script.setAttribute('data-reference',         wompiReferencia);

    /*
     * redirect-url: adonde Wompi lleva al usuario después del pago.
     * Wompi agrega automáticamente estos query params:
     *   ?id=<transaction_id>&status=APPROVED|DECLINED|VOIDED&reference=<ref>
     *
     * CAMBIA esta URL por la de tu página de confirmación real.
     * Para GitHub Pages sería: https://alej02992.github.io/Villa_AguaClara/confirmacion.html
     */
    script.setAttribute('data-redirect-url',
        'https://alej02992.github.io/Villa_AguaClara/confirmacion.html'
    );

    /*
     * customer-data: pre-llena los datos del cliente en el checkout de Wompi.
     * Se obtiene del formulario una vez que sea válido (cuando se monta,
     * el formulario ya fue validado).
     */
    var nombre = document.getElementById('p-nombre') ? document.getElementById('p-nombre').value.trim() : '';
    var correo = document.getElementById('p-correo') ? document.getElementById('p-correo').value.trim() : '';
    var tel    = document.getElementById('p-tel')    ? document.getElementById('p-tel').value.trim()    : '';

    if (correo) script.setAttribute('data-customer-data:email',       correo);
    if (nombre) script.setAttribute('data-customer-data:full-name',   nombre);
    if (tel)    script.setAttribute('data-customer-data:phone-number', tel.replace(/\D/g, ''));

    container.appendChild(script);

    script.addEventListener('load', function() {
    setTimeout(function() {
        var modal   = document.querySelector('.popup-modal');
        var wompiEl = document.getElementById('popup-wompi-container');
        if (modal && wompiEl) {
            modal.scrollTo({ top: wompiEl.offsetTop - 20, behavior: 'smooth' });
            }
        }, 300);
    });

    /* ── Overlay bloqueador (semitransparente, encima del botón) ── */
    var overlay = document.createElement('div');
    overlay.id  = 'wompi-overlay';
    overlay.style.cssText = [
        'position:absolute',
        'inset:0',
        'background:rgba(255,255,255,0.60)',
        'cursor:not-allowed',
        'align-items:center',
        'justify-content:center',
        'font-family:Jost,sans-serif',
        'font-size:13px',
        'color:#888',
        'letter-spacing:.04em',
        'z-index:10',
        'display:flex'
    ].join(';');
    overlay.textContent = 'Completa tus datos para continuar';
    container.appendChild(overlay);
}

/* ══ POPUP ══════════════════════════════════════════════════════════════════ */
function abrirPopup() {
    document.getElementById('popup-overlay').classList.add('activo');
    document.body.style.overflow = 'hidden';

    /* Montar Wompi (deshabilitado) la primera vez que se abre el popup */
    var noches = parseInt(document.getElementById('res-noches-texto').dataset.noches || '0');
    var total  = noches * PRECIO_NOCHE + (decoActiva ? PRECIO_DECO : 0);
    montarWompiEnPopup(total);

    setTimeout(function() {
        var primer = document.getElementById('p-nombre');
        if (primer) primer.focus();
    }, 320);
}

function cerrarPopup() {
    document.getElementById('popup-overlay').classList.remove('activo');
    document.body.style.overflow = '';
}

function cerrarPopupOverlay(e) {
    if (e.target === document.getElementById('popup-overlay')) cerrarPopup();
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') cerrarPopup();
});

/* ══ VALIDACIÓN ══════════════════════════════════════════════════════════════ */
function limpiarErrores() {
    ['nombre','correo','tel'].forEach(function(campo) {
        var errEl   = document.getElementById('err-' + campo);
        var inputEl = document.getElementById('p-' + campo);
        if (errEl)   errEl.textContent = '';
        if (inputEl) inputEl.classList.remove('error-campo');
    });
}

function marcarError(campo, msg) {
    var errEl   = document.getElementById('err-' + campo);
    var inputEl = document.getElementById('p-' + campo);
    if (errEl)   errEl.textContent = msg;
    if (inputEl) inputEl.classList.add('error-campo');
}

/* Devuelve true si el formulario es válido */
function formularioValido() {
    var nombre   = document.getElementById('p-nombre').value.trim();
    var correo   = document.getElementById('p-correo').value.trim();
    var tel      = document.getElementById('p-tel').value.trim();
    var reCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return nombre.length >= 3 && reCorreo.test(correo) && tel.replace(/\D/g,'').length >= 7;
}

/* Guarda en backend (una sola vez) y habilita el botón Wompi */
function habilitarPago() {
    actualizarOverlayWompi(true);

    if (guardadoEnBackend) return;   /* evitar doble llamada */
    guardadoEnBackend = true;

    var nombre  = document.getElementById('p-nombre').value.trim();
    var correo  = document.getElementById('p-correo').value.trim();
    var tel     = document.getElementById('p-tel').value.trim();
    var noches  = parseInt(document.getElementById('res-noches-texto').dataset.noches || '0');
    var total   = noches * PRECIO_NOCHE + (decoActiva ? PRECIO_DECO : 0);

    var params = {};
    try {
        params = JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('d') || '{}'));
    } catch(e) {}

    var payload = {
        nombre:      nombre,
        correo:      correo,
        telefono:    tel,
        alojamiento: params.aloj || '',
        checkin:     params.ci   || '',
        checkout:    params.co   || '',
        noches:      noches,
        decoracion:  decoActiva,
        total:       total,
        referencia:  wompiReferencia
    };

    fetch(BACKEND_URL + '/api/reservas', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
    })
    .then(function(res) {
        if (!res.ok) {
            return res.json().then(function(data) {
                /* 409 = fechas ya ocupadas — caso más común */
                if (res.status === 409) {
                    alert('⚠️ Lo sentimos, esas fechas ya no están disponibles.\nPor favor regresa y elige otras fechas.');
                    window.location.href = 'index.html';
                }
            });
        }
    })
    .catch(function() {
        /* Silencioso: el pago puede continuar aunque el backend falle.
           El webhook de Wompi actualizará el estado cuando el pago se procese. */
    });
}

/* Validación en tiempo real campo por campo */
function validarCampo(campo) {
    var valor    = document.getElementById('p-' + campo).value.trim();
    var reCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var errEl    = document.getElementById('err-' + campo);
    var inputEl  = document.getElementById('p-' + campo);

    var msg = '';
    if (campo === 'nombre' && valor.length < 3)
        msg = 'Por favor ingresa tu nombre completo.';
    if (campo === 'correo' && !reCorreo.test(valor))
        msg = 'Ingresa un correo electrónico válido.';
    if (campo === 'tel' && valor.replace(/\D/g,'').length < 7)
        msg = 'Ingresa un número de teléfono válido.';

    if (errEl)   errEl.textContent = msg;
    if (inputEl) inputEl.classList.toggle('error-campo', !!msg);
}

function validarEnTiempoReal(campoId) {
    var input = document.getElementById(campoId);
    if (input && input.dataset.tocado) {
        var campo = campoId.replace('p-', '');
        validarCampo(campo);
    }
    if (formularioValido()) {
        habilitarPago();
    } else {
        /* El usuario volvió a editar → resetear para re-guardar si llega a ser válido */
        guardadoEnBackend = false;
        actualizarOverlayWompi(false);
    }
}

/* Adjuntar listeners al DOM listo */
document.addEventListener('DOMContentLoaded', function() {
    ['nombre','correo','tel'].forEach(function(campo) {
        var input = document.getElementById('p-' + campo);
        if (!input) return;

        input.addEventListener('blur', function() {
            input.dataset.tocado = '1';
            validarCampo(campo);
            if (formularioValido()) habilitarPago();
            else { guardadoEnBackend = false; actualizarOverlayWompi(false); }
        });

        input.addEventListener('input', function() {
            validarEnTiempoReal('p-' + campo);
        });
    });
});

/* ══ INICIALIZACIÓN ══════════════════════════════════════════════════════════ */
(function init() {
    var params = {};
    try {
        params = JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('d') || '{}'));
    } catch(e) {}

    var aloj    = params.aloj || 'Tu alojamiento';
    var ci      = params.ci   || '—';
    var co      = params.co   || '—';
    var noches  = parseInt(params.n || '0');
    var subtotal = noches * PRECIO_NOCHE;

    var tituloEl = document.getElementById('res-titulo-aloj');
    var nombreEl = document.getElementById('res-nombre-aloj');
    if (tituloEl) tituloEl.textContent = aloj;
    if (nombreEl) nombreEl.textContent = aloj;

    if (imagenes[aloj]) initCarrusel(imagenes[aloj]);
    else initCarrusel(['Imagenes/glamping1.jpg']);

    var ciEl = document.getElementById('res-checkin');
    var coEl = document.getElementById('res-checkout');
    if (ciEl) ciEl.textContent = ci;
    if (coEl) coEl.textContent = co;

    var nochesEl = document.getElementById('res-noches-texto');
    if (nochesEl) {
        nochesEl.textContent    = noches + ' noche' + (noches !== 1 ? 's' : '') + ' en total';
        nochesEl.dataset.noches = noches;
    }

    var linNochesEl   = document.getElementById('res-linea-noches');
    var linSubtotalEl = document.getElementById('res-linea-subtotal');
    if (linNochesEl)   linNochesEl.textContent   = noches + ' noche' + (noches !== 1 ? 's' : '') + ' × $250.000';
    if (linSubtotalEl) linSubtotalEl.textContent = formatCOP(subtotal);

    var totalEl = document.getElementById('res-total');
    if (totalEl) totalEl.textContent = formatCOP(subtotal);
})();

/* ══ FIX: cerrar popup cuando Wompi abre su checkout ══
   El widget dispara un click en su botón interno → detectamos
   ese momento y cerramos nuestro modal para que el iframe
   de Wompi tenga z-index libre y se vea completo.          */
