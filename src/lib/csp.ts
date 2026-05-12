export function getCspNonce(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const nonce = document
    .querySelector('meta[name="csp-nonce"]')
    ?.getAttribute('content')
    ?.trim();

  return nonce && nonce.length > 0 ? nonce : null;
}
