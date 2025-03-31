/* eslint-disable no-unused-vars */
"use client"

import React, { createContext, useContext } from 'react'
import esTranslations from '@/translations/es.json'

// Define un tipo para el contexto
type TranslationContextType = {
  t: (path: string) => string
}

// Crear el contexto
const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

// Proveedor del contexto
export function TranslationProvider({ children }: { children: React.ReactNode }) {
  // Función para obtener un valor de traducción utilizando una ruta de acceso como "navbar.buy"
  const t = (path: string): string => {
    const keys = path.split('.')
    let value: any = esTranslations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${path}`)
        return path
      }
    }
    
    return value as string
  }

  return (
    <TranslationContext.Provider value={{ t }}>
      {children}
    </TranslationContext.Provider>
  )
}

// Hook personalizado para usar las traducciones
export function useTranslation() {
  const context = useContext(TranslationContext)
  
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  
  return context
} 