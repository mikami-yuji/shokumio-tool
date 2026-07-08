import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "シール受注商品一覧（米匠庵）",
  description: "GoogleスプレッドシートおよびDropbox画像と連携したシール受注商品管理ツール",
};

/**
 * アプリケーションの共通ルートレイアウト
 * @param props 子要素
 * @returns React.JSX.Element レイアウトHTML
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
