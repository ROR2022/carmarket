import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createPaymentPreference } from "@/services/mercado-pago"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
    
  if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { carId } = await request.json()
    if (!carId) {
      return NextResponse.json({ error: "Car ID is required" }, { status: 400 })
    }

    // Get car details
    const { data: car, error: carError } = await supabase.from("cars").select("*").eq("id", carId).single()

    if (carError || !car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 })
    }

    // Get user email
    
    if (!user?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 })
    }

    // Create payment preference
    const preference = await createPaymentPreference([{ id: car.id, title: car.title, price: car.price }], user.email)

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
    })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}

