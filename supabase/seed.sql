-- Create test users (passwords handled by Supabase Auth, these are just profiles for local dev if auth.users assumes them)
-- Note: In real Supabase, you must create auth.users first. This seed assumes you might run a script or use the dashboard. 
-- However, for local dev, we can try inserting into auth.users if we have access, but usually we just insert into profiles 
-- and hope the IDs match or we rely on the trigger. 
-- BETTER APPROACH: Use Supabase Studio to create users, or use a script. 
-- For this seed, we will Populate CATEGORIES and standard data.

INSERT INTO categories (name, slug) VALUES
('Development', 'development'),
('Business', 'business'),
('Design', 'design'),
('Marketing', 'marketing');

-- We can't easily seed profiles/courses without known UUIDs from auth.users.
-- So we will leave this part for a manual setup script or just categories for now.

