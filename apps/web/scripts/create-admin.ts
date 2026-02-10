import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load env vars manually
// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env')
console.log(`Loading env from: ${envPath}`)

if (!fs.existsSync(envPath)) {
    console.error(`Error: .env file not found at ${envPath}`)
    process.exit(1)
}

const envConfig = fs.readFileSync(envPath, 'utf8')
const env: Record<string, string> = {}

envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
        const key = match[1].trim()
        // Remove quotes and whitespace/newlines (important for Windows \r)
        const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1')
        env[key] = value
    }
})

console.log('Env loaded keys:', Object.keys(env))

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

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
