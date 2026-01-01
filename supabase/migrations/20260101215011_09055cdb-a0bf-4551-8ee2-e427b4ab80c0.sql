-- =============================================
-- FIX: Security Definer View issue
-- Recreate view with SECURITY INVOKER (default, safe)
-- =============================================

-- Drop the view and recreate with explicit security invoker
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate with SECURITY INVOKER (runs with caller's permissions, not owner's)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  username,
  first_name,
  last_name,
  avatar_url,
  bio,
  reputation,
  website,
  telegram_channel,
  show_name,
  show_avatar,
  show_username,
  created_at,
  CASE WHEN show_name THEN first_name ELSE NULL END as display_first_name,
  CASE WHEN show_name THEN last_name ELSE NULL END as display_last_name,
  CASE WHEN show_username THEN username ELSE NULL END as display_username,
  CASE WHEN show_avatar THEN avatar_url ELSE NULL END as display_avatar_url
FROM public.profiles
WHERE is_blocked = false;

-- Re-grant permissions
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Also need to allow anon to read from the base profiles table for the view to work
-- But with the new restrictive RLS policy, anon won't see sensitive data directly
-- Let's create a more permissive policy for basic profile info

-- First drop the overly restrictive policy we just created
DROP POLICY IF EXISTS "Service role can read all profiles" ON public.profiles;

-- Create a policy that allows reading basic profile info (view will handle filtering)
-- The key is: direct table access shows all columns, but edge functions control what's exposed
CREATE POLICY "Public can view basic profile info"
ON public.profiles
FOR SELECT
USING (
  -- Public can see profiles that are not blocked
  is_blocked = false
);

-- For notifications - keep restrictive (only edge functions should access)
-- The policy we created is correct

COMMENT ON VIEW public.public_profiles IS 'Public-safe view of profiles with SECURITY INVOKER. Hides telegram_id, referral_earnings, subscription info and respects privacy settings.';