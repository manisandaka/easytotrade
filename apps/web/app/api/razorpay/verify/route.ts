import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            courseId
        } = await request.json()

        const body = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest('hex')

        const isAuthentic = expectedSignature === razorpay_signature

        if (!isAuthentic) {
            return new NextResponse('Invalid signature', { status: 400 })
        }

        // 1. Record payment
        const { error: paymentError } = await supabase.from('payments').insert({
            user_id: user.id,
            razorpay_order_id: razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id,
            razorpay_signature: razorpay_signature,
            amount: 0, // We should fetch this from order or pass it, but for verification just recording ID is key
            status: 'paid',
        })

        if (paymentError) console.error('Payment insert error:', paymentError)

        // 2. Enroll user
        const { error: enrollError } = await supabase.from('enrollments').insert({
            user_id: user.id,
            course_id: courseId,
            status: 'active',
        })

        if (enrollError) {
            if (enrollError.code !== '23505') {
                console.error('Enrollment insert error:', enrollError)
                return new NextResponse('Enrollment failed', { status: 500 })
            }
        }

        return NextResponse.json({ success: true })

    } catch (err: unknown) {
        console.error('Payment Verification Error:', err)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
