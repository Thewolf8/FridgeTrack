let Filesystem = null;
let Share = null;
let Capacitor = null;

try {
  Filesystem = require('@capacitor/filesystem').Filesystem;
  Share = require('@capacitor/share').Share;
  Capacitor = require('@capacitor/core').Capacitor;
} catch {
  // Not in Capacitor environment — will use web fallbacks
}

const Directory = {
  Documents: 'DOCUMENTS',
  Downloads: 'DOWNLOADS',
  Data: 'DATA',
  Cache: 'CACHE',
  External: 'EXTERNAL',
  ExternalStorage: 'EXTERNAL_STORAGE',
};

function isNativePlatform() {
  try {
    return Capacitor?.isNativePlatform?.() || false;
  } catch {
    return false;
  }
}

async function writeFileNative(filename, data, directory = Directory.Documents) {
  if (!Filesystem) throw new Error('Filesystem plugin not available');
  const result = await Filesystem.writeFile({
    path: filename,
    data,
    directory,
    recursive: true,
  });
  return result.uri;
}

async function shareFileNative(uri, title = 'Share') {
  if (!Share) throw new Error('Share plugin not available');
  await Share.share({
    title,
    url: uri,
  });
}

async function shareTextNative(text, title = 'Share') {
  if (!Share) throw new Error('Share plugin not available');
  await Share.share({
    title,
    text,
  });
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

// ===== SHARE SHOPPING LIST AS TEXT =====
export async function shareShoppingListAsText(formattedText) {
  if (isNativePlatform() && Share) {
    await shareTextNative(formattedText, 'Shopping List');
  } else {
    // Web fallback: copy to clipboard or download as txt
    try {
      await navigator.clipboard.writeText(formattedText);
    } catch {
      downloadBlob(formattedText, 'shopping-list.txt', 'text/plain');
    }
  }
}

// ===== DOWNLOAD AS PDF =====
export async function downloadPDF(pdfDoc, filename = 'shopping-list.pdf') {
  const pdfOutput = pdfDoc.output('datauristring');
  const base64Data = pdfOutput.split(',')[1];

  if (isNativePlatform() && Filesystem && Share) {
    const uri = await writeFileNative(filename, base64Data, Directory.Documents);
    await shareFileNative(uri, filename);
  } else {
    pdfDoc.save(filename);
  }
}

// ===== EXPORT AS JSON =====
export async function exportJSON(data, filename = 'fridgetrack-export.json') {
  const jsonStr = JSON.stringify(data, null, 2);

  if (isNativePlatform() && Filesystem && Share) {
    const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
    const uri = await writeFileNative(filename, base64Data, Directory.Documents);
    await shareFileNative(uri, filename);
  } else {
    downloadBlob(jsonStr, filename, 'application/json');
  }
}

// ===== EXPORT INVENTORY PDF =====
export async function exportInventoryPDF(pdfDoc, filename = 'fridgetrack-inventory.pdf') {
  const pdfOutput = pdfDoc.output('datauristring');
  const base64Data = pdfOutput.split(',')[1];

  if (isNativePlatform() && Filesystem && Share) {
    const uri = await writeFileNative(filename, base64Data, Directory.Documents);
    await shareFileNative(uri, filename);
  } else {
    pdfDoc.save(filename);
  }
}

// ===== EXPORT INVENTORY TXT =====
export async function exportInventoryTXT(content, filename = 'fridgetrack-inventory.txt') {
  if (isNativePlatform() && Filesystem && Share) {
    const base64Data = btoa(unescape(encodeURIComponent(content)));
    const uri = await writeFileNative(filename, base64Data, Directory.Documents);
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
    // The Filesystem plugin handles permissions internally
    // but we can check if it's available
    if (!Filesystem) return { granted: false };
    // Try a test write to verify permissions
    await Filesystem.writeFile({
      path: '.permission_test',
      data: 'test',
      directory: Directory.Cache,
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

export { isNativePlatform, Directory };
