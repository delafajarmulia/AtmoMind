import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://contoh.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'contoh-api-key';

// Inisialisasi koneksi ke Supabase dengan pengaman jika URL kosong (menghindari layar crash)
export const supabase = createClient(supabaseUrl, supabaseKey)
