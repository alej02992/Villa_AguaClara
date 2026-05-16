# Villa_AguaClara
Pagina Web para empresa hotelera de Glampings, ubicados en Florian, Santander.

# Contexto del Proyecto: Villa AguaClara (Reservas de Glamping)

## Arquitectura de Software
- **Frontend:** HTML5, CSS3, JavaScript vanila. Desplegado en GitHub Pages (`https://alej02992.github.io/Villa_AguaClara/`).
- **Backend:** Node.js + Express. Desplegado en Render (`https://villa-aguaclara.onrender.com`).
- **Base de Datos:** PostgreSQL en Aiven.
- **Pagos:** Wompi Checkout Widget (Pasarela de pagos).

## Reglas de Negocio Críticas
1. **Precios:** El precio base por noche está definido estáticamente en `$250,000` COP. La decoración opcional cuesta `$100,000` COP adicionales.
2. **Ciclo de Vida de una Reserva (`estado_pago`):**
   - `pendiente`: Registrada en base de datos antes de pasar a la pasarela.
   - `pagada`: Confirmada mediante el Webhook de Wompi cuando el estado transaccional es `APPROVED`.
   - `cancelada`: Si falla el pago (`DECLINED`, `VOIDED`) o si expira el tiempo límite.
3. **Liberación de Cupos:** Hay un proceso en segundo plano (`setInterval` en `server.js`) que corre cada 5 minutos y cancela las reservas que lleven más de 1 minuto en estado `pendiente`.
4. **Seguridad:** El backend implementa CORS restrictivo permitiendo solo el origen del frontend en producción y `localhost:5500` en desarrollo. El webhook de Wompi se salta la lectura de JSON estándar porque requiere `express.raw` para validar firmas criptográficas.