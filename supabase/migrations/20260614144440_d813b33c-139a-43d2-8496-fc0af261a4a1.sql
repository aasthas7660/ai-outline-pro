
CREATE POLICY "Users read own generated-images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own generated-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own generated-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own generated-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
