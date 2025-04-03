'use client';

import { createClient } from '@/utils/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user || null);
        
        // Si hay un usuario, verificar si es admin
        if (session?.user) {
          const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin');
          
          if (!adminError) {
            setIsAdmin(isAdminData || false);
          } else {
            console.error('Error checking admin status:', adminError);
            setIsAdmin(false);
          }
        }
      }
      
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      
      // Verificar estado de admin cuando cambia la autenticación
      if (session?.user) {
        const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin');
        
        if (!adminError) {
          setIsAdmin(isAdminData || false);
        } else {
          console.error('Error checking admin status:', adminError);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/sign-in');
  };

  return {
    user,
    session,
    signOut,
    loading,
    isAuthenticated: !!user,
    isAdmin
  };
} 