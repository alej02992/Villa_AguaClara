-- Ejecuta esto una sola vez en tu base de datos Aiven
-- Puedes correrlo desde la consola de Aiven o con psql

CREATE TABLE IF NOT EXISTS glampings (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    capacidad   INT,
    precio_noche NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS reservas (
    id             SERIAL PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    fecha_entrada  DATE         NOT NULL,
    fecha_salida   DATE         NOT NULL,
    glamping_id    INT          NOT NULL REFERENCES glampings(id),
    creado_en      TIMESTAMP    DEFAULT NOW()
);

-- Datos de ejemplo (opcional)
INSERT INTO glampings (nombre, descripcion, capacidad, precio_noche)
VALUES
    ('Domo Estrella',  'Domo con vista al río y cielo abierto', 2, 350000),
    ('Cabaña Bambú',   'Cabaña ecológica entre árboles',        4, 480000)
ON CONFLICT DO NOTHING;