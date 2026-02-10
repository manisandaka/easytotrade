import { createClient } from '@/utils/supabase/server'
import { updateCourse, deleteLesson } from '../actions' // Import deleteLesson
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function EditCoursePage({ params }: { params: { id: string } }) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch course with lessons sorted by order
    const { data: course } = await supabase
        .from('courses')
        .select('*, lessons(*)')
        .eq('id', id)
        .single()

    if (!course) {
        return <div>Course not found</div>
    }

    // Sort lessons locally if needed or use order() in query
    const lessons = (course.lessons as { id: string; title: string; order: number; is_preview: boolean }[])?.sort((a, b) => a.order - b.order) || []

    return (
        <div className="flex flex-col items-center p-8 w-full">
            <div className="w-full max-w-4xl space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Edit Course: {course.title}</h1>
                    <Link href="/admin" className="text-sm underline">Back to Dashboard</Link>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Course Details</h2>
                    <form action={updateCourse.bind(null, id)} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="font-medium">Title</label>
                                <input name="title" defaultValue={course.title} className="border rounded p-2" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-medium">Status</label>
                                <select name="status" defaultValue={course.status} className="border rounded p-2">
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-medium">Description</label>
                            <textarea name="description" defaultValue={course.description} className="border rounded p-2 h-24" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-medium">Price (cents)</label>
                            <input type="number" name="price" defaultValue={course.price / 100} step="0.01" className="border rounded p-2" />
                        </div>
                        <button className="bg-primary text-primary-foreground py-2 px-4 rounded w-fit">Update Details</button>
                    </form>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Lessons</h2>
                        <Link href={`/admin/courses/${id}/lessons/new`} className="bg-secondary text-secondary-foreground px-3 py-1 rounded text-sm">
                            Add Lesson
                        </Link>
                    </div>

                    <div className="space-y-2">
                        {lessons.map((lesson: { id: string; title: string; order: number; is_preview: boolean }) => (
                            <div key={lesson.id} className="flex justify-between items-center p-3 border rounded bg-background">
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-muted-foreground w-6 text-center">{lesson.order}</span>
                                    <div>
                                        <p className="font-medium">{lesson.title}</p>
                                        <p className="text-xs text-muted-foreground">{lesson.is_preview ? 'Preview' : 'Locked'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/admin/courses/${id}/lessons/${lesson.id}`} className="text-blue-600 text-sm">Edit</Link>
                                    <form action={deleteLesson.bind(null, id, lesson.id)}>
                                        <button className="text-red-600 text-sm">Delete</button>
                                    </form>
                                </div>
                            </div>
                        ))}
                        {lessons.length === 0 && <p className="text-muted-foreground text-center py-4">No lessons yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}
