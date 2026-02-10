import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { toggleLessonCompletion } from '../../../actions'

export default async function LessonPage({
    params
}: {
    params: { id: string; lessonId: string }
}) {
    const { id, lessonId } = await params
    const supabase = await createClient()

    // check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect(`/login?next=/courses/${id}/lessons/${lessonId}`)

    // check enrollment
    const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', id)
        .single()

    // fetch lesson
    const { data: lesson } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

    if (!lesson) return <div>Lesson not found</div>

    // If not enrolled and not preview, unauthorized
    if (!enrollment && !lesson.is_preview) {
        // check if instructor/admin
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const { data: course } = await supabase.from('courses').select('instructor_id').eq('id', id).single()

        const isOwner = course?.instructor_id === user.id
        const isAdmin = profile?.role === 'admin'

        if (!isOwner && !isAdmin) {
            return redirect(`/courses/${id}?message=You must enroll to view this lesson`)
        }
    }

    // check progress
    const { data: progress } = await supabase
        .from('lesson_progress')
        .select('completed')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single()

    const isCompleted = progress?.completed || false

    // Fetch all lessons for navigation
    const { data: allLessonsRaw } = await supabase
        .from('lessons')
        .select('id, title, "order"')
        .eq('course_id', id)
        .order('order', { ascending: true })

    const allLessons = allLessonsRaw || []
    const currentIndex = allLessons.findIndex((l: { id: string }) => l.id === lessonId)
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            <div className="flex-1 p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl space-y-8">
                    <div className="flex justify-between items-center mb-4">
                        <Link href={`/courses/${id}`} className="text-sm underline text-muted-foreground">
                            &larr; Back to Course
                        </Link>
                        <div className="flex items-center gap-4">
                            <form action={toggleLessonCompletion.bind(null, lessonId, !isCompleted, id)}>
                                <button className={`px-4 py-2 rounded text-sm font-medium ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-secondary text-secondary-foreground'}`}>
                                    {isCompleted ? '✓ Completed' : 'Mark as Complete'}
                                </button>
                            </form>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">{lesson.title}</h1>

                    {lesson.video_url && (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
                            {lesson.video_url.includes('youtube') || lesson.video_url.includes('vimeo') ? (
                                <iframe
                                    src={lesson.video_url}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title={lesson.title}
                                />
                            ) : (
                                <video controls src={lesson.video_url} className="w-full h-full" />
                            )}
                        </div>
                    )}

                    {lesson.meet_link && (
                        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-bold text-blue-900 mb-2">Live Session</h3>
                            <p className="mb-4 text-blue-800">This lesson includes a live Google Meet session.</p>
                            <a
                                href={lesson.meet_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
                            >
                                Join Google Meet
                            </a>
                        </div>
                    )}

                    <div className="prose max-w-none p-6 bg-card border rounded-lg">
                        <div className="whitespace-pre-wrap">{lesson.content || 'No text content.'}</div>
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t">
                        <div>
                            {prevLesson && (
                                <Link
                                    href={`/courses/${id}/lessons/${prevLesson.id}`}
                                    className="border px-4 py-2 rounded hover:bg-muted"
                                >
                                    &larr; Previous: {prevLesson.title}
                                </Link>
                            )}
                        </div>
                        <div>
                            {nextLesson ? (
                                <Link
                                    href={`/courses/${id}/lessons/${nextLesson.id}`}
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90"
                                >
                                    Next: {nextLesson.title} &rarr;
                                </Link>
                            ) : (
                                <Link
                                    href={`/courses/${id}`}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:opacity-90"
                                >
                                    Finish Course
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
