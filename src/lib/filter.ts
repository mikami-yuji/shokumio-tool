import { Product } from '../types';

/**
 * 商品一覧を指定された条件でフィルタリングする
 * @param products 元の商品リスト
 * @param searchText 検索キーワード
 * @param shubetsu 絞り込み種別
 * @param weight 絞り込み重量
 * @param material 絞り込み材質名称
 * @param productName 絞り込み商品名
 * @param jan 絞り込みJANコード有無
 * @returns Product[] フィルタリングされた商品リスト
 */
export function filterProducts(
  products: Product[],
  searchText: string,
  shubetsu: string,
  weight: string,
  material: string,
  productName: string,
  jan: string
): Product[] {
  try {
    const query = searchText.trim().toLowerCase();

    return products.filter((item): boolean => {
      // 検索キーワードの判定 (タイトル、商品名、受注№、材質名、などを対象に部分一致)
      let matchesSearch = true;
      if (query) {
        const targetText = [
          item.title,
          item.productName,
          item.juchuNo,
          item.productCode,
          item.materialName,
          item.directName
        ].filter(Boolean).join(' ').toLowerCase();
        
        matchesSearch = targetText.includes(query);
      }

      // 各フィルター条件の判定 (スプレッドシートに準拠)
      const matchesShubetsu = !shubetsu || item.shubetsu === shubetsu;
      const matchesWeight = !weight || item.weight === weight;
      const matchesMaterial = !material || item.materialName === material;
      const matchesProductName = !productName || item.productName === productName;

      // JANコードあり・なしの判定
      let matchesJan = true;
      const hasJan = !!item.janCode &&
                     item.janCode.trim() !== '' &&
                     item.janCode.trim() !== '―' &&
                     item.janCode.trim() !== '-' &&
                     item.janCode.trim() !== 'なし';

      if (jan === 'yes') {
        matchesJan = hasJan;
      } else if (jan === 'no') {
        matchesJan = !hasJan;
      }

      return (
        matchesSearch &&
        matchesShubetsu &&
        matchesWeight &&
        matchesMaterial &&
        matchesProductName &&
        matchesJan
      );
    });
  } catch (error) {
    console.error('Error filtering products:', error);
    return products;
  }
}
