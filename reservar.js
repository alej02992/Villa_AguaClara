var PRECIO_NOCHE = 250000;
        var PRECIO_DECO  = 100000;
        var decoActiva   = false;

        /* ── IMÁGENES POR ALOJAMIENTO ── */
        var imagenes = {
            'Glamping Montaña': [
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
            'Cabañas Alpinas': [
                'Imagenes/cabañas.jpg',
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

        var wompiReferencia  = '';
        var wompiCentavos    = 0;
        var wompiPublicKey   = 'pub_test_YOUR_PUBLIC_KEY';

        function montarWompiEnPopup(totalCOP) {
            var params = {};
            try { params = JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('d') || '{}')); } catch(e) {}

            wompiCentavos   = totalCOP * 100;
            wompiReferencia = generarReferencia(params.aloj || '', params.ci || '', params.co || '');

            var container = document.getElementById('popup-wompi-container');
            if (!container) return;
            container.style.display = 'flex';
            container.innerHTML = '';

            var script = document.createElement('script');
            script.src = 'https://checkout.wompi.co/widget.js';
            script.setAttribute('data-render',           'button');
            script.setAttribute('data-public-key',       wompiPublicKey);
            script.setAttribute('data-currency',         'COP');
            script.setAttribute('data-amount-in-cents',  wompiCentavos);
            script.setAttribute('data-reference',        wompiReferencia);
            script.setAttribute('data-redirect-url',     location.origin + '/gracias.html');
            script.id = 'wompi-btn';
            container.appendChild(script);
        }

        /* ══ POPUP ══ */
        function abrirPopup() {
            document.getElementById('popup-overlay').classList.add('activo');
            document.body.style.overflow = 'hidden';
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

        function limpiarErrores() {
            ['nombre','correo','tel','personas'].forEach(function(campo) {
                document.getElementById('err-' + campo).textContent = '';
                var input = document.getElementById('p-' + campo);
                if (input) input.classList.remove('error-campo');
            });
        }

        function marcarError(campo, msg) {
            document.getElementById('err-' + campo).textContent = msg;
            var input = document.getElementById('p-' + campo);
            if (input) input.classList.add('error-campo');
        }

        function validarYPagar() {
            limpiarErrores();
            var nombre   = document.getElementById('p-nombre').value.trim();
            var correo   = document.getElementById('p-correo').value.trim();
            var tel      = document.getElementById('p-tel').value.trim();
            var personas = document.getElementById('p-personas').value;
            var ok = true;

            if (!nombre || nombre.length < 3) {
                marcarError('nombre', 'Por favor ingresa tu nombre completo.');
                ok = false;
            }
            var reCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!correo || !reCorreo.test(correo)) {
                marcarError('correo', 'Ingresa un correo electrónico válido.');
                ok = false;
            }
            if (!tel || tel.replace(/\D/g,'').length < 7) {
                marcarError('tel', 'Ingresa un número de teléfono válido.');
                ok = false;
            }
            if (!personas) {
                marcarError('personas', 'Selecciona el número de personas.');
                ok = false;
            }

            if (!ok) return;

            /* Guardar en backend y luego mostrar Wompi */
            var btn = document.getElementById('popup-btn-continuar');
            btn.disabled    = true;
            btn.textContent = 'Guardando…';

            var noches = parseInt(document.getElementById('res-noches-texto').dataset.noches || '0');
            var total  = noches * PRECIO_NOCHE + (decoActiva ? PRECIO_DECO : 0);

            var params = {};
            try { params = JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('d') || '{}')); } catch(e) {}

            var payload = {
                nombre:      nombre,
                correo:      correo,
                telefono:    tel,
                personas:    personas,
                nota:        document.getElementById('p-nota').value.trim(),
                alojamiento: params.aloj  || '',
                checkin:     params.ci    || '',
                checkout:    params.co    || '',
                noches:      noches,
                decoracion:  decoActiva,
                total:       total,
                referencia:  generarReferencia(params.aloj || '', params.ci || '', params.co || '')
            };

            fetch('/api/reservas', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            })
            .then(function(r) {
                if (!r.ok) throw new Error('Error del servidor');
                return r.json();
            })
            .then(function() {
                /* Éxito: ocultar botón y mostrar Wompi */
                btn.style.display = 'none';
                montarWompiEnPopup(total);
            })
            .catch(function() {
                /* Si el backend falla, igual permitir pagar (no bloquear al usuario) */
                btn.style.display = 'none';
                montarWompiEnPopup(total);
            });
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
        })();