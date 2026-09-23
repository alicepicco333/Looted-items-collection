// Tours page: reading preferences (length + complexity) and the three tours.
// Each tour shows its objects in tour order; "Start" opens the first one with
// the chosen preferences. Tour order comes from tour-data.json.

(function tours() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem('tourData')) || {}; } catch (e) { return {}; } })();
  const prefs = { length: saved.length || 'short', complexity: saved.complexity || 'fun' };

  function updatePrefs() {
    document.querySelectorAll('[data-pref-length]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.prefLength === prefs.length)));
    document.querySelectorAll('[data-pref-complexity]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.prefComplexity === prefs.complexity)));
    document.getElementById('prefs-summary').textContent = `${prefs.length} texts · ${prefs.complexity} level`;
  }
  document.querySelectorAll('[data-pref-length]').forEach((b) => b.addEventListener('click', () => { prefs.length = b.dataset.prefLength; updatePrefs(); }));
  document.querySelectorAll('[data-pref-complexity]').forEach((b) => b.addEventListener('click', () => { prefs.complexity = b.dataset.prefComplexity; updatePrefs(); }));
  updatePrefs();

  document.querySelectorAll('[data-tour-start]').forEach((button) => {
    button.addEventListener('click', () => {
      localStorage.removeItem('currentIndex');
      localStorage.setItem('tourData', JSON.stringify({ tourName: button.dataset.tourStart, ...prefs }));
      window.location.href = 'Object-page.html';
    });
  });

  // each tour's objects, in the order the tour visits them
  fetch('tour-data.json')
    .then((r) => r.json())
    .then((data) => {
      document.querySelectorAll('[data-tour-strip]').forEach((list) => {
        const tour = data[list.dataset.tourStrip];
        list.innerHTML = tour.items.map((id, i) => {
          const rdf = decodeURIComponent((tour.texts[id].metadata?.['Rdf-file_link'] || '').split('/').pop());
          const o = inventoryEntry(parseInt(rdf, 10));
          if (!o) return '';
          return `<li><a href="Object-page.html?no=${o.no}&tour=${encodeURIComponent(list.dataset.tourStrip)}" title="${String(i + 1).padStart(2, '0')} · ${o.title}">
            <figure class="duotone"><img src="${o.images[0]}" alt="" loading="lazy"></figure>
            <span class="visually-hidden">Stop ${i + 1}: ${o.title}</span></a></li>`;
        }).join('');
      });
    })
    .catch((err) => console.error('Could not load tour order:', err));
})();
