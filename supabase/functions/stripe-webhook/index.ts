import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.16.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')

    if (!signature) {
        return new Response('No signature', { status: 400 })
    }

    try {
        const body = await req.text()
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
        let event

        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                webhookSecret,
                undefined,
                cryptoProvider
            )
        } catch (err) {
            console.error(`Webhook signature verification failed.`, err.message)
            return new Response(err.message, { status: 400 })
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object
            const userId = session.metadata?.userId
            const courseId = session.metadata?.courseId

            if (userId && courseId) {
                const supabase = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                )

                // 1. Record payment
                const { error: paymentError } = await supabase.from('payments').insert({
                    user_id: userId,
                    stripe_session_id: session.id,
                    amount: session.amount_total ?? 0,
                    status: session.payment_status,
                })

                if (paymentError) console.error('Payment insert error:', paymentError)

                // 2. Enroll user
                const { error: enrollError } = await supabase.from('enrollments').insert({
                    user_id: userId,
                    course_id: courseId,
                    status: 'active',
                })

                if (enrollError) {
                    // Ignore duplicate key error (already enrolled)
                    if (enrollError.code !== '23505') {
                        console.error('Enrollment insert error:', enrollError)
                        return new Response('Enrollment failed', { status: 500 })
                    }
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (err) {
        console.error(err)
        return new Response(err.message, { status: 400 })
    }
})
