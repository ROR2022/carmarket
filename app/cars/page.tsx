'use client';

import React, { useEffect, useState } from 'react';
//import { useSearchParams } from 'next/navigation';
import { CarCard } from '@/components/car/car-card';
import { CarFilters } from '@/components/car/car-filters';
import { CarPagination } from '@/components/car/car-pagination';
import { useTranslation } from '@/utils/translation-context';
import { Car, CarFilters as CarFiltersType, PaginationInfo, SortOption } from '@/types/car';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { CatalogService } from '@/services/catalog';

export default function CarsPage() {
  const { t } = useTranslation();
  //const searchParams = useSearchParams();
  
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
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  
  // Cargar marcas disponibles
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const brands = await CatalogService.getAvailableBrands();
        setAvailableBrands(brands);
      } catch (err) {
        console.error('Error loading brands:', err);
      }
    };
    
    loadBrands();
  }, []);
  
  // Cargar autos al iniciar o cambiar filtros/página
  useEffect(() => {
    const loadCars = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await CatalogService.searchListings(
          filters,
          pagination.currentPage,
          pagination.pageSize,
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
  }, [pagination.currentPage, pagination.pageSize, filters, sortOption, t]);
  
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
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {t('cars.pageTitle')}
        </h1>
        <p className="max-w-[800px] text-muted-foreground md:text-xl">
          {t('cars.pageSubtitle')}
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
              availableBrands={availableBrands}
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
                  <SelectItem value="created_desc">{t('cars.sort.newest')}</SelectItem>
                  <SelectItem value="price_desc">{t('cars.sort.priceHighToLow')}</SelectItem>
                  <SelectItem value="price_asc">{t('cars.sort.priceLowToHigh')}</SelectItem>
                  <SelectItem value="year_desc">{t('cars.sort.yearNewest')}</SelectItem>
                  <SelectItem value="year_asc">{t('cars.sort.yearOldest')}</SelectItem>
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