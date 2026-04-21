# marupro - 写真管理システム

Supabase Storageを利用した写真アップロード・管理Webアプリケーション群

## プロジェクト構成

```
marupro/
├── gdrive-photo-uploader/   # 写真アップロード（単一ファイル）
├── photo-upload/             # 写真アップロード（複数ファイル対応・改良版）
├── download/                 # 写真管理画面（閲覧・ダウンロード・削除）
├── supabase/
│   └── setup.sql             # Supabase初期セットアップSQL
```

## 共通技術スタック

- **バックエンド**: Node.js + Express
- **ストレージ**: Supabase Storage
- **デプロイ**: Google Cloud Run
- **フロントエンド**: HTML + CSS + JavaScript (Vanilla)

---

## 各アプリの詳細

### 1. gdrive-photo-uploader（単一ファイルアップロード）

写真を1枚ずつSupabase Storageにアップロードするシンプルなアプリ。

- シンプルなファイル選択フォーム
- タイムスタンプ付きユニークファイル名で保存
- アップロード後に公開URLを返却

**API**:

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/upload` | 画像を1枚アップロード（フィールド名: `photo`） |
| GET | `/health` | ヘルスチェック |

**ファイル構成**:
```
gdrive-photo-uploader/
├── .env / .env.example
├── Dockerfile
├── package.json
├── server.js
├── public/
│   └── index.html
└── uploads/
```

### 2. photo-upload（複数ファイルアップロード・改良版）

複数ファイルを一括アップロードできる改良版アプリ。

- ドラッグ&ドロップ対応のUI
- 複数ファイル同時アップロード
- デザイン性の高いフロントエンド（M PLUS Rounded 1c / Nunito フォント使用）

**API**:

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/upload` | 複数画像を一括アップロード（フィールド名: `photos[]`） |
| GET | `/health` | ヘルスチェック |

**ファイル構成**:
```
photo-upload/
├── Dockerfile
├── package.json
├── server.js
└── public/
    ├── index.html
    └── assets/css/styles.css
```

**gdrive-photo-uploaderとの違い**:

| 項目 | gdrive-photo-uploader | photo-upload |
|------|----------------------|--------------|
| アップロード | 1枚ずつ | 複数同時 |
| UI | シンプルなフォーム | ドラッグ&ドロップ対応 |
| デザイン | 基本的 | Webフォント使用のリッチUI |

### 3. download（写真管理画面）

アップロード済みの写真を閲覧・管理する管理画面。

- グリッドレイアウトの画像ギャラリー
- 個別ダウンロード・削除機能（確認ダイアログ付き）
- 統計情報（枚数・合計サイズ）表示
- 30秒ごとの自動更新

**API**:

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/images` | 画像一覧を取得（作成日の降順、最大1000件） |
| DELETE | `/api/images/:filename` | 指定した画像を削除 |
| GET | `/health` | ヘルスチェック |

**ファイル構成**:
```
download/
├── .env / .env.example
├── Dockerfile
├── package.json
├── server.js
└── public/
    └── index.html
```

---

## セットアップ

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/) にアクセスしてアカウント作成
2. 新しいプロジェクトを作成
3. プロジェクト設定から以下を取得:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **API Key (anon/public)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. データベースセットアップ

Supabaseダッシュボードの **SQL Editor** で `supabase/setup.sql` を実行:

```bash
# setup.sql の内容:
# - photosバケットの作成（公開設定）
# - Storage RLSポリシーの設定（閲覧・アップロード・削除）
```

### 3. 環境変数の設定

各アプリのディレクトリで `.env` ファイルを作成（3つのアプリで共通の値を使用）:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_BUCKET=photos
```

### 4. アプリの起動

```bash
# アップロードアプリ（単一ファイル）
cd gdrive-photo-uploader && npm install && npm start

# アップロードアプリ（複数ファイル対応）
cd photo-upload && npm install && npm start

# 管理画面
cd download && npm install && npm start
```

いずれも `http://localhost:8080` でアクセス（同時起動する場合はポートを変更）。

## Google Cloud Runへのデプロイ

各アプリごとにデプロイ:

```bash
cd <アプリディレクトリ>

gcloud run deploy <サービス名> \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=https://xxxxx.supabase.co,SUPABASE_KEY=your-key,SUPABASE_BUCKET=photos
```
