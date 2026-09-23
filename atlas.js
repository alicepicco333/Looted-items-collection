// Atlas page: the world map (atlas-map.js) with a list of the 30 objects, and the
// museum floor plans (two floors) with every object's marker, grouped by room.
// Hovering or focusing an object anywhere highlights it on both maps.

(function atlasPage() {
  const list = document.getElementById('atlas-list');
  const rooms = document.getElementById('room-list');
  const markers = document.getElementById('floor-markers');
  const held = (o) => (o.to ? o.to.label : 'Various museums');

  const world = createAtlasMap(document.getElementById('atlas-map'), {
    bounds: [[-45, -160], [66, 178]],
    onSelect: (no) => { window.location.href = `Object-page.html?no=${no}`; },
  });

  // world: object list
  list.innerHTML = INVENTORY.map((o) => `
    <li><a href="Object-page.html?no=${o.no}" data-no="${o.no}">
      <span class="mono">${pad3(o.no)}</span>
      <span class="atlas-list__title">${o.title}</span>
      <span class="atlas-list__route mono">${o.from.label.split(',')[0]} → ${held(o).split(',')[0]}</span>
      ${o.returned ? `<span class="atlas-list__route mono returned">${o.returned}</span>` : ''}
    </a></li>`).join('');

  // museum: one numbered marker per object, at the head of its pin, on its floor
  const plan = document.getElementById('floor-plan');
  const svgNS = 'http://www.w3.org/2000/svg';
  const showMarkers = (floor) => markers.querySelectorAll('a').forEach((a) => a.toggleAttribute('hidden', a.dataset.floor !== String(floor)));
  const showFloor = setupFloors(plan, showMarkers);
  INVENTORY.forEach((o) => {
    const a = document.createElementNS(svgNS, 'a');
    a.setAttribute('href', `Object-page.html?no=${o.no}`);
    a.setAttribute('data-no', o.no);
    a.setAttribute('data-floor', o.floor);
    a.setAttribute('aria-label', `${pad3(o.no)} ${o.title}, floor ${o.floor}, room ${o.room}`);
    a.innerHTML = `<g class="floor-marker" transform="translate(${o.pin[0]} ${o.pin[1] + 21})">
      <circle r="17"/><text dy="5">${o.no}</text></g>`;
    markers.appendChild(a);
  });
  showFloor(1);
  showMarkers(1);

  // museum: rooms with their objects
  const byRoom = {};
  INVENTORY.forEach((o) => (byRoom[o.room] ??= []).push(o));
  rooms.innerHTML = Object.keys(ROOMS).filter((r) => byRoom[r]).map((r) => `
    <li${r === '9' ? ' class="room-list__floor"' : ''}>
      ${r === '1' || r === '9' ? `<p class="room-list__floor-label mono">Floor ${r === '1' ? 1 : 2}</p>` : ''}
      <h3><span class="mono">R${r}</span> ${ROOMS[r]}</h3>
      <ul>${byRoom[r].map((o) => `<li><a href="Object-page.html?no=${o.no}" data-no="${o.no}"><span class="mono">${pad3(o.no)}</span> ${o.title}</a></li>`).join('')}</ul>
    </li>`).join('');

  // shared highlight across the list, the room list and both maps
  function highlight(no) {
    // an object on the other floor brings its floor into view
    const o = no && inventoryEntry(no);
    if (o && plan.dataset.floor !== String(o.floor)) { showFloor(o.floor); showMarkers(o.floor); }
    document.querySelectorAll('[data-no]').forEach((el) => el.classList.toggle('is-active', Number(el.dataset.no) === no));
    if (world) world.highlight(no);
  }
  document.querySelectorAll('[data-no]').forEach((el) => {
    const no = Number(el.dataset.no);
    el.addEventListener('mouseenter', () => highlight(no));
    el.addEventListener('focus', () => highlight(no));
    el.addEventListener('mouseleave', () => highlight(null));
    el.addEventListener('blur', () => highlight(null));
  });
})();
