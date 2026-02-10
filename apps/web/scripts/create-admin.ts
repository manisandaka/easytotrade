import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})



async function createAdmin() {
    const email = 'admin@easytotrade.com'
    const password = 'securepassword123' // Change this!
    const fullName = 'System Admin'

    console.log(`Creating admin user: ${email}`)

    // 1. Create user in auth.users
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName
        }
    })

    if (createError) {
        console.error('Error creating user:', createError.message)
        return
    }

    if (!user.user) {
        console.error('User creation failed (no user returned)')
        return
    }

    const userId = user.user.id
    console.log(`User created with ID: ${userId}`)

    // 2. Assign admin role in public.profiles
    // The trigger might have created the profile with 'learner' role.
    // We need to update it to 'admin'.

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId)

    if (updateError) {
        console.error('Error updating profile role:', updateError.message)
    } else {
        console.log('Successfully promoted user to Admin role.')
    }
}

createAdmin()
