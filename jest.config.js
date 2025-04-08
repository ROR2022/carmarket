// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Proporcionar la ruta a tu aplicación Next.js para cargar next.config.js y .env files
  dir: './',
});

// Cualquier configuración personalizada de Jest que quieras agregar
/** @type {import('jest').Config} */
const customJestConfig = {
  // Añade más opciones de configuración antes de cada test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Directorio donde Jest debería buscar los test
  testEnvironment: 'jest-environment-jsdom',
  
  // Manejar importaciones de CSS, fuentes e imágenes
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|scss)$': '<rootDir>/__mocks__/styleMock.js',
  },
  
  // Ignorar archivos que no necesitamos probar
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/tests/ui/',
  ],
  
  // Cobertura de código
  collectCoverageFrom: [
    'app/**/*.{js,ts,jsx,tsx}',
    'components/**/*.{js,ts,jsx,tsx}',
    'services/**/*.{js,ts,jsx,tsx}',
    'utils/**/*.{js,ts,jsx,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  
  // Transformación de archivos
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
};

// createJestConfig se exporta automáticamente de next/jest
module.exports = createJestConfig(customJestConfig); 