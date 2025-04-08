# Guía Técnica para Desarrolladores

Esta guía proporciona la información técnica necesaria para entender, configurar y extender el sistema de Car Marketplace.

## Índice

1. [Arquitectura General](#arquitectura-general)
2. [Sistema de Reservas](#sistema-de-reservas)
3. [Integración con Mercado Pago](#integración-con-mercado-pago)
4. [Sistema de Notificaciones](#sistema-de-notificaciones)
5. [Base de Datos](#base-de-datos)
6. [Autenticación](#autenticación)
7. [Testing](#testing)
8. [Extensión del Sistema](#extensión-del-sistema)

## Arquitectura General

La aplicación sigue una arquitectura de capas:

1. **Capa de Presentación**: Componentes React y páginas Next.js
2. **Capa de Servicios**: Lógica de negocio encapsulada en servicios
3. **Capa de Acceso a Datos**: Supabase Client y Server-side Clients

### Estructura de Directorios

```
app/                  # Next.js App Router con páginas y rutas API
  ├── api/            # API endpoints
  │   ├── reservations/     # Endpoints para reservas
  │   ├── payments/         # Endpoints para pagos
  │   └── webhooks/         # Webhooks para servicios externos
  └── [rutas]/        # Rutas y páginas organizadas por funcionalidad
components/           # Componentes de React reutilizables
  ├── car/            # Componentes específicos de vehículos
  ├── ui/             # Componentes UI genéricos
  └── payments/       # Componentes relacionados con pagos
services/             # Servicios para interactuar con APIs y base de datos
  ├── listings.ts     # Servicio para anuncios de vehículos
  ├── reservation.ts  # Servicio para reservas
  ├── notification.ts # Servicio para notificaciones
  └── analytics.ts    # Servicio para analíticas
utils/                # Utilidades y helpers
  ├── supabase/       # Clientes de Supabase
  ├── format.ts       # Utilidades de formato
  └── validation.ts   # Validaciones
types/                # Definiciones de TypeScript
db/                   # Migraciones y scripts de base de datos
```

## Sistema de Reservas

El sistema de reservas es el núcleo de la aplicación y conecta compradores con vendedores.

### Flujo de Reserva

1. **Creación de Reserva**:
   - El comprador inicia una reserva desde la página de detalles del vehículo
   - Se crea un registro en la tabla `car_reservations` con estado `pending`
   - Se genera una referencia de pago con Mercado Pago

2. **Procesamiento de Pago**:
   - El comprador es redirigido a la página de Mercado Pago
   - Mercado Pago envía notificaciones a nuestro webhook al cambiar el estado del pago

3. **Finalización de Reserva**:
   - Si el pago es exitoso, la reserva pasa a estado `approved`
   - El vehículo se marca como `reserved` y no está disponible para nuevas reservas
   - Se envían notificaciones al comprador y vendedor

### Estructura de Datos

```typescript
type ReservationStatus = 'pending' | 'approved' | 'expired' | 'cancelled';

interface CarReservation {
  id: string;
  listingId: string;
  userId: string;
  reservationAmount: number;
  paymentId?: string;
  paymentStatus: 'pending' | 'approved' | 'rejected' | 'cancelled';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}
```

## Integración con Mercado Pago

La integración con Mercado Pago permite procesar pagos para reservas.

### Configuración

La configuración se realiza a través de variables de entorno:

```
MP_PUBLIC_KEY=your-public-key
MP_ACCESS_TOKEN=your-access-token
```

### Componentes Principales

- `services/mercadoPago.ts`: Cliente para la API de Mercado Pago
- `app/api/webhooks/mercadopago/route.ts`: Webhook para recibir notificaciones
- `app/api/reservations/[id]/payment/route.ts`: Endpoint para crear preferencias de pago

### Webhooks

El punto de entrada para notificaciones de Mercado Pago es:
`/api/webhooks/mercadopago`

Este endpoint recibe notificaciones sobre cambios en el estado de los pagos y actualiza las reservas correspondientes.

## Sistema de Notificaciones

El sistema de notificaciones mantiene informados a compradores y vendedores.

### Tipos de Notificaciones

- **Notificaciones en App**: Almacenadas en la tabla `notifications`
- **Notificaciones por Email**: Enviadas a través de un servicio SMTP (simulado en desarrollo)

### Implementación

El servicio principal es `services/notification.ts` que proporciona métodos para:

1. Crear notificaciones en la base de datos
2. Enviar emails
3. Gestionar notificaciones específicas para reservas
4. Marcar notificaciones como leídas

### Uso

```typescript
// Ejemplo de uso
await NotificationService.notifyReservationPaid(
  reservation,
  sellerId,
  sellerEmail,
  buyerEmail,
  vehicleTitle
);
```

## Base de Datos

La base de datos utiliza PostgreSQL a través de Supabase.

### Tablas Principales

- `listings`: Anuncios de vehículos
- `listing_images`: Imágenes de vehículos
- `car_reservations`: Reservas de vehículos
- `notifications`: Notificaciones en la app
- `profiles`: Perfiles de usuario
- `messages`: Sistema de mensajería

### Índices y Claves

Se utilizan índices para optimizar las consultas frecuentes:

```sql
CREATE INDEX idx_car_reservations_listing_id ON car_reservations(listing_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_listings_seller_id ON listings(seller_id);
```

### RPC (Procedimientos Almacenados)

Se utilizan funciones RPC para operaciones complejas:

```sql
-- Ejemplo: Función para actualizar estado de reserva
CREATE OR REPLACE FUNCTION update_reservation_status(...)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Lógica de actualización
END;
$$;
```

## Autenticación

La autenticación utiliza Supabase Auth.

### Flujo de Autenticación

1. **Registro/Login**: Gestionado por componentes de Supabase Auth
2. **Sesión**: Manejada con `useAuth` hook
3. **Protección de Rutas**: Middleware de autenticación en Next.js

### Roles y Permisos

- **Usuario Anónimo**: Puede ver anuncios públicos
- **Usuario Registrado**: Puede crear favoritos, enviar mensajes, realizar reservas
- **Vendedor**: Es un usuario registrado que ha publicado anuncios
- **Admin**: Puede gestionar todos los anuncios y usuarios

## Testing

El sistema de pruebas está organizado en varias capas:

### Pruebas Unitarias

Utilizan Jest para probar componentes y servicios de forma aislada.

```typescript
// Ejemplo de test unitario
describe('NotificationService', () => {
  it('debe crear notificación correctamente', async () => {
    // Configuración
    // Ejecución
    // Verificación
  });
});
```

### Pruebas de Integración

Verifican la comunicación entre diferentes partes del sistema.

```javascript
// Ejemplo de test de integración
async function testPaymentFlow() {
  // Crear reserva
  // Procesar pago
  // Verificar estado final
}
```

### Pruebas E2E

Utilizan Playwright para verificar flujos completos desde la perspectiva del usuario.

```javascript
// Ejemplo de test E2E
test('Usuario puede reservar un vehículo', async ({ page }) => {
  // Navegación
  // Acciones
  // Verificaciones
});
```

## Extensión del Sistema

### Añadir Nuevas Funcionalidades

1. **Crear un Servicio**: Encapsular la lógica de negocio en un servicio
2. **Implementar APIs**: Añadir endpoints en `app/api/`
3. **Crear Componentes UI**: Añadir componentes en `components/`
4. **Integrar en Páginas**: Utilizar los componentes en las páginas

### Modificar el Sistema de Reservas

Para modificar el sistema de reservas:

1. Actualizar `services/reservation.ts` con la nueva lógica
2. Modificar `app/api/reservations/` para reflejar los cambios
3. Actualizar el procesamiento de webhook si es necesario
4. Añadir nuevas notificaciones si se requieren

### Añadir Nuevo Proveedor de Pago

Para integrar un nuevo proveedor de pago:

1. Crear un nuevo servicio (ej. `services/otherPaymentProvider.ts`)
2. Implementar la lógica de creación de pagos y verificación
3. Añadir un nuevo endpoint para webhooks
4. Actualizar la interfaz de usuario para permitir seleccionar el método de pago 