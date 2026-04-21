// Load .env only in development (not in Cloud Run)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

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
  console.warn('Warning: SUPABASE_URL and SUPABASE_KEY not set. Upload functionality will not work.');
}

// 静的ファイル配信
app.use(express.static('public'));

// 写真アップロードエンドポイント
app.post('/upload', upload.array('photos[]'), async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase設定がされていません' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'ファイルが選択されていません' });
    }

    const uploadedFiles = [];
    
    // 複数ファイルを順次処理
    for (const file of req.files) {
      const filePath = file.path;
      const fileName = file.originalname;
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName}`;

      try {
        // ファイルを読み込み
        const fileBuffer = fs.readFileSync(filePath);

        // Supabase Storageにアップロード
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(uniqueFileName, fileBuffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        // 一時ファイル削除
        fs.unlinkSync(filePath);

        if (error) {
          console.error('Supabase upload error:', error);
          throw new Error('アップロードに失敗しました: ' + error.message);
        }

        // 公開URLを取得
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uniqueFileName);

        uploadedFiles.push({
          name: fileName,
          path: data.path,
          url: publicUrlData.publicUrl,
        });
      } catch (fileError) {
        // エラーが発生したファイルの一時ファイルも削除
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.error('Failed to delete temp file:', unlinkError);
        }
        throw fileError;
      }
    }

    res.json({
      success: true,
      message: 'アップロード成功',
      files: uploadedFiles,
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
