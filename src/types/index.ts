export type Product = {
  juchuNo: string;        // 受注№
  shubetsu: string;       // 種別
  weight: string;         // 重量
  productCode: string;    // 商品コード
  productName: string;    // 商品名
  shape: string;          // 形状
  orderQty: number;       // 受注数
  materialName: string;   // 材質名称
  printCode: string;      // 印刷コード
  frontColors: number;    // 表色数
  backColors: number;     // 裏色数
  totalColors: number;    // 総色数
  janCode: string;        // JANコード
  directCode: string;     // 直送先コード
  directName: string;     // 直送先名称
  latestOrderDate: string;// 最新受注日
  title: string;          // タイトル
  imageUrl: string;       // 算出した画像URL (例: /images/1022510A.jpg)
};

export type OrderItem = {
  product: Product;
  quantity: number;
};
