'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RazorpayCheckoutProps {
    courseId: string
    price: number
    title: string
    description: string
    user: {
        id: string
        email: string
        full_name?: string
    }
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function RazorpayCheckout({ courseId, price, title, description, user }: RazorpayCheckoutProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handlePayment = async () => {
        setLoading(true)
        try {
            // 1. Create Order
            const orderRes = await fetch('/api/razorpay/order', {
                method: 'POST',
                body: JSON.stringify({ courseId }),
            })

            if (!orderRes.ok) throw new Error('Failed to create order')
            const order = await orderRes.json()

            // 2. Initialize Options
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use NEXT_PUBLIC_ for client-side
                amount: order.amount,
                currency: order.currency,
                name: "EasytoTrade",
                description: title,
                image: "https://your-logo-url.com/logo.png", // Optional
                order_id: order.id,
                handler: async function (response: any) {
                    // 3. Verify Payment
                    const verifyRes = await fetch('/api/razorpay/verify', {
                        method: 'POST',
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            courseId
                        }),
                    })

                    if (verifyRes.ok) {
                        alert('Payment Successful! You are enrolled.')
                        router.refresh()
                    } else {
                        alert('Payment Verification Failed')
                    }
                },
                prefill: {
                    name: user.full_name,
                    email: user.email,
                    contact: "" // Optional
                },
                notes: {
                    address: "Razorpay Corporate Office"
                },
                theme: {
                    color: "#3399cc"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                alert(response.error.description);
            });
            rzp1.open();

        } catch (error) {
            console.error(error)
            alert('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
            {loading ? 'Processing...' : `Enroll for $${(price / 100).toFixed(2)}`}
        </button>
    )
}
