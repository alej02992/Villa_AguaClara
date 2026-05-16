const { Pool } = require('pg');

// Todas las credenciales vienen de variables de entorno (.env local / Render dashboard en producción)
const pool = new Pool({
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Prueba de conexión al iniciar
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
    } else {
        console.log('✅ Conexión exitosa a Aiven PostgreSQL:', res.rows[0].now);
    }
});

module.exports = pool;