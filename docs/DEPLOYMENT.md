# Guía de Despliegue - Car Marketplace

Esta guía proporciona instrucciones detalladas para desplegar la aplicación Car Marketplace en un entorno de producción.

## Índice

1. [Preparativos Previos](#preparativos-previos)
2. [Despliegue en Vercel](#despliegue-en-vercel)
3. [Configuración de Base de Datos](#configuración-de-base-de-datos)
4. [Configuración de Mercado Pago](#configuración-de-mercado-pago)
5. [Configuración de Webhooks](#configuración-de-webhooks)
6. [Configuración de Correo Electrónico](#configuración-de-correo-electrónico)
7. [Optimizaciones de Producción](#optimizaciones-de-producción)
8. [Monitoreo y Registros](#monitoreo-y-registros)
9. [Resolución de Problemas](#resolución-de-problemas)

## Preparativos Previos

### Variables de Entorno

Antes de desplegar, asegúrate de tener todas las variables de entorno necesarias:

1. Copia `.env.example` a un nuevo archivo `.env.production.local`
2. Completa todas las variables con valores de producción
3. Asegúrate de tener las credenciales de producción para Mercado Pago y Supabase

### Construcción para Producción

Para construir la aplicación para producción:

```bash
npm run build
```

Verifica que la construcción sea exitosa y que no haya errores o advertencias.

## Despliegue en Vercel

### Configuración Inicial

1. Crea una cuenta en [Vercel](https://vercel.com) si aún no tienes una
2. Conecta tu repositorio de GitHub a Vercel
3. Configura un nuevo proyecto:
   - Selecciona el repositorio
   - Configura el framework preset como "Next.js"
   - Establece el directorio raíz como "/"
   - Define el comando de construcción como "npm run build"
   - Define el directorio de salida como ".next"

### Variables de Entorno en Vercel

1. Ve a la sección "Settings" > "Environment Variables"
2. Añade todas las variables de entorno de tu archivo `.env.production.local`
3. Asegúrate de añadir las siguientes variables específicas de producción:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_BASE_URL=https://tu-dominio.com`
   - `VERCEL_ANALYTICS=true` (si deseas habilitar Vercel Analytics)

### Dominio Personalizado

1. En Vercel, ve a "Settings" > "Domains"
2. Añade tu dominio personalizado
3. Sigue las instrucciones para configurar los registros DNS

## Configuración de Base de Datos

### Supabase en Producción

1. Crea un proyecto de producción en [Supabase](https://supabase.com)
2. Ejecuta las migraciones de base de datos:
   ```bash
   npx supabase db push
   ```
3. Configura las políticas de seguridad para el entorno de producción
4. Actualiza las variables de entorno en Vercel con las credenciales de Supabase de producción:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Respalda tu Base de Datos

Configura copias de seguridad automáticas para tu base de datos:

1. En Supabase, ve a "Settings" > "Database"
2. Configura las copias de seguridad diarias
3. Establece un período de retención para las copias de seguridad

## Configuración de Mercado Pago

### Credenciales de Producción

1. Obtén tus credenciales de producción desde el [Panel de Desarrolladores de Mercado Pago](https://www.mercadopago.com.ar/developers)
2. Actualiza las variables de entorno en Vercel:
   - `MP_ACCESS_TOKEN`
   - `MP_PUBLIC_KEY`
   - `MP_CLIENT_ID`
   - `MP_CLIENT_SECRET`

### Configuración de la Aplicación

1. Registra tu aplicación en el Panel de Desarrolladores de Mercado Pago
2. Configura las URL de redirección:
   - URL de éxito: `https://tu-dominio.com/payment/success`
   - URL de fallo: `https://tu-dominio.com/payment/failure`
   - URL de pendiente: `https://tu-dominio.com/payment/pending`

## Configuración de Webhooks

### Webhooks de Mercado Pago

1. En el Panel de Desarrolladores de Mercado Pago, ve a "Webhooks"
2. Añade una nueva URL de webhook: `https://tu-dominio.com/api/webhooks/mercadopago`
3. Selecciona los eventos a recibir:
   - `payment.created`
   - `payment.updated`
   - `payment.approved`
   - `payment.rejected`
   - `payment.cancelled`

### Prueba de Webhooks

1. Usa una herramienta como [Webhook.site](https://webhook.site) para probar los webhooks
2. Realiza una transacción de prueba en el modo sandbox
3. Verifica que recibas las notificaciones correctamente

## Configuración de Correo Electrónico

### Proveedor de Correo

Configura un proveedor de correo electrónico para las notificaciones:

1. Crea una cuenta en un servicio como SendGrid, Mailgun o Amazon SES
2. Obtén las credenciales API y actualiza las variables de entorno:
   - `EMAIL_SERVER_HOST`
   - `EMAIL_SERVER_PORT`
   - `EMAIL_SERVER_USER`
   - `EMAIL_SERVER_PASSWORD`
   - `EMAIL_FROM`

### Plantillas de Correo

1. Crea plantillas de correo electrónico para diferentes tipos de notificaciones:
   - Confirmación de registro
   - Reserva creada
   - Pago aprobado
   - Reserva cancelada

## Optimizaciones de Producción

### Optimización de Imágenes

1. Asegúrate de que todas las imágenes estén optimizadas con `next/image`
2. Configura un servicio de CDN para servir imágenes estáticas

### Caching

1. Implementa políticas de caché para contenido estático:
   ```javascript
   // En next.config.js
   module.exports = {
     async headers() {
       return [
         {
           source: '/images/:path*',
           headers: [
             {
               key: 'Cache-Control',
               value: 'public, max-age=31536000, immutable',
             },
           ],
         },
       ];
     },
   };
   ```

### Rendimiento

1. Ejecuta Lighthouse para analizar el rendimiento:
   ```bash
   npx lighthouse https://tu-dominio.com
   ```
2. Implementa las mejoras sugeridas por Lighthouse

## Monitoreo y Registros

### Monitoreo de Aplicación

1. Configura Vercel Analytics para monitorear el rendimiento y uso
2. Implementa un servicio como Sentry para seguimiento de errores:
   ```bash
   npm install @sentry/nextjs
   ```
3. Configura Sentry en tu proyecto Next.js

### Registros de Actividad

1. Implementa registros de actividad para acciones críticas:
   - Pagos
   - Reservas
   - Autenticación

2. Centraliza los registros en un servicio como Logtail o Datadog

## Resolución de Problemas

### Problemas Comunes

#### Problemas con Webhooks

Si los webhooks no funcionan correctamente:

1. Verifica que la URL del webhook sea accesible desde Internet
2. Comprueba que estés recibiendo y procesando el evento correctamente
3. Revisa los encabezados de autenticación

#### Problemas de Pago

Si hay problemas con los pagos:

1. Verifica las credenciales de Mercado Pago
2. Comprueba los registros de transacciones en el panel de Mercado Pago
3. Asegúrate de que la integración esté configurada correctamente

#### Problemas de Rendimiento

Si hay problemas de rendimiento:

1. Analiza el rendimiento con Lighthouse
2. Optimiza las imágenes y activos estáticos
3. Implementa lazy loading para componentes pesados

### Contacto de Soporte

Para soporte técnico, contacta a:

- Correo electrónico: tech-support@car-marketplace.com
- Canal de Slack: #deployment-support 