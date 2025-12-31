import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function enc(text: string) {
  return new TextEncoder().encode(text);
}

async function hmacSha256Raw(key: string, data: string) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, enc(data));
}

async function hmacSha256Hex(key: ArrayBuffer, data: string) {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyTelegramInitData(initData: string): Promise<{ user: any | null }> {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { user: null };

  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key === 'hash') return;
    pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  const secretKey = await hmacSha256Raw('WebAppData', TELEGRAM_BOT_TOKEN);
  const checkHash = await hmacSha256Hex(secretKey, dataCheckString);

  if (checkHash !== hash) return { user: null };

  const userJson = params.get('user');
  if (!userJson) return { user: null };

  try {
    return { user: JSON.parse(userJson) };
  } catch {
    return { user: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { initData, userId } = await req.json();
    
    if (!initData) {
      return new Response(JSON.stringify({ error: 'initData is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user: tgUser } = await verifyTelegramInitData(initData);
    if (!tgUser?.id) {
      return new Response(JSON.stringify({ error: 'Invalid Telegram initData' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get target user profile
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, reputation')
      .eq('id', userId)
      .maybeSingle();

    if (pErr || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get reputation history with from_user profiles
    const { data: history, error: hErr } = await supabase
      .from('reputation_history')
      .select(`
        id,
        value,
        created_at,
        from_user:profiles!reputation_history_from_user_id_fkey(
          id, first_name, last_name, username, avatar_url, 
          show_name, show_username, show_avatar, subscription_tier
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (hErr) {
      console.error('Error fetching reputation history:', hErr);
    }

    return new Response(JSON.stringify({ 
      reputation: profile.reputation || 0, 
      history: history || [] 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('tg-user-reputation error:', e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
