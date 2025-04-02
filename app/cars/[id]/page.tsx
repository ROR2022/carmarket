'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Fuel, 
  Heart, 
  MapPin, 
  MessageSquare, 
  Gauge,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/utils/translation-context';
import { Car } from '@/types/car';
import { formatCurrency, formatDate, formatMileage } from '@/utils/format';
import { useAuth } from '@/utils/auth-hooks';

// Simula la obtención de datos para un auto específico
const fetchCarById = async (id: string): Promise<Car | null> => {
  // Simular un retraso para mostrar el estado de carga
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Datos simulados para el auto (para demo)
  const car: Car = {
    id,
    title: 'Toyota Corolla 2020',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    category: 'sedan',
    price: 3500000,
    mileage: 25000,
    fuelType: 'gasoline',
    transmission: 'automatic',
    features: [
      'Aire acondicionado',
      'Vidrios eléctricos',
      'Cierre centralizado',
      'Alarma',
      'Dirección asistida',
      'Airbags',
      'Sistema antibloqueo de frenos (ABS)',
      'Control de estabilidad (ESP)',
      'Computadora de abordo',
      'Bluetooth',
      'Tapizado de cuero',
      'Sensor de estacionamiento'
    ],
    description: 'Toyota Corolla 2020 en excelente estado. Un solo dueño, con mantenimiento al día y todas las revisiones realizadas en concesionario oficial. Versión full con tapizado de cuero, pantalla táctil, cámara de retroceso y mucho más. El auto ideal para la ciudad y viajes largos, combinando confort, seguridad y bajo consumo de combustible.',
    location: 'Buenos Aires, Argentina',
    images: ['/images/cars/sedan.jpeg', '/images/cars/suv.jpeg', '/images/cars/hatchback.jpeg'],
    sellerId: 'seller-1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  return car;
};

export default function CarDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const carId = params.id as string;
  
  // Estados
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Cargar datos del auto
  useEffect(() => {
    const loadCar = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchCarById(carId);
        if (data) {
          setCar(data);
        } else {
          setError('Vehículo no encontrado');
          // Redirigir tras un breve retraso si no se encuentra el auto
          setTimeout(() => {
            router.push('/cars');
          }, 3000);
        }
      } catch (err) {
        console.error('Error fetching car details:', err);
        setError('Error al cargar los detalles del vehículo');
      } finally {
        setLoading(false);
      }
    };
    
    loadCar();
  }, [carId, router]);
  
  // Manejar navegación de imágenes
  const handlePrevImage = () => {
    if (!car) return;
    setCurrentImageIndex(prev => 
      prev === 0 ? car.images.length - 1 : prev - 1
    );
  };
  
  const handleNextImage = () => {
    if (!car) return;
    setCurrentImageIndex(prev => 
      prev === car.images.length - 1 ? 0 : prev + 1
    );
  };
  
  // Manejar toggle de favorito
  const toggleFavorite = () => {
    if (!isAuthenticated) {
      // Redirigir a inicio de sesión si el usuario no está autenticado
      router.push('/sign-in');
      return;
    }
    setIsFavorite(prev => !prev);
    // Aquí implementarías la lógica para guardar en el backend
  };
  
  // Manejar contacto con el vendedor
  const contactSeller = () => {
    if (!isAuthenticated) {
      // Redirigir a inicio de sesión si el usuario no está autenticado
      router.push('/sign-in');
      return;
    }
    // Implementar lógica para contactar al vendedor
    console.log('Contactar vendedor');
  };
  
  // Renderizado condicional para carga y error
  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-96">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p>{t('common.loading_details')}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !car) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold mb-4">{t('common.error')}</h2>
          <p className="text-muted-foreground mb-6">{error || t('cars.not_found')}</p>
          <Button asChild>
            <Link href="/cars">{t('common.back_to_list')}</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      {/* Breadcrumb y botón de volver */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/cars" className="hover:text-foreground">
              {t('navbar.cars')}
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/cars/category/${car.category}`} className="hover:text-foreground">
              {t(`categories.${car.category}`)}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">{car.title}</span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cars">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back_to_list')}
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Contenido principal en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda: imágenes y detalles */}
        <div className="lg:col-span-2 space-y-8">
          {/* Galería de imágenes */}
          <div className="relative rounded-xl overflow-hidden">
            <div className="aspect-[16/9] relative">
              <Image
                src={car.images[currentImageIndex]}
                alt={car.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            
            {/* Controles de navegación */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 rounded-full"
              onClick={handlePrevImage}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 rounded-full"
              onClick={handleNextImage}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
            
            {/* Indicador de imágenes */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="bg-black/50 rounded-full px-3 py-1 text-white text-xs">
                {currentImageIndex + 1} / {car.images.length}
              </div>
            </div>
          </div>
          
          {/* Información principal */}
          <div>
            <h1 className="text-3xl font-bold">{car.title}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="flex items-center">
                <MapPin className="mr-1 h-3 w-3" /> 
                {car.location}
              </Badge>
              <Badge variant="outline" className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" /> 
                {car.year}
              </Badge>
              <Badge variant="outline" className="flex items-center">
                <Gauge className="mr-1 h-3 w-3" /> 
                {formatMileage(car.mileage)}
              </Badge>
              <Badge variant="outline" className="flex items-center">
                <Fuel className="mr-1 h-3 w-3" /> 
                {car.fuelType}
              </Badge>
              <Badge variant="outline" className="flex items-center">
                <Settings className="mr-1 h-3 w-3" /> 
                {car.transmission}
              </Badge>
            </div>
            
            <Separator className="my-6" />
            
            {/* Pestañas de detalles */}
            <Tabs defaultValue="description">
              <TabsList className="mb-4">
                <TabsTrigger value="description">{t('cars.description')}</TabsTrigger>
                <TabsTrigger value="features">{t('cars.features')}</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="space-y-4">
                <div className="text-muted-foreground">
                  <p>{car.description}</p>
                </div>
              </TabsContent>
              <TabsContent value="features">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {car.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Columna derecha: precio, acciones y datos del vendedor */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Card de precio y acciones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold">{formatCurrency(car.price)}</CardTitle>
                <CardDescription>{t('cars.final_price')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={contactSeller} className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" /> 
                    {t('cars.contact')}
                  </Button>
                  <Button 
                    variant={isFavorite ? "default" : "secondary"} 
                    onClick={toggleFavorite} 
                    className="w-full"
                  >
                    <Heart className={`mr-2 h-4 w-4 ${isFavorite ? '' : ''}`} /> 
                    {isFavorite ? t('cars.saved') : t('cars.save')}
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>{t('cars.vehicle_id')}: {car.id}</p>
                  <p>{t('cars.last_update')}: {formatDate(car.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Card del vendedor */}
            <Card>
              <CardHeader>
                <CardTitle>{t('cars.seller_info')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="relative h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-primary">S</span>
                  </div>
                  <div>
                    <p className="font-medium">{t('cars.seller_id')}: {car.sellerId}</p>
                    <p className="text-sm text-muted-foreground">{t('cars.member_since')} 2022</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={contactSeller}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t('cars.send_message')}
                </Button>
              </CardContent>
            </Card>
            
            {/* Aviso legal */}
            <div className="text-xs text-muted-foreground">
              <p>
                <strong>{t('cars.disclaimer.title')}:</strong> {t('cars.disclaimer.text')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 