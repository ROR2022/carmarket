'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CarListingForm } from '@/components/sell/car-listing-form';
import { ListingFormData } from '@/types/listing';
import { useTranslation } from '@/utils/translation-context';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/utils/auth-hooks';

export default function ListingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Manejar envío del formulario
  const handleSubmit = async (data: ListingFormData) => {
    try {
      setIsSubmitting(true);
      
      // Simulamos retraso de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // En producción, aquí enviaríamos los datos a la API
      console.log('Datos del formulario enviados:', data);
      
      // Redireccionamos a la página de mis anuncios
      toast({
        title: t('sell.listing.form.listingPublished'),
        description: 'ID: ' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      });
      
      // Simulamos retraso antes de redirigir
      setTimeout(() => {
        router.push('/sell/my-listings');
      }, 2000);
    } catch (error) {
      console.error('Error al publicar anuncio:', error);
      toast({
        title: 'Error',
        description: 'Ha ocurrido un error al publicar el anuncio. Por favor, inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guardar borrador
  const handleSaveDraft = async (data: ListingFormData) => {
    try {
      setIsSavingDraft(true);
      
      // Simulamos retraso de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En producción, aquí enviaríamos los datos a la API para guardar como borrador
      console.log('Datos de borrador guardados:', data);
      
      toast({
        title: t('sell.listing.form.draftSaved'),
        description: 'ID: ' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      });
    } catch (error) {
      console.error('Error al guardar borrador:', error);
      toast({
        title: 'Error',
        description: 'Ha ocurrido un error al guardar el borrador. Por favor, inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Previsualizar anuncio
  const handlePreview = (data: ListingFormData) => {
    // En una implementación real, podríamos almacenar estos datos en un estado global
    // o localStorage y redirigir a una página de vista previa
    console.log('Vista previa:', data);
    
    // Por ahora solo mostramos un toast
    toast({
      title: 'Vista previa',
      description: 'Función de vista previa en desarrollo'
    });
  };

  // Si está cargando la autenticación, mostrar spinner
  if (authLoading) {
    return (
      <div className="container py-10 flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  // Si no está autenticado, mostrar mensaje y botón de login
  if (!isAuthenticated) {
    return (
      <div className="container py-10">
        <div className="max-w-md mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-4">
            {t('sell.listing.pageTitle')}
          </h1>
          <p className="mb-8">
            Para publicar un vehículo, primero debes iniciar sesión en tu cuenta.
          </p>
          <Button asChild>
            <Link href="/sign-in">
              Iniciar sesión
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Formulario de listado
  return (
    <div className="container py-10">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {t('sell.listing.pageTitle')}
        </h1>
        <p className="max-w-[800px] text-muted-foreground md:text-xl">
          {t('sell.listing.pageSubtitle')}
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <CarListingForm 
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          onPreview={handlePreview}
          isSubmitting={isSubmitting}
          isSavingDraft={isSavingDraft}
        />
      </div>
    </div>
  );
} 