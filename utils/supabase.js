import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Dummy client jika env belum diatur — agar tampilan tetap bisa ditest dengan data mockup
function createDummyClient() {
  const dummyQuery = () => {
    const builder = {
      select: () => builder,
      order: () => builder,
      limit: () => builder,
      gte: () => builder,
      lte: () => builder,
      eq: () => builder,
      single: () => Promise.resolve({ data: null, error: { message: 'Supabase belum dikonfigurasi (env kosong)' } }),
      then: (resolve) => resolve({ data: [], error: { message: 'Supabase belum dikonfigurasi (env kosong)' } }),
    };
    return builder;
  };

  return {
    from: () => dummyQuery(),
    channel: () => ({
      on: function () { return this; },
      subscribe: function () { return this; },
    }),
    removeChannel: () => {},
  };
}

// Inisialisasi koneksi ke Supabase dengan pengaman jika URL kosong (menghindari layar crash)
export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : createDummyClient();
