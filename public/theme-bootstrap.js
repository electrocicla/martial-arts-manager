(function () {
  try {
    var storedTheme = window.localStorage.getItem('theme');
    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    var resolvedTheme = storedTheme === 'light'
      ? 'light'
      : storedTheme === 'dark'
        ? 'dark'
        : storedTheme === 'system' && prefersLight
          ? 'light'
          : 'dark';
    var root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  } catch (error) {
    console.warn('Theme bootstrap failed:', error);
  }
})();