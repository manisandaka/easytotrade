import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { enrollFree } from '../actions'
import RazorpayCheckout from '../../components/RazorpayCheckout'

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: course } = await supabase
        .from('courses')
        .select(`
            *,
            profiles(full_name),
            categories(name),
            lessons(id, title, is_preview, "order")
        `)
        .eq('id', id)
        .eq('status', 'published')
        .single()

    if (!course) {
        return <div className="p-8 text-center">Course not found or not published.</div>
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    let isEnrolled = false
    if (user) {
        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', id)
            .single()
        if (enrollment) isEnrolled = true
    }

    const lessons = (course.lessons as { id: string; title: string; order: number; is_preview: boolean }[])?.sort((a, b) => a.order - b.order) || []

    return (
        <div className="flex flex-col items-center p-8 w-full min-h-screen">
            <div className="w-full max-w-4xl bg-card border rounded-lg overflow-hidden shadow-sm">
                <div className="h-64 bg-muted flex items-center justify-center text-muted-foreground">
                    {course.image_url ? (
                        <img
                            src={course.image_url}
                            alt={course.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-xl">No Course Image</span>
                    )}
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold">{course.title}</h1>
                                <p className="text-muted-foreground mt-1">
                                    by {course.profiles?.full_name || 'Unknown'} • {course.categories?.name}
                                </p>
                            </div>
                            <div className="text-2xl font-bold">
                                {course.price > 0 ? `$${(course.price / 100).toFixed(2)}` : 'Free'}
                            </div>
                        </div>
                    </div>

                    <div className="prose max-w-none">
                        <h3 className="text-xl font-semibold">About this course</h3>
                        <p className="whitespace-pre-wrap">{course.description}</p>
                    </div>

                    <div className="border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Course Content</h3>
                            <span className="text-sm text-muted-foreground">{lessons.length} lessons</span>
                        </div>
                        <div className="space-y-2">
                            {lessons.map((lesson: { id: string; title: string; is_preview: boolean }, idx: number) => (
                                <div
                                    key={lesson.id}
                                    className={`flex justify-between items-center p-3 border rounded ${isEnrolled || lesson.is_preview
                                        ? 'hover:bg-accent cursor-pointer'
                                        : 'opacity-75 bg-muted/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-muted-foreground w-6 text-center">
                                            {idx + 1}
                                        </span>
                                        <span className="font-medium">{lesson.title}</span>
                                        {lesson.is_preview && !isEnrolled && (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                Preview
                                            </span>
                                        )}
                                    </div>
                                    {isEnrolled || lesson.is_preview ? (
                                        <Link
                                            href={`/courses/${id}/lessons/${lesson.id}`}
                                            className="text-blue-600 font-medium text-sm"
                                        >
                                            Watch
                                        </Link>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">Locked</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        {isEnrolled ? (
                            <Link
                                href={`/courses/${id}/lessons/${lessons[0]?.id}`}
                                className="block w-full text-center bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition"
                            >
                                Continue Learning
                            </Link>
                        ) : (
                            <>
                                {course.price === 0 ? (
                                    <form action={enrollFree.bind(null, id)}>
                                        <button
                                            type="submit"
                                            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition"
                                        >
                                            Enroll for Free
                                        </button>
                                    </form>
                                ) : (
                                    <RazorpayCheckout
                                        courseId={id}
                                        price={course.price}
                                        title={course.title}
                                        description={course.description}
                                        user={{
                                            id: user?.id || '',
                                            email: user?.email || '',
                                            full_name: course.profiles?.full_name
                                        }}
                                    />
                                )}
                            </>
                        )}

                    </div>
                </div>
            </div>
        </div >
    )
}
