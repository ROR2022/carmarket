import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Crear cliente de Supabase (que ahora devuelve una promesa)
  const supabase = await createClient();
  
  // Obtener info del usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  
  const url = new URL(request.url);
  const threadId = url.searchParams.get('thread_id');
  
  if (!threadId) {
    return NextResponse.json({ error: 'Se requiere thread_id como parámetro' }, { status: 400 });
  }
  
  try {
    // 1. Obtener todos los mensajes del hilo
    const { data: threadMessages, error: threadError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, email, full_name, phone),
        seller:seller_id(id, email, full_name, phone)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    
    if (threadError) {
      throw threadError;
    }
    
    // 2. Clasificar los mensajes según quién los envió
    const messagesByRole = {
      asSeller: threadMessages?.filter(msg => msg.seller_id === user.id) || [],
      asBuyer: threadMessages?.filter(msg => msg.sender_id === user.id && msg.seller_id !== user.id) || [],
      fromOthers: threadMessages?.filter(msg => msg.sender_id !== user.id && msg.seller_id !== user.id) || [],
      all: threadMessages || []
    };
    
    // 3. Verificar los permisos del usuario para este hilo
    const userRoles = [];
    if (messagesByRole.asSeller.length > 0) userRoles.push('vendedor');
    if (messagesByRole.asBuyer.length > 0) userRoles.push('comprador');
    
    const canAccessThread = messagesByRole.asSeller.length > 0 || 
                           messagesByRole.asBuyer.length > 0;
    
    // 4. Preparar el resultado para mostrar al usuario
    const result = {
      threadId,
      currentUser: {
        id: user.id,
        email: user.email,
        roles: userRoles,
        canAccessThread
      },
      conversationSummary: {
        totalMessages: threadMessages?.length || 0,
        messagesAsSeller: messagesByRole.asSeller.length,
        messagesAsBuyer: messagesByRole.asBuyer.length,
        messagesFromOthers: messagesByRole.fromOthers.length
      },
      messages: threadMessages?.map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender?.full_name || msg.sender?.email || msg.sender_id,
        sellerId: msg.seller_id,
        sellerName: msg.seller?.full_name || msg.seller?.email || msg.seller_id,
        subject: msg.subject,
        message: msg.message?.substring(0, 50) + (msg.message?.length > 50 ? '...' : ''),
        createdAt: msg.created_at,
        readAt: msg.read_at,
        parentMessageId: msg.parent_message_id,
        threadId: msg.thread_id,
        isUserSender: msg.sender_id === user.id,
        isUserSeller: msg.seller_id === user.id,
      }))
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en endpoint de diagnóstico de conversación:', error);
    return NextResponse.json(
      { error: 'Error interno', details: error }, 
      { status: 500 }
    );
  }
} 