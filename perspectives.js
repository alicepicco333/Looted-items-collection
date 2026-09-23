// Object page: "Perspectives" section.
//  1. Two sides: the community / state of origin and the holding institution,
//     with the current status and the sources they come from (perspectives.json).
//  2. Three tours, three readings: how each tour of the archive tells the same
//     object (tour-data.json), so the visitor can compare the framings.

const Perspectives = {
  data: null,

  async load() {
    try {
      const response = await fetch('perspectives.json');
      if (response.ok) this.data = await response.json();
    } catch (error) {
      console.error('Could not load perspectives.json:', error);
    }
  },

  // no: inventory number; tours: the whole tour-data.json; current: { tourName, complexity }
  render(no, tours, current) {
    const section = document.getElementById('perspectives');
    if (!section) return;
    const entry = this.data && this.data.objects[String(no)];
    section.hidden = !entry;
    if (!entry) return;

    const el = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text) node.textContent = text;
      return node;
    };
    const sourceList = (sources) => {
      const list = el('ul', 'sources mono');
      sources.forEach((s) => {
        const li = el('li');
        const a = el('a', '', s.title);
        a.href = s.url;
        a.target = '_blank';
        a.rel = 'noopener';
        li.appendChild(a);
        list.appendChild(li);
      });
      return list;
    };

    // returned objects: the label's stamp says so instead of "Removed from ..."
    const stamp = document.getElementById('object-stamp');
    if (stamp && entry.status.kind === 'returned') stamp.textContent = entry.status.label;

    // status
    const status = document.getElementById('persp-status');
    status.innerHTML = '';
    status.dataset.kind = entry.status.kind;
    status.appendChild(el('p', 'stamp persp-status__stamp', entry.status.label));
    status.appendChild(el('p', 'persp-status__text', entry.status.text));
    status.appendChild(sourceList(entry.status.sources));

    // two sides
    const voices = document.getElementById('persp-voices');
    voices.innerHTML = '';
    [['origin', 'Where it comes from'], ['holder', 'Where it is held']].forEach(([key, label]) => {
      const v = entry[key];
      if (!v) return;
      const col = el('article', `voice voice--${key}`);
      col.appendChild(el('p', 'voice__label mono', label));
      col.appendChild(el('h3', 'voice__name', v.voice));
      v.text.forEach((t) => col.appendChild(el('p', '', t)));
      const details = el('details', 'voice__sources');
      details.appendChild(el('summary', 'mono', `Sources (${v.sources.length})`));
      details.appendChild(sourceList(v.sources));
      col.appendChild(details);
      voices.appendChild(col);
    });
    voices.classList.toggle('is-single', !entry.holder);

    // three tours, three readings
    const readings = document.getElementById('persp-tours');
    readings.innerHTML = '';
    const complexity = current.complexity || 'basic';
    Object.entries(tours).forEach(([tourName, tour]) => {
      const itemId = tour.items.find((id) => objectNo(tour.texts[id]) === no);
      if (!itemId) return;
      const item = tour.texts[itemId];
      const card = el('article', `reading${tourName === current.tourName ? ' is-current' : ''}`);
      card.appendChild(el('p', 'reading__tour mono', `${tourName}${tourName === current.tourName ? ' · you are here' : ''}`));
      card.appendChild(el('p', 'reading__text', item[complexity]?.short || item.basic?.short || ''));
      if (tourName !== current.tourName) {
        const link = el('a', 'reading__link mono', 'Read it in this tour →');
        link.href = `Object-page.html?no=${no}&tour=${encodeURIComponent(tourName)}`;
        card.appendChild(link);
      }
      readings.appendChild(card);
    });

    document.getElementById('persp-note').textContent = this.data.note;
  },
};

window.Perspectives = Perspectives;
