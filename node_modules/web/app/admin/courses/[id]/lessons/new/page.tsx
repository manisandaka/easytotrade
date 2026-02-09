import { createLesson } from '../../../actions'

export default async function NewLessonPage({ params }: { params: { id: string } }) {
    const { id } = await params

    return (
        <div className="flex flex-col items-center p-8 w-full">
            <div className="w-full max-w-2xl bg-card border rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-6">Add New Lesson</h1>
                <form action={createLesson.bind(null, id)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="title" className="font-medium">Title</label>
                        <input name="title" required className="border rounded p-2" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="description" className="font-medium">Description</label>
                        <input name="description" className="border rounded p-2" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="content" className="font-medium">Content (Markdown)</label>
                        <textarea name="content" className="border rounded p-2 h-48 font-mono" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="video_url" className="font-medium">Video URL</label>
                            <input name="video_url" className="border rounded p-2" placeholder="https://..." />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="meet_link" className="font-medium">Google Meet Link</label>
                            <input name="meet_link" className="border rounded p-2" placeholder="https://meet.google.com/..." />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="is_preview" id="is_preview" />
                        <label htmlFor="is_preview">Free Preview</label>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="order" className="font-medium">Order</label>
                        <input type="number" name="order" defaultValue="0" className="border rounded p-2 w-24" />
                    </div>

                    <button className="bg-primary text-primary-foreground py-2 px-4 rounded mt-4">Add Lesson</button>
                </form>
            </div>
        </div>
    )
}
