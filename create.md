# Google Drive写真アップロードアプリ開発ガイド

## プロジェクト概要
ユーザーが写真をアップロードし、特定のGoogle Driveアカウントに自動保存するWebアプリケーション

## 技術スタック
- **フロントエンド**: HTML（シンプルなフォーム）
- **バックエンド**: Node.js + Express
- **クラウド**: Google Cloud Run
- **API**: Google Drive API v3

---

## 事前準備

### 1. Google Cloud Console設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. **APIとサービス** > **ライブラリ** から以下を有効化：
   - Google Drive API
   - Cloud Run API
4. **APIとサービス** > **認証情報** > **認証情報を作成** > **サービスアカウント**
   - サービスアカウント名を入力（例: drive-uploader）
   - 役割: なし（後でDriveで権限付与）
   - 完了後、サービスアカウントをクリック
   - **キー** タブ > **鍵を追加** > **新しい鍵を作成** > **JSON**
   - ダウンロードしたJSONファイルを保存

5. Google Driveで保存先フォルダを作成し、サービスアカウントのメールアドレス（JSON内の`client_email`）に**編集者権限**を付与

### 2. ローカル環境準備
```bash
mkdir gdrive-photo-uploader
cd gdrive-photo-uploader
```

---

## ファイル構成

```
gdrive-photo-uploader/
├── Dockerfile
├── .dockerignore
├── .gcloudignore
├── package.json
├── server.js
├── public/
│   └── index.html
└── service-account-key.json  # Google Cloudからダウンロード
```

---

## コード

### package.json
```json
{
  "name": "gdrive-photo-uploader",
  "version": "1.0.0",
  "description": "Photo uploader to Google Drive",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "googleapis": "^128.0.0",
    "multer": "^1.4.5-lts.1"
  },
  "engines": {
    "node": ">=18"
  }
}
```

### server.js
```javascript
const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// 環境変数またはファイルから認証情報を読み込み
const KEYFILE_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account-key.json';
const FOLDER_ID = process.env.DRIVE_FOLDER_ID || ''; // Google DriveのフォルダID

// Google Drive API認証
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

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

    // Google Driveにアップロード
    const fileMetadata = {
      name: fileName,
      parents: FOLDER_ID ? [FOLDER_ID] : [],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    // 一時ファイル削除
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'アップロード成功',
      file: {
        id: response.data.id,
        name: response.data.name,
        link: response.data.webViewLink,
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
```

### public/index.html
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>写真アップロード</title>
</head>
<body>
  <h1>写真をアップロード</h1>
  
  <form id="uploadForm">
    <input type="file" id="photoInput" accept="image/*" required>
    <button type="submit">アップロード</button>
  </form>

  <div id="message"></div>
  <div id="result"></div>

  <script>
    const form = document.getElementById('uploadForm');
    const messageDiv = document.getElementById('message');
    const resultDiv = document.getElementById('result');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fileInput = document.getElementById('photoInput');
      const file = fileInput.files[0];
      
      if (!file) {
        messageDiv.textContent = 'ファイルを選択してください';
        return;
      }

      messageDiv.textContent = 'アップロード中...';
      resultDiv.textContent = '';

      const formData = new FormData();
      formData.append('photo', file);

      try {
        const response = await fetch('/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          messageDiv.textContent = 'アップロード成功！';
          resultDiv.innerHTML = `
            <p>ファイル名: ${data.file.name}</p>
            <a href="${data.file.link}" target="_blank">Google Driveで開く</a>
          `;
          form.reset();
        } else {
          messageDiv.textContent = 'エラー: ' + data.error;
        }
      } catch (error) {
        messageDiv.textContent = 'アップロードに失敗しました';
        console.error('Error:', error);
      }
    });
  </script>
</body>
</html>
```

### Dockerfile
```dockerfile
FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p uploads

EXPOSE 8080

CMD ["node", "server.js"]
```

### .dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
README.md
uploads/*
```

### .gcloudignore
```
node_modules/
.git/
.gitignore
uploads/
```

---

## デプロイ手順

### 1. ローカルテスト
```bash
npm install
node server.js
```
ブラウザで `http://localhost:8080` にアクセス

### 2. Google Cloud Runにデプロイ

```bash
# Google Cloudにログイン
gcloud auth login

# プロジェクトIDを設定
gcloud config set project YOUR_PROJECT_ID

# Cloud Runにデプロイ
gcloud run deploy gdrive-photo-uploader \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars DRIVE_FOLDER_ID=YOUR_FOLDER_ID
```

**注意**: `YOUR_FOLDER_ID`は、Google DriveのフォルダURLから取得
- URL例: `https://drive.google.com/drive/folders/1abc...xyz`
- フォルダID: `1abc...xyz`

### 3. サービスアカウントキーの設定

デプロイ後、Google Cloud Consoleで：
1. Cloud Run > サービス選択
2. **編集してデプロイ** > **変数とシークレット**
3. シークレットとして `service-account-key.json` の内容を追加

または、Cloud Run用のサービスアカウントにDrive権限を直接付与する方が安全：
```bash
# Cloud Runのサービスアカウントを確認
gcloud run services describe gdrive-photo-uploader --region asia-northeast1

# そのサービスアカウントに、Google Driveのフォルダへのアクセス権を付与
```

---

## セキュリティ考慮事項

1. **認証の追加**: 現在は誰でもアップロード可能。本番環境では認証機能を追加推奨
2. **ファイルサイズ制限**: multerで制限を設定
3. **ファイル形式検証**: 画像ファイルのみ受け付けるよう検証強化
4. **レート制限**: 過度なアップロードを防ぐ
5. **環境変数**: 秘密情報は環境変数やSecret Managerで管理

---

## トラブルシューティング

### エラー: 認証情報が見つからない
- `service-account-key.json`が正しい場所にあるか確認
- ファイルのJSON形式が正しいか確認

### エラー: Permission denied
- サービスアカウントにGoogle Driveフォルダの編集権限があるか確認
- Drive APIが有効化されているか確認

### Cloud Runでのファイルアップロード
- Cloud Runは読み取り専用ファイルシステム
- `/tmp`または`uploads/`ディレクトリを使用（一時的）

---

## 次のステップ

- ユーザー認証の追加
- アップロード履歴の記録
- プログレスバーの追加
- 複数ファイルのアップロード対応
- 画像のサムネイル生成