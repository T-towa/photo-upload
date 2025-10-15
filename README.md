# Supabase写真アップロードアプリ

ユーザーが写真をアップロードし、Supabase Storageに自動保存するWebアプリケーション

## 技術スタック

- **フロントエンド**: HTML（シンプルなフォーム）
- **バックエンド**: Node.js + Express
- **ストレージ**: Supabase Storage
- **クラウド**: Google Cloud Run（オプション）

## 事前準備

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスしてアカウント作成
2. 新しいプロジェクトを作成
3. プロジェクト設定から以下の情報を取得:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **API Key (anon/public)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. Storageバケットの作成

1. Supabaseダッシュボードで **Storage** を選択
2. **New bucket** をクリック
3. バケット名: `photos`（任意の名前でOK）
4. **Public bucket** にチェック（公開URLを取得するため）
5. 作成完了

### 3. ローカル環境準備

```bash
cd gdrive-photo-uploader
npm install
```

### 4. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成:

```bash
cp .env.example .env
```

`.env` ファイルを編集して、Supabaseの認証情報を設定:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET=photos
```

## ローカルでの実行

1. `.env` ファイルにSupabase認証情報を設定（上記参照）
2. サーバーを起動:
   ```bash
   npm start
   ```
3. ブラウザで `http://localhost:8080` にアクセス
4. 画像を選択してアップロード

## Google Cloud Runへのデプロイ

### 1. Google Cloudにログイン

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. デプロイ実行

```bash
gcloud run deploy supabase-photo-uploader \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=https://xxxxx.supabase.co,SUPABASE_KEY=your-key,SUPABASE_BUCKET=photos
```

## セキュリティ考慮事項

1. **認証の追加**: 現在は誰でもアップロード可能。本番環境では認証機能を追加推奨
2. **ファイルサイズ制限**: multerで制限を設定
3. **ファイル形式検証**: 画像ファイルのみ受け付けるよう検証強化
4. **レート制限**: 過度なアップロードを防ぐ
5. **環境変数**: 秘密情報は環境変数やSecret Managerで管理
6. **Supabase RLS**: Row Level Securityでアクセス制御を強化

## トラブルシューティング

### エラー: SUPABASE_URL and SUPABASE_KEY must be set

- `.env` ファイルが作成されているか確認
- `SUPABASE_URL` と `SUPABASE_KEY` が正しく設定されているか確認

### エラー: Bucket not found

- Supabaseダッシュボードでバケットが作成されているか確認
- `.env` の `SUPABASE_BUCKET` 名が正しいか確認

### アップロードは成功するが画像が表示されない

- バケットが **Public** に設定されているか確認
- Supabase Storage > Policies でアクセス権限を確認

## ファイル構成

```
gdrive-photo-uploader/
├── .env                      # 環境変数（gitignore済み）
├── .env.example              # 環境変数テンプレート
├── .gitignore                # Git除外設定
├── .dockerignore
├── .gcloudignore
├── Dockerfile
├── package.json
├── server.js
├── public/
│   └── index.html
└── uploads/                  # 一時アップロードディレクトリ
```

## Supabase Storageの利点

- **無料枠が充実**: 1GBまで無料
- **簡単な設定**: APIキーだけで利用可能
- **公開URL**: 自動的に公開URLを取得
- **CDN配信**: グローバルCDNで高速配信
- **セキュリティ**: Row Level Security (RLS) でアクセス制御

## 次のステップ

- ユーザー認証の追加（Supabase Auth）
- アップロード履歴の記録（Supabase Database）
- プログレスバーの追加
- 複数ファイルのアップロード対応
- 画像のサムネイル生成
- RLS（Row Level Security）の設定
