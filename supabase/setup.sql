-- ============================================
-- marupro Supabase セットアップSQL
-- ============================================
-- Supabase ダッシュボードの SQL Editor で実行してください

-- ============================================
-- 1. Storageバケットの作成
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. Storage ポリシー（RLS）
-- ============================================

CREATE POLICY "photos_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "photos_public_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos');

CREATE POLICY "photos_public_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'photos');
