import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Crear cliente de Supabase
  const supabase = await createClient();
  
  // Obtener info del usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  
  const url = new URL(request.url);
  const threadId = url.searchParams.get('thread_id');
  const buyerId = url.searchParams.get('buyer_id');
  const sellerId = url.searchParams.get('seller_id');
  
  // Resultados que vamos a devolver
  const results: {
    currentUser: {
      id: string;
      email: string | undefined;
    };
    thread?: {
      id: string;
      messages: unknown[];
    };
    communication?: {
      buyerToSeller?: unknown[];
      sellerToBuyer?: unknown[];
      buyerThreads?: unknown[];
      threadsMessages?: unknown[];
    };
    userMessages?: {
      sent: unknown[];
      receivedAsSeller: unknown[];
      threadReplies: unknown[];
    };
    [key: string]: unknown;
  } = {
    currentUser: {
      id: user.id,
      email: user.email
    }
  };
  
  try {
    // 1. Si se especificó un thread_id, obtener todos los mensajes de ese hilo
    if (threadId) {
      const { data: threadMessages, error: threadError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, email, full_name),
          seller:seller_id(id, email, full_name)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      
      if (threadError) throw threadError;
      
      results.thread = {
        id: threadId,
        messages: threadMessages
      };
    }
    
    // 2. Si se especificaron buyer_id y seller_id, analizar la comunicación entre ellos
    if (buyerId && sellerId) {
      // Mensajes del comprador al vendedor
      const { data: buyerToSellerMessages, error: buyerError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', buyerId)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: true });
      
      if (buyerError) throw buyerError;
      
      // Mensajes del vendedor al comprador
      const { data: sellerToBuyerMessages, error: sellerError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', sellerId)
        .eq('seller_id', sellerId) // El seller_id sigue siendo el mismo
        .order('created_at', { ascending: true });
      
      if (sellerError) throw sellerError;
      
      // Hilos donde participa el comprador
      const { data: buyerThreads, error: buyerThreadsError } = await supabase
        .from('messages')
        .select('thread_id')
        .eq('sender_id', buyerId)
        .not('thread_id', 'is', null)
        .order('created_at', { ascending: true });
      
      if (buyerThreadsError) throw buyerThreadsError;
      
      // Todos los mensajes en esos hilos
      const threadIds = [...new Set(buyerThreads.map((m: { thread_id: string | null }) => m.thread_id as string))];
      let threadsMessages: unknown[] = [];
      
      if (threadIds.length > 0) {
        const { data: allThreadsMessages, error: allThreadsError } = await supabase
          .from('messages')
          .select('*')
          .in('thread_id', threadIds)
          .order('created_at', { ascending: true });
        
        if (allThreadsError) throw allThreadsError;
        threadsMessages = allThreadsMessages || [];
      }
      
      results.communication = {
        buyerToSeller: buyerToSellerMessages,
        sellerToBuyer: sellerToBuyerMessages,
        buyerThreads: buyerThreads,
        threadsMessages: threadsMessages
      };
    }
    
    // 3. Análisis de los mensajes para el usuario actual
    const { data: userSentMessages, error: sentError } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: true });
    
    if (sentError) throw sentError;
    
    const { data: userReceivedAsSeller, error: receivedError } = await supabase
      .from('messages')
      .select('*')
      .eq('seller_id', user.id)
      .neq('sender_id', user.id)
      .order('created_at', { ascending: true });
    
    if (receivedError) throw receivedError;
    
    // Obtener todos los thread_id donde el usuario ha enviado mensajes
    const userThreadIds = (userSentMessages || [])
      .filter((msg: { thread_id: string | null }) => msg.thread_id)
      .map((msg: { thread_id: string | null }) => msg.thread_id as string);
    
    const uniqueThreadIds = [...new Set(userThreadIds)];
    
    // Obtener respuestas a esos hilos
    let threadReplies: unknown[] = [];
    if (uniqueThreadIds.length > 0) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('thread_id', uniqueThreadIds)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      threadReplies = data || [];
    }
    
    results.userMessages = {
      sent: userSentMessages,
      receivedAsSeller: userReceivedAsSeller,
      threadReplies: threadReplies
    };
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error en endpoint de debug de mensajes:', error);
    return NextResponse.json(
      { error: 'Error interno', details: error }, 
      { status: 500 }
    );
  }
} 