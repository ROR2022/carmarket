"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import FeaturedCars from "@/components/featured-cars"
import HowItWorks from "@/components/how-it-works"
import CarCategories from "@/components/car-categories"
import { useTranslation } from "@/utils/translation-context"

export default function HomePage() {
  const { t } = useTranslation()
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-900 to-slate-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("homePage.hero.title")}</h1>
            <p className="text-xl mb-8">{t("homePage.hero.subtitle")}</p>

            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t("homePage.hero.searchPlaceholder")}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
                <Button size="lg" className="shrink-0">
                  {t("homePage.hero.searchButton")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <FeaturedCars />

      {/* How It Works */}
      <HowItWorks />

      {/* Car Categories */}
      <CarCategories />

      {/* CTA Section */}
      <section className="bg-primary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t("homePage.cta.title")}</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            {t("homePage.cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/cars">{t("homePage.cta.browseAllCars")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sell">{t("homePage.cta.sellYourCar")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

