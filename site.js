// Shared behaviour for pages using site.css: theme toggle, mobile menu,
// header that hides while scrolling down, "start tour" links, scroll reveals.

(function () {
  const root = document.documentElement;

  // Theme toggle
  const themeButton = document.querySelector('.theme-toggle');
  function setTheme(theme) {
    if (theme === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
    try { localStorage.setItem('theme', theme); } catch (e) {}
    if (themeButton) themeButton.setAttribute('aria-pressed', String(theme === 'light'));
    document.dispatchEvent(new Event('themechange'));
  }
  if (themeButton) {
    themeButton.setAttribute('aria-pressed', String(root.dataset.theme === 'light'));
    themeButton.addEventListener('click', () => setTheme(root.dataset.theme === 'light' ? 'dark' : 'light'));
  }

  // Mobile menu
  const nav = document.querySelector('.site-nav');
  const navToggle = document.querySelector('.nav-toggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Hide the header while scrolling down, show it again when scrolling up
  const header = document.querySelector('.site-header');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const menuOpen = nav && nav.classList.contains('is-open');
    header.classList.toggle('is-hidden', y > lastY && y > 200 && !menuOpen);
    lastY = y;
  }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  // Any link with data-start-tour starts that tour from its first object
  document.querySelectorAll('[data-start-tour]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('currentIndex');
      localStorage.setItem('tourData', JSON.stringify({
        tourName: link.dataset.startTour || 'Timeline Tour',
        length: 'short',
        complexity: 'fun',
      }));
      window.location.href = 'Object-page.html';
    });
  });

  // Reveal [data-reveal] elements as they scroll into view
  const revealed = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -10% 0px' });
    revealed.forEach((el) => observer.observe(el));
  } else {
    revealed.forEach((el) => el.classList.add('is-visible'));
  }
})();
