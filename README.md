# Car Marketplace

Plataforma de compra y venta de vehículos con sistema de reservas integrado con Mercado Pago.

## Características Principales

- 🚗 Búsqueda avanzada de vehículos con filtros
- 💰 Sistema de reservas con pago integrado a través de Mercado Pago
- 💬 Sistema de mensajería entre compradores y vendedores
- 📊 Panel de control para vendedores con analíticas
- 🔔 Sistema de notificaciones por email y en la aplicación
- 🌙 Soporte para modo oscuro
- 📱 Diseño responsivo adaptado a móviles

## Tecnologías Utilizadas

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase Functions
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth
- **Almacenamiento**: Supabase Storage
- **Pasarela de Pago**: Mercado Pago
- **Testing**: Jest, Playwright

## Arquitectura

La aplicación sigue una arquitectura basada en servicios con una clara separación de responsabilidades:

```
app/                  # Componentes de página y API routes (Next.js App Router)
  ├── api/            # API endpoints
  └── [rutas]/        # Componentes de página organizados por ruta
components/           # Componentes de React reutilizables
services/             # Servicios para interactuar con APIs y base de datos
utils/                # Utilidades y helpers
db/                   # Migraciones y scripts de base de datos
tests/                # Pruebas automatizadas
```

## Requisitos Previos

- Node.js 18+ 
- PostgreSQL
- Cuenta de Mercado Pago (para procesamiento de pagos)
- Cuenta de Supabase (o PostgreSQL local)

## Configuración

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/car-marketplace.git
   cd car-marketplace
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   Copiar el archivo `.env.example` a `.env.local` y configurar variables:
   ```bash
   cp .env.example .env.local
   ```
   Editar `.env.local` con tus credenciales de Supabase y Mercado Pago.

4. Ejecutar migraciones de base de datos:
   ```bash
   npm run db:migrate
   ```

## Ejecutar la Aplicación

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm start
```

## Testing

El proyecto incluye varias capas de pruebas:

- **Pruebas Unitarias**: `npm test`
- **Pruebas de Integración**: `npm run test:integration`
- **Pruebas E2E**: `npm run test:ui`
- **Todas las pruebas**: `npm run test:all`

Para más detalles, consultar [documentación de pruebas](tests/README.md).

## Webhooks de Mercado Pago

La aplicación está configurada para recibir notificaciones de Mercado Pago a través de webhooks.
Para desarrollo local, puedes usar herramientas como ngrok para exponer tu entorno local:

```bash
ngrok http 3000
```

El webhook para notificaciones está en: `/api/webhooks/mercadopago`

## Despliegue

La aplicación está optimizada para desplegarse en:

- Vercel (recomendado)
- Netlify
- Cualquier proveedor que soporte Next.js

### Pasos para Despliegue en Vercel

1. Conecta el repositorio a Vercel
2. Configura las variables de entorno en el panel de Vercel
3. Configura el dominio personalizado (opcional)

## Licencia

[MIT](LICENSE)

## Contribuciones

Las contribuciones son bienvenidas. Por favor, revisa primero el documento [CONTRIBUTING.md](CONTRIBUTING.md). 