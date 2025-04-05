'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CarListingForm } from '@/components/sell/car-listing-form';
import { ListingFormData } from '@/types/listing';
import { CarCategory, Transmission, FuelType } from '@/types/car';
import { useTranslation } from '@/utils/translation-context';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/utils/auth-hooks';
import { ListingService } from '@/services/listings';
import { StorageService } from '@/services/storage';

export default function ListingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editListingId = searchParams.get('edit');
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [loadingListing, setLoadingListing] = useState(false);
  const [initialData, setInitialData] = useState<Partial<ListingFormData> | undefined>(undefined);
  const [pageTitle, setPageTitle] = useState<string>(t('sell.listing.pageTitle'));
  const [pageSubtitle, setPageSubtitle] = useState<string>(t('sell.listing.pageSubtitle'));

  // Cargar datos del anuncio si estamos editando
  useEffect(() => {
    if (editListingId && user && isAuthenticated) {
      setLoadingListing(true);
      setPageTitle(t('sell.listing.editTitle'));
      setPageSubtitle(t('sell.listing.editSubtitle'));
      
      ListingService.getListingById(editListingId)
        .then(listing => {
          if (listing) {
            // Verificar que el anuncio pertenece al usuario
            if (listing.sellerId !== user.id) {
              toast({
                title: 'Error',
                description: 'No tienes permiso para editar este anuncio',
                variant: 'destructive'
              });
              router.push('/sell/my-listings');
              return;
            }
            
            // Preparar datos iniciales para el formulario
            const formData: Partial<ListingFormData> = {
              brand: listing.brand,
              model: listing.model,
              year: listing.year,
              category: listing.category as CarCategory,
              transmission: listing.transmission as Transmission,
              fuelType: listing.fuelType as FuelType,
              mileage: listing.mileage,
              color: "", // No está disponible en el modelo CarListing
              features: listing.features,
              description: listing.description,
              location: listing.location,
              sellerName: listing.sellerName,
              sellerEmail: listing.sellerEmail,
              sellerPhone: listing.sellerPhone,
              price: listing.price,
              negotiable: false, // Valor por defecto, ajustar según necesidad
              acceptsTrade: false, // Valor por defecto, ajustar según necesidad
            };
            
            setInitialData(formData);
          } else {
            toast({
              title: 'Error',
              description: 'No se encontró el anuncio',
              variant: 'destructive'
            });
            router.push('/sell/my-listings');
          }
        })
        .catch(error => {
          console.error('Error al cargar anuncio:', error);
          toast({
            title: 'Error',
            description: 'Ha ocurrido un error al cargar el anuncio',
            variant: 'destructive'
          });
          router.push('/sell/my-listings');
        })
        .finally(() => {
          setLoadingListing(false);
        });
    }
  }, [editListingId, user, isAuthenticated, router, t]);

  // Manejar envío del formulario (crear o actualizar)
  const handleSubmit = async (data: ListingFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para publicar un anuncio',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (editListingId) {
        // Actualizar anuncio existente
        await ListingService.updateListing(editListingId, data, user.id);
        
        // Gestionar imágenes si hay nuevas
        if (data.images && data.images.length > 0) {
          const uploadedImages = await StorageService.uploadListingImages(
            data.images as File[], 
            user.id, 
            editListingId
          );
          
          await StorageService.saveListingImages(editListingId, uploadedImages);
        }
        
        // Gestionar documentos si hay nuevos
        if (data.documents && data.documents.length > 0) {
          const uploadedDocuments = await StorageService.uploadListingDocuments(
            data.documents as File[],
            user.id,
            editListingId
          );
          
          await StorageService.saveListingDocuments(editListingId, uploadedDocuments);
        }
        
        toast({
          title: t('sell.listing.form.listingUpdated'),
          description: 'ID: ' + editListingId,
        });
      } else {
        // Crear nuevo anuncio
        console.log('creando anuncio con data: ', data);
        const listingId = await ListingService.createListing(data, user.id);
        console.log('1.-listingId creado: ', listingId);
        
        // Subir imágenes
        if (data.images && data.images.length > 0) {
          const uploadedImages = await StorageService.uploadListingImages(
            data.images as File[], 
            user.id, 
            listingId
          );
          console.log('2.-uploadedImages subidas: ', uploadedImages);
          
          await StorageService.saveListingImages(listingId, uploadedImages);
          console.log('3.-saveListingImages guardadas: ', listingId);
        }
        
        // Subir documentos
        if (data.documents && data.documents.length > 0) {
          const uploadedDocuments = await StorageService.uploadListingDocuments(
            data.documents as File[],
            user.id,
            listingId
          );
          console.log('4.-uploadedDocuments subidas: ', uploadedDocuments);
          
          await StorageService.saveListingDocuments(listingId, uploadedDocuments);
          console.log('5.-saveListingDocuments guardadas: ', listingId);
        }
        
        toast({
          title: t('sell.listing.form.listingPublished'),
          description: 'ID: ' + listingId,
        });
      }
      
      // Redirigir a la página de mis anuncios
      router.push('/sell/my-listings');
      
    } catch (error) {
      console.error('Error al procesar anuncio:', error);
      toast({
        title: 'Error',
        description: 'Ha ocurrido un error al procesar el anuncio. Por favor, inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guardar borrador (solo para anuncios nuevos)
  const handleSaveDraft = async (data: ListingFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para guardar un borrador',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSavingDraft(true);
      
      // 1. Crear el anuncio como borrador
      const listingId = await ListingService.saveDraft(data, user.id);
      
      // No subimos archivos al guardar como borrador para ahorrar espacio de almacenamiento
      // Los archivos se subirán cuando el usuario decida publicar el anuncio
      
      toast({
        title: t('sell.listing.form.draftSaved'),
        description: 'ID: ' + listingId,
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

  // Si está cargando la autenticación o los datos del anuncio, mostrar spinner
  if (authLoading || loadingListing) {
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
            {pageTitle}
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

  // Formulario de listado (crear o editar)
  return (
    <div className="container py-10">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {pageTitle}
        </h1>
        <p className="max-w-[800px] text-muted-foreground md:text-xl">
          {pageSubtitle}
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <CarListingForm 
          onSubmit={handleSubmit}
          onSaveDraft={!editListingId ? handleSaveDraft : undefined}
          onPreview={handlePreview}
          initialData={initialData}
          isSubmitting={isSubmitting}
          isSavingDraft={isSavingDraft}
        />
      </div>
    </div>
  );
} 