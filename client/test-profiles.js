import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
    console.log("Checking profiles table...");
    const { data: profiles, error: selectError } = await supabase.from('profiles').select('*');

    if (selectError) {
        console.error("Error reading profiles:", selectError);
    } else {
        console.log(`Found ${profiles?.length || 0} profiles:`, profiles);
    }

    // Try a direct insert using the anon key (which we allowed in RLS just now)
    // We will use a dummy UUID just to test if INSERT works at all.
    console.log("\nTrying to insert a test profile...");
    const dummyId = '11111111-2222-3333-4444-555555555555';
    const { error: insertError } = await supabase.from('profiles').upsert([{
        id: dummyId,
        email: 'test_insert@example.com',
        role: 'user',
        status: 'active',
        credits: 100
    }], { onConflict: 'id' });

    if (insertError) {
        console.error("Insert failed! RLS might still be blocking:", insertError);
    } else {
        console.log("Insert succeeded!");

        // Clean up
        await supabase.from('profiles').delete().eq('id', dummyId);
    }
}

main().catch(console.error);
