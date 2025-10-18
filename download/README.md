# 写真管理画面

Supabase Storageにアップロードされた写真を閲覧・ダウンロード・削除できる管理画面アプリケーション

## 機能

- 📸 **画像ギャラリー表示**: グリッドレイアウトで全画像を視覚的に表示
- ⬇️ **ダウンロード**: 各画像を個別にダウンロード可能
- 🗑️ **削除**: 不要な画像を削除
- 📊 **統計情報**: 画像枚数と合計サイズを表示
- 🔄 **自動更新**: 30秒ごとに画像リストを自動更新

## 技術スタック

- **フロントエンド**: HTML + CSS + JavaScript (Vanilla)
- **バックエンド**: Node.js + Express
- **ストレージ**: Supabase Storage
- **デプロイ**: Google Cloud Run対応

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

`.env` ファイルを編集:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET=photos
```

**注意**: アップロードアプリと同じSupabase認証情報を使用してください。

## ローカル実行

```bash
npm start
```

ブラウザで `http://localhost:8080` にアクセス

## Google Cloud Runへのデプロイ

### 方法1: gcloudコマンド

```bash
gcloud run deploy photo-admin \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --project your-project-id \
  --set-env-vars SUPABASE_URL=https://xxxxx.supabase.co,SUPABASE_KEY=your-key,SUPABASE_BUCKET=photos
```

### 方法2: Cloud Consoleから

1. [Cloud Run](https://console.cloud.google.com/run) にアクセス
2. **サービスを作成**をクリック
3. **ソースリポジトリから継続的にデプロイする**を選択
4. リポジトリを接続
5. 環境変数を設定:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_BUCKET`
6. デプロイ

## UI機能

### 画像カード

各画像カードには以下の情報が表示されます:

- **画像プレビュー**: サムネイルで全体像を確認
- **ファイル名**: 画像のファイル名
- **日時**: アップロード日時
- **サイズ**: ファイルサイズ
- **アクション**: ダウンロード・削除ボタン

### 操作

- **ダウンロード**: ボタンをクリックで即座にダウンロード開始
- **削除**: 確認ダイアログ後に削除実行
- **自動更新**: 30秒ごとに新しい画像を自動読み込み

## セキュリティ考慮事項

⚠️ **重要**: このアプリは認証機能がありません

本番環境では以下の対策を推奨:

1. **Basic認証の追加**
2. **IP制限**
3. **Supabase RLS（Row Level Security）の設定**
4. **管理者用の専用Supabase Keyの使用**

### Basic認証の追加例

`server.js` に追加:

```javascript
const basicAuth = require('express-basic-auth');

app.use(basicAuth({
  users: { 'admin': 'your-password' },
  challenge: true
}));
```

## トラブルシューティング

### 画像が表示されない

- Supabaseバケットが **Public** に設定されているか確認
- 環境変数が正しく設定されているか確認
- ブラウザのコンソールでエラーを確認

### 削除ができない

- Supabase Storage > Policies で削除権限があるか確認
- RLSポリシーで `DELETE` 操作が許可されているか確認

### デプロイエラー

- Dockerfileが正しい場所にあるか確認
- 環境変数がCloud Runで設定されているか確認

## ファイル構成

```
download/
├── .env                # 環境変数（gitignore）
├── .env.example        # 環境変数テンプレート
├── .gitignore
├── .dockerignore
├── .gcloudignore
├── Dockerfile
├── package.json
├── server.js           # ExpressサーバーとAPI
├── public/
│   └── index.html      # 管理画面UI
└── README.md
```

## API エンドポイント

### `GET /api/images`

画像一覧を取得

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

画像を削除

**レスポンス**:
```json
{
  "success": true,
  "message": "削除しました"
}
```

## 次のステップ

- 認証機能の追加
- 一括ダウンロード機能
- 画像のフィルタリング・検索機能
- ページネーション
- 画像の詳細情報表示
