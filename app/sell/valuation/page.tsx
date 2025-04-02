'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useTranslation } from '@/utils/translation-context';
import { ValuationRequest, ValuationResponse } from '@/types/listing';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Transmission, FuelType, CarCategory } from '@/types/car';

// Simulación de marcas y modelos para el formulario
const MOCK_BRANDS = ['Toyota', 'Honda', 'Volkswagen', 'Chevrolet', 'Ford', 'Nissan', 'Hyundai', 'Mercedes-Benz', 'BMW', 'Audi'];

// Array para los años
const YEARS = Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => new Date().getFullYear() - i);

// Características extras
const EXTRAS = [
  "airConditioning",
  "leatherSeats",
  "sunroof",
  "navigation",
  "parkingSensors",
  "reverseCamera",
  "alloyWheels",
  "bluetooth"
];

// Esquema de validación para el formulario de valoración
const valuationFormSchema = z.object({
  // Paso 1: Información básica
  brand: z.string().min(1, { message: "La marca es obligatoria" }),
  model: z.string().min(1, { message: "El modelo es obligatorio" }),
  year: z.string().min(1, { message: "El año es obligatorio" }),
  
  // Paso 2: Características y estado
  mileage: z.string().min(1, { message: "El kilometraje es obligatorio" })
    .refine(val => !isNaN(Number(val)), { message: "El kilometraje debe ser un número" }),
  transmission: z.string().min(1, { message: "La transmisión es obligatoria" }),
  fuelType: z.string().min(1, { message: "El combustible es obligatorio" }),
  category: z.string().min(1, { message: "La categoría es obligatoria" }),
  condition: z.string().min(1, { message: "El estado es obligatorio" }),
  extras: z.array(z.string()).optional(),
  
  // Paso 3: Datos de contacto
  contactName: z.string().min(1, { message: "El nombre es obligatorio" }),
  contactEmail: z.string().email({ message: "Email inválido" }),
  contactPhone: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones"
  }),
  privacyAccepted: z.boolean().refine(val => val === true, {
    message: "Debes aceptar la política de privacidad"
  })
});

// Simular una llamada a API para obtener valoración
const getValuation = async (data: ValuationRequest): Promise<ValuationResponse> => {
  // Simulamos un retraso de 1.5 segundos
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Calculamos una valoración basada en los datos ingresados
  const basePrice = 250000;
  const yearFactor = 1 - ((new Date().getFullYear() - parseInt(data.year.toString())) * 0.05);
  const mileageFactor = 1 - (parseInt(data.mileage.toString()) / 200000);
  const conditionFactor = {
    'excellent': 1.1,
    'good': 1,
    'fair': 0.85,
    'poor': 0.7
  }[data.condition as 'excellent' | 'good' | 'fair' | 'poor'] || 1;
  
  const extras = data.extras?.length || 0;
  const extrasFactor = 1 + (extras * 0.01);
  
  // Precio calculado en base a factores
  const calculatedPrice = basePrice * yearFactor * mileageFactor * conditionFactor * extrasFactor;
  
  // Variabilidad para min y max 
  const minPrice = Math.round(calculatedPrice * 0.9);
  const maxPrice = Math.round(calculatedPrice * 1.1);
  const avgPrice = Math.round(calculatedPrice);
  
  // Fecha de expiración (15 días a partir de hoy)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 15);
  
  return {
    estimatedPrice: {
      min: minPrice,
      max: maxPrice,
      average: avgPrice
    },
    valuationId: `VAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    expiresAt: expiryDate.toISOString(),
    recommendedListingPrice: Math.round(calculatedPrice * 1.05),
    marketAnalysis: {
      averageTimeOnMarket: 21,
      demandLevel: calculatedPrice > 300000 ? 'medium' : 'high',
      similarListingsCount: Math.floor(Math.random() * 20) + 5
    }
  };
};

export default function ValuationPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [valuation, setValuation] = useState<ValuationResponse | null>(null);
  
  // Configuración del formulario con react-hook-form y zod
  const form = useForm<z.infer<typeof valuationFormSchema>>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      brand: "",
      model: "",
      year: "",
      mileage: "",
      transmission: "",
      fuelType: "",
      category: "",
      condition: "",
      extras: [],
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      termsAccepted: false,
      privacyAccepted: false
    }
  });
  
  // Gestionar avance al siguiente paso
  const handleNextStep = async () => {
    let fieldsToValidate: string[] = [];
    
    // Campos a validar según el paso actual
    if (step === 1) {
      fieldsToValidate = ['brand', 'model', 'year'];
    } else if (step === 2) {
      fieldsToValidate = ['mileage', 'transmission', 'fuelType', 'category', 'condition'];
    }
    
    // Validar los campos del paso actual
    const result = await form.trigger(fieldsToValidate as Array<keyof z.infer<typeof valuationFormSchema>>);
    
    if (result) {
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Gestionar retroceso al paso anterior
  const handlePreviousStep = () => {
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Enviar formulario
  const onSubmit = async (data: z.infer<typeof valuationFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Convertir datos del formulario al formato requerido para la API
      const valuationRequest: ValuationRequest = {
        brand: data.brand,
        model: data.model,
        year: parseInt(data.year),
        mileage: parseInt(data.mileage),
        transmission: data.transmission as Transmission,
        fuelType: data.fuelType as FuelType,
        category: data.category as CarCategory,
        condition: data.condition as 'excellent' | 'good' | 'fair' | 'poor',
        extras: data.extras || [],
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone
      };
      
      // Llamada a API simulada
      const result = await getValuation(valuationRequest);
      
      // Guardamos el resultado
      setValuation(result);
      
      // Avanzamos al paso de resultado
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error al obtener valoración:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Formato para valores monetarios
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Formatear fecha
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {t('sell.valuation.pageTitle')}
        </h1>
        <p className="max-w-[800px] text-muted-foreground md:text-xl">
          {t('sell.valuation.pageSubtitle')}
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        {/* Formulario de valoración (pasos 1-3) */}
        {step < 4 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('sell.valuation.form.title')}</CardTitle>
              <CardDescription>{t('sell.valuation.form.subtitle')}</CardDescription>
              
              {/* Indicador de progreso */}
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className={`font-medium ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {t('sell.valuation.form.step1Title')}
                  </span>
                  <span className={`font-medium ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {t('sell.valuation.form.step2Title')}
                  </span>
                  <span className={`font-medium ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {t('sell.valuation.form.step3Title')}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(step / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Paso 1: Información básica */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('sell.valuation.form.brandLabel')}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('sell.valuation.form.brandPlaceholder')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {MOCK_BRANDS.map((brand) => (
                                  <SelectItem key={brand} value={brand}>
                                    {brand}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('sell.valuation.form.modelLabel')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t('sell.valuation.form.modelPlaceholder')} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('sell.valuation.form.yearLabel')}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('sell.valuation.form.yearPlaceholder')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {YEARS.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Paso 2: Características y estado */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="mileage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('sell.valuation.form.mileageLabel')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder={t('sell.valuation.form.mileagePlaceholder')} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="transmission"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('sell.valuation.form.transmissionLabel')}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="manual">Manual</SelectItem>
                                <SelectItem value="automatic">Automática</SelectItem>
                                <SelectItem value="cvt">CVT</SelectItem>
                                <SelectItem value="semi-automatic">Semi-automática</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="fuelType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('sell.valuation.form.fuelTypeLabel')}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="gasoline">Gasolina</SelectItem>
                                <SelectItem value="diesel">Diésel</SelectItem>
                                <SelectItem value="electric">Eléctrico</SelectItem>
                                <SelectItem value="hybrid">Híbrido</SelectItem>
                                <SelectItem value="plugin_hybrid">Híbrido enchufable</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('sell.valuation.form.categoryLabel')}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sedan">Sedán</SelectItem>
                                <SelectItem value="suv">SUV</SelectItem>
                                <SelectItem value="hatchback">Hatchback</SelectItem>
                                <SelectItem value="pickup">Pickup</SelectItem>
                                <SelectItem value="coupe">Coupé</SelectItem>
                                <SelectItem value="convertible">Convertible</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="condition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('sell.valuation.form.conditionLabel')}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="excellent">{t('sell.valuation.form.conditionOptions.excellent')}</SelectItem>
                                <SelectItem value="good">{t('sell.valuation.form.conditionOptions.good')}</SelectItem>
                                <SelectItem value="fair">{t('sell.valuation.form.conditionOptions.fair')}</SelectItem>
                                <SelectItem value="poor">{t('sell.valuation.form.conditionOptions.poor')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="extras"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel>{t('sell.valuation.form.extrasLabel')}</FormLabel>
                              <FormDescription>
                                {t('sell.valuation.form.extrasPlaceholder')}
                              </FormDescription>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              {EXTRAS.map((extra) => (
                                <FormField
                                  key={extra}
                                  control={form.control}
                                  name="extras"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={extra}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(extra)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value || [], extra])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== extra
                                                    )
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                          {t(`sell.valuation.form.extras.${extra}`)}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Paso 3: Datos de contacto */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('sell.valuation.form.contactNameLabel')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t('sell.valuation.form.contactNamePlaceholder')} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('sell.valuation.form.contactEmailLabel')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder={t('sell.valuation.form.contactEmailPlaceholder')} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('sell.valuation.form.contactPhoneLabel')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t('sell.valuation.form.contactPhonePlaceholder')} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Separator className="my-4" />
                      
                      <FormField
                        control={form.control}
                        name="termsAccepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                {t('sell.valuation.form.termsLabel')}
                              </FormLabel>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="privacyAccepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                {t('sell.valuation.form.privacyLabel')}
                              </FormLabel>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Botones de navegación */}
                  <div className="flex justify-between pt-4">
                    {step > 1 ? (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handlePreviousStep}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('sell.valuation.form.backButton')}
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => router.push('/sell')}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('common.back_to_list')}
                      </Button>
                    )}
                    
                    {step < 3 ? (
                      <Button 
                        type="button"
                        onClick={handleNextStep}
                      >
                        {t('sell.valuation.form.nextButton')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('sell.valuation.form.submitButton')}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        {/* Resultado de valoración (paso 4) */}
        {step === 4 && valuation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('sell.valuation.result.title')}</CardTitle>
              <CardDescription>{t('sell.valuation.result.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Valor estimado */}
              <div className="text-center py-4">
                <h3 className="text-lg font-medium mb-2">{t('sell.valuation.result.estimatedValue')}</h3>
                <div className="text-4xl font-bold text-primary">
                  {formatCurrency(valuation.estimatedPrice.average)}
                </div>
                <div className="flex justify-center gap-6 mt-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">{t('sell.valuation.result.minValue')}:</span>{' '}
                    {formatCurrency(valuation.estimatedPrice.min)}
                  </div>
                  <div>
                    <span className="font-medium">{t('sell.valuation.result.maxValue')}:</span>{' '}
                    {formatCurrency(valuation.estimatedPrice.max)}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Análisis de mercado */}
              <div>
                <h3 className="text-lg font-medium mb-3">{t('sell.valuation.result.marketAnalysis')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold mb-1">
                        {valuation.marketAnalysis.averageTimeOnMarket}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('sell.valuation.result.timeOnMarket')} ({t('sell.valuation.result.days')})
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold capitalize mb-1">
                        {valuation.marketAnalysis.demandLevel === 'high' 
                          ? 'Alta' 
                          : valuation.marketAnalysis.demandLevel === 'medium' 
                            ? 'Media' 
                            : 'Baja'
                        }
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('sell.valuation.result.demandLevel')}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold mb-1">
                        {valuation.marketAnalysis.similarListingsCount}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('sell.valuation.result.similarListings')}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <Separator />
              
              {/* Recomendación y próximos pasos */}
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-1">{t('sell.valuation.result.recommendedPrice')}</h3>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(valuation.recommendedListingPrice)}
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-3">{t('sell.valuation.result.nextStepsTitle')}</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="flex-1" asChild>
                    <Link href="/sell/list">
                      {t('sell.valuation.result.createListing')}
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1">
                    {t('sell.valuation.result.requestInspection')}
                  </Button>
                </div>
                
                <div className="mt-6 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium">{t('sell.valuation.result.valuationExpiry')}:</span>{' '}
                    {formatDate(valuation.expiresAt)}
                  </p>
                  <p className="mt-2">
                    {t('sell.valuation.result.disclaimer')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 