"use client"

import { useState } from "react"
//import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface CheckoutButtonProps {
  carId: string
  price: number
}

export default function CheckoutButton({ carId, price }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  //const router = useRouter()

  const handleCheckout = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ carId }),
      })

      if (!response.ok) {
        throw new Error("Failed to create payment")
      }

      const { initPoint } = await response.json()

      // Redirect to Mercado Pago checkout
      window.location.href = initPoint
    } catch (error) {
      console.error("Checkout error:", error)
      alert("There was an error processing your payment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={isLoading} size="lg" className="w-full">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Pay ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(price)}`
      )}
    </Button>
  )
}

