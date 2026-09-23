// Collection page: every object as a card grid or an index table, filterable
// by region. Data from inventory.js; each entry opens Object-page.html?no=N.

(function collection() {
  const grid = document.getElementById('collection-grid');
  const table = document.getElementById('collection-table');
  const count = document.getElementById('collection-count');
  let region = 'All';
  let view = localStorage.getItem('collectionView') || 'grid';

  const link = (o) => `Object-page.html?no=${o.no}`;
  const held = (o) => (o.to ? o.to.label : 'Various museums');

  grid.innerHTML = INVENTORY.map((o) => `
    <li class="card" data-region="${o.region}" data-reveal>
      <a href="${link(o)}">
        <figure class="duotone card__image"><img src="${o.images[0]}" alt="" loading="lazy"></figure>
        <p class="card__meta mono"><span>${pad3(o.no)}</span><span>R${o.room}</span></p>
        <h2 class="card__title">${o.title}</h2>
        <p class="card__route mono">${o.from.label} <span aria-hidden="true">→</span><span class="visually-hidden">, now in</span> ${held(o)}</p>
        ${o.how ? `<p class="card__how">${o.how.label}</p>` : ''}
        ${o.returned ? `<p class="card__returned mono">${o.returned}</p>` : ''}
      </a>
    </li>`).join('');

  table.querySelector('tbody').innerHTML = INVENTORY.map((o) => `
    <tr data-region="${o.region}">
      <td class="mono">${pad3(o.no)}</td>
      <th scope="row"><a href="${link(o)}">${o.title}</a></th>
      <td>${o.from.label}${o.how ? `<br><span class="card__how">${o.how.label}</span>` : ''}</td>
      <td>${held(o)}${o.returned ? `<br><span class="mono returned">${o.returned}</span>` : ''}</td>
      <td class="mono">R${o.room} · ${ROOMS[o.room]}</td>
    </tr>`).join('');

  function update() {
    let shown = 0;
    document.querySelectorAll('[data-region]').forEach((el) => {
      const match = region === 'All' || el.dataset.region === region;
      el.hidden = !match;
      if (match && el.tagName === 'LI') shown++;
    });
    count.textContent = `${String(shown).padStart(2, '0')} / ${INVENTORY.length} objects`;
    grid.hidden = view !== 'grid';
    table.hidden = view !== 'table';
    document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === region)));
    document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  }

  document.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => { region = b.dataset.filter; update(); }));
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    view = b.dataset.view;
    try { localStorage.setItem('collectionView', view); } catch (e) {}
    update();
  }));

  // cards are added after site.js looked for [data-reveal], so show them here
  requestAnimationFrame(() => grid.querySelectorAll('[data-reveal]').forEach((el, i) => {
    el.style.setProperty('--delay', `${(i % 4) * 0.06}s`);
    el.classList.add('is-visible');
  }));

  update();
})();
