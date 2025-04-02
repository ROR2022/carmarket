'use client';

import { useState } from 'react';
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

// Datos de prueba para simular anuncios del usuario
const generateMockListings = (count: number, status: ListingStatus): CarListing[] => {
  const statusDate = new Date();
  
  // Ajustamos la fecha según el estado
  if (status === 'expired') {
    statusDate.setDate(statusDate.getDate() - 30);
  } else if (status === 'sold') {
    statusDate.setDate(statusDate.getDate() - 15);
  } else if (status === 'pending') {
    statusDate.setDate(statusDate.getDate() - 2);
  }
  
  const expiryDate = new Date(statusDate);
  expiryDate.setDate(expiryDate.getDate() + 30);
  
  return Array.from({ length: count }, (_, i) => ({
    id: `list-${status}-${i + 1}`,
    title: `Toyota Corolla ${2018 + i % 4}`,
    brand: 'Toyota',
    model: 'Corolla',
    year: 2018 + i % 4,
    category: i % 2 === 0 ? 'sedan' : 'hatchback',
    price: 250000 + (i * 15000),
    mileage: 45000 + (i * 5000),
    fuelType: 'gasoline',
    transmission: 'automatic',
    features: ['Air Conditioning', 'Power Windows', 'Central Locking'],
    description: 'Vehículo en excelente estado, único dueño, todas las facturas de servicio.',
    location: 'Ciudad de México',
    images: [
      i % 2 === 0 
        ? '/images/cars/sedan.jpeg' 
        : '/images/cars/hatchback.jpeg'
    ],
    sellerId: 'user-1',
    sellerName: 'Juan Pérez',
    sellerEmail: 'juan@example.com',
    sellerPhone: '5551234567',
    status,
    viewCount: Math.floor(Math.random() * 200) + 20,
    contactCount: Math.floor(Math.random() * 20),
    isFeatured: i % 5 === 0,
    createdAt: statusDate.toISOString(),
    updatedAt: statusDate.toISOString(),
    expiresAt: expiryDate.toISOString(),
  }));
};

// Crear datos de muestra
const MOCK_LISTINGS = {
  active: generateMockListings(5, 'active'),
  pending: generateMockListings(2, 'pending'),
  sold: generateMockListings(3, 'sold'),
  expired: generateMockListings(2, 'expired'),
  draft: generateMockListings(1, 'draft'),
  rejected: generateMockListings(1, 'rejected'),
};

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
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  // Simular eliminación de un anuncio
  const handleDeleteListing = () => {
    if (selectedListingId) {
      // En una aplicación real, aquí llamaríamos a la API

      // Actualizar el estado local eliminando el anuncio
      const updatedListings = { ...listings };
      const listingStatus = Object.keys(updatedListings).find((status) => 
        (updatedListings as Record<string, CarListing[]>)[status].some(listing => listing.id === selectedListingId)
      ) as keyof typeof updatedListings;
      
      if (listingStatus) {
        updatedListings[listingStatus] = updatedListings[listingStatus].filter(
          listing => listing.id !== selectedListingId
        );
        setListings(updatedListings);
      }
      
      // Cerrar el diálogo de confirmación
      setDeleteConfirmOpen(false);
      setSelectedListingId(null);
    }
  };

  // Cambiar estado de un anuncio
  const handleStatusChange = (listingId: string, newStatus: ListingStatus) => {
    // En una aplicación real, aquí llamaríamos a la API
    
    // Encontrar el anuncio y su estado actual
    let currentStatus: keyof typeof listings | undefined;
    let targetListing: CarListing | undefined;
    
    Object.entries(listings).forEach(([status, statusListings]) => {
      const found = statusListings.find(listing => listing.id === listingId);
      if (found) {
        currentStatus = status as keyof typeof listings;
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
      
      // Si es vendido, actualizamos la fecha
      if (newStatus === 'sold') {
        updatedListing.updatedAt = new Date().toISOString();
      }
      
      // Añadir al nuevo estado
      updatedListings[newStatus] = [...updatedListings[newStatus], updatedListing];
      
      // Actualizar estado
      setListings(updatedListings);
    }
  };

  // Toggle destacado
  const handleToggleFeatured = (listingId: string) => {
    // En una aplicación real, aquí llamaríamos a la API
    
    const updatedListings = { ...listings };
    
    Object.keys(updatedListings).forEach((status) => {
      const statusKey = status as keyof typeof updatedListings;
      updatedListings[statusKey] = updatedListings[statusKey].map(listing => 
        listing.id === listingId 
          ? { ...listing, isFeatured: !listing.isFeatured } 
          : listing
      );
    });
    
    setListings(updatedListings);
  };

  // Renovar anuncio expirado
  const handleRenewListing = (listingId: string) => {
    // Encontrar el anuncio
    const expiredListing = listings.expired.find(listing => listing.id === listingId);
    
    if (expiredListing) {
      // Crear copia del estado actual
      const updatedListings = { ...listings };
      
      // Eliminar de expirados
      updatedListings.expired = updatedListings.expired.filter(
        listing => listing.id !== listingId
      );
      
      // Actualizar fechas y estado
      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      const renewedListing = {
        ...expiredListing,
        status: 'active' as ListingStatus,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        expiresAt: expiryDate.toISOString()
      };
      
      // Añadir a activos
      updatedListings.active = [...updatedListings.active, renewedListing];
      
      // Actualizar estado
      setListings(updatedListings);
    }
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