/**
 * Cross-environment clipboard utility.
 *
 * navigator.clipboard.writeText() only works on HTTPS or localhost origins.
 * On LAN IPs (e.g. 10.22.100.194:3000) it silently fails or throws.
 * This utility falls back to the legacy execCommand('copy') approach
 * using a hidden textarea when the Clipboard API is unavailable.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try the modern Clipboard API first (works on HTTPS & localhost)
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard API rejected (insecure context) — fall through to legacy
    }
  }

  // 2. Legacy fallback using execCommand('copy')
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;

    // Position off-screen so it's invisible but still selectable
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
