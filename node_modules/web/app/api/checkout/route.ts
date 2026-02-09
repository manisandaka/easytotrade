import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
})

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { courseId } = await request.json()

        if (!courseId) {
            return new NextResponse('Course ID required', { status: 400 })
        }

        const { data: course } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single()

        if (!course || course.price === 0) {
            return new NextResponse('Invalid course or free course', { status: 400 })
        }

        // Check if customer exists in Stripe (optional, for now create session with email)
        // We pass client_reference_id as courseId and user_id in metadata
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: course.title,
                            description: course.description?.substring(0, 100),
                            images: course.image_url ? [course.image_url] : [],
                        },
                        unit_amount: course.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/courses/${courseId}?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/courses/${courseId}?canceled=true`,
            client_reference_id: user.id,
            metadata: {
                courseId: courseId,
                userId: user.id,
            },
            customer_email: user.email,
        })

        return NextResponse.json({ sessionId: session.id, url: session.url })

    } catch (err: any) {
        console.error(err)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
