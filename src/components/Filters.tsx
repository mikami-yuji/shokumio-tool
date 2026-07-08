import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Product } from '../types';

type FiltersProps = {
  products: Product[];
  selectedShubetsu: string;
  onShubetsuChange: (val: string) => void;
  selectedWeight: string;
  onWeightChange: (val: string) => void;
  selectedMaterial: string;
  onMaterialChange: (val: string) => void;
  selectedProductName: string;
  onProductNameChange: (val: string) => void;
  selectedJan: string;
  onJanChange: (val: string) => void;
  onReset: () => void;
};

/**
 * 絞り込みフィルターコンポーネント (スプレッドシート準拠 - 営G除外)
 * @param props フィルターのプロパティ
 * @returns React.JSX.Element フィルターUI
 */
export const Filters = ({
  products,
  selectedShubetsu,
  onShubetsuChange,
  selectedWeight,
  onWeightChange,
  selectedMaterial,
  onMaterialChange,
  selectedProductName,
  onProductNameChange,
  selectedJan,
  onJanChange,
  onReset,
}: FiltersProps): React.JSX.Element => {
  // スプレッドシートデータから動的にユニークな選択肢を抽出
  const shubetsuOptions: string[] = React.useMemo(() => {
    const set = new Set(products.map((p) => p.shubetsu).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const weightOptions: string[] = React.useMemo(() => {
    const set = new Set(products.map((p) => p.weight).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const materialOptions: string[] = React.useMemo(() => {
    const set = new Set(products.map((p) => p.materialName).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const productNameOptions: string[] = React.useMemo(() => {
    const set = new Set(products.map((p) => p.productName).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  return (
    <div className="filter-panel">
      <div className="filter-title">仕様で絞り込む</div>

      <div className="filter-grid">
        {/* 種別 */}
        <select
          className="filter-select"
          value={selectedShubetsu}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => onShubetsuChange(e.target.value)}
        >
          <option value="">すべての種別</option>
          {shubetsuOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {/* 重量 */}
        <select
          className="filter-select"
          value={selectedWeight}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => onWeightChange(e.target.value)}
        >
          <option value="">すべての重量</option>
          {weightOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {/* 材質名称 */}
        <select
          className="filter-select"
          value={selectedMaterial}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => onMaterialChange(e.target.value)}
        >
          <option value="">すべての材質名称</option>
          {materialOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {/* 商品名 */}
        <select
          className="filter-select"
          value={selectedProductName}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => onProductNameChange(e.target.value)}
        >
          <option value="">すべての商品名</option>
          {productNameOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {/* JANコードあり・なし */}
        <select
          className="filter-select"
          value={selectedJan}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => onJanChange(e.target.value)}
        >
          <option value="">JANコード あり/なし</option>
          <option value="yes">JANあり</option>
          <option value="no">JANなし</option>
        </select>

        {/* 条件リセットボタン */}
        <button className="btn-reset" onClick={onReset} title="フィルターを初期化">
          <RotateCcw size={14} />
          条件クリア
        </button>
      </div>
    </div>
  );
};
