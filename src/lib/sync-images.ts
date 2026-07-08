import fs from 'fs';
import path from 'path';
import https from 'https';
import AdmZip from 'adm-zip';

// .env.local を手動で読み込む（ビルド前スクリプトとしても動作するように）
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  for (const line of envConfig.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // クォートの除去
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  }
}

const DROPBOX_ZIP_URL: string = process.env.DROPBOX_ZIP_URL || 'https://www.dropbox.com/scl/fo/2dut0cpg8eel9l60hz2im/AD0dBTTPlHVIXgZfKkiJPu8?rlkey=ppbc5uqtnfshrju37827qofux&dl=1';
const TARGET_DIR: string = path.resolve(process.cwd(), 'public', 'images');
const TEMP_ZIP_PATH: string = path.resolve(process.cwd(), 'temp_images.zip');

/**
 * 指定されたURLからファイルをダウンロードする関数
 * @param url ダウンロード対象のURL
 * @param destFilePath 保存先のファイルパス
 * @returns Promise<void>
 */
function downloadFile(url: string, destFilePath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(destFilePath);
    
    // リダイレクトに対応するヘルパー
    const request = (targetUrl: string): void => {
      https.get(targetUrl, (response) => {
        // リダイレクト (301, 302) の処理
        if (response.statusCode && [301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
          request(response.headers.location);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file: Status Code ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(destFilePath, () => {}); // エラー時は作成途中のファイルを削除
        reject(err);
      });
    };

    request(url);
  });
}

/**
 * フォルダ内のファイルを平坦化し、TARGET_DIR直下に移動する関数
 * @param currentDir 現在走査中のディレクトリ
 * @returns void
 */
function flattenDirectory(currentDir: string): void {
  const items = fs.readdirSync(currentDir);

  for (const item of items) {
    const itemPath = path.join(currentDir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // サブディレクトリ内を再帰的に走査
      flattenDirectory(itemPath);
      // 空になったディレクトリを削除
      try {
        fs.rmdirSync(itemPath);
      } catch (e) {
        console.error(`Failed to remove empty directory: ${itemPath}`, e);
      }
    } else {
      // ファイルを TARGET_DIR 直下に移動
      const targetPath = path.join(TARGET_DIR, item);
      if (itemPath !== targetPath) {
        fs.renameSync(itemPath, targetPath);
      }
    }
  }
}

/**
 * Dropbox共有フォルダから画像を同期するメイン処理
 * @returns Promise<void>
 */
async function syncImages(): Promise<void> {
  console.log('Starting Dropbox image synchronization...');
  
  // 保存先ディレクトリの作成
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  try {
    console.log(`Downloading zip file from: ${DROPBOX_ZIP_URL}`);
    await downloadFile(DROPBOX_ZIP_URL, TEMP_ZIP_PATH);
    console.log('Download complete. Extracting zip file...');

    const zip = new AdmZip(TEMP_ZIP_PATH);
    zip.extractAllTo(TARGET_DIR, true);
    console.log('Extraction complete. Normalizing directory structure...');

    // 解凍結果の平坦化 (サブディレクトリに入っているファイルをTARGET_DIR直下に移動)
    flattenDirectory(TARGET_DIR);

    console.log('Cleaning up temporary files...');
    if (fs.existsSync(TEMP_ZIP_PATH)) {
      fs.unlinkSync(TEMP_ZIP_PATH);
    }

    console.log('Image synchronization completed successfully.');
  } catch (error) {
    console.error('Error during image synchronization:', error);
    // 一時ファイルのクリーンアップ
    if (fs.existsSync(TEMP_ZIP_PATH)) {
      try {
        fs.unlinkSync(TEMP_ZIP_PATH);
      } catch (e) {}
    }
    process.exit(1);
  }
}

// 実行
syncImages();
