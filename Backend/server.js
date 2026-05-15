require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const crypto  = require('crypto');
const pool    = require('./config/db');

const app = express();

// ── Seguridad ──────────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
    process.env.FRONTEND_URL,   // https://alej02992.github.io
    'http://localhost:5500',
    'http://127.0.0.1:5500',
].filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        // ✅ CORRECCIÓN: permitir requests sin origin (Render health checks,
        // Wompi webhook, curl, etc.) tanto en dev como en producción
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS bloqueado: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// El webhook de Wompi necesita el body crudo para verificar firma
app.use('/api/wompi/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── Saludo ──────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ ok: true, msg: 'Backend Villa AguaClara 🚀' }));

app.get('/ping', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({
            ok: true,
            msg: 'Backend activo'
        });
    } catch (err) {
        res.status(500).json({
            ok: false,
            error: err.message
        });
    }
});

// ── POST /api/reservas — crear reserva (estado: pendiente) ─────────────────

        app.post('/api/reservas', async (req, res) => {

            const {
                nombre,
                correo,
                telefono,
                alojamiento,
                checkin,
                checkout,
                noches,
                decoracion,
                total,
                referencia
            } = req.body;

            if (
                !nombre || !correo || !telefono ||
                !alojamiento || !checkin ||
                !checkout || !noches || !referencia
            ) {
                return res.status(400).json({
                    error: 'Faltan campos obligatorios'
                });
            }

            const deco       = decoracion ? true : false;
            const subtotal   = noches * 250000;
            const totalFinal = deco ? subtotal + 100000 : subtotal;

            try {

                // ── VALIDAR DISPONIBILIDAD ─────────────
                const existe = await pool.query(
                    `
                    SELECT id
                    FROM reservas
                    WHERE alojamiento = $1
                    AND estado_pago IN ('pendiente', 'pagada')
                    AND (
                        ($2 < fecha_salida)
                        AND
                        ($3 > fecha_entrada)
                    )
                    `,
                    [alojamiento, checkin, checkout]
                );

                if (existe.rows.length > 0) {

                    return res.status(409).json({
                        error: 'Las fechas ya no están disponibles'
                    });

                }

                // ── INSERTAR RESERVA ─────────────
                const r = await pool.query(
                    `
                    INSERT INTO reservas
                    (
                        nombre,correo,telefono,alojamiento,fecha_entrada,
                        fecha_salida,noches,decoracion,subtotal,total,referencia
                    )
                    VALUES
                    (
                        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
                    )
                    ON CONFLICT (referencia) DO NOTHING
                    RETURNING id, referencia
                    `,
                    [
                        nombre,correo,telefono,alojamiento,checkin,checkout,
                        noches,deco,subtotal,totalFinal,referencia
                    ]
                );

                res.status(201).json(
                    r.rows[0] || { msg: 'ya existía' }
                );

            } catch (err) {

                console.error('POST /api/reservas:', err.message);

                res.status(500).json({
                    error: 'Error interno'
                });

            }

        });

// ── GET /api/reservas — listar (solo uso interno / admin) ──────────────────

app.get('/api/reservas', async (_req, res) => {
    try {
        const r = await pool.query(
            'SELECT * FROM reservas ORDER BY fecha_entrada ASC'
        );
        res.json(r.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// ── GET /api/disponibilidad?alojamiento=X — fechas bloqueadas ─────────────

app.get('/api/disponibilidad', async (req, res) => {
    const { alojamiento } = req.query;
    if (!alojamiento) return res.status(400).json({ error: 'Falta alojamiento' });

    try {
        const r = await pool.query(
            `SELECT fecha_entrada, fecha_salida
             FROM reservas
             WHERE alojamiento = $1
               AND estado_pago IN ('pendiente','pagada')
               AND fecha_salida >= CURRENT_DATE`,
            [alojamiento]
        );
        res.json(r.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// ── PUT /api/reservas/:referencia — actualizar estado (solo pruebas/admin) ─
app.put('/api/reservas/:referencia', async (req, res) => {
    const { referencia } = req.params;
    const { estado_pago } = req.body;

    const estadosValidos = ['pendiente', 'pagada', 'cancelada'];
    if (!estadosValidos.includes(estado_pago)) {
        return res.status(400).json({ error: 'Estado inválido' });
    }

    try {
        const r = await pool.query(
            `UPDATE reservas SET estado_pago = $1 WHERE referencia = $2 RETURNING id, referencia, estado_pago`,
            [estado_pago, referencia]
        );
        if (r.rows.length === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
        res.json(r.rows[0]);
    } catch (err) {
        console.error('PUT /api/reservas:', err.message);
        res.status(500).json({ error: 'Error interno' });
    }
});

// ── POST /api/wompi/webhook — confirmar pago ───────────────────────────────
app.post('/api/wompi/webhook', (req, res) => {
    const signature = req.headers['x-event-checksum'];
    const secret    = process.env.WOMPI_EVENTS_SECRET;

    if (secret && signature) {
        const expected = crypto
            .createHmac('sha256', secret)
            .update(req.body)
            .digest('hex');
        if (signature !== expected) {
            return res.status(401).json({ error: 'Firma inválida' });
        }
    }

    let evento;
    try { evento = JSON.parse(req.body.toString()); }
    catch { return res.status(400).json({ error: 'JSON inválido' }); }

    const tx = evento?.data?.transaction;
    if (!tx) return res.sendStatus(200);

    const { reference, id: txId, status } = tx;
    const estadoMap = { APPROVED: 'pagada', DECLINED: 'cancelada', VOIDED: 'cancelada' };
    const nuevoEstado = estadoMap[status];

    if (nuevoEstado && reference) {
        pool.query(
            `UPDATE reservas
             SET estado_pago = $1, transaction_id = $2
             WHERE referencia = $3`,
            [nuevoEstado, txId, reference]
        ).catch(e => console.error('Webhook update:', e.message));
    }

    res.sendStatus(200);
});

// ── 404 / error global ─────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, _req, res, _next) => {
    console.error(err.message);
    res.status(500).json({ error: 'Error interno' });
});

// ── Job: liberar reservas pendientes expiradas ─────────────────────────────
var MINUTOS_EXPIRACION = 1;  // tiempo para completar el pago antes de liberar la reserva

async function limpiarReservasExpiradas() {
    try {
        var r = await pool.query(
            `UPDATE reservas
             SET estado_pago = 'cancelada'
             WHERE estado_pago = 'pendiente'
               AND creado_en < NOW() - INTERVAL '${MINUTOS_EXPIRACION} minutes'
             RETURNING id, referencia, creado_en`
        );
        if (r.rows.length > 0) {
            console.log(`🧹 ${r.rows.length} reserva(s) expirada(s) liberadas:`,
                r.rows.map(function(row) {
                    return 'ID ' + row.id + ' | Ref: ' + row.referencia;
                })
            );
        }
    } catch (err) {
        console.error('Error limpiando reservas expiradas:', err.message);
    }
}

// Ejecutar al iniciar y luego cada 5 minutos
limpiarReservasExpiradas();
setInterval(limpiarReservasExpiradas, 5 * 60 * 1000);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));