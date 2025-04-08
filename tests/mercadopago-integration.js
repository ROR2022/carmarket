/**
 * Prueba de Integración con Mercado Pago
 * 
 * Este archivo contiene pruebas para verificar la integración completa
 * del sistema de reservas con Mercado Pago.
 * 
 * Ejecutar las pruebas:
 * 1. Configurar las variables de entorno para test
 * 2. Ejecutar: node tests/mercadopago-integration.js
 */

import { _describe, _it, _expect } from 'jest';
import _mercadopago from 'mercadopago';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Configuración de prueba
const config = {
  // Credenciales de Mercado Pago para testing (reemplazar con variables de entorno)
  mercadoPagoPublicKey: process.env.MP_PUBLIC_KEY_TEST || 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  mercadoPagoAccessToken: process.env.MP_ACCESS_TOKEN_TEST || 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  
  // URL del servidor (localhost o ambiente de staging)
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  
  // Datos de prueba
  testData: {
    listingId: '123e4567-e89b-12d3-a456-426614174000',  // Reemplazar con un ID válido del ambiente de prueba
    userId: '123e4567-e89b-12d3-a456-426614174123',     // Reemplazar con un ID válido del ambiente de prueba
    reservationAmount: 1000.0
  }
};

/**
 * Realiza una prueba completa del flujo de reserva
 */
async function runIntegrationTest() {
  console.log('🧪 Iniciando pruebas de integración con Mercado Pago...');
  
  try {
    // 1. Verificar credenciales de Mercado Pago
    await testCredentials();
    
    // 2. Crear una reserva
    const reservationId = await createTestReservation();
    
    // 3. Obtener la preferencia de pago
    const preferenceId = await getPaymentPreference(reservationId);
    
    // 4. Simular un pago exitoso
    const paymentId = await simulatePayment(preferenceId, 'approved');
    
    // 5. Simular llamada al webhook
    await simulateWebhook(paymentId);
    
    // 6. Verificar estado final de la reserva
    await verifyReservationStatus(reservationId, 'approved');
    
    // 7. Verificar notificaciones enviadas
    await verifyNotifications(reservationId);
    
    console.log('✅ Todas las pruebas completadas con éxito');
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

/**
 * Verifica que las credenciales de Mercado Pago sean válidas
 */
async function testCredentials() {
  console.log('📝 Verificando credenciales de Mercado Pago...');
  
  try {
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${config.mercadoPagoAccessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error verificando credenciales: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Respuesta inesperada al verificar credenciales');
    }
    
    console.log('✅ Credenciales verificadas correctamente');
  } catch (error) {
    console.error('❌ Error verificando credenciales:', error);
    throw error;
  }
}

/**
 * Crea una reserva de prueba
 */
async function createTestReservation() {
  console.log('📝 Creando reserva de prueba...');
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/reservations/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        listingId: config.testData.listingId,
        userId: config.testData.userId,
        amount: config.testData.reservationAmount
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error creando reserva: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.reservationId) {
      throw new Error('No se obtuvo ID de reserva');
    }
    
    console.log(`✅ Reserva creada con ID: ${data.reservationId}`);
    return data.reservationId;
  } catch (error) {
    console.error('❌ Error creando reserva:', error);
    throw error;
  }
}

/**
 * Obtiene una preferencia de pago para la reserva
 */
async function getPaymentPreference(reservationId) {
  console.log(`📝 Obteniendo preferencia de pago para reserva ${reservationId}...`);
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/reservations/${reservationId}/payment`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error obteniendo preferencia: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.preferenceId) {
      throw new Error('No se obtuvo ID de preferencia');
    }
    
    console.log(`✅ Preferencia de pago obtenida: ${data.preferenceId}`);
    return data.preferenceId;
  } catch (error) {
    console.error('❌ Error obteniendo preferencia:', error);
    throw error;
  }
}

/**
 * Simula un pago en Mercado Pago Sandbox
 */
async function simulatePayment(preferenceId, status = 'approved') {
  console.log(`📝 Simulando pago ${status} para preferencia ${preferenceId}...`);
  
  // En un entorno real, esto se haría a través de la API de Mercado Pago
  // Para pruebas, simplemente generamos un ID de pago ficticio
  const paymentId = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  
  console.log(`✅ Pago simulado con ID: ${paymentId}`);
  return paymentId;
}

/**
 * Simula una llamada al webhook de Mercado Pago
 */
async function simulateWebhook(paymentId, status = 'approved') {
  console.log(`📝 Simulando webhook para pago ${paymentId}...`);
  
  try {
    // Crear payload similar al que enviaría Mercado Pago
    const payload = {
      action: 'payment.updated',
      api_version: 'v1',
      data: {
        id: paymentId
      },
      date_created: new Date().toISOString(),
      id: crypto.randomUUID(),
      live_mode: false,
      type: 'payment',
      user_id: '123456789'
    };
    
    // Simular llamada al webhook
    const response = await fetch(`${config.apiBaseUrl}/api/webhooks/mercadopago`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // En producción, Mercado Pago incluye cabeceras de firma que deberían verificarse
        'X-Test-Webhook': 'true'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Error en llamada al webhook: ${response.status} ${response.statusText}`);
    }
    
    console.log('✅ Llamada al webhook simulada correctamente');
  } catch (error) {
    console.error('❌ Error simulando webhook:', error);
    throw error;
  }
}

/**
 * Verifica que el estado final de la reserva sea el esperado
 */
async function verifyReservationStatus(reservationId, expectedStatus) {
  console.log(`📝 Verificando estado de reserva ${reservationId}...`);
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/reservations/${reservationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error obteniendo reserva: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.paymentStatus !== expectedStatus) {
      throw new Error(`Estado incorrecto. Esperado: ${expectedStatus}, Obtenido: ${data.paymentStatus}`);
    }
    
    if (expectedStatus === 'approved' && data.status !== 'reserved') {
      throw new Error(`Estado de listado incorrecto. Esperado: reserved, Obtenido: ${data.status}`);
    }
    
    console.log(`✅ Estado de reserva verificado: ${data.paymentStatus}`);
  } catch (error) {
    console.error('❌ Error verificando estado de reserva:', error);
    throw error;
  }
}

/**
 * Verifica que se hayan enviado las notificaciones correspondientes
 */
async function verifyNotifications(reservationId) {
  console.log(`📝 Verificando notificaciones para reserva ${reservationId}...`);
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/test/notifications/${reservationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error verificando notificaciones: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.buyerNotified || !data.sellerNotified) {
      throw new Error('No se enviaron todas las notificaciones necesarias');
    }
    
    console.log('✅ Notificaciones verificadas correctamente');
  } catch (error) {
    console.error('❌ Error verificando notificaciones:', error);
    throw error;
  }
}

// Ejecutar pruebas si se ejecuta directamente
if (require.main === module) {
  runIntegrationTest();
}

module.exports = {
  runIntegrationTest,
  testCredentials,
  createTestReservation,
  getPaymentPreference,
  simulatePayment,
  simulateWebhook,
  verifyReservationStatus,
  verifyNotifications
}; 