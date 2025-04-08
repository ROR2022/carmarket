# Sistema de Pruebas - Car Marketplace

Este directorio contiene las pruebas para el sistema de reserva de vehículos y la integración con Mercado Pago.

## Estructura de Pruebas

El sistema de pruebas está organizado de la siguiente manera:

```
tests/
├── mercadopago-integration.js   # Pruebas de integración con Mercado Pago
├── ui/                          # Pruebas de interfaz de usuario
│   └── reservation-flow.test.js # Prueba E2E del flujo de reserva
├── README.md                    # Esta documentación
```

Adicionalmente, cada servicio tiene sus propias pruebas unitarias en un subdirectorio `__tests__` dentro de su directorio, por ejemplo:

```
services/
├── notification.ts              # Servicio de notificaciones
├── __tests__/                   # Pruebas unitarias para servicios
│   └── notification.test.ts     # Pruebas unitarias del servicio de notificaciones
```

## Tipos de Pruebas

### 1. Pruebas Unitarias

Las pruebas unitarias utilizan Jest y se enfocan en probar componentes y servicios individuales de forma aislada.

Ejecutar pruebas unitarias:

```bash
npm test
```

Ejecutar en modo watch (desarrollo):

```bash
npm run test:watch
```

### 2. Pruebas de Integración

Las pruebas de integración verifican la comunicación entre diferentes partes del sistema, especialmente la integración con servicios externos como Mercado Pago.

Ejecutar pruebas de integración:

```bash
npm run test:integration
```

### 3. Pruebas de UI (End-to-End)

Las pruebas de UI utilizan Playwright para automatizar la interacción con la aplicación a través del navegador, verificando flujos completos desde la perspectiva del usuario.

Ejecutar pruebas de UI:

```bash
npm run test:ui
```

Ejecutar en modo debug (con visualización):

```bash
npm run test:ui:debug
```

### 4. Ejecutar todas las pruebas

Para ejecutar todos los tipos de prueba:

```bash
npm run test:all
```

## Configuración para Pruebas

### Variables de Entorno

Para ejecutar las pruebas, es necesario configurar ciertas variables de entorno:

```bash
# URL base para pruebas (por defecto: http://localhost:3000)
TEST_BASE_URL=http://localhost:3000

# Credenciales de Mercado Pago para testing
MP_PUBLIC_KEY_TEST=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MP_ACCESS_TOKEN_TEST=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Para CI (opcional)
CI=true
```

## Añadir Nuevas Pruebas

### Pruebas Unitarias

1. Crear un archivo en `services/__tests__/[nombre-servicio].test.ts` o `components/__tests__/[nombre-componente].test.tsx`
2. Utilizar Jest para escribir las pruebas
3. Ejecutar `npm run test:watch` para ver los resultados en tiempo real

Ejemplo:

```typescript
import { MyService } from '../my-service';

describe('MyService', () => {
  it('debe hacer algo específico', () => {
    const result = MyService.doSomething();
    expect(result).toBe(expectedValue);
  });
});
```

### Pruebas de UI

1. Crear un archivo en `tests/ui/[nombre-funcionalidad].test.js`
2. Utilizar Playwright para escribir las pruebas
3. Ejecutar `npm run test:ui` para ejecutar las pruebas

Ejemplo:

```javascript
const { test, expect } = require('@playwright/test');

test('usuario puede completar una acción', async ({ page }) => {
  await page.goto('/ruta');
  await page.click('button:has-text("Acción")');
  await expect(page.locator('.resultado')).toBeVisible();
});
```

## Mocks y Stubs

- Los mocks para servicios externos se encuentran en sus respectivos archivos de prueba
- Los mocks para archivos estáticos están en `__mocks__/`

## CI/CD

Las pruebas se ejecutan automáticamente en el pipeline de CI/CD:

- Las pruebas unitarias y de integración se ejecutan en cada pull request
- Las pruebas E2E se ejecutan antes de cada despliegue a producción

## Problemas Comunes

### Errores de Timeout

Si las pruebas de UI fallan por timeout, intenta:

```javascript
// Aumentar el timeout para una prueba específica
test('prueba lenta', async ({ page }) => {
  // código de prueba
}, { timeout: 60000 });
```

### Errores de Acceso a Variables de Entorno

Asegúrate de tener un archivo `.env.test` con las variables necesarias. 