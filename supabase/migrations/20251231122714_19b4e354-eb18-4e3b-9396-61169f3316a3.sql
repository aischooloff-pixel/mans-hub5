-- Create storage bucket for product media
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for product media
CREATE POLICY "Anyone can view product media"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-media');

CREATE POLICY "Service role can manage product media"
ON storage.objects FOR ALL
USING (bucket_id = 'product-media')
WITH CHECK (bucket_id = 'product-media');

-- Create table for subscription pricing (managed by admin)
CREATE TABLE IF NOT EXISTS public.subscription_pricing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tier text NOT NULL UNIQUE CHECK (tier IN ('plus', 'premium')),
  monthly_price integer NOT NULL DEFAULT 0,
  yearly_price integer NOT NULL DEFAULT 0,
  monthly_original_price integer NOT NULL DEFAULT 0,
  yearly_original_price integer NOT NULL DEFAULT 0,
  discount_percent integer NOT NULL DEFAULT 50,
  yearly_discount_percent integer NOT NULL DEFAULT 30,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_pricing ENABLE ROW LEVEL SECURITY;

-- Everyone can read pricing
CREATE POLICY "Anyone can view pricing"
ON public.subscription_pricing FOR SELECT
USING (true);

-- Only service role can manage pricing
CREATE POLICY "Service role can manage pricing"
ON public.subscription_pricing FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default pricing
INSERT INTO public.subscription_pricing (tier, monthly_price, yearly_price, monthly_original_price, yearly_original_price, discount_percent, yearly_discount_percent)
VALUES 
  ('plus', 299, 2510, 598, 5020, 50, 30),
  ('premium', 2490, 20916, 4980, 41832, 50, 30)
ON CONFLICT (tier) DO NOTHING;