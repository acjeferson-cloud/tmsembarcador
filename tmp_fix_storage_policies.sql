    UPDATE storage.buckets SET public = true WHERE id = 'logos';
    
    -- Try to drop policies first so they don't error
    DROP POLICY IF EXISTS "Allow public read of logos" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated uploads to logos" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated updates to logos" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated deletes of logos" ON storage.objects;

    -- Create permissive policies for authenticated users
    CREATE POLICY "Allow public read of logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
    CREATE POLICY "Allow authenticated uploads to logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos');
    CREATE POLICY "Allow authenticated updates to logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos');
    CREATE POLICY "Allow authenticated deletes of logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos');
