// Loaded in <head> so the saved theme is applied before the page paints.
// site.js saves the choice under the same localStorage key when the theme button is used.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    if (localStorage.getItem('theme') === 'light') root.dataset.theme = 'light';
  } catch (e) {}
})();
