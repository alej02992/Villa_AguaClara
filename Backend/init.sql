-- ══════════════════════════════════════════════════
--  VILLA AGUACLARA — init.sql
--  Ejecutar UNA sola vez en Aiven (consola o psql)
-- ══════════════════════════════════════════════════

-- ── Alojamientos ──────────────────────────────────
CREATE TABLE IF NOT EXISTS alojamientos (
    id            SERIAL PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL UNIQUE,
    descripcion   TEXT,
    capacidad     INT,
    precio_noche  NUMERIC(10,2) NOT NULL
);

INSERT INTO alojamientos (nombre, descripcion, capacidad, precio_noche) VALUES
    ('Glamping Montaña', 'Domo con vista a la montaña y cielo abierto', 2, 250000),
    ('Glamping Bosque',  'Domo ecológico entre árboles nativos',        2, 250000),
    ('Cabañas Alpinas',  'Cabaña de madera con jacuzzi privado',        4, 250000)
ON CONFLICT (nombre) DO NOTHING;

-- ── Reservas ──────────────────────────────────────
-- Estado del ciclo de vida:
--   pendiente   → guardada antes del pago
--   pagada      → Wompi confirmó el pago (webhook)
--   cancelada   → cancelada por el huésped o admin
CREATE TABLE IF NOT EXISTS reservas (
    id              SERIAL PRIMARY KEY,

    -- Huésped
    nombre          VARCHAR(150) NOT NULL,
    correo          VARCHAR(150) NOT NULL,
    telefono        VARCHAR(30)  NOT NULL,

    -- Estadía
    alojamiento     VARCHAR(100) NOT NULL REFERENCES alojamientos(nombre),
    fecha_entrada   DATE         NOT NULL,
    fecha_salida    DATE         NOT NULL,
    noches          INT          NOT NULL,
    decoracion      BOOLEAN      NOT NULL DEFAULT FALSE,

    -- Dinero
    subtotal        NUMERIC(12,2) NOT NULL,  -- noches × precio
    total           NUMERIC(12,2) NOT NULL,  -- subtotal + deco si aplica

    -- Wompi
    referencia      VARCHAR(60)  NOT NULL UNIQUE, -- ej: AGUACLARA-XXXXXXXX
    transaction_id  VARCHAR(120),                 -- ID que devuelve Wompi en el webhook
    estado_pago     VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                        CHECK (estado_pago IN ('pendiente','pagada','cancelada')),

    -- Control
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índices de consulta frecuente
CREATE INDEX IF NOT EXISTS idx_reservas_referencia    ON reservas (referencia);
CREATE INDEX IF NOT EXISTS idx_reservas_estado        ON reservas (estado_pago);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_entrada ON reservas (fecha_entrada);

-- Trigger: actualiza "actualizado_en" automáticamente
CREATE OR REPLACE FUNCTION set_actualizado_en()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.actualizado_en = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_reservas_actualizado ON reservas;
CREATE TRIGGER trg_reservas_actualizado
    BEFORE UPDATE ON reservas
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();