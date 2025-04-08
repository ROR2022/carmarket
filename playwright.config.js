// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuración de Playwright para pruebas automatizadas
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,  // Timeout global en milisegundos
  fullyParallel: true,
  forbidOnly: !!process.env.CI,  // Fail en CI si hay tests marcados con test.only
  retries: process.env.CI ? 2 : 0,  // Reintentos: 2 en CI, 0 en desarrollo
  workers: process.env.CI ? 1 : undefined,  // Limitar a 1 worker en CI
  reporter: process.env.CI ? 'github' : 'html',  // Usar reporter de GitHub en CI, HTML en desarrollo
  
  // Directorio para artefactos de pruebas (capturas, vídeos, etc.)
  outputDir: 'test-results/',
  
  // Configuración global compartida para todas las pruebas
  use: {
    // Base URL para todos los métodos page.goto() y api requests
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    
    // Capturar capturas de pantalla en errores
    screenshot: 'only-on-failure',
    
    // Grabar vídeo sólo en caso de fallos
    video: 'retain-on-failure',
    
    // Traza las acciones para debuggear fallos
    trace: 'retain-on-failure',
  },
  
  // Configuración de proyectos para diferentes navegadores
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Pruebas en dispositivos móviles
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Servidor web para pruebas locales
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,  // 2 minutos para arrancar el servidor
  },
}); 