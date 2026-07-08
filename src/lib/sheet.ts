import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { google } from 'googleapis';
import { Product } from '../types';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '1P_2AsGoUkMBfgR7tO0HBaJTval2rGX7pWxKbf1jkcqs';
const CSV_URL = process.env.NEXT_PUBLIC_SPREADSHEET_CSV_URL || `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`;
const LOCAL_CSV_PATH = path.resolve(process.cwd(), 'src', 'data', 'data.csv');
const IMAGES_DIR = path.resolve(process.cwd(), 'public', 'images');

/**
 * CSVテキストを行の配列にパースする
 * @param csvText パース対象 of CSV文字列
 * @returns string[][] パースされた行データ
 */
function parseCSV(csvText: string): string[][] {
  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });
  return parsed.data;
}

/**
 * パースされた行データをProductオブジェクトの配列に変換する
 * @param rows CSVまたはAPIから取得した行データ (1行目はヘッダー)
 * @returns Product[] パースされた商品データ一覧
 */
function processRowsToProducts(rows: string[][]): Product[] {
  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map(h => h.trim());
  const dataRows = rows.slice(1);

  // 各列のインデックスを取得
  const juchuIdx = headers.indexOf('受注№');
  const shubetsuIdx = headers.indexOf('種別');
  const weightIdx = headers.indexOf('重量');
  const productCodeIdx = headers.indexOf('商品コード');
  const productNameIdx = headers.indexOf('商品名');
  const shapeIdx = headers.indexOf('形状');
  const orderQtyIdx = headers.indexOf('受注数');
  const materialNameIdx = headers.indexOf('材質名称');
  const printCodeIdx = headers.indexOf('印刷コード');
  const frontColorsIdx = headers.indexOf('表色数');
  const backColorsIdx = headers.indexOf('裏色数');
  const totalColorsIdx = headers.indexOf('総色数');
  const janCodeIdx = headers.indexOf('JANコード');
  const directCodeIdx = headers.indexOf('直送先コード');
  const directNameIdx = headers.indexOf('直送先名称');
  const latestOrderDateIdx = headers.indexOf('最新受注日');
  const titleIdx = headers.indexOf('タイトル');

  // キャッシュされた画像ファイル名のリスト
  let imageFiles: Set<string> = new Set();
  try {
    if (fs.existsSync(IMAGES_DIR)) {
      imageFiles = new Set(fs.readdirSync(IMAGES_DIR));
    }
  } catch (e) {
    console.error('Failed to read images directory:', e);
  }

  return dataRows.map((row): Product | null => {
    const juchuNo = juchuIdx !== -1 && row[juchuIdx] ? row[juchuIdx].trim() : '';
    if (!juchuNo) {
      return null;
    }

    const shubetsu = shubetsuIdx !== -1 && row[shubetsuIdx] ? row[shubetsuIdx].trim() : '';
    const weight = weightIdx !== -1 && row[weightIdx] ? row[weightIdx].trim() : '';
    const productCode = productCodeIdx !== -1 && row[productCodeIdx] ? row[productCodeIdx].trim() : '';
    const productName = productNameIdx !== -1 && row[productNameIdx] ? row[productNameIdx].trim() : '';
    const shape = shapeIdx !== -1 && row[shapeIdx] ? row[shapeIdx].trim() : '';
    
    const orderQty = orderQtyIdx !== -1 && row[orderQtyIdx] ? parseInt(row[orderQtyIdx].replace(/,/g, ''), 10) : 0;
    const materialName = materialNameIdx !== -1 && row[materialNameIdx] ? row[materialNameIdx].trim() : '';
    const printCode = printCodeIdx !== -1 && row[printCodeIdx] ? row[printCodeIdx].trim() : '';

    const frontColors = frontColorsIdx !== -1 && row[frontColorsIdx] ? parseInt(row[frontColorsIdx], 10) : 0;
    const backColors = backColorsIdx !== -1 && row[backColorsIdx] ? parseInt(row[backColorsIdx], 10) : 0;
    const totalColors = totalColorsIdx !== -1 && row[totalColorsIdx] ? parseInt(row[totalColorsIdx], 10) : 0;

    const janCode = janCodeIdx !== -1 && row[janCodeIdx] ? row[janCodeIdx].trim() : '';
    const directCode = directCodeIdx !== -1 && row[directCodeIdx] ? row[directCodeIdx].trim() : '';
    const directName = directNameIdx !== -1 && row[directNameIdx] ? row[directNameIdx].trim() : '';
    const latestOrderDate = latestOrderDateIdx !== -1 && row[latestOrderDateIdx] ? row[latestOrderDateIdx].trim() : '';
    const title = titleIdx !== -1 && row[titleIdx] ? row[titleIdx].trim() : '';

    // `[受注№]A.jpg` が存在すればそのパスを使用
    const imgFileName = `${juchuNo}A.jpg`;
    const imageUrl = imageFiles.has(imgFileName) ? `/images/${imgFileName}` : '';

    return {
      juchuNo,
      shubetsu,
      weight,
      productCode,
      productName,
      shape,
      orderQty: isNaN(orderQty) ? 0 : orderQty,
      materialName,
      printCode,
      frontColors: isNaN(frontColors) ? 0 : frontColors,
      backColors: isNaN(backColors) ? 0 : backColors,
      totalColors: isNaN(totalColors) ? 0 : totalColors,
      janCode,
      directCode,
      directName,
      latestOrderDate,
      title,
      imageUrl,
    };
  }).filter((p): p is Product => p !== null);
}

/**
 * Google Sheets API を使用して非公開シートからデータを取得する
 * @returns Promise<Product[] | null> 取得成功時は商品リスト、未設定・エラー時はnull
 */
async function fetchViaSheetsAPI(): Promise<Product[] | null> {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    return null;
  }

  try {
    console.log('Attempting to fetch data via Google Sheets API...');
    
    let credentials;
    if (serviceAccountKey.startsWith('{')) {
      credentials = JSON.parse(serviceAccountKey);
    } else {
      const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf8');
      credentials = JSON.parse(decoded);
    }

    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:Z1000',
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      console.warn('Google Sheets API returned empty values.');
      return null;
    }

    console.log(`Successfully fetched ${values.length} rows via Sheets API.`);
    return processRowsToProducts(values);
  } catch (error) {
    console.error('Error fetching data via Google Sheets API:', error);
    return null;
  }
}

/**
 * スプレッドシート公開CSV URLからデータをフェッチする
 * @returns Promise<Product[] | null> 取得成功時は商品リスト、401エラーや接続失敗時はnull
 */
async function fetchViaPublicCSV(): Promise<Product[] | null> {
  try {
    console.log(`Attempting to fetch public CSV from: ${CSV_URL}`);
    const response = await fetch(CSV_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      console.warn(`Public CSV fetch failed: Status ${response.status}`);
      return null;
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);
    console.log(`Successfully fetched and parsed public CSV (${rows.length} rows).`);
    return processRowsToProducts(rows);
  } catch (error) {
    console.error('Error fetching public CSV:', error);
    return null;
  }
}

/**
 * ローカルの data.csv からデータを読み込む
 * @returns Product[] ローカルの商品リスト (フォールバック)
 */
function readLocalCSV(): Product[] {
  try {
    console.log(`Reading local fallback CSV from: ${LOCAL_CSV_PATH}`);
    if (!fs.existsSync(LOCAL_CSV_PATH)) {
      console.warn('Local CSV file does not exist.');
      return [];
    }

    const csvText = fs.readFileSync(LOCAL_CSV_PATH, 'utf8');
    const rows = parseCSV(csvText);
    console.log(`Successfully read local CSV (${rows.length} rows).`);
    return processRowsToProducts(rows);
  } catch (error) {
    console.error('Error reading local CSV:', error);
    return [];
  }
}

/**
 * Googleスプレッドシートのデータを取得し、Productの配列にパースする
 * (API -> Public CSV -> Local CSV の順にフォールバックします)
 * @returns Promise<Product[]> パースされた商品データ一覧
 */
export async function getProductsFromSheet(): Promise<Product[]> {
  try {
    const apiResult = await fetchViaSheetsAPI();
    if (apiResult) {
      return apiResult;
    }

    const csvResult = await fetchViaPublicCSV();
    if (csvResult) {
      return csvResult;
    }

    return readLocalCSV();
  } catch (error) {
    console.error('Error in getProductsFromSheet main flow:', error);
    return readLocalCSV();
  }
}
