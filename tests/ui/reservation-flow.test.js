/**
 * Pruebas de UI para el flujo de reserva
 * 
 * Este archivo contiene pruebas E2E para verificar que el flujo completo
 * de reserva de un vehículo funciona correctamente desde la perspectiva del usuario.
 * 
 * Utiliza Playwright para automatizar la navegación y simular interacciones de usuario.
 * 
 * Para ejecutar: npx playwright test tests/ui/reservation-flow.test.js
 */

const { test, expect } = require('@playwright/test');
const { v4: uuidv4 } = require('uuid');

// URL base para las pruebas
const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Datos de prueba
const testUser = {
  email: `test-user-${uuidv4().slice(0, 8)}@example.com`,
  password: 'TestPassword123!',
  name: 'Usuario de Prueba'
};

// Prueba E2E del flujo de reserva
test.describe('Flujo de reserva de vehículo', () => {
  let listingId;
  
  // Hooks para crear data de prueba y limpiar después
  test.beforeAll(async ({ request }) => {
    // Crear usuario de prueba si no existe
    // En un entorno real, esto se haría a través de una API o directamente en la DB
    console.log('Configurando datos de prueba...');
  });
  
  test.afterAll(async ({ request }) => {
    // Limpiar datos de prueba
    console.log('Limpiando datos de prueba...');
  });
  
  // Registro/Login del usuario
  test('1. Usuario puede registrarse o iniciar sesión', async ({ page }) => {
    await page.goto(`${baseUrl}/login`);
    
    // Si ya tenemos usuario, iniciar sesión
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Verificar que estamos en la página de inicio o dashboard
    await expect(page).toHaveURL(/^\/(dashboard)?$/);
  });
  
  // Navegación y búsqueda de vehículos
  test('2. Usuario puede buscar y encontrar vehículos', async ({ page }) => {
    await page.goto(baseUrl);
    
    // Usar la barra de búsqueda
    await page.fill('input[placeholder*="Buscar"]', 'auto');
    await page.press('input[placeholder*="Buscar"]', 'Enter');
    
    // Verificar que se muestran resultados
    const results = page.locator('.listing-card');
    await expect(results).toHaveCount({ min: 1 });
    
    // Guardar el ID del primer listado para usarlo más adelante
    const firstListing = results.first();
    const href = await firstListing.locator('a').getAttribute('href');
    listingId = href.split('/').pop();
    
    console.log(`Usando listado ID: ${listingId}`);
  });
  
  // Ver detalles del vehículo
  test('3. Usuario puede ver detalles del vehículo', async ({ page }) => {
    await page.goto(`${baseUrl}/cars/${listingId}`);
    
    // Verificar que se muestra la información del vehículo
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.car-price')).toBeVisible();
    
    // Verificar que existe botón de reserva
    const reserveButton = page.locator('button:has-text("Reservar")');
    await expect(reserveButton).toBeVisible();
  });
  
  // Proceso de reserva
  test('4. Usuario puede iniciar proceso de reserva', async ({ page }) => {
    await page.goto(`${baseUrl}/cars/${listingId}`);
    
    // Hacer clic en el botón de reserva
    await page.click('button:has-text("Reservar")');
    
    // Verificar que llega a la página de confirmación
    await expect(page).toHaveURL(/^\/reservations\/new/);
    
    // Verificar detalles de la reserva
    await expect(page.locator('.reservation-details')).toBeVisible();
    await expect(page.locator('.reservation-price')).toBeVisible();
    
    // Hacer clic en confirmar reserva
    await page.click('button:has-text("Confirmar")');
    
    // Verificar redirección a la página de pago
    await expect(page).toHaveURL(/^\/payment\//);
  });
  
  // Proceso de pago (simulado)
  test('5. Usuario puede completar el pago', async ({ page }) => {
    // Asumimos que estamos en la página de pago desde el test anterior
    // Esperamos que se cargue el iframe de Mercado Pago
    const _mpFrame = page.frameLocator('iframe[name*="mercadopago"]');
    
    // En un entorno real, interactuar con el iframe de MP
    // Para prueba, simulamos que el pago se completa automáticamente
    
    // Verificar que después de cierto tiempo, se redirecciona a la página de éxito
    // Esto asume que tenemos una redirección automática en el entorno de prueba
    await expect(page).toHaveURL(/^\/reservations\/\w+\/success/, { timeout: 30000 });
  });
  
  // Verificación post-reserva
  test('6. Usuario puede ver su reserva confirmada', async ({ page }) => {
    await page.goto(`${baseUrl}/reservations`);
    
    // Verificar que la reserva aparece en la lista
    const reservations = page.locator('.reservation-item');
    await expect(reservations).toHaveCount({ min: 1 });
    
    // Verificar que el estado de la reserva es "Confirmada" o similar
    await expect(page.locator('.reservation-status:has-text("Confirmada")')).toBeVisible();
  });
  
  // Notificaciones
  test('7. Usuario recibe notificaciones sobre su reserva', async ({ page }) => {
    await page.goto(`${baseUrl}/notifications`);
    
    // Verificar que hay notificaciones relacionadas con la reserva
    const notifications = page.locator('.notification-item');
    await expect(notifications).toHaveCount({ min: 1 });
    
    // Buscar notificación específica de reserva
    await expect(page.locator('.notification-item:has-text("reserva")')).toBeVisible();
  });
});

// Pruebas adicionales para escenarios alternativos
test.describe('Escenarios alternativos de reserva', () => {
  test('Usuario no puede reservar sin iniciar sesión', async ({ page }) => {
    // Visitar directamente la página de un listado sin iniciar sesión
    await page.goto(`${baseUrl}/cars/some-valid-listing-id`);
    
    // Intentar reservar
    await page.click('button:has-text("Reservar")');
    
    // Verificar que se redirecciona a login
    await expect(page).toHaveURL(/^\/login/);
  });
  
  test('Sistema muestra mensaje de error si hay problema de pago', async ({ page }) => {
    // Esta prueba requeriría simular un error en el sistema de pago
    // Se implementaría con mocks o variables de entorno especiales
    console.log('Prueba de error de pago pendiente de implementación');
  });
});

// Pruebas desde la perspectiva del vendedor
test.describe('Perspectiva del vendedor', () => {
  // Estas pruebas requerirían un usuario vendedor
  
  test('Vendedor recibe notificación cuando su vehículo es reservado', async ({ page }) => {
    // Iniciar sesión como vendedor
    // Verificar notificaciones
    console.log('Prueba de notificación a vendedor pendiente de implementación');
  });
  
  test('Vendedor puede ver estado de sus listados', async ({ page }) => {
    // Iniciar sesión como vendedor
    // Verificar que el listado reservado muestra estado correcto
    console.log('Prueba de estado de listados pendiente de implementación');
  });
}); 