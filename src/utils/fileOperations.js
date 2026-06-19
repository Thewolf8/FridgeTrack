// ⚠️ CRITICAL FIX: this file previously loaded Capacitor plugins via
// require('@capacitor/...') wrapped in try/catch. Vite-bundled apps (and
// the Capacitor WebView) have NO `require` function at runtime — every
// call threw "ReferenceError: require is not defined", silently caught,
// leaving Filesystem/Share/Capacitor permanently null. As a result
// isNativePlatform() ALWAYS returned false — even inside the real
// installed Android app — so Share/Download silently fell back to
// web-only code (blob links, clipboard) that does nothing inside a
// WebView. Switching to normal static ES imports (exactly like a working
// Capacitor app should) fixes this for good; the plugins resolve
// correctly on both web and native automatically.
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

// Cache directory is reliable for sharing across all Android versions.
// Documents directory is used for true on-device downloads.
const SHARE_DIR = Directory.Cache;
const SAVE_DIR = Directory.Documents;

export function isNativePlatform() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function writeFileNative(filename, data, directory = SHARE_DIR, encoding) {
  const result = await Filesystem.writeFile({
    path: filename,
    data,
    directory,
    encoding,
    recursive: true,
  });
  return result.uri;
}

async function shareFileNative(uri, title = 'Share') {
  await Share.share({ title, url: uri });
}

async function shareTextNative(text, title = 'Share') {
  await Share.share({ title, text });
}

// Web fallback: blob download
function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadBase64(base64Data, filename, mimeType) {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== TRUE DIRECT DOWNLOAD (no share sheet) =====
// Saves the file straight into Documents/fridgetrack-backups/ on device,
// or triggers a normal browser download on web. Distinct from the
// share*() functions below, which always open the OS share sheet.
export async function downloadFile(content, filename, isBase64 = false) {
  const path = `fridgetrack-backups/${filename}`;

  if (isNativePlatform()) {
    try {
      const perm = await Filesystem.checkPermissions();
      if (perm?.publicStorage !== 'granted') {
        await Filesystem.requestPermissions();
      }
    } catch {
      // Newer Android versions (scoped storage) manage this automatically
    }

    await Filesystem.writeFile({
      path,
      data: content,
      directory: SAVE_DIR,
      encoding: isBase64 ? undefined : Encoding.UTF8,
      recursive: true,
    });
    return `Documents/${path}`;
  }

  // Web fallback: real browser download
  if (isBase64) {
    downloadBase64(content, filename, 'application/octet-stream');
  } else {
    downloadBlob(content, filename, 'text/plain');
  }
  return filename;
}

// ===== SHARE SHOPPING LIST AS TEXT =====
export async function shareShoppingListAsText(formattedText) {
  if (isNativePlatform()) {
    await shareTextNative(formattedText, 'Shopping List');
  } else {
    try {
      await navigator.clipboard.writeText(formattedText);
    } catch {
      downloadBlob(formattedText, 'shopping-list.txt', 'text/plain');
    }
  }
}

// ===== SHARE AS PDF (opens OS share sheet) =====
export async function downloadPDF(pdfDoc, filename = 'shopping-list.pdf') {
  const pdfOutput = pdfDoc.output('datauristring');
  const base64Data = pdfOutput.split(',')[1];

  if (isNativePlatform()) {
    const uri = await writeFileNative(filename, base64Data, SHARE_DIR);
    await shareFileNative(uri, filename);
  } else {
    pdfDoc.save(filename);
  }
}

// ===== SHARE AS JSON (opens OS share sheet) =====
export async function exportJSON(data, filename = 'fridgetrack-export.json') {
  const jsonStr = JSON.stringify(data, null, 2);

  if (isNativePlatform()) {
    const uri = await writeFileNative(filename, jsonStr, SHARE_DIR, Encoding.UTF8);
    await shareFileNative(uri, filename);
  } else {
    downloadBlob(jsonStr, filename, 'application/json');
  }
}

// ===== SHARE INVENTORY PDF =====
export async function exportInventoryPDF(pdfDoc, filename = 'fridgetrack-inventory.pdf') {
  const pdfOutput = pdfDoc.output('datauristring');
  const base64Data = pdfOutput.split(',')[1];

  if (isNativePlatform()) {
    const uri = await writeFileNative(filename, base64Data, SHARE_DIR);
    await shareFileNative(uri, filename);
  } else {
    pdfDoc.save(filename);
  }
}

// ===== SHARE INVENTORY TXT =====
export async function exportInventoryTXT(content, filename = 'fridgetrack-inventory.txt') {
  if (isNativePlatform()) {
    const uri = await writeFileNative(filename, content, SHARE_DIR, Encoding.UTF8);
    await shareFileNative(uri, filename);
  } else {
    downloadBlob(content, filename, 'text/plain');
  }
}

// ===== IMPORT JSON FILE =====
export function pickJSONFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          resolve(data);
        } catch {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };
    input.click();
  });
}

// ===== REQUEST PERMISSIONS =====
export async function requestStoragePermissions() {
  if (!isNativePlatform()) return { granted: true };
  try {
    await Filesystem.writeFile({
      path: '.permission_test',
      data: 'test',
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Filesystem.deleteFile({
      path: '.permission_test',
      directory: Directory.Cache,
    });
    return { granted: true };
  } catch (e) {
    return { granted: false, error: e.message };
  }
}

// ===== FORMAT SHOPPING LIST AS TEXT =====
export function formatShoppingListAsText(items, t) {
  const now = new Date().toLocaleString();
  let text = `===== FridgeTrack ${t('shoppingList')} =====\n`;
  text += `${t('generatedOn')}: ${now}\n\n`;

  const sections = ['fridge', 'freezer', 'pantry'];
  sections.forEach(section => {
    const sectionItems = items.filter(i => i.section === section);
    if (sectionItems.length > 0) {
      text += `${t(section).toUpperCase()}:\n`;
      sectionItems.forEach(item => {
        const checkbox = item.purchased ? '[x]' : '[ ]';
        text += `${checkbox} ${item.name}`;
        if (item.suggestedQty) {
          text += ` — ${item.suggestedQty} ${item.unit ? t(item.unit) : ''}`;
        }
        text += '\n';
      });
      text += '\n';
    }
  });

  text += '=====================================\n';
  return text;
}

// Re-export storage functions for convenience
export { exportFullBackup, importFullBackup } from './storage';

export { Directory };
