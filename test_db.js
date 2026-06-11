require('dotenv').config({path: './claves.env'});
const db = require('./api/config/db.js');
async function run() {
    try {
        await db.query('SELECT 1');
        console.log('Ping OK');
        
        const existe = await db.query(
            `SELECT id FROM reservas WHERE alojamiento = $1 AND estado_pago IN ('pendiente', 'pagada') AND ( ($2 < fecha_salida) AND ($3 > fecha_entrada) )`,
            ['Glamping Montana', '2026-06-20', '2026-06-22']
        );
        console.log('Select OK', existe.rowCount);
        
        const r = await db.query(
            `INSERT INTO reservas (nombre,correo,telefono,alojamiento,fecha_entrada,fecha_salida,noches,decoracion,subtotal,total,referencia) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (referencia) DO NOTHING RETURNING id, referencia`,
            ['Test','test@test.com','1234567','Tu alojamiento','2026-06-20','2026-06-22',2,false,500000,500000,'TEST-12346']
        );
        console.log('Insert OK', r.rowCount);
    } catch(e) {
        console.error('DB Error:', e.message);
    }
    process.exit(0);
}
run();
