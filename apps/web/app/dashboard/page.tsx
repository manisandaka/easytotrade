import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '../login/actions'

export default async function Dashboard() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex-1 w-full flex flex-col gap-4 items-center">
            <div className="w-full max-w-4xl p-8 space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <form action={signout}>
                        <button className="bg-red-600 text-white rounded px-4 py-2">
                            Sign Out
                        </button>
                    </form>
                </div>

                <div className="bg-foreground/5 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Welcome, {profile?.full_name || user.email}!</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded">
                            <h3 className="font-medium">Role</h3>
                            <p>{profile?.role || 'Learner'}</p>
                        </div>
                        <div className="p-4 border rounded">
                            <h3 className="font-medium">User ID</h3>
                            <p className="text-sm font-mono">{user.id}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-bold">My Courses</h3>
                    <p className="text-muted-foreground">You are not enrolled in any courses yet.</p>
                </div>
            </div>
        </div>
    )
}
