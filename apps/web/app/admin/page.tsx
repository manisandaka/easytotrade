import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminDashboard() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return redirect('/dashboard?message=Unauthorized access')
    }

    const { data: courses } = await supabase
        .from('courses')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })

    return (
        <div className="flex-1 w-full flex flex-col gap-4 items-center p-8">
            <div className="w-full max-w-6xl space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <Link href="/admin/courses/new" className="bg-primary text-primary-foreground px-4 py-2 rounded">
                        Create Course
                    </Link>
                </div>

                <div className="bg-card p-6 rounded-lg border">
                    <h2 className="text-xl font-semibold mb-4">All Courses</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="p-2">Title</th>
                                    <th className="p-2">Instructor</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Price</th>
                                    <th className="p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses?.map((course) => (
                                    <tr key={course.id} className="border-b">
                                        <td className="p-2">{course.title}</td>
                                        <td className="p-2">{course.profiles?.full_name || 'Unknown'}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-1 rounded text-xs ${course.status === 'published' ? 'bg-green-100 text-green-800' :
                                                    course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'
                                                }`}>
                                                {course.status}
                                            </span>
                                        </td>
                                        <td className="p-2">${(course.price / 100).toFixed(2)}</td>
                                        <td className="p-2">
                                            <Link href={`/admin/courses/${course.id}`} className="text-blue-600 hover:underline">
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {(!courses || courses.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-muted-foreground">No courses found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
