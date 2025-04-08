# Estructura de Base de Datos

Este directorio contiene los scripts SQL y documentación relacionada con la estructura de la base de datos del proyecto.

## Migraciones

Los scripts en el directorio `migrations` deben aplicarse en orden numérico en la consola SQL de Supabase:

1. `01_car_reservations.sql` - Crea la tabla para reservas de vehículos y sus políticas de seguridad

## Tabla: car_reservations

Almacena las reservas de vehículos realizadas por los usuarios mediante el pago del 1% del valor del vehículo.

### Columnas

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | Identificador único de la reserva |
| listing_id | UUID | Referencia al listado de vehículo |
| user_id | UUID | Usuario que realizó la reserva |
| reservation_amount | DECIMAL | Monto de la reserva (1% del valor del vehículo) |
| payment_id | VARCHAR | ID de pago en Mercado Pago |
| payment_status | VARCHAR | Estado del pago: 'pending', 'approved', 'rejected', 'cancelled', 'expired' |
| expires_at | TIMESTAMP | Fecha y hora de expiración de la reserva |
| created_at | TIMESTAMP | Fecha y hora de creación |
| updated_at | TIMESTAMP | Fecha y hora de última actualización |

### Políticas de Seguridad (RLS)

- Lectura: Todos los usuarios pueden ver las reservas
- Creación: Los usuarios solo pueden crear sus propias reservas
- Actualización: Los usuarios solo pueden actualizar sus propias reservas
- Eliminación: Los usuarios solo pueden eliminar sus propias reservas

## Cómo aplicar migraciones

1. Accede al panel de administración de Supabase
2. Ve a la sección "SQL Editor"
3. Crea una nueva consulta
4. Copia el contenido del script SQL que deseas aplicar
5. Ejecuta la consulta

Nota: Asegúrate de que todas las tablas referenciadas ya existan antes de ejecutar los scripts. 