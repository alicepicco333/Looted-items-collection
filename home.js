// Home page: inventory strip, object marquee and the then → now atlas (Leaflet).
// Needs inventory.js, Leaflet and atlas-map.js.

// ---------- inventory strip (hero) ----------

(function strip() {
  const list = document.getElementById('hero-strip');
  if (!list) return;
  list.innerHTML = INVENTORY.map((o, i) => `
    <li style="--i: ${i}">
      <a href="Object-page.html?no=${o.no}" aria-label="${pad3(o.no)} ${o.title}">
        <figure class="duotone"><img src="${o.images[0]}" alt="" loading="eager"></figure>
        <span class="mono">${pad3(o.no)}</span>
      </a>
    </li>`).join('');
})();

// ---------- marquee ----------

(function marquee() {
  const band = document.querySelector('.marquee');
  if (!band) return;
  const item = (o) =>
    `<span class="marquee__item"><span class="mono">${pad3(o.no)}</span>${o.title} · ${o.from.label.split(',')[0]} → ${o.to ? o.to.label.split(',')[0] : 'various museums'}</span>`;
  const html = INVENTORY.map(item).join('');
  // two identical tracks so the loop is seamless
  band.querySelectorAll('.marquee__track').forEach((track) => { track.innerHTML = html; });

  const toggle = band.querySelector('.marquee__toggle');
  toggle.addEventListener('click', () => {
    const paused = band.classList.toggle('is-paused');
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', paused ? 'Play the moving list of objects' : 'Pause the moving list of objects');
    toggle.setAttribute('aria-pressed', String(paused));
  });
})();

// ---------- atlas (shared with atlas.html, see atlas-map.js) ----------

createAtlasMap(document.getElementById('atlas-map'), {
  onSelect: (no) => { window.location.href = `Object-page.html?no=${no}`; },
});
