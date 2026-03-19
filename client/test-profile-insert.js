import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testProfileInsert() {
    console.log('Testing profile insertion...')
    const dummyId = '00000000-0000-0000-0000-000000000000'
    const { data, error } = await supabase.from('profiles').insert([{
        id: dummyId,
        email: 'test@example.com',
        credits: 100
    }])

    if (error) {
        console.error('Error inserting profile:', error)
    } else {
        console.log('Profile inserted successfully (or already exists):', data)
    }
}

testProfileInsert()
