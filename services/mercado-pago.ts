import { MercadoPagoConfig, Payment, Preference } from "mercadopago"

// Initialize the MercadoPago client
const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

// Definir interfaz para los items
interface PaymentItem {
  id: string;
  title: string;
  price: number;
  [key: string]: unknown;
}

export async function createPaymentPreference(items: PaymentItem[], buyerEmail: string) {
  try {
    const preference = new Preference(mercadopago)

    const result = await preference.create({
      body: {
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          quantity: 1,
          unit_price: item.price,
          currency_id: "MXN",
        })),
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending`,
        },
        auto_return: "approved",
        payer: {
          email: buyerEmail,
        },
      },
    })

    return result
  } catch (error) {
    console.error("Error creating payment preference:", error)
    throw error
  }
}

export async function getPaymentById(paymentId: string) {
  try {
    const payment = new Payment(mercadopago)
    return await payment.get({ id: paymentId })
  } catch (error) {
    console.error("Error getting payment:", error)
    throw error
  }
}

