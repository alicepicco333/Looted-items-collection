// Leaflet "then → now" map used on the home page and the Atlas page:
// one point per place of origin, one square per holding city, an arc between them.
// Needs Leaflet and inventory.js.
//
//   const atlas = createAtlasMap(element, { onSelect: (no) => ... });
//   atlas.highlight(5);   // emphasise object 005's route (null clears)

function createAtlasMap(el, { onSelect, bounds = [[-45, -160], [66, 178]] } = {}) {
  if (!el || !window.L) return null;

  const map = L.map(el, {
    zoomSnap: 0.25,
    minZoom: 1,
    maxBounds: [[-75, -200], [85, 200]],
    worldCopyJump: false,
    scrollWheelZoom: false, // don't trap page scrolling; zoom with the buttons or a pinch
    attributionControl: false,
  });
  map.fitBounds(bounds);

  let countries = null;
  function styleCountries() {
    if (!countries) return;
    const css = getComputedStyle(document.documentElement);
    countries.setStyle({
      fillColor: css.getPropertyValue('--bg-raised').trim(),
      fillOpacity: 1,
      color: css.getPropertyValue('--fg').trim(),
      weight: 0.6,
      opacity: 0.45,
    });
  }
  fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
    .then((r) => r.json())
    .then((data) => {
      countries = L.geoJSON(data, { interactive: false }).addTo(map);
      countries.bringToBack();
      styleCountries();
    })
    .catch((err) => console.error('Could not load country outlines:', err));
  document.addEventListener('themechange', styleCountries);

  // curved line between two points: a quadratic Bézier bent to the side
  function arc(from, to, steps = 48) {
    const [lat1, lng1] = from;
    const [lat2, lng2] = to;
    const ctrl = [(lat1 + lat2) / 2 + (lng2 - lng1) * 0.22, (lng1 + lng2) / 2 - (lat2 - lat1) * 0.22];
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
      pts.push([a * lat1 + b * ctrl[0] + c * lat2, a * lng1 + b * ctrl[1] + c * lng2]);
    }
    return pts;
  }

  const icon = (cls) => L.divIcon({ className: cls, iconSize: [12, 12], iconAnchor: [6, 6] });
  const arcs = {};
  const origins = {};
  const holders = new Set();

  INVENTORY.forEach((o) => {
    const label = `${pad3(o.no)} ${o.title}`;
    const origin = L.marker(o.from.coords, { icon: icon('atlas-origin'), title: `${label}: taken from ${o.from.label}`, keyboard: true }).addTo(map);
    origin.bindTooltip(`${label}<br>from ${o.from.label}<br>${o.returned ? `held in ${o.to.label}<br>${o.returned}` : `now ${o.to ? o.to.label : 'in various museums'}`}`, { className: 'atlas-tip', direction: 'top', offset: [0, -8] });
    origin.on('mouseover focus', () => highlight(o.no));
    origin.on('mouseout blur', () => highlight(null));
    if (onSelect) origin.on('click keypress', () => onSelect(o.no));
    origins[o.no] = origin;

    if (!o.to || o.to.coords.join() === o.from.coords.join()) return; // no single destination, or never left
    arcs[o.no] = L.polyline(arc(o.from.coords, o.to.coords), { className: `atlas-arc${o.returned ? ' is-returned' : ''}`, weight: 1.5, interactive: false }).addTo(map);

    if (!holders.has(o.to.label)) {
      holders.add(o.to.label);
      const here = INVENTORY.filter((x) => x.to && x.to.label === o.to.label);
      const held = here.map((x) => `${pad3(x.no)} ${x.title}${x.returned ? ' <i>(since returned)</i>' : ''}`);
      // a city whose objects have all gone back is a former holder: hollow square
      const former = here.every((x) => x.returned);
      L.marker(o.to.coords, { icon: icon(`atlas-holder${former ? ' is-former' : ''}`), title: `${former ? 'Formerly held in' : 'Held in'} ${o.to.label}`, keyboard: true })
        .addTo(map)
        .bindTooltip(`<b>${o.to.label}</b><br>${held.join('<br>')}`, { className: 'atlas-tip', direction: 'top', offset: [0, -8] });
    }
  });

  function highlight(no) {
    Object.entries(arcs).forEach(([n, line]) => {
      const el = line.getElement();
      if (!el) return;
      el.classList.toggle('is-active', Number(n) === no);
      el.classList.toggle('is-dimmed', no !== null && Number(n) !== no);
    });
    Object.entries(origins).forEach(([n, m]) => {
      const el = m.getElement();
      if (el) el.classList.toggle('is-active', Number(n) === no);
    });
  }

  return { map, highlight };
}
