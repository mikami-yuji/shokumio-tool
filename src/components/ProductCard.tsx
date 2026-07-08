import React from 'react';
import { ImageOff, Check } from 'lucide-react';
import { Product } from '../types';

type ProductCardProps = {
  product: Product;
  isSelected: boolean;
  onToggleSelect: (product: Product) => void;
  onZoomImage: (imageUrl: string) => void;
};

/**
 * 商品情報を表示するカードコンポーネント (価格・営G等非表示版)
 * @param props コンポーネントのプロパティ
 * @returns React.JSX.Element 商品カードUI
 */
export const ProductCard = ({
  product,
  isSelected,
  onToggleSelect,
  onZoomImage,
}: ProductCardProps): React.JSX.Element => {
  
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    if (product.imageUrl) {
      onZoomImage(product.imageUrl);
    }
  };

  const handleCardClick = (): void => {
    onToggleSelect(product);
  };

  // 表示名として「タイトル」を最優先で使用し、空なら「商品名」をフォールバック
  const displayName = product.title || product.productName || '無題の商品';

  // 重量の単位（kg）を適切に整形して表示
  const displayWeight = product.weight && product.weight !== '―'
    ? (product.weight.toLowerCase().endsWith('kg') ? product.weight : `${product.weight}kg`)
    : '―';

  return (
    <div 
      className={`product-card ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      {/* 受注№のバッジ (Amazonのベストセラータグ風) */}
      <div className="card-badge">受注№ {product.juchuNo}</div>

      {/* 選択中のチェックマーク */}
      <div className="card-checkbox-indicator">
        <Check size={14} strokeWidth={3} />
      </div>

      {/* 商品画像エリア */}
      <div className="card-image-container" onClick={handleImageClick}>
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={displayName} 
            className="card-image"
            loading="lazy"
            title="クリックで拡大表示"
          />
        ) : (
          <div className="no-image-placeholder">
            <ImageOff size={32} strokeWidth={1.5} />
            <span>NO IMAGE</span>
          </div>
        )}
      </div>

      {/* カードボディ情報 */}
      <div className="card-body">
        {/* 青色テキストリンク風のタイトル */}
        <h3 className="card-title" title={displayName}>
          {displayName}
        </h3>

        {/* スペック情報の一覧表示 (スプレッドシートのカラム名称に準拠) */}
        <div className="card-meta-list" style={{ borderTop: 'none', paddingTop: 0 }}>
          <div className="meta-row">
            <span className="meta-label">種別:</span>
            <span className="meta-value">{product.shubetsu || '―'}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">重量:</span>
            <span className="meta-value">{displayWeight}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">商品名:</span>
            <span className="meta-value" title={product.productName}>
              {product.productName || '―'}
            </span>
          </div>
          <div className="meta-row">
            <span className="meta-label">材質名称:</span>
            <span className="meta-value" title={product.materialName}>
              {product.materialName || '―'}
            </span>
          </div>
        </div>

        {/* 下部タグエリア */}
        <div className="card-tags" style={{ marginTop: 'auto' }}>
          {product.janCode && product.janCode !== '―' && (
            <span className="card-tag">JAN: {product.janCode}</span>
          )}
        </div>
      </div>
    </div>
  );
};
