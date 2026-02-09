'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function enrollFree(courseId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const { error } = await supabase
        .from('enrollments')
        .insert({
            user_id: user.id,
            course_id: courseId,
            status: 'active'
        })

    if (error) {
        // checks for unique constraint violation (already enrolled)
        if (error.code === '23505') {
            // already enrolled, just redirect
            return redirect(`/courses/${courseId}`)
        }
        console.error('Enrollment error:', error)
        throw new Error('Failed to enroll')
    }

    revalidatePath(`/courses/${courseId}`)
    redirect(`/courses/${courseId}`)
}

export async function toggleLessonCompletion(lessonId: string, completed: boolean, courseId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
        .from('lesson_progress')
        .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            completed,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error('Progress update error:', error)
        throw new Error('Failed to update progress')
    }

    revalidatePath(`/courses/${courseId}/lessons/${lessonId}`)
}

