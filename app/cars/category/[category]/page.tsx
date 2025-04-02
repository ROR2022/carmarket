'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CarCard } from '@/components/car/car-card';
import { CarFilters } from '@/components/car/car-filters';
import { CarPagination } from '@/components/car/car-pagination';
import { useTranslation } from '@/utils/translation-context';
import { Car, CarFilters as CarFiltersType, CarListResponse, PaginationInfo, SortOption, CarCategory } from '@/types/car';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { capitalize } from '@/utils/format';

// Reutilizamos la misma función de fetchCars pero la modificamos para filtrar por categoría automáticamente
const fetchCarsByCategory = async (
  category: CarCategory,
  page = 1, 
  pageSize = 12, 
  filters: CarFiltersType = {}, 
  sort: SortOption = 'created_desc'
): Promise<CarListResponse> => {
  // Simulamos un retraso para mostrar el estado de carga
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Importamos los datos simulados del otro archivo (en realidad los definimos de nuevo)
  const MOCK_BRANDS = ['Toyota', 'Honda', 'Volkswagen', 'Chevrolet', 'Ford', 'Nissan', 'Hyundai', 'Mercedes-Benz', 'BMW', 'Audi'];
  
  // Generamos autos de prueba
  const mockCars: Car[] = Array.from({ length: 50 }, (_, i) => ({
    id: `car-${i + 1}`,
    title: `${MOCK_BRANDS[i % MOCK_BRANDS.length]} Modelo ${(i % 10) + 1}`,
    brand: MOCK_BRANDS[i % MOCK_BRANDS.length],
    model: `Modelo ${(i % 10) + 1}`,
    year: 2015 + (i % 9),
    category: i % 3 === 0 ? 'sedan' : i % 3 === 1 ? 'suv' : 'hatchback',
    price: 1500000 + (i * 100000),
    mileage: 10000 + (i * 5000),
    fuelType: i % 4 === 0 ? 'gasoline' : i % 4 === 1 ? 'diesel' : i % 4 === 2 ? 'electric' : 'hybrid',
    transmission: i % 2 === 0 ? 'manual' : 'automatic',
    features: ['Air Conditioning', 'Power Windows', 'Central Locking'],
    description: `Este es un ${MOCK_BRANDS[i % MOCK_BRANDS.length]} en excelente estado. Posee ${i % 2 === 0 ? 'transmisión manual' : 'transmisión automática'} y motor ${i % 4 === 0 ? 'a gasolina' : i % 4 === 1 ? 'diésel' : i % 4 === 2 ? 'eléctrico' : 'híbrido'}.`,
    location: 'Buenos Aires, Argentina',
    images: [
      i % 3 === 0 
        ? '/images/cars/sedan.jpeg' 
        : i % 3 === 1 
          ? '/images/cars/suv.jpeg'
          : '/images/cars/hatchback.jpeg'
    ],
    sellerId: `seller-${(i % 5) + 1}`,
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
  }));
  
  // Filtramos primero por categoría
  let filteredCars = mockCars.filter(car => car.category === category);
  
  // Aplicamos los demás filtros
  if (filters.minPrice !== undefined) {
    filteredCars = filteredCars.filter(car => car.price >= filters.minPrice!);
  }
  
  if (filters.maxPrice !== undefined) {
    filteredCars = filteredCars.filter(car => car.price <= filters.maxPrice!);
  }
  
  if (filters.minYear !== undefined) {
    filteredCars = filteredCars.filter(car => car.year >= filters.minYear!);
  }
  
  if (filters.maxYear !== undefined) {
    filteredCars = filteredCars.filter(car => car.year <= filters.maxYear!);
  }
  
  if (filters.brands) {
    filteredCars = filteredCars.filter(car => filters.brands?.includes(car.brand));
  }
  
  if (filters.models) {
    filteredCars = filteredCars.filter(car => 
      filters.models?.includes(car.model)
    );
  }
  
  if (filters.transmissions) {
    filteredCars = filteredCars.filter(car => filters.transmissions?.includes(car.transmission));
  }
  
  if (filters.fuelTypes) {
    filteredCars = filteredCars.filter(car => filters.fuelTypes?.includes(car.fuelType));
  }
  
  if (filters.maxMileage !== undefined) {
    filteredCars = filteredCars.filter(car => car.mileage <= filters.maxMileage!);
  }
  
  // Ordenamos los resultados
  switch (sort) {
    case 'price_desc':
      filteredCars.sort((a, b) => b.price - a.price);
      break;
    case 'price_asc':
      filteredCars.sort((a, b) => a.price - b.price);
      break;
    case 'year_desc':
      filteredCars.sort((a, b) => b.year - a.year);
      break;
    case 'year_asc':
      filteredCars.sort((a, b) => a.year - b.year);
      break;
    case 'created_desc':
    default:
      filteredCars.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }
  
  // Calculamos la paginación
  const totalItems = filteredCars.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedCars = filteredCars.slice(startIndex, endIndex);
  
  return {
    cars: paginatedCars,
    pagination: {
      currentPage: page,
      totalPages,
      pageSize,
      totalItems,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

// Función para obtener un título amigable para cada categoría
const getCategoryTitle = (category: string): string => {
  switch (category) {
    case 'sedan':
      return 'Sedanes';
    case 'suv':
      return 'SUVs';
    case 'hatchback':
      return 'Hatchbacks';
    case 'pickup':
      return 'Camionetas';
    case 'convertible':
      return 'Convertibles';
    case 'coupe':
      return 'Coupé';
    default:
      return capitalize(category);
  }
};

export default function CategoryPage() {
  const { t } = useTranslation();
  const params = useParams();
  const category = params.category as CarCategory;
  const categoryName = getCategoryTitle(category);
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 9,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState<CarFiltersType>({});
  const [sortOption, setSortOption] = useState<SortOption>('created_desc');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Cargar autos al iniciar o cambiar filtros/página
  useEffect(() => {
    const loadCars = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchCarsByCategory(
          category,
          pagination.currentPage,
          pagination.pageSize,
          filters,
          sortOption
        );
        
        setCars(result.cars);
        setPagination(result.pagination);
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError(t('cars.error'));
      } finally {
        setLoading(false);
      }
    };
    
    loadCars();
  }, [pagination.currentPage, pagination.pageSize, filters, sortOption, category, t]);
  
  // Gestionar cambios de página
  const handlePageChange = (page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
    
    // Scroll al inicio de la lista
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Aplicar filtros
  const handleApplyFilters = (newFilters: CarFiltersType) => {
    setFilters(newFilters);
    setPagination(prev => ({
      ...prev,
      currentPage: 1  // Volver a la primera página al aplicar filtros
    }));
  };
  
  // Limpiar filtros
  const handleClearFilters = () => {
    setFilters({});
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };
  
  // Gestionar cambio de ordenamiento
  const handleSortChange = (value: string) => {
    setSortOption(value as SortOption);
  };
  
  // Gestionar favoritos
  const handleToggleFavorite = (carId: string) => {
    setFavorites(prev => {
      if (prev.includes(carId)) {
        return prev.filter(id => id !== carId);
      } else {
        return [...prev, carId];
      }
    });
  };
  
  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link href="/cars">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a todos los autos
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {categoryName}
        </h1>
        <p className="max-w-[800px] text-muted-foreground md:text-xl">
          Explora nuestra selección de {categoryName.toLowerCase()} de alta calidad
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Columna de filtros */}
        <div className="md:col-span-1">
          <div className="sticky top-24">
            <CarFilters
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              initialFilters={filters}
              availableBrands={['Toyota', 'Honda', 'Volkswagen', 'Chevrolet', 'Ford', 'Nissan', 'Hyundai', 'Mercedes-Benz', 'BMW', 'Audi']}
            />
          </div>
        </div>
        
        {/* Columna principal de contenido */}
        <div className="md:col-span-3">
          {/* Ordenamiento y resumen de resultados */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              {pagination.totalItems} {pagination.totalItems === 1 ? 'vehículo' : 'vehículos'} encontrados
            </p>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('cars.sort.title')}</span>
              <Select
                value={sortOption}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t('cars.sort.newest')}</SelectItem>
                  <SelectItem value="priceHighToLow">{t('cars.sort.priceHighToLow')}</SelectItem>
                  <SelectItem value="priceLowToHigh">{t('cars.sort.priceLowToHigh')}</SelectItem>
                  <SelectItem value="yearNewest">{t('cars.sort.yearNewest')}</SelectItem>
                  <SelectItem value="yearOldest">{t('cars.sort.yearOldest')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Estado de carga */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p>{t('cars.loading')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-12">
              <p>{t('cars.noResults')}</p>
            </div>
          ) : (
            <>
              {/* Cuadrícula de autos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {cars.map(car => (
                  <CarCard
                    key={car.id}
                    car={car}
                    isFavorite={favorites.includes(car.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
              
              {/* Paginación */}
              <CarPagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
} 