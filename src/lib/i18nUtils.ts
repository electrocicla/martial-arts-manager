export function label(t: (key: string) => string, key: string, fallback?: string) {
  try {
    const translated = t(key);
    if (!translated || translated === key) {
      if (fallback) return fallback;
      // humanize the key: take last segment and replace camelCase/dots with spaces
      const last = key.split('.').pop() || key;
      const human = last
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]/g, ' ')
        .replace(/([a-z])([0-9])/g, '$1 $2');
      return human.charAt(0).toUpperCase() + human.slice(1);
    }
    return translated;
  } catch {
    return fallback || key;
  }
}
