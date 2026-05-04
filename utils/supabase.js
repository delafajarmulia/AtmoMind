import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Inisialisasi koneksi ke Supabase dengan pengaman jika URL kosong (menghindari layar crash)
export const supabase = createClient(supabaseUrl, supabaseKey)
