import { isIP } from 'node:net';

/** Longest URL accepted, measured after trimming (DR-4). */
export const MAX_URL_LENGTH = 2048;

const EXPLICIT_HTTP_SCHEME = /^https?:\/\//i;
/** Last DNS label: letters, or an IDN A-label (`xn--…`). Rejects numeric TLDs. */
const TOP_LEVEL_LABEL = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

function parse(value: string): URL | null {
  if (!EXPLICIT_HTTP_SCHEME.test(value)) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * DR-4: an absolute http(s) URL whose host is a public domain name — not
 * `localhost`, not a bare intranet name, not an IP literal.
 */
export function isPublicHttpUrl(value: string): boolean {
  const url = parse(value);
  if (!url) return false;
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(hostname) !== 0) return false;
  const labels = hostname.split('.');
  if (labels.length < 2) return false;
  return TOP_LEVEL_LABEL.test(labels[labels.length - 1]);
}

/**
 * DR-5: true when the URL's host is `hostname` or a subdomain of it
 * (case-insensitive, port ignored).
 */
export function pointsToHost(value: string, hostname: string): boolean {
  const url = parse(value);
  if (!url) return false;
  const target = hostname.toLowerCase();
  const host = url.hostname.toLowerCase();
  return host === target || host.endsWith(`.${target}`);
}
