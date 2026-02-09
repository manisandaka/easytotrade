import { createClient } from '@/utils/supabase/server'
import { createCourse } from '../actions'

export default async function NewCoursePage() {
    const supabase = await createClient()
    const { data: categories } = await supabase.from('categories').select('*')

    return (
        <div className="flex flex-col items-center p-8 w-full">
            <div className="w-full max-w-2xl bg-card border rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-6">Create New Course</h1>
                <form action={createCourse} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="title" className="font-medium">Course Title</label>
                        <input
                            name="title"
                            id="title"
                            required
                            className="border rounded p-2 bg-background"
                            placeholder="e.g. Advanced Technical Analysis"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="description" className="font-medium">Description</label>
                        <textarea
                            name="description"
                            id="description"
                            className="border rounded p-2 bg-background h-32"
                            placeholder="Course description..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="price" className="font-medium">Price ($)</label>
                            <input
                                type="number"
                                name="price"
                                id="price"
                                min="0"
                                step="0.01"
                                required
                                className="border rounded p-2 bg-background"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="category_id" className="font-medium">Category</label>
                            <select name="category_id" id="category_id" className="border rounded p-2 bg-background">
                                <option value="">Select a category</option>
                                {categories?.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="bg-primary text-primary-foreground py-2 px-4 rounded mt-4">
                        Create Course
                    </button>
                </form>
            </div>
        </div>
    )
}
