import { describe, it, expect } from 'vitest';
import { filterProducts } from '../lib/filter';
import { Product } from '../types';

// テスト用モックデータ (価格・営G情報なし、タイトル属性付き)
const mockProducts: Product[] = [
  {
    juchuNo: '1001',
    shubetsu: 'シール',
    weight: '5kg',
    productCode: 'PRD-01',
    productName: '新潟産コシヒカリシール',
    shape: '角型',
    orderQty: 1000,
    materialName: '和紙',
    printCode: 'P-01',
    frontColors: 2,
    backColors: 0,
    totalColors: 2,
    janCode: '4901234567890',
    directCode: 'D-100',
    directName: '米匠庵倉庫',
    latestOrderDate: '2026-07-01',
    title: 'コシヒカリシール特選',
    imageUrl: '/images/1001A.jpg'
  },
  {
    juchuNo: '1002',
    shubetsu: 'ラベル',
    weight: '2kg',
    productCode: 'PRD-02',
    productName: '山形産つや姫ラベル',
    shape: '丸型',
    orderQty: 500,
    materialName: 'ミラコート',
    printCode: 'P-02',
    frontColors: 4,
    backColors: 0,
    totalColors: 4,
    janCode: '―',
    directCode: 'D-200',
    directName: '直送センター',
    latestOrderDate: '2026-07-02',
    title: 'つや姫特別ラベル',
    imageUrl: ''
  },
  {
    juchuNo: '1003',
    shubetsu: 'シール',
    weight: '10kg',
    productCode: 'PRD-03',
    productName: '秋田産あきたこまち和風シール',
    shape: '角型',
    orderQty: 2000,
    materialName: 'クラフト',
    printCode: 'P-03',
    frontColors: 1,
    backColors: 0,
    totalColors: 1,
    janCode: '',
    directCode: 'D-100',
    directName: '米匠庵倉庫',
    latestOrderDate: '2026-07-03',
    title: 'あきたこまちクラフト',
    imageUrl: '/images/1003A.jpg'
  },
  {
    juchuNo: '1004',
    shubetsu: 'シール',
    weight: '5kg',
    productCode: 'PRD-04',
    productName: '新潟産新之助シール',
    shape: '丸型',
    orderQty: 1200,
    materialName: '和紙',
    printCode: 'P-04',
    frontColors: 2,
    backColors: 0,
    totalColors: 2,
    janCode: 'なし',
    directCode: 'D-100',
    directName: '米匠庵倉庫',
    latestOrderDate: '2026-07-04',
    title: '新之助シールなし',
    imageUrl: ''
  },
  {
    juchuNo: '1005',
    shubetsu: 'ラベル',
    weight: '2kg',
    productCode: 'PRD-05',
    productName: 'ゆめぴりかラベル',
    shape: '角型',
    orderQty: 800,
    materialName: '上質紙',
    printCode: 'P-05',
    frontColors: 3,
    backColors: 0,
    totalColors: 3,
    janCode: ' - ',
    directCode: 'D-200',
    directName: '直送センター',
    latestOrderDate: '2026-07-05',
    title: 'ゆめぴりかハイフン',
    imageUrl: ''
  }
];

describe('filterProducts', (): void => {
  
  it('should return all products when no filters are applied', (): void => {
    const result = filterProducts(mockProducts, '', '', '', '', '', '');
    expect(result).toHaveLength(5);
    expect(result).toEqual(mockProducts);
  });

  it('should filter by search text (title優先)', (): void => {
    const result = filterProducts(mockProducts, '特選', '', '', '', '', '');
    expect(result).toHaveLength(1);
    expect(result[0].juchuNo).toBe('1001');
  });

  it('should filter by search text (juchuNo)', (): void => {
    const result = filterProducts(mockProducts, '1003', '', '', '', '', '');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('あきたこまちクラフト');
  });

  it('should filter by search text case-insensitively', (): void => {
    const result = filterProducts(mockProducts, 'prd-01', '', '', '', '', '');
    expect(result).toHaveLength(1);
    expect(result[0].juchuNo).toBe('1001');
  });

  it('should filter by shubetsu', (): void => {
    const result = filterProducts(mockProducts, '', 'シール', '', '', '', '');
    expect(result).toHaveLength(3);
    expect(result.map(p => p.juchuNo)).toEqual(['1001', '1003', '1004']);
  });

  it('should filter by weight', (): void => {
    const result = filterProducts(mockProducts, '', '', '2kg', '', '', '');
    expect(result).toHaveLength(2);
    expect(result.map(p => p.juchuNo)).toEqual(['1002', '1005']);
  });

  it('should filter by material', (): void => {
    const result = filterProducts(mockProducts, '', '', '', 'ミラコート', '', '');
    expect(result).toHaveLength(1);
    expect(result[0].juchuNo).toBe('1002');
  });

  it('should filter by productName', (): void => {
    const result = filterProducts(mockProducts, '', '', '', '', '秋田産あきたこまち和風シール', '');
    expect(result).toHaveLength(1);
    expect(result[0].juchuNo).toBe('1003');
  });

  it('should filter by janCode presence (yes)', (): void => {
    const result = filterProducts(mockProducts, '', '', '', '', '', 'yes');
    expect(result).toHaveLength(1);
    expect(result[0].juchuNo).toBe('1001');
  });

  it('should filter by janCode presence (no)', (): void => {
    const result = filterProducts(mockProducts, '', '', '', '', '', 'no');
    expect(result).toHaveLength(4);
    expect(result.map(p => p.juchuNo)).toEqual(['1002', '1003', '1004', '1005']);
  });

  it('should handle complex multiple filters combined', (): void => {
    const result = filterProducts(mockProducts, '新潟', 'シール', '5kg', '和紙', '新潟産コシヒカリシール', 'yes');
    expect(result).toHaveLength(1);
    expect(result[0].juchuNo).toBe('1001');
  });

  it('should return empty list when no products match complex filter', (): void => {
    const result = filterProducts(mockProducts, 'つや姫', 'シール', '', '', '', '');
    expect(result).toHaveLength(0);
  });
});
