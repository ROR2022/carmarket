/**
 * Pruebas unitarias para el servicio de notificaciones
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotificationService } from '../../services/notification';
import { NotificationType as _NotificationType } from '../../types/notification';
import { CarReservation } from '@/types/reservation';

// Mock para createClient de Supabase
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ data: { id: 'mock-notification-id' }, error: null }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({ data: mockNotifications, error: null }))
            })),
            count: jest.fn(() => ({ count: 5, error: null }))
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({ data: mockNotifications, error: null }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ error: null }))
      }))
    }))
  }))
}));

// Datos de prueba
const mockNotifications = [
  {
    id: '1',
    user_id: 'user-1',
    type: 'reservation_created',
    title: 'Nueva reserva',
    message: 'Se ha creado una nueva reserva',
    link: '/cars/123',
    related_id: 'res-1',
    read: false,
    created_at: '2023-01-01T12:00:00.000Z'
  },
  {
    id: '2',
    user_id: 'user-1',
    type: 'reservation_paid',
    title: 'Reserva pagada',
    message: 'Se ha completado el pago de la reserva',
    link: '/cars/123',
    related_id: 'res-1',
    read: false,
    created_at: '2023-01-02T12:00:00.000Z'
  }
];

// Mock de una reserva de prueba
const mockReservation: CarReservation = {
  id: 'res-1',
  listingId: 'listing-1',
  userId: 'user-1',
  reservationAmount: 100.0,
  paymentId: 'payment-1',
  paymentStatus: 'pending',
  expiresAt: '2023-12-31T23:59:59.999Z',
  createdAt: '2023-12-01T12:00:00.000Z',
  updatedAt: '2023-12-01T12:00:00.000Z'
};

// Espiar console.log para pruebas de email
const originalConsoleLog = console.log;
let consoleLogSpy: jest.SpyInstance;

beforeEach(() => {
  // Crear un spy para console.log
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
});

afterEach(() => {
  // Restaurar console.log
  consoleLogSpy.mockRestore();
  console.log = originalConsoleLog;
});

describe('NotificationService', () => {
  describe('_sendEmail', () => {
    it('debe simular el envío de un email correctamente', async () => {
      // Ejecutar
      await NotificationService._sendEmail('test@example.com', 'Test Subject', 'Test Content');
      
      // Verificar
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('EMAIL'),
        expect.stringContaining('test@example.com'),
        expect.stringContaining('Test Subject'),
        expect.stringContaining('Test Content')
      );
    });
  });
  
  describe('createNotification', () => {
    it('debe crear una notificación correctamente', async () => {
      // Ejecutar
      const result = await NotificationService.createNotification(
        'user-1',
        'reservation_created',
        'Test Title',
        'Test Message',
        '/test-link',
        'test-related-id'
      );
      
      // Verificar
      expect(result).toBe('mock-notification-id');
    });
  });
  
  describe('getUnreadNotifications', () => {
    it('debe obtener las notificaciones no leídas', async () => {
      // Ejecutar
      const result = await NotificationService.getUnreadNotifications('user-1');
      
      // Verificar
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('1');
      expect(result[0].type).toBe('reservation_created');
    });
  });
  
  describe('getAllNotifications', () => {
    it('debe obtener todas las notificaciones con límite por defecto', async () => {
      // Ejecutar
      const result = await NotificationService.getAllNotifications('user-1');
      
      // Verificar
      expect(result.length).toBe(2);
    });
    
    it('debe obtener notificaciones con límite personalizado', async () => {
      // Ejecutar
      const result = await NotificationService.getAllNotifications('user-1', 10);
      
      // Verificar
      expect(result.length).toBe(2);
    });
  });
  
  describe('markAsRead', () => {
    it('debe marcar una notificación como leída', async () => {
      // Ejecutar y verificar que no lanza error
      await expect(NotificationService.markAsRead('notification-1')).resolves.not.toThrow();
    });
  });
  
  describe('markAllAsRead', () => {
    it('debe marcar todas las notificaciones como leídas', async () => {
      // Ejecutar y verificar que no lanza error
      await expect(NotificationService.markAllAsRead('user-1')).resolves.not.toThrow();
    });
  });
  
  describe('countUnread', () => {
    it('debe contar las notificaciones no leídas', async () => {
      // Ejecutar
      const result = await NotificationService.countUnread('user-1');
      
      // Verificar
      expect(result).toBe(5);
    });
  });
  
  describe('notifyReservationCreated', () => {
    it('debe enviar notificaciones para reserva creada', async () => {
      // Espiar los métodos internos
      const sendEmailSpy = jest.spyOn(NotificationService, '_sendEmail');
      const createNotificationSpy = jest.spyOn(NotificationService, 'createNotification');
      
      // Ejecutar
      await NotificationService.notifyReservationCreated(
        mockReservation,
        'seller-1',
        'seller@example.com',
        'buyer@example.com',
        'Test Car'
      );
      
      // Verificar
      expect(sendEmailSpy).toHaveBeenCalledTimes(2); // Dos emails: vendedor y comprador
      expect(createNotificationSpy).toHaveBeenCalledTimes(1); // Una notificación para vendedor
      
      // Restaurar espías
      sendEmailSpy.mockRestore();
      createNotificationSpy.mockRestore();
    });
  });
  
  describe('notifyReservationCancelled', () => {
    it('debe enviar notificaciones para reserva cancelada con razón', async () => {
      // Espiar los métodos internos
      const sendEmailSpy = jest.spyOn(NotificationService, '_sendEmail');
      const createNotificationSpy = jest.spyOn(NotificationService, 'createNotification');
      
      // Ejecutar
      await NotificationService.notifyReservationCancelled(
        mockReservation,
        'seller-1',
        'seller@example.com',
        'buyer@example.com',
        'Test Car',
        'Pago rechazado'
      );
      
      // Verificar
      expect(sendEmailSpy).toHaveBeenCalledTimes(2); // Dos emails: vendedor y comprador
      expect(createNotificationSpy).toHaveBeenCalledTimes(2); // Notificaciones para vendedor y comprador
      
      // Restaurar espías
      sendEmailSpy.mockRestore();
      createNotificationSpy.mockRestore();
    });
    
    it('debe enviar notificaciones para reserva cancelada sin razón', async () => {
      // Espiar los métodos internos
      const sendEmailSpy = jest.spyOn(NotificationService, '_sendEmail');
      const createNotificationSpy = jest.spyOn(NotificationService, 'createNotification');
      
      // Ejecutar
      await NotificationService.notifyReservationCancelled(
        mockReservation,
        'seller-1',
        'seller@example.com',
        'buyer@example.com',
        'Test Car'
      );
      
      // Verificar
      expect(sendEmailSpy).toHaveBeenCalledTimes(2); // Dos emails: vendedor y comprador
      expect(createNotificationSpy).toHaveBeenCalledTimes(2); // Notificaciones para vendedor y comprador
      
      // Restaurar espías
      sendEmailSpy.mockRestore();
      createNotificationSpy.mockRestore();
    });
  });
}); 