import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Endpoint de prueba para verificar notificaciones enviadas
 * Solo disponible en entorno de desarrollo y pruebas
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar que estemos en un entorno de desarrollo o pruebas
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Este endpoint solo está disponible en entornos de desarrollo' },
      { status: 403 }
    );
  }

  const reservationId = (await params).id;
  
  if (!reservationId) {
    return NextResponse.json(
      { error: 'Se requiere ID de reserva' },
      { status: 400 }
    );
  }
  
  try {
    const supabase = await createClient();
    
    // Obtener detalles de la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('car_reservations')
      .select('user_id, listing_id')
      .eq('id', reservationId)
      .single();
      
    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }
    
    // Obtener el seller_id del listado
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', reservation.listing_id)
      .single();
      
    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listado no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar notificaciones para comprador
    const { count: buyerNotificationCount, error: buyerError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', reservation.user_id)
      .eq('related_id', reservationId);
      
    // Verificar notificaciones para vendedor
    const { count: sellerNotificationCount, error: sellerError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', listing.seller_id)
      .eq('related_id', reservationId);
      
    if (buyerError || sellerError) {
      return NextResponse.json(
        { error: 'Error verificando notificaciones' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      reservationId,
      buyerNotified: (buyerNotificationCount || 0) > 0,
      sellerNotified: (sellerNotificationCount || 0) > 0,
      buyerNotifications: buyerNotificationCount || 0,
      sellerNotifications: sellerNotificationCount || 0
    });
  } catch (error) {
    console.error('Error checking notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 