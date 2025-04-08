#!/usr/bin/env node

/**
 * Script de optimización para producción de Car Marketplace
 * 
 * Este script realiza optimizaciones y validaciones antes del despliegue:
 * - Verifica variables de entorno
 * - Optimiza imágenes
 * - Analiza el bundle de JavaScript
 * - Verifica dependencias
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Colores para la consola
const success = chalk.green;
const error = chalk.red;
const info = chalk.blue;
const warning = chalk.yellow;

console.log(info('🚀 Iniciando optimización para producción de Car Marketplace...'));

// Verificar dependencias necesarias
function checkDependencies() {
  console.log(info('📦 Verificando dependencias...'));
  
  try {
    // Verificar si las dependencias de optimización están instaladas
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const devDependencies = packageJson.devDependencies || {};
    
    const requiredDeps = [
      'sharp',
      'next-bundle-analyzer',
      'eslint',
      'typescript'
    ];
    
    const missingDeps = [];
    
    for (const dep of requiredDeps) {
      if (!devDependencies[dep] && !packageJson.dependencies?.[dep]) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      console.log(warning(`⚠️ Dependencias faltantes: ${missingDeps.join(', ')}`));
      console.log(info('📥 Instalando dependencias faltantes...'));
      
      execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    } else {
      console.log(success('✅ Todas las dependencias necesarias están instaladas.'));
    }
  } catch (err) {
    console.log(error('❌ Error al verificar dependencias:'), err);
    process.exit(1);
  }
}

// Validar variables de entorno
function validateEnvVariables() {
  console.log(info('🔑 Validando variables de entorno...'));
  
  try {
    const envExample = fs.readFileSync('./.env.example', 'utf8').split('\n');
    
    // Extraer nombres de variables del archivo .env.example
    const requiredVars = envExample
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.split('=')[0].trim());
    
    // Verificar si existe .env.production.local o .env.local
    const envFile = fs.existsSync('./.env.production.local') 
      ? './.env.production.local' 
      : (fs.existsSync('./.env.local') ? './.env.local' : null);
    
    if (!envFile) {
      console.log(error('❌ No se encontró ningún archivo .env para producción.'));
      console.log(info('📝 Creando archivo .env.production.local a partir de .env.example...'));
      
      fs.copyFileSync('./.env.example', './.env.production.local');
      console.log(warning('⚠️ Por favor, completa las variables en el archivo .env.production.local'));
      return;
    }
    
    const envContent = fs.readFileSync(envFile, 'utf8').split('\n');
    
    // Extraer variables definidas en el archivo .env
    const definedVars = envContent
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.split('=')[0].trim());
    
    // Encontrar variables faltantes
    const missingVars = requiredVars.filter(v => !definedVars.includes(v));
    
    // Encontrar variables vacías
    const emptyVars = envContent
      .filter(line => line.trim() && !line.startsWith('#'))
      .filter(line => line.split('=')[1]?.trim() === '')
      .map(line => line.split('=')[0].trim());
    
    if (missingVars.length > 0) {
      console.log(warning(`⚠️ Variables faltantes en ${envFile}: ${missingVars.join(', ')}`));
      console.log(info('💡 Estas variables son necesarias para el funcionamiento de la aplicación.'));
    }
    
    if (emptyVars.length > 0) {
      console.log(warning(`⚠️ Variables sin valor en ${envFile}: ${emptyVars.join(', ')}`));
      console.log(info('💡 Estas variables necesitan un valor para el funcionamiento correcto.'));
    }
    
    if (missingVars.length === 0 && emptyVars.length === 0) {
      console.log(success('✅ Todas las variables de entorno están configuradas correctamente.'));
    }
    
    // Verificar específicamente las variables críticas
    const criticalVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'MP_ACCESS_TOKEN',
      'MP_PUBLIC_KEY'
    ];
    
    const missingCriticalVars = criticalVars.filter(v => 
      !definedVars.includes(v) || 
      emptyVars.includes(v) ||
      envContent.find(line => line.startsWith(v))?.split('=')[1]?.trim() === ''
    );
    
    if (missingCriticalVars.length > 0) {
      console.log(error(`❌ Variables críticas sin configurar: ${missingCriticalVars.join(', ')}`));
      console.log(warning('⚠️ La aplicación no funcionará correctamente sin estas variables.'));
    }
  } catch (err) {
    console.log(error('❌ Error al validar variables de entorno:'), err);
  }
}

// Optimizar imágenes en public/images
function optimizeImages() {
  console.log(info('🖼️ Optimizando imágenes...'));
  
  try {
    // Verificar si sharp está instalado
    try {
      require.resolve('sharp');
    } catch (_e) {
      // Error is intentionally unused as it indicates sharp is not installed
      console.log(warning('⚠️ Sharp no está instalado. Instalando...'));
      execSync('npm install --save-dev sharp', { stdio: 'inherit' });
    }
    
    // Verificar si existe el directorio de imágenes
    const imageDir = './public/images';
    if (!fs.existsSync(imageDir)) {
      console.log(warning(`⚠️ Directorio ${imageDir} no encontrado.`));
      return;
    }
    
    // Crear directorio para imágenes optimizadas si no existe
    const optimizedDir = './public/images/optimized';
    if (!fs.existsSync(optimizedDir)) {
      fs.mkdirSync(optimizedDir, { recursive: true });
    }
    
    // Obtener listado de imágenes
    const imageFiles = fs.readdirSync(imageDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      })
      .filter(file => !file.includes('optimized'));
    
    if (imageFiles.length === 0) {
      console.log(info('ℹ️ No se encontraron imágenes para optimizar.'));
      return;
    }
    
    console.log(info(`📊 Se encontraron ${imageFiles.length} imágenes para optimizar.`));
    
    // Optimizar imágenes con sharp
    const sharp = require('sharp');
    let optimizedCount = 0;
    
    for (const file of imageFiles) {
      const inputPath = path.join(imageDir, file);
      const outputPath = path.join(optimizedDir, file);
      
      const fileExt = path.extname(file).toLowerCase();
      const originalSize = fs.statSync(inputPath).size;
      
      const sharpInstance = sharp(inputPath).withMetadata();
      
      // Configurar opciones de compresión según el tipo de imagen
      if (['.jpg', '.jpeg'].includes(fileExt)) {
        sharpInstance.jpeg({ quality: 80, mozjpeg: true });
      } else if (fileExt === '.png') {
        sharpInstance.png({ compressionLevel: 9, palette: true });
      } else if (fileExt === '.webp') {
        sharpInstance.webp({ quality: 80 });
      }
      
      // Guardar imagen optimizada
      sharpInstance.toFile(outputPath)
        .then(info => {
          const newSize = fs.statSync(outputPath).size;
          const savingsPercent = ((originalSize - newSize) / originalSize * 100).toFixed(2);
          
          console.log(success(`✅ Optimizada: ${file} - Ahorro: ${savingsPercent}% (${(originalSize - newSize) / 1024} KB)`));
          optimizedCount++;
          
          if (optimizedCount === imageFiles.length) {
            console.log(success(`✅ Se optimizaron ${optimizedCount} imágenes.`));
          }
        })
        .catch(err => {
          console.log(error(`❌ Error al optimizar ${file}:`), err);
        });
    }
  } catch (_err) {
    console.log(error('❌ Error en la optimización de imágenes:'), _err);
  }
}

// Analizar tamaño del bundle
function analyzeBundleSize() {
  console.log(info('📊 Analizando tamaño del bundle...'));
  
  try {
    // Verificar configuración actual de next.config.js
    const nextConfigPath = './next.config.js';
    
    if (!fs.existsSync(nextConfigPath)) {
      console.log(warning('⚠️ No se encontró el archivo next.config.js'));
      return;
    }
    
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Verificar si ya está configurado el analizador de bundle
    if (nextConfig.includes('withBundleAnalyzer')) {
      console.log(info('ℹ️ Bundle Analyzer ya está configurado en next.config.js'));
    } else {
      console.log(warning('⚠️ Bundle Analyzer no está configurado en next.config.js'));
      console.log(info('💡 Para activar el análisis del bundle, agrega esta configuración a next.config.js:'));
      console.log(`
const withBundleAnalyzer = require('next-bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // tu configuración existente
});
      `);
    }
    
    console.log(info('💡 Para ejecutar el análisis del bundle, usa el comando:'));
    console.log(info('ANALYZE=true npm run build'));
  } catch (err) {
    console.log(error('❌ Error al analizar el tamaño del bundle:'), err);
  }
}

// Verificar linters y tipos
function verifyCodeQuality() {
  console.log(info('🔍 Verificando calidad del código...'));
  
  try {
    console.log(info('🧹 Ejecutando linting...'));
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      console.log(success('✅ Linting completado sin errores.'));
    } catch (_err) {
      // Error is intentionally unused as we just want to report linting issues
      console.log(warning('⚠️ Se encontraron errores de linting.'));
    }
    
    console.log(info('🔍 Verificando tipos TypeScript...'));
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      console.log(success('✅ Verificación de tipos completada sin errores.'));
    } catch (_err) {
      // Error is intentionally unused as we just want to report type issues
      console.log(warning('⚠️ Se encontraron errores de tipos en TypeScript.'));
    }
  } catch (err) {
    console.log(error('❌ Error al verificar la calidad del código:'), err);
  }
}

// Ejecutar verificaciones
async function runOptimizations() {
  checkDependencies();
  validateEnvVariables();
  optimizeImages();
  analyzeBundleSize();
  verifyCodeQuality();
  
  console.log(success('✅ Proceso de optimización completado.'));
  console.log(info('💡 Revisa los mensajes anteriores para ver si hay acciones pendientes.'));
  console.log(info('🚀 Para construir la aplicación para producción, ejecuta: npm run build'));
}

runOptimizations().catch(err => {
  console.error(error('❌ Error en el proceso de optimización:'), err);
  process.exit(1);
}); 