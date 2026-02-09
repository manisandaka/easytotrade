import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function CoursesPage({
    searchParams,
}: {
    searchParams: { q?: string; category?: string }
}) {
    const supabase = await createClient()
    const query = searchParams.q
    const categoryId = searchParams.category

    let supabaseQuery = supabase
        .from('courses')
        .select('*, profiles(full_name), categories(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

    if (query) {
        supabaseQuery = supabaseQuery.ilike('title', `%${query}%`)
    }

    if (categoryId) {
        supabaseQuery = supabaseQuery.eq('category_id', categoryId)
    }

    const { data: courses } = await supabaseQuery
    const { data: categories } = await supabase.from('categories').select('*')

    return (
        <div className="flex flex-col items-center p-8 w-full">
            <div className="w-full max-w-6xl space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold">Explore Courses</h1>
                    <form className="flex gap-2 w-full md:w-auto">
                        <select
                            name="category"
                            defaultValue={categoryId}
                            className="border rounded p-2 bg-background"
                        >
                            <option value="">All Categories</option>
                            {categories?.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <input
                            name="q"
                            defaultValue={query}
                            placeholder="Search courses..."
                            className="border rounded p-2 bg-background"
                        />
                        <button className="bg-primary text-primary-foreground px-4 py-2 rounded">
                            Search
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses?.map((course) => (
                        <Link
                            href={`/courses/${course.id}`}
                            key={course.id}
                            className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-card"
                        >
                            <div className="h-48 bg-muted flex items-center justify-center text-muted-foreground">
                                {course.image_url ? (
                                    <img
                                        src={course.image_url}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span>No Image</span>
                                )}
                            </div>
                            <div className="p-4 space-y-2">
                                <h2 className="text-xl font-semibold line-clamp-1">{course.title}</h2>
                                <p className="text-sm text-muted-foreground">
                                    by {course.profiles?.full_name || 'Unknown'}
                                </p>
                                <div className="flex justify-between items-center mt-4">
                                    <span className="font-bold">
                                        {course.price > 0
                                            ? `$${(course.price / 100).toFixed(2)}`
                                            : 'Free'}
                                    </span>
                                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                                        {course.categories?.name}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {(!courses || courses.length === 0) && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No courses found matching your criteria.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
