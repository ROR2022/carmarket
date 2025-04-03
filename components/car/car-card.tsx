'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/utils/translation-context';
import { Car } from '@/types/car';
import { formatCurrency } from '@/utils/format';

interface CarCardProps {
  car: Car;
  isFavorite?: boolean;
  onToggleFavorite?: (carId: string) => void;
}

export function CarCard({ car, isFavorite = false, onToggleFavorite }: CarCardProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  //console.log('dataCar:..',car);

  const handleToggleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(car.id);
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div 
        className="relative aspect-[16/9] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={`/cars/${car.id}`}>
          <div className="relative w-full h-full">
            <Image
              src={car.images[0] || '/images/placeholder-car.png'}
              alt={car.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 ease-in-out"
              style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            />
          </div>
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/80 hover:bg-white"
              onClick={handleToggleFavorite}
            >
              <Heart 
                className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} 
              />
              <span className="sr-only">
                {isFavorite 
                  ? t('cars.carCard.removeFromFavorites') 
                  : t('cars.carCard.addToFavorites')
                }
              </span>
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-primary hover:bg-primary/90">
                {car.category.charAt(0).toUpperCase() + car.category.slice(1)}
              </Badge>
              <span className="text-white font-semibold">{car.year}</span>
            </div>
          </div>
        </Link>
      </div>
      <CardContent className="p-4">
        <Link href={`/cars/${car.id}`} className="no-underline">
          <h3 className="text-lg font-bold truncate hover:text-primary transition-colors">
            {car.title}
          </h3>
          <p className="text-2xl font-bold text-primary mt-1">
            {formatCurrency(car.price)}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="font-medium">{t('cars.carCard.mileage')}:</span> 
              <span>{car.mileage.toLocaleString()} km</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{t('cars.carCard.transmission')}:</span> 
              <span>{car.transmission}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{t('cars.carCard.fuel')}:</span> 
              <span>{car.fuelType}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{t('cars.carCard.year')}:</span> 
              <span>{car.year}</span>
            </div>
          </div>
        </Link>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2 justify-between">
        <Button asChild className="w-full">
          <Link href={`/cars/${car.id}`}>
            {t('cars.carCard.viewDetails')}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 