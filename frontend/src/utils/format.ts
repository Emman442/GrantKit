/**
 * Utility functions for formatting amounts, addresses, times, and validating inputs
 */

// 1 GEN = 10^18 smallest units (like ETH)
export const DECIMALS = 18n;
export const UNIT_SCALE = 10n ** DECIMALS;

/**
 * Converts human number (e.g. 500) to smallest unit BigInt string (e.g. 500 * 10^18)
 */
export function toSmallestUnit(humanAmount: string | number): string {
  try {
    const str = String(humanAmount).trim();
    if (!str || isNaN(Number(str))) return '0';
    const parts = str.split('.');
    const whole = BigInt(parts[0] || '0') * UNIT_SCALE;
    if (parts.length === 1) return whole.toString();
    
    // Process decimals up to 18 digits
    const fracStr = parts[1].padEnd(18, '0').slice(0, 18);
    const frac = BigInt(fracStr);
    return (whole + frac).toString();
  } catch {
    return '0';
  }
}

/**
 * Converts smallest unit BigInt string to readable human string
 */
export function fromSmallestUnit(rawAmount: string | bigint | number, decimalsToShow = 2): string {
  try {
    const raw = typeof rawAmount === 'bigint' ? rawAmount : BigInt(String(rawAmount || '0'));
    const whole = raw / UNIT_SCALE;
    const remainder = raw % UNIT_SCALE;
    if (remainder === 0n) {
      return whole.toLocaleString('en-US');
    }
    const fracStr = remainder.toString().padStart(18, '0').slice(0, decimalsToShow);
    const trimmedFrac = fracStr.replace(/0+$/, '');
    if (!trimmedFrac) {
      return whole.toLocaleString('en-US');
    }
    return `${whole.toLocaleString('en-US')}.${trimmedFrac}`;
  } catch {
    return '0';
  }
}

/**
 * Format currency with tabular-nums wrapper metadata
 */
export function formatGen(rawAmount: string | bigint | number, symbol = 'GEN'): {
  display: string;
  raw: string;
} {
  const rawStr = String(rawAmount || '0');
  const human = fromSmallestUnit(rawStr, 2);
  return {
    display: `${human} ${symbol}`,
    raw: `${rawStr} wei / smallest unit`,
  };
}

/**
 * Truncate EVM/GenLayer addresses: 0x9dCF...6dDFB6
 */
export function truncateAddress(address: string, startChars = 6, endChars = 6): string {
  if (!address) return '';
  if (address.length <= startChars + endChars + 2) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format seconds to MM:SS string
 */
export function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format Unix timestamp to localized ISO-like string
 */
export function formatDate(timestampMsOrSec: number): string {
  if (!timestampMsOrSec) return '—';
  const ms = timestampMsOrSec < 10000000000 ? timestampMsOrSec * 1000 : timestampMsOrSec;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Validates external URL:
 * - Must be valid HTTPS URL
 * - No localhost, 127.0.0.1, 0.0.0.0
 * - No private IPv4 ranges (10.x, 192.168.x, 172.16-31.x)
 * - No credentials in URL (e.g. user:pass@)
 */
export function validateHttpsUrl(urlString: string): { valid: boolean; error?: string } {
  const trimmed = urlString.trim();
  if (!trimmed) {
    return { valid: false, error: 'URL is required' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'URL must use https:// protocol' };
  }

  // Reject embedded credentials
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'Credentials in URL are forbidden' };
  }

  const host = parsed.hostname.toLowerCase();

  // Reject localhost and plain names without dot
  if (host === 'localhost' || !host.includes('.')) {
    return { valid: false, error: 'Localhost and private domains are not allowed' };
  }

  // Reject IPv4 loopback & private subnets
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = host.match(ipv4Regex);
  if (match) {
    const octets = match.slice(1).map(Number);
    if (octets.some((o) => o > 255)) {
      return { valid: false, error: 'Invalid IP address' };
    }
    // 127.0.0.0/8
    if (octets[0] === 127) {
      return { valid: false, error: 'Loopback IP addresses are forbidden' };
    }
    // 0.0.0.0
    if (octets[0] === 0) {
      return { valid: false, error: 'Zero network IP is forbidden' };
    }
    // 10.0.0.0/8
    if (octets[0] === 10) {
      return { valid: false, error: 'Private IP space (10.0.0.0/8) is forbidden' };
    }
    // 192.168.0.0/16
    if (octets[0] === 192 && octets[1] === 168) {
      return { valid: false, error: 'Private IP space (192.168.0.0/16) is forbidden' };
    }
    // 172.16.0.0/12
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
      return { valid: false, error: 'Private IP space (172.16.0.0/12) is forbidden' };
    }
  }

  return { valid: true };
}

/**
 * Computes milestone tranches:
 * Amount is divided evenly across milestone count,
 * with the final milestone taking the remainder.
 */
export function computeTranches(totalRawAmount: string | bigint, milestoneCount: number): string[] {
  if (milestoneCount <= 0) return [];
  const total = typeof totalRawAmount === 'bigint' ? totalRawAmount : BigInt(totalRawAmount || '0');
  const countBig = BigInt(milestoneCount);
  const baseTranche = total / countBig;
  const remainder = total % countBig;

  const tranches: string[] = [];
  for (let i = 0; i < milestoneCount; i++) {
    if (i === milestoneCount - 1) {
      tranches.push((baseTranche + remainder).toString());
    } else {
      tranches.push(baseTranche.toString());
    }
  }
  return tranches;
}
