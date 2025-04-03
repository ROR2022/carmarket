'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/utils/translation-context';
import { Loader2, Edit, Trash, Eye, Star, ShieldAlert, Clock, PlusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/utils/auth-hooks';
import { CarListing, ListingStatus } from '@/types/listing';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';
import { ListingService } from '@/services/listings';

// Formatear fecha relativa
const formatRelativeDate = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
};

// Formatear moneda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(value);
};

export default function MyListingsPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Record<ListingStatus, CarListing[]>>({
    active: [],
    pending: [],
    sold: [],
    expired: [],
    draft: [],
    rejected: [],
    approved: [],
    changes_requested: []
  });
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  // Cargar anuncios del usuario
  useEffect(() => {
    const loadUserListings = async () => {
      if (isAuthenticated && user && !authLoading) {
        try {
          setLoading(true);
          const userListings = await ListingService.getUserListings(user.id);
          setListings(userListings);
        } catch (error) {
          console.error('Error cargando anuncios:', error);
          toast({
            title: 'Error',
            description: 'No se pudieron cargar tus anuncios. Por favor, intenta de nuevo.',
            variant: 'destructive'
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserListings();
  }, [isAuthenticated, user, authLoading]);

  // Eliminar un anuncio
  const handleDeleteListing = async () => {
    if (!selectedListingId || !user) return;
    
    try {
      await ListingService.deleteListing(selectedListingId, user.id);
      
      // Actualizar el estado local
      const updatedListings = { ...listings };
      const listingStatus = Object.keys(updatedListings).find((status) => 
        updatedListings[status as ListingStatus].some(listing => listing.id === selectedListingId)
      ) as ListingStatus;
      
      if (listingStatus) {
        updatedListings[listingStatus] = updatedListings[listingStatus].filter(
          listing => listing.id !== selectedListingId
        );
        setListings(updatedListings);
      }
      
      toast({
        title: 'Anuncio eliminado',
        description: 'El anuncio ha sido eliminado correctamente'
      });
    } catch (error) {
      console.error('Error eliminando anuncio:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el anuncio. Por favor, intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedListingId(null);
    }
  };

  // Cambiar estado de un anuncio
  const handleStatusChange = async (listingId: string, newStatus: ListingStatus) => {
    if (!user) return;
    
    try {
      // Llamar al servicio para cambiar el estado
      await ListingService.changeListingStatus(listingId, newStatus, user.id);
      
      // Encontrar el anuncio y su estado actual
      let currentStatus: ListingStatus | undefined;
      let targetListing: CarListing | undefined;
      
      Object.entries(listings).forEach(([status, statusListings]) => {
        const found = statusListings.find(listing => listing.id === listingId);
        if (found) {
          currentStatus = status as ListingStatus;
          targetListing = found;
        }
      });
      
      if (currentStatus && targetListing) {
        // Crear copia del estado actual
        const updatedListings = { ...listings };
        
        // Eliminar el anuncio de su estado actual
        updatedListings[currentStatus] = updatedListings[currentStatus].filter(
          listing => listing.id !== listingId
        );
        
        // Añadir el anuncio al nuevo estado
        const updatedListing = { 
          ...targetListing, 
          status: newStatus,
          updatedAt: new Date().toISOString() 
        };
        
        // Añadir al nuevo estado
        updatedListings[newStatus] = [...updatedListings[newStatus], updatedListing];
        
        // Actualizar estado
        setListings(updatedListings);
        
        toast({
          title: 'Estado actualizado',
          description: `El anuncio ahora está ${newStatus === 'sold' ? 'marcado como vendido' : 'en estado ' + newStatus}`
        });
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado del anuncio. Por favor, intenta de nuevo.',
        variant: 'destructive'
      });
    }
  };

  // Toggle destacado
  const handleToggleFeatured = async (listingId: string) => {
    if (!user) return;
    
    try {
      // Primero encontramos el anuncio para saber su estado actual de destacado
      let targetListing: CarListing | undefined;
      let listingStatus: ListingStatus | undefined;
      
      Object.entries(listings).forEach(([status, statusListings]) => {
        const found = statusListings.find(listing => listing.id === listingId);
        if (found) {
          targetListing = found;
          listingStatus = status as ListingStatus;
        }
      });
      
      if (!targetListing || !listingStatus) return;
      
      const newFeaturedStatus = !targetListing.isFeatured;
      
      // Llamar al servicio para cambiar el estado destacado
      await ListingService.toggleFeatured(listingId, newFeaturedStatus, user.id);
      
      // Actualizar el estado local
      const updatedListings = { ...listings };
      updatedListings[listingStatus] = updatedListings[listingStatus].map(listing => 
        listing.id === listingId 
          ? { ...listing, isFeatured: newFeaturedStatus } 
          : listing
      );
      
      setListings(updatedListings);
      
      toast({
        title: newFeaturedStatus ? 'Anuncio destacado' : 'Anuncio no destacado',
        description: newFeaturedStatus 
          ? 'Tu anuncio ahora aparecerá como destacado' 
          : 'Tu anuncio ya no aparecerá como destacado'
      });
    } catch (error) {
      console.error('Error cambiando estado destacado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado destacado del anuncio. Por favor, intenta de nuevo.',
        variant: 'destructive'
      });
    }
  };

  // Renovar un anuncio expirado (reactivarlo)
  const handleRenewListing = async (listingId: string) => {
    // Este es esencialmente un cambio de estado de 'expired' a 'active'
    await handleStatusChange(listingId, 'active');
  };

  // Si está cargando la autenticación o los datos, mostrar spinner
  if (authLoading || loading) {
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
            {t('sell.myListings.pageTitle')}
          </h1>
          <p className="mb-8">
            Para ver tus anuncios, primero debes iniciar sesión en tu cuenta.
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

  // Componente para mostrar estado vacío
  const EmptyState = () => (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{t('sell.myListings.empty.title')}</h3>
        <p className="text-muted-foreground mb-6">{t('sell.myListings.empty.description')}</p>
        <Button asChild>
          <Link href="/sell/list">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('sell.myListings.empty.actionButton')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  // Obtener la insignia según el estado
  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">{t('sell.myListings.status.active')}</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t('sell.myListings.status.pending')}</Badge>;
      case 'sold':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">{t('sell.myListings.status.sold')}</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">{t('sell.myListings.status.expired')}</Badge>;
      case 'draft':
        return <Badge variant="outline">{t('sell.myListings.status.draft')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('sell.myListings.status.rejected')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {t('sell.myListings.pageTitle')}
        </h1>
        <p className="max-w-[800px] text-muted-foreground md:text-xl">
          {t('sell.myListings.pageSubtitle')}
        </p>
      </div>
      
      <div className="mb-6 flex justify-between items-center">
        <div></div>
        <Button asChild>
          <Link href="/sell/list">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('sell.myListings.empty.actionButton')}
          </Link>
        </Button>
      </div>
      
      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active">
            {t('sell.myListings.tabs.active')} ({listings.active.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            {t('sell.myListings.tabs.pending')} ({listings.pending.length})
          </TabsTrigger>
          <TabsTrigger value="sold">
            {t('sell.myListings.tabs.sold')} ({listings.sold.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            {t('sell.myListings.tabs.expired')} ({listings.expired.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            {t('sell.myListings.tabs.draft')} ({listings.draft.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            {t('sell.myListings.tabs.rejected')} ({listings.rejected.length})
          </TabsTrigger>
        </TabsList>
        
        {Object.keys(listings).map((status) => {
          const statusKey = status as keyof typeof listings;
          const statusListings = listings[statusKey];
          
          return (
            <TabsContent key={status} value={status} className="w-full">
              {statusListings.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('sell.myListings.table.vehicle')}</TableHead>
                        <TableHead>{t('sell.myListings.table.price')}</TableHead>
                        <TableHead>{t('sell.myListings.table.status')}</TableHead>
                        <TableHead className="text-center">{t('sell.myListings.table.views')}</TableHead>
                        <TableHead className="text-center">{t('sell.myListings.table.contacts')}</TableHead>
                        <TableHead>{t('sell.myListings.table.publishDate')}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statusListings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <div className="relative h-10 w-16 overflow-hidden rounded">
                                <Image 
                                  src={listing.images[0]} 
                                  alt={listing.title}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-medium">{listing.title}</p>
                                <p className="text-xs text-muted-foreground">{listing.location}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatCurrency(listing.price)}</p>
                              {listing.isFeatured && (
                                <Badge variant="secondary" className="ml-1">
                                  <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                  Destacado
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(listing.status)}
                          </TableCell>
                          <TableCell className="text-center">{listing.viewCount}</TableCell>
                          <TableCell className="text-center">{listing.contactCount}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatRelativeDate(listing.createdAt)}
                              {listing.status === 'active' && (
                                <p className="text-xs text-muted-foreground">
                                  Expira: {formatRelativeDate(listing.expiresAt)}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>{t('sell.myListings.actions.view')}</span>
                                </DropdownMenuItem>
                                
                                {/* Editar solo disponible para activos, pendientes y borradores */}
                                {['active', 'pending', 'draft'].includes(listing.status) && (
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>{t('sell.myListings.actions.edit')}</span>
                                  </DropdownMenuItem>
                                )}
                                
                                {/* Marcar como vendido solo para activos */}
                                {listing.status === 'active' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(listing.id, 'sold')}>
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    <span>{t('sell.myListings.actions.markAsSold')}</span>
                                  </DropdownMenuItem>
                                )}
                                
                                {/* Destacar/no destacar solo para activos */}
                                {listing.status === 'active' && (
                                  <DropdownMenuItem onClick={() => handleToggleFeatured(listing.id)}>
                                    <Star className="mr-2 h-4 w-4" />
                                    <span>{listing.isFeatured ? 'Quitar destacado' : t('sell.myListings.actions.feature')}</span>
                                  </DropdownMenuItem>
                                )}
                                
                                {/* Pausar disponible para activos */}
                                {listing.status === 'active' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(listing.id, 'draft')}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    <span>{t('sell.myListings.actions.pause')}</span>
                                  </DropdownMenuItem>
                                )}
                                
                                {/* Activar disponible para borradores */}
                                {listing.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(listing.id, 'active')}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    <span>{t('sell.myListings.actions.activate')}</span>
                                  </DropdownMenuItem>
                                )}
                                
                                {/* Renovar disponible para expirados */}
                                {listing.status === 'expired' && (
                                  <DropdownMenuItem onClick={() => handleRenewListing(listing.id)}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    <span>{t('sell.myListings.actions.renew')}</span>
                                  </DropdownMenuItem>
                                )}
                                
                                {/* Eliminar disponible para todos */}
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedListingId(listing.id);
                                    setDeleteConfirmOpen(true);
                                  }}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  <span>{t('sell.myListings.actions.delete')}</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sell.myListings.deleteConfirm.title')}</DialogTitle>
            <DialogDescription>
              {t('sell.myListings.deleteConfirm.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              {t('sell.myListings.deleteConfirm.cancelButton')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteListing}>
              {t('sell.myListings.deleteConfirm.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 