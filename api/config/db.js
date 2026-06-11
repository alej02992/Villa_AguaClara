const { Pool } = require('pg');

// Todas las credenciales vienen de variables de entorno (.env local / Vercel dashboard en producción)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user:     process.env.DATABASE_URL ? undefined : process.env.DB_USER,
    password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
    host:     process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
    port:     process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT, 10),
    database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Prueba de conexión al iniciar (útil para logs en serverless warmup)
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
    } else {
        console.log('✅ Conexión exitosa a PostgreSQL:', res.rows[0]?.now);
    }
});

module.exports = pool;
