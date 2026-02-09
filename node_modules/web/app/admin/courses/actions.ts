'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCourse(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const price = Number(formData.get('price')) * 100 // Convert to cents
    const category_id = formData.get('category_id') as string

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const { data, error } = await supabase
        .from('courses')
        .insert({
            title,
            description,
            price,
            category_id: category_id || null,
            instructor_id: user.id, // Auto-assign to creator for now
            status: 'draft',
        })
        .select()
        .single()

    if (error) {
        console.error('Create course error:', error)
        return redirect('/admin/courses/new?message=Failed to create course')
    }

    revalidatePath('/admin')
    redirect(`/admin/courses/${data.id}`)
}

export async function updateCourse(id: string, formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const price = Number(formData.get('price')) * 100
    const status = formData.get('status') as 'draft' | 'published' | 'archived'

    const { error } = await supabase
        .from('courses')
        .update({
            title,
            description,
            price,
            status
        })
        .eq('id', id)

    if (error) {
        throw new Error('Failed to update course')
    }

    revalidatePath(`/admin/courses/${id}`)
    revalidatePath('/admin')
}

export async function createLesson(courseId: string, formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const content = formData.get('content') as string
    const video_url = formData.get('video_url') as string
    const meet_link = formData.get('meet_link') as string
    const is_preview = formData.get('is_preview') === 'on'
    const order = Number(formData.get('order')) || 0

    const { error } = await supabase
        .from('lessons')
        .insert({
            course_id: courseId,
            title,
            description,
            content,
            video_url,
            meet_link,
            is_preview,
            order
        })

    if (error) {
        console.error('Create lesson error:', error)
        throw new Error('Failed to create lesson')
    }

    revalidatePath(`/admin/courses/${courseId}`)
    redirect(`/admin/courses/${courseId}`)
}

export async function deleteLesson(courseId: string, lessonId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

    if (error) {
        throw new Error('Failed to delete lesson')
    }

    revalidatePath(`/admin/courses/${courseId}`)
}

