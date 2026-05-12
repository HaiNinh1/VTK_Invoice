// File-download helpers.
//
// Backend endpoints stream private files behind auth (Sanctum bearer). We
// fetch them as blobs through the same axios instance so the Authorization
// header is attached automatically, then trigger a browser save.

import { api } from './client';

export interface DownloadResult {
  blob: Blob;
  filename: string;
  contentType: string;
}

function filenameFromDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  // RFC 5987 form: filename*=UTF-8''...
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].replace(/['"]/g, '').trim());
    } catch {
      /* fall through */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  if (plain?.[1]) return plain[1].trim();
  return fallback;
}

/**
 * GET a binary resource as a Blob, honoring Content-Disposition for filename.
 */
export async function downloadBlob(url: string, fallbackName = 'download'): Promise<DownloadResult> {
  const res = await api.get(url, { responseType: 'blob' });
  const disposition =
    (res.headers as Record<string, string>)['content-disposition'] ??
    (res.headers as Record<string, string>)['Content-Disposition'];
  const contentType =
    (res.headers as Record<string, string>)['content-type'] ??
    (res.headers as Record<string, string>)['Content-Type'] ??
    'application/octet-stream';
  return {
    blob: res.data as Blob,
    filename: filenameFromDisposition(disposition, fallbackName),
    contentType,
  };
}

/**
 * Convenience: download a blob and trigger a browser save dialog.
 * Returns the resolved filename.
 */
export async function saveDownload(url: string, fallbackName = 'download'): Promise<string> {
  const { blob, filename } = await downloadBlob(url, fallbackName);
  const href = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Give the browser a tick to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  return filename;
}
