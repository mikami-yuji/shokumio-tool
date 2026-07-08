# シール受注商品管理システム (米匠庵)

既存のHTML/JS構成から、**Next.js (App Router, TypeScript)** および **プレミアムVanilla CSS** を使用してフルリニューアルした、シールの受注商品管理・発注リスト作成ツールです。
Googleスプレッドシートから商品データを動的に取得し、Dropboxの共有フォルダ画像を受注番号に紐づけて自動表示します。

---

## 主な機能と特徴

1. **プレミアムUI/UX**:
   - Google Fonts (Noto Sans JP, Outfit) をベースにした美しいダーク調モダンデザイン。
   - カードの3Dホバー、カートのアニメーション等のマイクロインタラクション。
   - モバイル・タブレット・PCに完全対応したレスポンスレイアウト。
2. **多重フォールバック設計のデータ連携**:
   - **Google Sheets API**: 非公開のスプレッドシートからセキュアにデータを同期します。
   - **パブリックCSV**: スプレッドシートをウェブに公開している場合、APIキーなしでフェッチします。
   - **ローカルCSV**: ネットワークエラーや認証エラーの際、`src/data/data.csv` から即座に読み込みます。
3. **Dropbox画像自動同期**:
   - コマンド一発で共有フォルダから画像 (ZIP) をダウンロード・解凍し、受注番号 (`[受注№]A.jpg`) に基づいて動的にカードへ表示します。
4. **発注・エクスポートシステム**:
   - 数量増減（100単位）、個別削除、全削除が可能なスライドアウトリスト。
   - 等幅配置で綺麗に整列されたテキストコピー機能。
   - CSVエクスポート、および `xlsx` ライブラリを用いた本物のExcelファイル (`.xlsx`) エクスポート。

---

## セットアップ手順

### 1. 依存パッケージのインストール

プロジェクトのルートディレクトリで以下を実行します。

```bash
npm install
```

### 2. 環境変数の設定 (`.env.local`)

プロジェクトのルートに `.env.local` ファイルを作成し、設定を行います。(自動生成されている場合は確認します)

```env
# 1. GoogleスプレッドシートID (URLの /d/ と /edit の間の文字列)
GOOGLE_SHEET_ID=1P_2AsGoUkMBfgR7tO0HBaJTval2rGX7pWxKbf1jkcqs

# 2. パブリックCSVとして取得する場合のURL (スプレッドシートがリンク共有公開されている場合)
NEXT_PUBLIC_SPREADSHEET_CSV_URL=https://docs.google.com/spreadsheets/d/1P_2AsGoUkMBfgR7tO0HBaJTval2rGX7pWxKbf1jkcqs/export?format=csv&gid=0

# 3. Dropbox共有フォルダのZIPダウンロードURL
# ※末尾の dl=0 を dl=1 に変更したものを指定します
DROPBOX_ZIP_URL=https://www.dropbox.com/scl/fo/2dut0cpg8eel9l60hz2im/AD0dBTTPlHVIXgZfKkiJPu8?rlkey=ppbc5uqtnfshrju37827qofux&dl=1

# 4. (オプション) 非公開スプレッドシートと安全に連携する場合のサービスアカウントJSONキー
# JSONファイルの中身(改行含む)をそのまま貼り付けるか、Base64エンコードした値を指定します
# GOOGLE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
```

### 3. Dropbox画像の同期

Dropboxの共有フォルダから画像をローカルに同期（一括ダウンロードと配置）します。

```bash
npm run sync-images
```
*実行後、`public/images/` 内に `1022510A.jpg` などの画像ファイルが自動的に平坦化されて展開されます。*

### 4. 開発サーバーの起動

```bash
npm run dev
```
起動後、ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## 開発とテスト

### ユニットテストの実行
フィルタリングロジックや主要ビジネスロジックのテストを実行します。

```bash
npm run test
```
*Vitestが起動し、作成された12個のテストケースが実行されます。*

---

## ディレクトリ構造

*   `src/app/`: Next.js ページおよびレイアウト
    *   `page.tsx`: メインUI（状態管理、フィルタリングハンドラなど）
    *   `layout.tsx`: 共通レイアウト、メタデータ（日本語化、タイトル設定など）
    *   `globals.css`: Vanilla CSSによるプレミアムなデザイン定義
    *   `api/data/route.ts`: スプレッドシートデータの取得API
*   `src/components/`: 再利用可能なUIコンポーネント
    *   `ProductCard.tsx`: 商品詳細、チェックマーク、Lightbox連携
    *   `Filters.tsx`: 動的セレクトボックス、フリーワード検索
    *   `OrderList.tsx`: カート操作、テキストコピー、CSV/Excelエクスポート
*   `src/lib/`: ヘルパーモジュール
    *   `sheet.ts`: Googleスプレッドシート連携（Sheets API / CSVフェッチ / ローカルCSVの3段構成）
    *   `filter.ts`: フィルタリングロジック（テストが容易な純粋関数）
    *   `sync-images.ts`: Dropbox画像の一括同期処理
*   `src/data/`:
    *   `data.csv`: スプレッドシートにアクセスできない場合のローカルフォールバック用データ
*   `old_src/`:
    *   以前のHTML/CSS/JS構成のバックアップ
