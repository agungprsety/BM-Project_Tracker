import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// We need the SERVICE_ROLE_KEY to bypass Row Level Security
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function promote() {
    console.log("Attempting to promote with Service Role Key...");
    
    // First, let's verify if the user exists and what their current status is
    const { data: user, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('nickname', 'gemini')
        .single();
        
    if (fetchErr) {
        console.error("Error fetching user:", fetchErr.message);
        return;
    }
    
    console.log("Current user state:", user);
    
    // Now perform the update taking advantage of the service role bypass
    const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('nickname', 'gemini')
        .select();
        
    if (error) {
        console.error("Failed to update:", error.message);
    } else {
        console.log("Update successful. New state:", data);
    }
}

promote();
