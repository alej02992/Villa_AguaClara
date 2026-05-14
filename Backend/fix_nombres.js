require('dotenv').config({ path: './claves.env' });
const { Pool } = require('pg');

const p = new Pool({
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl:      { rejectUnauthorized: false }
});

async function fix() {
    await p.query("UPDATE alojamientos SET nombre = 'Glamping Montana' WHERE id = 1");
    await p.query("UPDATE alojamientos SET nombre = 'Cabanas Alpinas'  WHERE id = 3");
    const r = await p.query("SELECT id, nombre, length(nombre), octet_length(nombre) FROM alojamientos");
    console.log(r.rows);
    await p.end();
}

fix().catch(e => { console.error(e.message); p.end(); });
