require('dotenv').config();

const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Supabase設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'photos';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 静的ファイル配信
app.use(express.static('public'));

// 写真アップロードエンドポイント
app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ファイルが選択されていません' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;

    // ファイルを読み込み
    const fileBuffer = fs.readFileSync(filePath);

    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFileName, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    // 一時ファイル削除
    fs.unlinkSync(filePath);

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'アップロードに失敗しました: ' + error.message });
    }

    // 公開URLを取得
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uniqueFileName);

    res.json({
      success: true,
      message: 'アップロード成功',
      file: {
        name: fileName,
        path: data.path,
        url: publicUrlData.publicUrl,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'アップロードに失敗しました' });
  }
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
