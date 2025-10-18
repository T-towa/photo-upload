// Load .env only in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Supabase設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'photos';

console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  bucket: bucketName,
  nodeEnv: process.env.NODE_ENV
});

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized successfully');
} else {
  console.warn('Warning: SUPABASE_URL and SUPABASE_KEY not set.');
}

// 静的ファイル配信
app.use(express.static('public'));

// 画像一覧取得API
app.get('/api/images', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase設定がされていません' });
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('List error:', error);
      return res.status(500).json({ error: error.message });
    }

    // 公開URLを付与
    const images = data.map(file => {
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(file.name);

      return {
        name: file.name,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
        url: urlData.publicUrl
      };
    });

    res.json({ images });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// 画像削除API
app.delete('/api/images/:filename', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase設定がされていません' });
    }

    const { filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([decodedFilename]);

    if (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: '削除しました' });
  } catch (error) {
    console.error('Delete API error:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Admin server running on port ${PORT}`);
});
