# download - 写真管理画面

Supabase Storageにアップロードされた写真を閲覧・ダウンロード・削除できる管理画面アプリケーション。

## 機能

- グリッドレイアウトで画像をギャラリー表示
- 各画像の個別ダウンロード
- 不要な画像の削除（確認ダイアログ付き）
- 統計情報（画像枚数・合計サイズ）表示
- 30秒ごとの自動更新

## 技術スタック

- **フロントエンド**: HTML + CSS + JavaScript (Vanilla)
- **バックエンド**: Node.js + Express
- **ストレージ**: Supabase Storage
- **デプロイ**: Google Cloud Run

## セットアップ

### 1. 依存関係のインストール

```bash
cd download
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成:

```bash
cp .env.example .env
```

`.env` ファイルを編集（アップロードアプリと同じ認証情報を使用）:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_BUCKET=photos
```

### 3. ローカル実行

```bash
npm start
```

ブラウザで `http://localhost:8080` にアクセス

## API エンドポイント

### `GET /api/images`

画像一覧を取得（作成日の降順、最大1000件）

**レスポンス**:
```json
{
  "images": [
    {
      "name": "1234567890-photo.jpg",
      "size": 1024000,
      "created_at": "2025-10-15T10:00:00Z",
      "url": "https://xxxxx.supabase.co/storage/v1/object/public/photos/..."
    }
  ]
}
```

### `DELETE /api/images/:filename`

指定した画像を削除

**レスポンス**:
```json
{
  "success": true,
  "message": "削除しました"
}
```

### `GET /health`

ヘルスチェック

## ファイル構成

```
download/
├── .env                # 環境変数（gitignore済み）
├── .env.example        # 環境変数テンプレート
├── .gitignore
├── .dockerignore
├── .gcloudignore
├── Dockerfile
├── package.json
├── server.js           # Expressサーバー・画像一覧/削除API
├── public/
│   └── index.html      # 管理画面UI
└── README.md
```

## Google Cloud Runへのデプロイ

```bash
gcloud run deploy photo-admin \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=https://xxxxx.supabase.co,SUPABASE_KEY=your-key,SUPABASE_BUCKET=photos
```