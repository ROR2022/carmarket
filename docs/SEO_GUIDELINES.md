# Directrices SEO para Car Marketplace

Este documento proporciona las mejores prácticas para optimizar el posicionamiento en buscadores de la aplicación Car Marketplace.

## Índice

1. [Estructura de URLs](#estructura-de-urls)
2. [Metadatos](#metadatos)
3. [Contenido](#contenido)
4. [Imágenes](#imágenes)
5. [Rendimiento](#rendimiento)
6. [Consideraciones Móviles](#consideraciones-móviles)
7. [Datos Estructurados](#datos-estructurados)
8. [Monitoreo y Analytics](#monitoreo-y-analytics)

## Estructura de URLs

Las URLs deben ser descriptivas, legibles y seguir un patrón coherente:

✅ **Correcto**:  
- `/vehiculos/volkswagen-golf-2018`
- `/vendedor/perfil-juan-perez`
- `/buscar/autos-sedan-usados`

❌ **Incorrecto**:  
- `/v/12345`
- `/s?id=789`
- `/listing.php?car=456`

### Reglas para URLs:

1. Usar slugs basados en marca-modelo-año para vehículos
2. Evitar parámetros de consulta complejos
3. Utilizar guiones (-) para separar palabras, no guiones bajos
4. Mantener todas las URLs en minúsculas
5. Evitar caracteres especiales y acentos en URLs

## Metadatos

Cada página debe tener metadatos optimizados:

```jsx
// Ejemplo en componente de Next.js (metadata export)
export const metadata = {
  title: 'Volkswagen Golf 2018 - Excelente Estado | Car Marketplace',
  description: 'Volkswagen Golf 2018 con 45,000 km, motor 1.4 TSI, transmisión automática. Excelente estado, único dueño. ¡Agenda una prueba de manejo hoy!',
  openGraph: {
    title: 'Volkswagen Golf 2018 - Excelente Estado',
    description: 'Volkswagen Golf 2018 con 45,000 km, motor 1.4 TSI...',
    images: [
      {
        url: 'https://car-marketplace.com/images/vw-golf-2018.jpg',
        width: 1200,
        height: 630,
        alt: 'Volkswagen Golf 2018',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Volkswagen Golf 2018 - Excelente Estado',
    description: 'Volkswagen Golf 2018 con 45,000 km...',
    images: ['https://car-marketplace.com/images/vw-golf-2018.jpg'],
  },
};
```

### Directrices para Metadatos:

1. **Titles**: 50-60 caracteres incluyendo nombre de la marca
2. **Descriptions**: 150-160 caracteres enfocados en características clave
3. **OG y Twitter Cards**: Optimizados para compartir en redes sociales
4. **Canonical URLs**: Usar etiquetas canónicas para evitar contenido duplicado

## Contenido

El contenido debe ser rico, relevante y estructurado:

### Para listados de vehículos:

1. Usar encabezados jerárquicos (H1, H2, H3) correctamente
2. Incluir especificaciones técnicas completas
3. Describir el estado del vehículo con detalle
4. Incluir información de mantenimiento y servicio
5. Proporcionar historia del vehículo cuando esté disponible

### Contenido generado por usuarios:

1. Moderar las reseñas para evitar contenido duplicado o spam
2. Fomentar reseñas detalladas con imágenes
3. Implementar sistema de calificación para vendedores

## Imágenes

Las imágenes deben estar optimizadas:

1. Usar nombres de archivo descriptivos: `volkswagen-golf-2018-frente.webp`
2. Incluir atributos alt descriptivos
3. Optimizar tamaño y compresión con `next/image`
4. Implementar lazy loading para mejorar rendimiento
5. Proporcionar múltiples formatos (WebP, AVIF, JPG)

```jsx
// Ejemplo de imagen optimizada
import Image from 'next/image';

<Image
  src="/images/volkswagen-golf-2018-frente.webp"
  alt="Volkswagen Golf 2018 - Vista frontal"
  width={800}
  height={600}
  priority={index === 0} // Priorizar primera imagen
  quality={85}
/>
```

## Rendimiento

El rendimiento afecta directamente al SEO:

1. Optimizar Core Web Vitals (LCP, FID, CLS)
2. Implementar server-side rendering para contenido crítico
3. Utilizar caching efectivo para assets estáticos
4. Minimizar JavaScript no esencial
5. Optimizar carga de fuentes

### Herramientas de monitoreo:

- Google PageSpeed Insights
- Lighthouse en Chrome DevTools
- Web Vitals en Google Search Console

## Consideraciones Móviles

La experiencia móvil es prioritaria:

1. Diseño responsivo para todas las páginas
2. Botones y elementos táctiles suficientemente grandes
3. Evitar contenido que requiera hovering
4. Optimizar tiempos de carga para conexiones móviles
5. Pruebas en diferentes dispositivos móviles

## Datos Estructurados

Implementar Schema.org para mejorar rich snippets:

```jsx
// Ejemplo para un listado de vehículo
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Vehicle",
  "name": "Volkswagen Golf 2018",
  "brand": {
    "@type": "Brand",
    "name": "Volkswagen"
  },
  "model": "Golf",
  "vehicleModelDate": "2018",
  "mileageFromOdometer": {
    "@type": "QuantitativeValue",
    "value": "45000",
    "unitCode": "KMT"
  },
  "fuelType": "Gasolina",
  "vehicleTransmission": "Automática",
  "color": "Blanco",
  "numberOfDoors": "5",
  "vehicleEngine": {
    "@type": "EngineSpecification",
    "name": "1.4 TSI"
  },
  "offers": {
    "@type": "Offer",
    "price": "15000",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "image": "https://car-marketplace.com/images/vw-golf-2018.jpg"
}
</script>
```

## Monitoreo y Analytics

Implementar herramientas de seguimiento:

1. Google Analytics 4 para tráfico y conversiones
2. Google Search Console para rendimiento en búsquedas
3. Hotjar o herramientas similares para comportamiento del usuario
4. Monitoreo de keywords relevantes

### KPIs a seguir:

- Posiciones en búsqueda para términos relevantes
- CTR (Click-Through Rate) para listados
- Tiempo en página para detalles de vehículos
- Tasa de rebote
- Tasa de conversión (contactos/reservas) 