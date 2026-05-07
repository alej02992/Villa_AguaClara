var PRECIO_NOCHE = 250000;
        var PRECIO_DECO  = 100000;
        var decoActiva   = false;

        /* ── IMÁGENES POR ALOJAMIENTO ── */
        var imagenes = {
            'Glamping Montaña': [
                'Imagenes/glamping1.jpg',
                'Imagenes/Portada_2.jpg',
                'Imagenes/foto1.jpg',
                'Imagenes/foto2.jpg',
                'Imagenes/foto3.jpg'
            ],
            'Glamping Bosque': [
                'Imagenes/glamping2.jpg',
                'Imagenes/Portada_3.jpeg',
                'Imagenes/foto4.jpg',
                'Imagenes/foto5.jpeg',
                'Imagenes/foto1.jpg'
            ],
            'Cabañas Alpinas': [
                'Imagenes/Cabañas.jpg',
                'Imagenes/Portada_2.jpg',
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
            var toggle   = document.getElementById('deco-toggle');
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
            actualizarWompi(total);
        }

        /* ══ WOMPI ══ */
        function generarReferencia(aloj, ci, co) {
            var str = (aloj + ci + co + Date.now()).replace(/\s/g, '');
            var hash = 0;
            for (var i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
            }
            return 'AGUACLARA-' + Math.abs(hash).toString(36).toUpperCase();
        }

        function actualizarWompi(totalCOP) {
            var btn = document.getElementById('wompi-btn');
            if (!btn) return;

            var params = {};
            try { params = JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('d') || '{}')); } catch(e) {}

            var centavos   = totalCOP * 100;
            var referencia = generarReferencia(params.aloj || '', params.ci || '', params.co || '');

            btn.setAttribute('data-amount-in-cents', centavos);
            btn.setAttribute('data-reference', referencia);
            btn.setAttribute('data-redirect-url', location.origin + '/gracias.html');

            /* Forzar re-render del widget Wompi si ya fue montado */
            if (window.WidgetCheckout) {
                var container = document.getElementById('wompi-container');
                if (container) {
                    container.innerHTML = '';
                    var newBtn = document.createElement('script');
                    newBtn.src = 'https://checkout.wompi.co/widget.js';
                    newBtn.setAttribute('data-render', 'button');
                    newBtn.setAttribute('data-public-key', btn.getAttribute('data-public-key'));
                    newBtn.setAttribute('data-currency', 'COP');
                    newBtn.setAttribute('data-amount-in-cents', centavos);
                    newBtn.setAttribute('data-reference', referencia);
                    newBtn.setAttribute('data-redirect-url', location.origin + '/gracias.html');
                    newBtn.id = 'wompi-btn';
                    container.appendChild(newBtn);
                }
            }
        }

        /* ══ INICIALIZACIÓN ══ */
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
                nochesEl.textContent = noches + ' noche' + (noches !== 1 ? 's' : '') + ' en total';
                nochesEl.dataset.noches = noches;
            }

            var linNochesEl   = document.getElementById('res-linea-noches');
            var linSubtotalEl = document.getElementById('res-linea-subtotal');
            if (linNochesEl)   linNochesEl.textContent   = noches + ' noche' + (noches !== 1 ? 's' : '') + ' × $250.000';
            if (linSubtotalEl) linSubtotalEl.textContent = formatCOP(subtotal);

            var totalEl = document.getElementById('res-total');
            if (totalEl) totalEl.textContent = formatCOP(subtotal);

            /* Inicializar Wompi con el total base */
            actualizarWompi(subtotal);
        })(); 