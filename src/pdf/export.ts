/**
 * HTML → PDF on the device → a real file name → the system share sheet.
 * Value delivered before any ad is mentioned. No server, nothing stored.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

export async function exportAndShare(
  html: string,
  fileName: string,
  dialogTitle: string,
): Promise<{ uri: string; ms: number }> {
  const t0 = Date.now();
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const ms = Date.now() - t0;
  let shareUri = uri;
  try {
    // Rename Print_xxx.pdf so the share target shows "Surat-izin-kerja-Dina-….pdf".
    const target = new File(Paths.cache, fileName);
    if (target.exists) target.delete();
    new File(uri).move(target);
    shareUri = target.uri;
  } catch {
    // The letter matters more than its name — share the original on any failure.
  }
  if (await Sharing.isAvailableAsync())
    await Sharing.shareAsync(shareUri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: 'com.adobe.pdf',
    });
  return { uri: shareUri, ms };
}
