require('dotenv').config(); // Carga .env en desarrollo (no hace nada en Render, que inyecta las vars directamente)

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const pool    = require('./db');

const app = express();

// ── Seguridad ──────────────────────────────────────────────────────────────
app.use(helmet()); // Cabeceras HTTP seguras

// CORS: solo permite peticiones desde tu GitHub Pages (y localhost en desarrollo)
const allowedOrigins = [
    process.env.FRONTEND_URL,          // ej: https://alej02992.github.io
    'http://localhost:5500',            // Live Server de VS Code
    'http://127.0.0.1:5500',
].filter(Boolean); // Elimina undefined si FRONTEND_URL no está definida

app.use(cors({
    origin: (origin, callback) => {
        // Permitir herramientas sin origin (Postman, curl) solo en desarrollo
        if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS bloqueado para origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json()); // Parsea body JSON en POST/PUT

// ── Rutas ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ mensaje: 'Backend Villa AguaClara funcionando 🚀' });
});

// Ejemplo de ruta que consulta la base de datos
app.get('/reservas', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM reservas ORDER BY fecha_entrada ASC');
        res.json(resultado.rows);
    } catch (err) {
        console.error('Error en /reservas:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Crear reserva (ejemplo)
app.post('/reservas', async (req, res) => {
    const { nombre, fecha_entrada, fecha_salida, glamping_id } = req.body;

    if (!nombre || !fecha_entrada || !fecha_salida || !glamping_id) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        const resultado = await pool.query(
            `INSERT INTO reservas (nombre, fecha_entrada, fecha_salida, glamping_id)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [nombre, fecha_entrada, fecha_salida, glamping_id]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error('Error al crear reserva:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ── Manejo de rutas no encontradas ─────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Manejo global de errores ───────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Error no controlado:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Inicio del servidor ────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});