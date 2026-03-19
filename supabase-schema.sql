-- Create Profiles table (if not using auth.users directly)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  role text DEFAULT 'user',
  status text DEFAULT 'active',
  credits integer DEFAULT 0,
  company text,
  phone text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for admin dashboard viewing)
CREATE POLICY "Allow public read access on profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Allow authenticated insert access (for new user signup)
CREATE POLICY "Allow authenticated insert on profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Allow authenticated update access (for upserting profile on login)
CREATE POLICY "Allow authenticated update on profiles"
  ON public.profiles FOR UPDATE
  USING (true);

-- Create Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id text PRIMARY KEY,
  user_email text NOT NULL,
  plan text NOT NULL,
  amount integer NOT NULL,
  status text DEFAULT 'completed',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for admin dashboard viewing)
CREATE POLICY "Allow public read access on payments"
  ON public.payments FOR SELECT
  USING (true);


-- Create Inquiries table (if it doesn't already exist)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id), -- Optional, null if anonymous
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  reply text, -- Admin's response
  status text DEFAULT 'pending',
  replied_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Allow all access for now to ensure debugging doesn't fail due to RLS
DROP POLICY IF EXISTS "Allow public read access on inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow public insert access on inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow public update access on inquiries" ON public.inquiries;

CREATE POLICY "Enable all access for inquiries" ON public.inquiries
  FOR ALL USING (true) WITH CHECK (true);


-- Create Generations table
CREATE TABLE IF NOT EXISTS public.generations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  url text NOT NULL,
  prompt text,
  style text,
  is_favorite boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated insert (for users creating images)
CREATE POLICY "Allow authenticated insert on generations"
  ON public.generations FOR INSERT
  WITH CHECK (true);

-- Allow public read access (for admin dashboard viewing)
CREATE POLICY "Allow public read access on generations"
  ON public.generations FOR SELECT
  USING (true);

-- Allow public update access (for favoriting)
CREATE POLICY "Allow public update access on generations"
  ON public.generations FOR UPDATE
  USING (true);
-- Migrations for existing tables (Run these if you already have the tables created)
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS reply text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS replied_at timestamp with time zone;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);
