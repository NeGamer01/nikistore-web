/**
 * Notifikasi WhatsApp dinonaktifkan (permintaan user: "tidak perlu notifikasi
 * saja gapapa"). Ini no-op shim supaya kode lama tetap compile.
 * Customer melihat detail server di halaman My Servers.
 */
export async function sendFonnteMessage(_to: string, _message: string): Promise<void> {
  // no-op
}
