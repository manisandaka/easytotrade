import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

let razorpayInstance: Razorpay | null = null;

function getRazorpay() {
    if (!razorpayInstance) {
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        })
    }
    return razorpayInstance
}

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

        const options = {
            amount: course.price, // Amount is already in cents/paise
            currency: "USD", // Or INR if preferred, keeping USD as per schema for now
            receipt: `receipt_${courseId}_${user.id.substring(0, 8)}`,
            notes: {
                courseId: courseId,
                userId: user.id
            }
        }

        const razorpay = getRazorpay()
        const order = await razorpay.orders.create(options)

        return NextResponse.json(order)

    } catch (err: any) {
        console.error('Razorpay Order Error:', err)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
