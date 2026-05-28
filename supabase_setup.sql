-- Run this in your Supabase SQL Editor

-- Create the site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY,
  maintenance_mode boolean DEFAULT false NOT NULL
);

-- Insert the default setting (if it doesn't exist)
INSERT INTO public.site_settings (id, maintenance_mode)
VALUES ('global', false)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access so the main website can fetch the setting
CREATE POLICY "Allow public read access to site_settings"
  ON public.site_settings
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users (like admin) to update the setting
CREATE POLICY "Allow authenticated users to update site_settings"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (true);
