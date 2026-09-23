// Documentation page: collapsible sections (<details>), an index that opens the
// section it links to, and expand / collapse all.

(function docs() {
  const sections = [...document.querySelectorAll('.doc-section')];

  function openFromHash() {
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    const section = target.closest('.doc-section');
    if (section) {
      section.open = true;
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  document.getElementById('docs-expand').addEventListener('click', () => sections.forEach((s) => { s.open = true; }));
  document.getElementById('docs-collapse').addEventListener('click', () => sections.forEach((s) => { s.open = false; }));

  // keep the URL pointing at the section that was opened last, so it can be shared
  sections.forEach((s) => s.addEventListener('toggle', () => {
    if (s.open && location.hash !== `#${s.id}`) history.replaceState(null, '', `#${s.id}`);
  }));
})();
