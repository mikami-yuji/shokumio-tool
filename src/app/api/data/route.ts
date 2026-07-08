import { NextResponse } from 'next/server';
import { getProductsFromSheet } from '@/lib/sheet';

// キャッシュ設定: 常に最新のデータを返すため、再検証を有効にしつつ動的レンダリングを可能にする
export const dynamic = 'force-dynamic';

/**
 * 商品一覧データを取得するAPIエンドポイント (GET /api/data)
 * @returns Promise<NextResponse> JSONレスポンス
 */
export async function GET(): Promise<NextResponse> {
  try {
    const products = await getProductsFromSheet();
    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', products: [] },
      { status: 500 }
    );
  }
}
