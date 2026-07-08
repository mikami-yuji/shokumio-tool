import React from 'react';
import { X, Trash2, Copy, FileSpreadsheet, Download, ShoppingCart } from 'lucide-react';
import * as XLSX from 'xlsx';
import { OrderItem } from '../types';

type OrderListProps = {
  isOpen: boolean;
  orderItems: OrderItem[];
  onClose: () => void;
  onUpdateQuantity: (juchuNo: string, qty: number) => void;
  onRemoveItem: (juchuNo: string) => void;
  onClearOrder: () => void;
};

function getDisplayWidth(str: string): number {
  let width = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (
      (charCode >= 0x00 && charCode < 0x81) ||
      (charCode === 0xf8f0) ||
      (charCode >= 0xff61 && charCode < 0xffa0) ||
      (charCode >= 0xf8f1 && charCode < 0xf8f4)
    ) {
      width += 1;
    } else {
      width += 2;
    }
  }
  return width;
}

function padStr(str: string, len: number): string {
  const strWidth = getDisplayWidth(str);
  const padding = len - strWidth > 0 ? ' '.repeat(len - strWidth) : '';
  return str + padding;
}

/**
 * 発注リストサイドバーコンポーネント (タイトル優先・スプレッドシート準拠表示)
 * @param props コンポーネントのプロパティ
 * @returns React.JSX.Element 発注リストUI
 */
export const OrderList = ({
  isOpen,
  orderItems,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
}: OrderListProps): React.JSX.Element => {

  // クリップボードにコピー
  const handleCopyText = (): void => {
    if (orderItems.length === 0) {
      alert('発注リストは空です。');
      return;
    }

    const headers = {
      juchuNo: '受注№',
      weight: '重量',
      title: 'タイトル', // 商品名からタイトルに変更
      quantity: '数量'
    };

    const maxWidths = {
      juchuNo: getDisplayWidth(headers.juchuNo),
      weight: getDisplayWidth(headers.weight),
      title: getDisplayWidth(headers.title),
      quantity: getDisplayWidth(headers.quantity)
    };

    const lines = orderItems.map((item) => {
      const quantityText = `${item.quantity.toLocaleString()}枚`;
      // タイトルを優先表示
      const itemTitle = item.product.title || item.product.productName || '―';
      
      // 重量データに kg が含まれていない場合は補完する
      let displayWeight = item.product.weight || '―';
      if (displayWeight !== '―' && !displayWeight.toLowerCase().endsWith('kg')) {
        displayWeight = `${displayWeight}kg`;
      }

      const line = {
        juchuNo: item.product.juchuNo,
        weight: displayWeight,
        title: itemTitle,
        quantity: quantityText
      };

      maxWidths.juchuNo = Math.max(maxWidths.juchuNo, getDisplayWidth(line.juchuNo));
      maxWidths.weight = Math.max(maxWidths.weight, getDisplayWidth(line.weight));
      maxWidths.title = Math.max(maxWidths.title, getDisplayWidth(line.title));
      maxWidths.quantity = Math.max(maxWidths.quantity, getDisplayWidth(line.quantity));

      return line;
    });

    let textToCopy = 
      padStr(headers.juchuNo, maxWidths.juchuNo) + '  ' +
      padStr(headers.weight, maxWidths.weight) + '  ' +
      padStr(headers.title, maxWidths.title) + '  ' +
      headers.quantity + '\n';

    lines.forEach((line) => {
      textToCopy += 
        padStr(line.juchuNo, maxWidths.juchuNo) + '  ' +
        padStr(line.weight, maxWidths.weight) + '  ' +
        padStr(line.title, maxWidths.title) + '  ' +
        line.quantity + '\n';
    });

    navigator.clipboard.writeText(textToCopy).then(
      () => {
        alert('発注リストをクリップボードにコピーしました。');
      },
      () => {
        alert('コピーに失敗しました。');
      }
    );
  };

  // CSVエクスポート
  const handleExportCSV = (): void => {
    if (orderItems.length === 0) return;

    // 「商品名」カラムヘッダーを「タイトル」に更新
    const headers = ['受注№', '種別', '重量', '商品コード', 'タイトル', '形状', '材質名称', 'JANコード', '数量', '画像ファイル名'];
    const csvRows = [headers.join(',')];

    orderItems.forEach((item) => {
      const p = item.product;
      const values = [
        p.juchuNo,
        p.shubetsu,
        p.weight,
        p.productCode,
        p.title || p.productName || '', // タイトルを書き出す
        p.shape,
        p.materialName,
        p.janCode,
        item.quantity,
        p.imageUrl ? `${p.juchuNo}A.jpg` : ''
      ].map((val) => {
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `order_list_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Excelエクスポート
  const handleExportExcel = (): void => {
    if (orderItems.length === 0) return;

    // ヘッダー名「タイトル」でシートを作成
    const data = orderItems.map((item) => {
      const p = item.product;
      return {
        '受注№': p.juchuNo,
        '種別': p.shubetsu,
        '重量': p.weight,
        '商品コード': p.productCode,
        'タイトル': p.title || p.productName || '', // タイトルを出力
        '形状': p.shape,
        '材質名称': p.materialName,
        'JANコード': p.janCode,
        '数量': item.quantity,
        '画像ファイル名': p.imageUrl ? `${p.juchuNo}A.jpg` : ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '発注リスト');
    
    XLSX.writeFile(workbook, `order_list_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className={`order-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          <ShoppingCart size={20} style={{ color: 'var(--btn-orange)' }} />
          ショッピングカート ({orderItems.length})
        </h2>
        <button className="sidebar-close-btn" onClick={onClose} title="閉じる">
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-content">
        {orderItems.length === 0 ? (
          <div className="empty-cart-state">
            <ShoppingCart size={48} strokeWidth={1} style={{ color: 'var(--border-hover)' }} />
            <p>カートは空です。</p>
            <span style={{ fontSize: '0.75rem', textAlign: 'center' }}>
              商品一覧から商品を選択して追加してください。
            </span>
          </div>
        ) : (
          orderItems.map((item) => {
            const itemTitle = item.product.title || item.product.productName || '無題の商品';
            return (
              <div key={item.product.juchuNo} className="cart-item">
                <div className="cart-item-image">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={itemTitle} />
                  ) : (
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>NO IMAGE</span>
                  )}
                </div>

                <div className="cart-item-details">
                  <span className="cart-item-title" title={itemTitle}>
                    {itemTitle}
                  </span>
                  <span className="cart-item-meta">
                    № {item.product.juchuNo} | {item.product.weight}
                  </span>

                  <div className="cart-item-actions">
                    <div className="qty-controls">
                      <button
                        className="qty-btn"
                        onClick={(): void => onUpdateQuantity(item.product.juchuNo, Math.max(0, item.quantity - 100))}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="qty-input"
                        value={item.quantity}
                        min="0"
                        step="100"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                          const val = parseInt(e.target.value, 10);
                          onUpdateQuantity(item.product.juchuNo, isNaN(val) ? 0 : val);
                        }}
                      />
                      <button
                        className="qty-btn"
                        onClick={(): void => onUpdateQuantity(item.product.juchuNo, item.quantity + 100)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  className="delete-item-btn"
                  onClick={(): void => onRemoveItem(item.product.juchuNo)}
                  title="削除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {orderItems.length > 0 && (
        <div className="sidebar-footer">
          <button className="btn-primary" onClick={handleCopyText}>
            <Copy size={16} />
            リストコピー
          </button>
          <button className="btn-secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} />
            Excelでダウンロード
          </button>
          <button className="btn-danger" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} onClick={handleExportCSV}>
            <Download size={16} />
            CSVで保存
          </button>
          <button className="btn-danger" onClick={onClearOrder}>
            <Trash2 size={16} />
            カートをすべて空にする
          </button>
        </div>
      )}
    </div>
  );
};
