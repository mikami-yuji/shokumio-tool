import React from 'react';
import { X, Trash2, Copy, FileSpreadsheet, Download, ShoppingCart } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
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

  // Excelエクスポート (画像付き発注書)
  const handleExportExcel = async (): Promise<void> => {
    if (orderItems.length === 0) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('発注書');

      // 列幅の設定
      worksheet.columns = [
        { key: 'image', width: 16 },
        { key: 'juchuNo', width: 14 },
        { key: 'title', width: 32 },
        { key: 'productName', width: 28 },
        { key: 'weight', width: 12 },
        { key: 'materialName', width: 22 },
        { key: 'janCode', width: 20 },
        { key: 'quantity', width: 15 }
      ];

      // 1. タイトルヘッダー (A1:H1 結合)
      worksheet.mergeCells('A1:H1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = '発 注 書 (シール商品一覧)';
      titleCell.font = { name: 'MS PGothic', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '131921' } }; // 暗いネイビー
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 40;

      // 2. 発注メタ情報 (3行目: 日付と件数)
      worksheet.mergeCells('A3:C3');
      const dateCell = worksheet.getCell('A3');
      dateCell.value = `発注日: ${new Date().toLocaleDateString('ja-JP')}`;
      dateCell.font = { name: 'MS PGothic', size: 10, bold: true };
      dateCell.alignment = { vertical: 'middle', horizontal: 'left' };

      worksheet.mergeCells('E3:H3');
      const countCell = worksheet.getCell('E3');
      const totalQty = orderItems.reduce((acc, item) => acc + item.quantity, 0);
      countCell.value = `発注件数: ${orderItems.length}件  |  合計数量: ${totalQty.toLocaleString()}枚`;
      countCell.font = { name: 'MS PGothic', size: 10, bold: true };
      countCell.alignment = { vertical: 'middle', horizontal: 'right' };
      worksheet.getRow(3).height = 20;

      // 5. テーブルヘッダー
      const headerRow = worksheet.getRow(5);
      headerRow.height = 28;
      const headers = ['画像', '受注№', 'タイトル', '商品名', '重量', '材質名称', 'JANコード', '数量'];
      headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        cell.font = { name: 'MS PGothic', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '232F3E' } }; // サブヘッダーネイビー
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD5D9D9' } },
          left: { style: 'thin', color: { argb: 'FFD5D9D9' } },
          bottom: { style: 'thin', color: { argb: 'FFD5D9D9' } },
          right: { style: 'thin', color: { argb: 'FFD5D9D9' } }
        };
      });

      // 画像のBase64変換ヘルパー
      const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const blob = await res.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              const base64 = base64data.split(',')[1];
              resolve(base64);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.error('Failed to fetch image:', e);
          return null;
        }
      };

      // 6. データ書き込み
      let startRow = 6;
      for (let i = 0; i < orderItems.length; i++) {
        const item = orderItems[i];
        const p = item.product;
        const row = worksheet.getRow(startRow);
        row.height = 80; // 画像が入るため高さを確保

        // 各種値の設定
        row.getCell(2).value = p.juchuNo;
        row.getCell(3).value = p.title || '―';
        row.getCell(4).value = p.productName || '―';
        
        // 重量のフォーマット
        let displayWeight = p.weight || '―';
        if (displayWeight !== '―' && !displayWeight.toLowerCase().endsWith('kg')) {
          displayWeight = `${displayWeight}kg`;
        }
        row.getCell(5).value = displayWeight;
        row.getCell(6).value = p.materialName || '―';
        row.getCell(7).value = p.janCode || '―';
        
        // 数量は数値として登録
        const qtyCell = row.getCell(8);
        qtyCell.value = item.quantity;
        qtyCell.numFmt = '#,##0"枚"';

        // アライメントと罫線
        for (let col = 1; col <= 8; col++) {
          const cell = row.getCell(col);
          cell.alignment = { vertical: 'middle', horizontal: col === 3 || col === 4 ? 'left' : 'center', wrapText: true };
          cell.font = { name: 'MS PGothic', size: 9 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD5D9D9' } },
            left: { style: 'thin', color: { argb: 'FFD5D9D9' } },
            bottom: { style: 'thin', color: { argb: 'FFD5D9D9' } },
            right: { style: 'thin', color: { argb: 'FFD5D9D9' } }
          };
        }

        // 画像の処理
        if (p.imageUrl) {
          const base64 = await fetchImageAsBase64(p.imageUrl);
          if (base64) {
            try {
              const imageId = workbook.addImage({
                base64: base64,
                extension: 'jpeg'
              });
              
              // A列のセル内にぴったり収まるようにマージンを設定して配置
              worksheet.addImage(imageId, {
                tl: { col: 0.05, row: startRow - 1 + 0.05 },
                ext: { width: 90, height: 95 }
              });
            } catch (err) {
              console.error('Failed to add image to excel sheet:', err);
              row.getCell(1).value = 'ERR IMAGE';
            }
          } else {
            row.getCell(1).value = 'NO IMAGE';
          }
        } else {
          row.getCell(1).value = 'NO IMAGE';
        }

        startRow++;
      }

      // ファイルのダウンロード実行
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `order_sheet_${dateStr}.xlsx`;

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to export styled excel:', error);
      alert('Excelファイルの生成中にエラーが発生しました。');
    }
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
