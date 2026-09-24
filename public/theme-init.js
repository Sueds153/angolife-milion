(function () {
  try {
    const theme = localStorage.getItem('theme');
    const supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (theme !== 'light' && supportDarkMode)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
