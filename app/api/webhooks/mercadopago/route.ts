import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getPaymentById } from "@/services/mercado-pago";
import { ListingService } from "@/services/listings";
import { NotificationService } from "@/services/notification";
import { MessageService } from "@/services/message";
import { CarReservation, PaymentStatus } from "@/types/reservation";

// Tipo para la reserva que se obtiene de la base de datos
interface DbReservation {
  id: string;
  listing_id: string;
  user_id: string;
  reservation_amount: number;
  payment_id: string;
  payment_status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Tipo para el pago de Mercado Pago
interface MercadoPagoPayment {
  id: string | number;
  status: string;
  external_reference?: string;
  preference_id?: string;
  metadata?: {
    type?: string;
    listing_id?: string;
  };
  additional_info?: {
    external_reference?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar la firma del webhook (no implementado para desarrollo)
    // TODO: Para producción, verificar la firma del webhook
    
    const payload = await request.json();
    console.log('Received webhook payload:', JSON.stringify(payload));
    
    // Solo procesar notificaciones de pagos
    if (payload.action === 'payment.created' || payload.action === 'payment.updated') {
      const paymentId = payload.data.id;
      const paymentData = await getPaymentById(paymentId);
      
      console.warn("webhook, paymentData: ", paymentData);
      if (paymentData) {
        await processPayment(paymentData as unknown as MercadoPagoPayment);
      } else {
        console.error('Failed to fetch payment data for ID:', paymentId);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function processPayment(payment: MercadoPagoPayment) {
  const supabase = await createClient();
  
  // Extraer datos del pago
  const paymentId = payment.id.toString();
  const paymentStatus = payment.status;
  const metadata = payment.metadata || {};
  
  console.log(`Processing payment ${paymentId} with status ${paymentStatus}`);
  
  // Verificar que sea un pago de reserva
  if (!metadata || metadata.type !== 'reservation') {
    console.log('Not a reservation payment, skipping');
    return;
  }
  
  const _listingId = metadata.listing_id;
  
  // Buscar la reserva asociada al pago
  const { data: reservations, error: reservationError } = await supabase
    .from('car_reservations')
    .select('*')
    .eq('payment_id', paymentId);
  
  if (reservationError) {
    console.error('Error finding reservations:', reservationError);
    return;
  }
  
  // Si no hay reserva con este payment_id, podría ser porque:
  // 1. Se está usando el preference_id como payment_id inicialmente
  // 2. Es la primera notificación que recibimos para este pago
  
  if (!reservations || reservations.length === 0) {
    // Buscar por reference_id o external_reference si está disponible
    const referenceId = payment.external_reference || 
                       payment.additional_info?.external_reference || 
                       payment.preference_id;
    
    let reservationData: DbReservation | null = null;
    //2351778277-a81bdf0e-9be8-451c-8723-0c5ed0b9cf9f
    //107253921705
    if (referenceId) {
      const { data, error } = await supabase
        .from('car_reservations')
        .select('*')
        .eq('payment_id', referenceId);
      
      if (!error && data && data.length > 0) {
        reservationData = data[0] as DbReservation;
      }
    }
    
    // Si no encontramos la reserva, no podemos proceder
    if (!reservationData) {
      console.error('Cannot find reservation for payment:', paymentId);
      return;
    }
    
    // Actualizar el payment_id con el ID real del pago
    await supabase
      .from('car_reservations')
      .update({ 
        payment_id: paymentId,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationData.id);
    
    // Si el pago fue aprobado, marcar el listado como reservado
    if (paymentStatus === 'approved') {
      await ListingService.reserveListing(reservationData.listing_id);
      
      // Enviar notificaciones de pago aprobado
      await sendPaymentApprovalNotifications(reservationData);
    } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
      // Si el pago fue rechazado o cancelado, enviar notificaciones
      await sendPaymentRejectionNotifications(reservationData);
    }
  } else {
    // Ya existe una reserva, actualizar su estado
    const reservation = reservations[0] as DbReservation;
    const previousStatus = reservation.payment_status;
    
    // Actualizar el estado del pago
    await supabase
      .from('car_reservations')
      .update({ 
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', reservation.id);
    
    // Si el pago cambió a estado aprobado, procesar la reserva
    if (paymentStatus === 'approved' && previousStatus !== 'approved') {
      await ListingService.reserveListing(reservation.listing_id);
      
      // Enviar notificaciones de pago aprobado
      await sendPaymentApprovalNotifications(reservation);
    }
    
    // Si el pago fue rechazado, enviar notificaciones apropiadas
    if ((paymentStatus === 'rejected' || paymentStatus === 'cancelled') && 
        previousStatus !== 'rejected' && previousStatus !== 'cancelled') {
      await sendPaymentRejectionNotifications(reservation);
      
      // Si el pago estaba aprobado y ahora está rechazado o cancelado,
      // liberar la reserva del listado
      if (previousStatus === 'approved') {
        await ListingService.releaseReservation(reservation.listing_id);
      }
    }
  }
}

/**
 * Envía notificaciones cuando un pago es aprobado
 * Utiliza el NotificationService para enviar emails y notificaciones en app
 * tanto al vendedor como al comprador, y crea un hilo de comunicación entre ambos
 */
async function sendPaymentApprovalNotifications(reservation: DbReservation) {
  try {
    // Obtener detalles adicionales necesarios para la notificación
    const supabase = await createClient();
    
    // 1. Obtener detalles del vehículo
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('title, seller_id')
      .eq('id', reservation.listing_id)
      .single();
    
    if (listingError || !listing) {
      console.error('Error fetching listing for notification:', listingError);
      return;
    }
    
    // 2. Obtener información del vendedor
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', listing.seller_id)
      .single();
    
    if (sellerError || !seller) {
      console.error('Error fetching seller for notification:', sellerError);
      return;
    }
    
    // 3. Obtener información del comprador
    const { data: buyer, error: buyerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', reservation.user_id)
      .single();
    
    if (buyerError || !buyer) {
      console.error('Error fetching buyer for notification:', buyerError);
      return;
    }
    
    // Formatear la reserva para el servicio de notificaciones
    const reservationFormatted: CarReservation = {
      id: reservation.id,
      listingId: reservation.listing_id,
      userId: reservation.user_id,
      reservationAmount: reservation.reservation_amount,
      paymentId: reservation.payment_id,
      paymentStatus: reservation.payment_status as PaymentStatus,
      expiresAt: reservation.expires_at,
      createdAt: reservation.created_at,
      updatedAt: reservation.updated_at
    };
    
    // Enviar notificaciones usando el servicio
    await NotificationService.notifyReservationPaid(
      reservationFormatted,
      listing.seller_id,
      seller.email,
      buyer.email,
      listing.title,
      reservation.expires_at
    );
    
    // Crear un hilo de comunicación entre comprador y vendedor
    const threadId = await MessageService.createReservationThread(
      listing.seller_id,
      reservation.user_id,
      reservation.listing_id,
      reservation.id
    );
    
    if (threadId) {
      console.log(`Created communication thread ${threadId} for reservation ${reservation.id}`);
    }
    
    console.log('Payment approval notifications sent successfully');
  } catch (error) {
    console.error('Error sending payment approval notifications:', error);
    // No lanzamos el error para no interrumpir el flujo principal
  }
}

/**
 * Envía notificaciones cuando un pago es rechazado
 */
async function sendPaymentRejectionNotifications(reservation: DbReservation) {
  try {
    const supabase = await createClient();
    
    // Obtener detalles del vehículo y usuarios
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('title, seller_id')
      .eq('id', reservation.listing_id)
      .single();
    
    if (listingError || !listing) {
      console.error('Error fetching listing for rejection notification:', listingError);
      return;
    }
    
    // Obtener información del vendedor
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', listing.seller_id)
      .single();
    
    if (sellerError || !seller) {
      console.error('Error fetching seller for rejection notification:', sellerError);
      return;
    }
    
    // Obtener información del comprador
    const { data: buyer, error: buyerError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', reservation.user_id)
      .single();
    
    if (buyerError || !buyer) {
      console.error('Error fetching buyer for rejection notification:', buyerError);
      return;
    }
    
    // Formatear la reserva para el servicio de notificaciones
    const reservationFormatted: CarReservation = {
      id: reservation.id,
      listingId: reservation.listing_id,
      userId: reservation.user_id,
      reservationAmount: reservation.reservation_amount,
      paymentId: reservation.payment_id,
      paymentStatus: reservation.payment_status as PaymentStatus,
      expiresAt: reservation.expires_at,
      createdAt: reservation.created_at,
      updatedAt: reservation.updated_at
    };
    
    // Enviar notificaciones usando el servicio
    await NotificationService.notifyReservationCancelled(
      reservationFormatted,
      listing.seller_id,
      seller.email,
      buyer.email,
      listing.title,
      'El pago no pudo ser procesado'
    );
    
    console.log('Payment rejection notifications sent successfully');
  } catch (error) {
    console.error('Error sending payment rejection notifications:', error);
  }
} 