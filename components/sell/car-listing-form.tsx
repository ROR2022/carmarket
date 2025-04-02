'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
//import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { useTranslation } from '@/utils/translation-context';
import { ListingFormData } from '@/types/listing';
import { CarCategory, FuelType, Transmission } from '@/types/car';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, ArrowRight, Loader2, UploadCloud } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

// Simulación de marcas para el formulario
const MOCK_BRANDS = ['Toyota', 'Honda', 'Volkswagen', 'Chevrolet', 'Ford', 'Nissan', 'Hyundai', 'Mercedes-Benz', 'BMW', 'Audi'];

// Array para los años
const YEARS = Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => new Date().getFullYear() - i);

// Esquema de validación para el formulario de listado
const listingFormSchema = z.object({
  // Datos básicos del vehículo
  brand: z.string().min(1, { message: "La marca es obligatoria" }),
  model: z.string().min(1, { message: "El modelo es obligatorio" }),
  year: z.coerce.number().min(1990, { message: "El año debe ser válido" }),
  category: z.string().min(1, { message: "La categoría es obligatoria" }),
  
  // Detalles técnicos
  transmission: z.string().min(1, { message: "La transmisión es obligatoria" }),
  fuelType: z.string().min(1, { message: "El tipo de combustible es obligatorio" }),
  mileage: z.coerce.number().min(0, { message: "El kilometraje debe ser válido" }),
  color: z.string().min(1, { message: "El color es obligatorio" }),
  vinNumber: z.string().optional(),
  licensePlate: z.string().optional(),
  
  // Características y descripción
  features: z.array(z.string()).min(1, { message: "Selecciona al menos una característica" }),
  description: z.string().min(50, { message: "La descripción debe tener al menos 50 caracteres" }),
  
  // Ubicación y contacto
  location: z.string().min(1, { message: "La ubicación es obligatoria" }),
  sellerName: z.string().min(1, { message: "El nombre es obligatorio" }),
  sellerEmail: z.string().email({ message: "Email inválido" }),
  sellerPhone: z.string().optional(),
  
  // Precio y condiciones
  price: z.coerce.number().min(1, { message: "El precio es obligatorio" }),
  negotiable: z.boolean().default(false),
  acceptsTrade: z.boolean().default(false),
  
  // Términos y condiciones
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones"
  })
});

// Lista de características disponibles
const FEATURES = [
  "airConditioning",
  "airbags",
  "alarmSystem",
  "alloyWheels",
  "antiLockBrakes",
  "bluetooth",
  "cruiseControl",
  "electricWindows",
  "fogLights",
  "heatedSeats",
  "leatherSeats",
  "navigation",
  "parkingSensors",
  "powerSteering",
  "rainSensor",
  "reverseCamera",
  "sunroof",
  "touchScreen",
  "usb"
];

interface CarListingFormProps {
  onSubmit: (data: ListingFormData) => void;
  onSaveDraft?: (data: ListingFormData) => void;
  onPreview?: (data: ListingFormData) => void;
  initialData?: Partial<ListingFormData>;
  isSubmitting?: boolean;
  isSavingDraft?: boolean;
}

export function CarListingForm({
  onSubmit,
  onSaveDraft,
  onPreview,
  initialData,
  isSubmitting = false,
  isSavingDraft = false
}: CarListingFormProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [documentNames, setDocumentNames] = useState<string[]>([]);
  
  // Configuración del formulario
  const form = useForm<z.infer<typeof listingFormSchema>>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      brand: initialData?.brand || "",
      model: initialData?.model || "",
      year: initialData?.year || new Date().getFullYear(),
      category: initialData?.category || "",
      transmission: initialData?.transmission || "",
      fuelType: initialData?.fuelType || "",
      mileage: initialData?.mileage || 0,
      color: initialData?.color || "",
      vinNumber: initialData?.vinNumber || "",
      licensePlate: initialData?.licensePlate || "",
      features: initialData?.features as string[] || [],
      description: initialData?.description || "",
      location: initialData?.location || "",
      sellerName: initialData?.sellerName || "",
      sellerEmail: initialData?.sellerEmail || "",
      sellerPhone: initialData?.sellerPhone || "",
      price: initialData?.price || 0,
      negotiable: initialData?.negotiable || false,
      acceptsTrade: initialData?.acceptsTrade || false,
      termsAccepted: false
    }
  });
  
  // Gestionar avance al siguiente paso
  const handleNextStep = async () => {
    let fieldsToValidate: string[] = [];
    
    // Campos a validar según el paso actual
    if (step === 1) {
      fieldsToValidate = ['brand', 'model', 'year', 'category'];
    } else if (step === 2) {
      fieldsToValidate = ['transmission', 'fuelType', 'mileage', 'color'];
    } else if (step === 3) {
      fieldsToValidate = ['features', 'description', 'location'];
    } else if (step === 4) {
      fieldsToValidate = ['price'];
    }
    
    // Validar los campos del paso actual
    const result = await form.trigger(fieldsToValidate as Array<keyof z.infer<typeof listingFormSchema>>);
    
    if (result) {
      if (step === 3 && images.length === 0) {
        form.setError('root', { 
          message: "Debes subir al menos una imagen del vehículo" 
        });
        return;
      }
      
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Gestionar retroceso al paso anterior
  const handlePreviousStep = () => {
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Configuración de dropzone para imágenes
  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 20,
    onDrop: (acceptedFiles) => {
      // Añadir las nuevas imágenes
      const newImages = [...images, ...acceptedFiles];
      setImages(newImages.slice(0, 20)); // Máximo 20 imágenes
      
      // Generar URLs de vista previa
      const newImageUrls = acceptedFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls([...imagePreviewUrls, ...newImageUrls]);
    }
  });
  
  // Configuración de dropzone para documentos
  const { getRootProps: getDocumentRootProps, getInputProps: getDocumentInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      // Añadir los nuevos documentos
      const newDocuments = [...documents, ...acceptedFiles];
      setDocuments(newDocuments.slice(0, 5)); // Máximo 5 documentos
      
      // Guardar nombres de documentos
      const newDocumentNames = acceptedFiles.map(file => file.name);
      setDocumentNames([...documentNames, ...newDocumentNames]);
    }
  });
  
  // Eliminar imagen
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    const newImageUrls = [...imagePreviewUrls];
    URL.revokeObjectURL(newImageUrls[index]);
    newImageUrls.splice(index, 1);
    setImagePreviewUrls(newImageUrls);
  };
  
  // Eliminar documento
  const removeDocument = (index: number) => {
    const newDocuments = [...documents];
    newDocuments.splice(index, 1);
    setDocuments(newDocuments);
    
    const newDocumentNames = [...documentNames];
    newDocumentNames.splice(index, 1);
    setDocumentNames(newDocumentNames);
  };
  
  // Manejar envío del formulario
  const handleSubmitForm = (data: z.infer<typeof listingFormSchema>) => {
    // Verificar imágenes
    if (images.length === 0) {
      form.setError('root', { 
        message: "Debes subir al menos una imagen del vehículo" 
      });
      return;
    }
    
    // Formatear datos para enviar
    const formData: ListingFormData = {
      ...data,
      category: data.category as CarCategory,
      transmission: data.transmission as Transmission,
      fuelType: data.fuelType as FuelType,
      images, // Archivos de imágenes
      documents // Archivos de documentos
    };
    
    onSubmit(formData);
  };
  
  // Guardar como borrador
  const handleSaveDraft = () => {
    if (onSaveDraft) {
      const formValues = form.getValues();
      const draftData = {
        ...formValues,
        category: formValues.category as CarCategory,
        transmission: formValues.transmission as Transmission,
        fuelType: formValues.fuelType as FuelType,
        images,
        documents
      } as ListingFormData;
      
      onSaveDraft(draftData);
    }
  };
  
  // Ver vista previa
  const handlePreview = () => {
    if (onPreview) {
      const previewData = {
        ...form.getValues(),
        images: imagePreviewUrls, // URLs de imágenes para previsualización
        documents: documentNames // Nombres de documentos para previsualización
      } as unknown as ListingFormData;
      
      onPreview(previewData);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sell.listing.form.step' + step + 'Title')}</CardTitle>
        
        {/* Indicador de progreso */}
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            <span className={`text-xs sm:text-sm font-medium ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              {t('sell.listing.form.step1Title')}
            </span>
            <span className={`text-xs sm:text-sm font-medium ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              {t('sell.listing.form.step2Title')}
            </span>
            <span className={`text-xs sm:text-sm font-medium ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              {t('sell.listing.form.step3Title')}
            </span>
            <span className={`text-xs sm:text-sm font-medium ${step >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
              {t('sell.listing.form.step4Title')}
            </span>
            <span className={`text-xs sm:text-sm font-medium ${step >= 5 ? 'text-primary' : 'text-muted-foreground'}`}>
              {t('sell.listing.form.step5Title')}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
            {/* Error general del formulario */}
            {form.formState.errors.root && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {form.formState.errors.root.message}
              </div>
            )}
            
            {/* Paso 1: Datos básicos */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.brandLabel')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar marca" />
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
                      <FormLabel>{t('sell.listing.form.modelLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Corolla" {...field} />
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
                      <FormLabel>{t('sell.listing.form.yearLabel')}</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar año" />
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
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.categoryLabel')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sedan">Sedán</SelectItem>
                          <SelectItem value="suv">SUV</SelectItem>
                          <SelectItem value="hatchback">Hatchback</SelectItem>
                          <SelectItem value="pickup">Pickup</SelectItem>
                          <SelectItem value="coupe">Coupé</SelectItem>
                          <SelectItem value="convertible">Convertible</SelectItem>
                          <SelectItem value="wagon">Familiar</SelectItem>
                          <SelectItem value="van">Van</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {/* Paso 2: Características técnicas */}
            {step === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="transmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.transmissionLabel')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar transmisión" />
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
                      <FormLabel>{t('sell.listing.form.fuelTypeLabel')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar combustible" />
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
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.mileageLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('sell.listing.form.mileagePlaceholder')} 
                          {...field}
                          onChange={e => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.colorLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('sell.listing.form.colorPlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vinNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('sell.listing.form.vinLabel')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('sell.listing.form.vinPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Opcional
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="licensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('sell.listing.form.licensePlateLabel')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('sell.listing.form.licensePlatePlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Opcional
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {/* Paso 3: Descripción y fotos */}
            {step === 3 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>{t('sell.listing.form.featuresLabel')}</FormLabel>
                        <FormDescription>
                          {t('sell.listing.form.featuresPlaceholder')}
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {FEATURES.map((feature) => (
                          <FormField
                            key={feature}
                            control={form.control}
                            name="features"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={feature}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(feature)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value || [], feature])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== feature
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {feature}
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
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.descriptionLabel')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('sell.listing.form.descriptionPlaceholder')}
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.locationLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('sell.listing.form.locationPlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <h3 className="mb-2 font-medium">{t('sell.listing.form.imagesLabel')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('sell.listing.form.imagesDescription')}
                  </p>
                  
                  <div 
                    {...getImageRootProps()} 
                    className="border-2 border-dashed rounded-md p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <input {...getImageInputProps()} />
                    <UploadCloud className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('sell.listing.form.imagesDropzoneText')}
                    </p>
                  </div>
                  
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Imágenes seleccionadas ({imagePreviewUrls.length})</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {imagePreviewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                              <Image 
                                src={url} 
                                alt={`Preview ${index + 1}`} 
                                fill
                                className="object-cover" 
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              &times;
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="mb-2 font-medium">{t('sell.listing.form.documentsLabel')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('sell.listing.form.documentsDescription')}
                  </p>
                  
                  <div 
                    {...getDocumentRootProps()} 
                    className="border-2 border-dashed rounded-md p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <input {...getDocumentInputProps()} />
                    <UploadCloud className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('sell.listing.form.documentsDropzoneText')}
                    </p>
                  </div>
                  
                  {documentNames.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Documentos seleccionados ({documentNames.length})</h4>
                      <div className="space-y-2">
                        {documentNames.map((name, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-md">
                            <span className="text-sm truncate">{name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeDocument(index)}
                            >
                              &times;
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Paso 4: Precio y condiciones */}
            {step === 4 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.priceLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('sell.listing.form.pricePlaceholder')} 
                          {...field}
                          onChange={e => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="negotiable"
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
                            {t('sell.listing.form.negotiableLabel')}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="acceptsTrade"
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
                            {t('sell.listing.form.acceptsTradeLabel')}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {/* Paso 5: Información de contacto */}
            {step === 5 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="sellerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.sellerNameLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('sell.listing.form.sellerNamePlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sellerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.sellerEmailLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder={t('sell.listing.form.sellerEmailPlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sellerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sell.listing.form.sellerPhoneLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('sell.listing.form.sellerPhonePlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Opcional
                      </FormDescription>
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
                          {t('sell.listing.form.termsLabel')}
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {/* Botones de navegación */}
            <div className="flex flex-wrap justify-between gap-4 pt-4">
              <div>
                {step > 1 ? (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handlePreviousStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('sell.listing.form.backButton')}
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('common.back_to_list')}
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Botón de guardado de borrador (siempre visible) */}
                {onSaveDraft && (
                  <Button 
                    type="button" 
                    variant="outline"
                    disabled={isSavingDraft}
                    onClick={handleSaveDraft}
                  >
                    {isSavingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('sell.listing.form.draftButton')}
                  </Button>
                )}
                
                {/* Botones según el paso */}
                {step < 5 ? (
                  <Button 
                    type="button"
                    onClick={handleNextStep}
                  >
                    {t('sell.listing.form.nextButton')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    {onPreview && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handlePreview}
                      >
                        {t('sell.listing.form.previewButton')}
                      </Button>
                    )}
                    
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('sell.listing.form.submitButton')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 