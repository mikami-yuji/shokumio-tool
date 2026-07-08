'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ShoppingCart, Search } from 'lucide-react';
import { Filters } from '../components/Filters';
import { ProductCard } from '../components/ProductCard';
import { Product, OrderItem } from '../types';
import { filterProducts } from '../lib/filter';

// クライアント側のみでロードしてSSRさせないよう遅延ロードを適用 (Lazy Loading)
const OrderList = dynamic(
  () => import('../components/OrderList').then((mod) => mod.OrderList),
  { ssr: false }
);

/**
 * アプリケーションのメインホーム画面コンポーネント (Client Component)
 * @returns React.JSX.Element ホーム画面
 */
export default function Home(): React.JSX.Element {
  // 状態管理
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // 検索・フィルター条件 (スプレッドシートに準拠 - 営G除外)
  const [searchText, setSearchText] = React.useState<string>('');
  const [selectedShubetsu, setSelectedShubetsu] = React.useState<string>('');
  const [selectedWeight, setSelectedWeight] = React.useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = React.useState<string>('');
  const [selectedProductName, setSelectedProductName] = React.useState<string>('');
  const [selectedJan, setSelectedJan] = React.useState<string>('');

  // カート (発注リスト) 状態
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState<boolean>(false);

  // 画像拡大表示 (Lightbox) 状態
  const [lightboxImageUrl, setLightboxImageUrl] = React.useState<string | null>(null);

  // 初回データ取得
  React.useEffect(() => {
    async function fetchProducts(): Promise<void> {
      try {
        setLoading(true);
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new Error('データの取得に失敗しました。');
        }
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err: unknown) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // ローカルストレージからの発注リスト読み込みと保存
  React.useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('shokumio_order_list');
      if (savedOrder) {
        setOrderItems(JSON.parse(savedOrder));
      }
    } catch (e) {
      console.error('Failed to load order list from localStorage', e);
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem('shokumio_order_list', JSON.stringify(orderItems));
    } catch (e) {
      console.error('Failed to save order list to localStorage', e);
    }
  }, [orderItems]);

  // 検索・フィルターリセット
  const handleResetFilters = (): void => {
    setSearchText('');
    setSelectedShubetsu('');
    setSelectedWeight('');
    setSelectedMaterial('');
    setSelectedProductName('');
    setSelectedJan('');
  };

  // カートアイテムのトグル追加/削除 (カードクリック時)
  const handleToggleSelectProduct = (product: Product): void => {
    setOrderItems((prevItems): OrderItem[] => {
      const exists = prevItems.some((item) => item.product.juchuNo === product.juchuNo);
      if (exists) {
        return prevItems.filter((item) => item.product.juchuNo !== product.juchuNo);
      } else {
        return [...prevItems, { product, quantity: 100 }];
      }
    });
  };

  // カート内の数量変更
  const handleUpdateQuantity = (juchuNo: string, quantity: number): void => {
    setOrderItems((prevItems): OrderItem[] =>
      prevItems.map((item): OrderItem =>
        item.product.juchuNo === juchuNo ? { ...item, quantity } : item
      )
    );
  };

  // カート内特定アイテムの削除
  const handleRemoveItem = (juchuNo: string): void => {
    setOrderItems((prevItems): OrderItem[] =>
      prevItems.filter((item) => item.product.juchuNo !== juchuNo)
    );
  };

  // カートのクリア確認モーダルを表示
  const handleClearOrder = (): void => {
    setIsConfirmOpen(true);
  };

  // カートのクリアを実行
  const handleConfirmClear = (): void => {
    setOrderItems([]);
    setIsConfirmOpen(false);
  };

  // フィルタリングされた商品の算出
  const filteredProducts = React.useMemo((): Product[] => {
    return filterProducts(
      products,
      searchText,
      selectedShubetsu,
      selectedWeight,
      selectedMaterial,
      selectedProductName,
      selectedJan
    );
  }, [
    products,
    searchText,
    selectedShubetsu,
    selectedWeight,
    selectedMaterial,
    selectedProductName,
    selectedJan,
  ]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner"></div>
        <p>スプレッドシートおよびDropboxよりデータを同期中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loader-container">
        <p style={{ color: 'var(--text-danger)', fontWeight: 'bold' }}>エラーが発生しました</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Amazon風ダークヘッダーコンテナ */}
      <div className="app-header-container">
        <header className="app-header">
          {/* 左側: ロゴエリア */}
          <div className="app-logo-area" onClick={handleResetFilters} title="トップへ戻る">
            <h1 className="app-title">
              幸南シール管理<span>米匠庵</span>
            </h1>
          </div>

          {/* 中央: Amazon風検索バー */}
          <div className="header-search-wrapper">
            <select 
              className="header-search-category"
              value={selectedShubetsu}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => setSelectedShubetsu(e.target.value)}
            >
              <option value="">すべて</option>
              {Array.from(new Set(products.map(p => p.shubetsu).filter(Boolean))).sort().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              className="header-search-input"
              placeholder="タイトル(商品名)、受注№、商品コード、材質などでキーワード検索..."
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setSearchText(e.target.value)}
            />
            <button className="header-search-btn" title="検索">
              <Search size={18} />
            </button>
          </div>

          {/* 右側: カートボタン */}
          <button 
            className="header-cart-btn"
            onClick={(): void => setIsSidebarOpen(!isSidebarOpen)}
            title="発注リストを開く"
          >
            <ShoppingCart size={22} />
            <span>カート</span>
            {orderItems.length > 0 && (
              <span className="header-cart-count">{orderItems.length}</span>
            )}
          </button>
        </header>

        {/* サブヘッダーバナー */}
        <div className="app-header-sub">
          <div className="sub-nav-item">全商品: {products.length}件</div>
          <div className="sub-nav-item" style={{ color: '#c45500', fontWeight: 'bold' }}>
            本日受注分: {products.filter(p => p.latestOrderDate).length}件
          </div>
          <div className="sub-nav-item" style={{ marginLeft: 'auto' }}>
            データ連携元: Google Spreadsheet & Dropbox
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {/* 仕様絞り込みフィルターパネル */}
        <Filters
          products={products}
          selectedShubetsu={selectedShubetsu}
          onShubetsuChange={setSelectedShubetsu}
          selectedWeight={selectedWeight}
          onWeightChange={setSelectedWeight}
          selectedMaterial={selectedMaterial}
          onMaterialChange={setSelectedMaterial}
          selectedProductName={selectedProductName}
          onProductNameChange={setSelectedProductName}
          selectedJan={selectedJan}
          onJanChange={setSelectedJan}
          onReset={handleResetFilters}
        />

        {/* 結果情報 */}
        <div className="results-info">
          <span>検索結果: {filteredProducts.length}件</span>
          {orderItems.length > 0 && (
            <span style={{ color: 'var(--text-danger)', fontWeight: 'bold' }}>
              発注リストに {orderItems.length} 点の商品が入っています
            </span>
          )}
        </div>

        {/* 商品カードグリッド */}
        {filteredProducts.length === 0 ? (
          <div className="loader-container" style={{ minHeight: '200px' }}>
            <p>条件に合致する商品が見つかりませんでした。</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => {
              const isSelected = orderItems.some((item) => item.product.juchuNo === product.juchuNo);
              return (
                <ProductCard
                  key={product.juchuNo}
                  product={product}
                  isSelected={isSelected}
                  onToggleSelect={handleToggleSelectProduct}
                  onZoomImage={setLightboxImageUrl}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* カートサイドバー */}
      <OrderList
        isOpen={isSidebarOpen}
        orderItems={orderItems}
        onClose={(): void => setIsSidebarOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearOrder={handleClearOrder}
      />

      {/* モバイル用フローティングカートトグルボタン */}
      <button 
        className="cart-trigger-btn"
        onClick={(): void => setIsSidebarOpen(!isSidebarOpen)}
        title="発注リストを開く"
        style={{ display: isSidebarOpen ? 'none' : 'flex' }}
      >
        <ShoppingCart size={22} />
        {orderItems.length > 0 && (
          <span className="cart-badge-count">{orderItems.length}</span>
        )}
      </button>

      {/* 画像拡大 Lightbox モーダル */}
      <div 
        className={`lightbox ${lightboxImageUrl ? 'open' : ''}`}
        onClick={(): void => setLightboxImageUrl(null)}
      >
        <button 
          className="lightbox-close" 
          onClick={(): void => setLightboxImageUrl(null)}
        >
          &times;
        </button>
        {lightboxImageUrl && (
          <img 
            src={lightboxImageUrl} 
            alt="拡大画像" 
            className="lightbox-content"
            onClick={(e: React.MouseEvent<HTMLImageElement>): void => e.stopPropagation()} 
          />
        )}
      </div>

      {/* カートクリア確認モーダル */}
      {isConfirmOpen && (
        <div className="confirm-modal-overlay" onClick={(): void => setIsConfirmOpen(false)}>
          <div className="confirm-modal-content" onClick={(e: React.MouseEvent<HTMLDivElement>): void => e.stopPropagation()}>
            <h3 className="confirm-modal-title">カートを空にする</h3>
            <p className="confirm-modal-message">カートに入っているすべての商品を削除します。よろしいですか？</p>
            <div className="confirm-modal-actions">
              <button className="btn-confirm-cancel" onClick={(): void => setIsConfirmOpen(false)}>
                キャンセル
              </button>
              <button className="btn-confirm-danger" onClick={handleConfirmClear}>
                すべて空にする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
