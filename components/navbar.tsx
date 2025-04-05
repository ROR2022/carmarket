"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Menu, X, LogOut, MessageSquare } from "lucide-react"
import { useTranslation } from "@/utils/translation-context"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useAuth } from "@/utils/auth-hooks"
import { MessageService } from "@/services/message"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { t } = useTranslation()
  const { isAuthenticated, signOut, loading, user } = useAuth()

  // Obtener contador de mensajes no leídos
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        const count = await MessageService.getUnreadMessageCount(user.id);
        setUnreadCount(count);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };
    
    if (isAuthenticated && user) {
      fetchUnreadCount();
      
      // Actualizar cada minuto
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              {t("common.appName")}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 relative z-20">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>{t("navbar.buy")}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[400px] md:w-[500px] lg:w-[600px] grid-cols-2 relative z-50">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/cars"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{t("navbar.allCars")}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t("navbar.browseCarsDescription")}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/cars/category/sedan"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{t("navbar.sedans")}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t("navbar.sedansDescription")}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/cars/category/suv"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{t("navbar.suvs")}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t("navbar.suvsDescription")}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/cars/category/hatchback"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{t("navbar.hatchbacks")}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t("navbar.hatchbacksDescription")}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>{t("navbar.sell")}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/sell"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{t("navbar.sellYourCar")}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t("navbar.sellYourCarDescription")}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      {isAuthenticated && (
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              href="/sell/my-listings"
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="text-sm font-medium leading-none">{t("navbar.myListings")}</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {t("navbar.myListingsDescription")}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      )}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/about" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>{t("navbar.aboutUs")}</NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          

          <div className="hidden md:flex items-center space-x-4">
            <ThemeSwitcher />
            {!loading && (
              <>
                {isAuthenticated ? (
                  <>
                    <Button variant="ghost" asChild className="gap-2">
                      <Link href="/messages">
                        <MessageSquare className="h-4 w-4" />
                        {t("navbar.messages")}
                        {unreadCount > 0 && (
                          <span className="ml-1 h-5 min-w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("navbar.logout")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href="/sign-in">{t("navbar.login")}</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/sign-up">{t("navbar.register")}</Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <ThemeSwitcher />
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden py-4 px-4 border-t">
          <nav className="flex flex-col space-y-4">
            <Link href="/cars" className="py-2 text-lg" onClick={() => setIsMenuOpen(false)}>
              {t("navbar.buyCars")}
            </Link>
            <Link href="/sell" className="py-2 text-lg" onClick={() => setIsMenuOpen(false)}>
              {t("navbar.sellYourCar")}
            </Link>
            {isAuthenticated && (
              <Link href="/sell/my-listings" className="py-2 text-lg" onClick={() => setIsMenuOpen(false)}>
                {t("navbar.myListings")}
              </Link>
            )}
            <Link href="/about" className="py-2 text-lg" onClick={() => setIsMenuOpen(false)}>
              {t("navbar.aboutUs")}
            </Link>
            {isAuthenticated && (
              <Link href="/messages" className="py-2 text-lg flex items-center" onClick={() => setIsMenuOpen(false)}>
                {t("navbar.messages")}
                {unreadCount > 0 && (
                  <span className="ml-2 h-5 min-w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <div className="pt-4 flex flex-col space-y-2">
              {!loading && (
                <>
                  {isAuthenticated ? (
                    <Button variant="outline" className="w-full" onClick={() => { signOut(); setIsMenuOpen(false); }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("navbar.logout")}
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" asChild className="w-full">
                        <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                          {t("navbar.login")}
                        </Link>
                      </Button>
                      <Button asChild className="w-full">
                        <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                          {t("navbar.register")}
                        </Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

