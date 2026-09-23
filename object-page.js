
// Function to parse URL parameters
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        tour: params.get('tour'),
        no: params.get('no'),
        length: params.get('length'),
        complexity: params.get('complexity'),
    };
}


function getItemsFromLocalStorage() {
    const tourData = localStorage.getItem('tourData');
    if (!tourData) {
        return null;
    }
    return JSON.parse(tourData);
}

window.getItemsFromLocalStorage = getItemsFromLocalStorage;

// Museum map floors (setupFloors in inventory.js): the pin shows only on its own floor
const showMuseumFloor = setupFloors(document.getElementById('museum-map'), (floor) => {
  const pin = document.getElementById('museum-map-pin');
  if (pin && pin.getAttribute('transform')) pin.toggleAttribute('hidden', pin.dataset.floor !== String(floor));
});

async function loadTourContent() {
    const tourData = localStorage.getItem('tourData');
    if (!tourData) {
        return null;
    }
    const { tourName, length, complexity } = JSON.parse(tourData);
    if (!tourName || !length || !complexity) {
        document.getElementById('item-title').textContent = 'Invalid or Missing Selection';
        document.getElementById('item-text').textContent = 'Please return to the personalization page and make a selection.';
        return;
    }

    let data;
    try {
        const response = await fetch('tour-data.json');
        if (!response.ok) {
            throw new Error(`Failed to load tour data: ${response.status}`);
        }
        data = await response.json();
    } catch (error) {
        console.error('Error fetching tour data:', error);
        document.getElementById('item-title').textContent = 'Error Loading Data';
        document.getElementById('item-text').textContent = 'There was an error retrieving the tour data. Please try again later.';
        return;
    }

    try {

        if (!data[tourName]) {
            document.getElementById('item-title').textContent = 'Tour Not Found';
            document.getElementById('item-text').textContent = 'The selected tour is not available in our data.';
            return;
        }

        const tourDataObj = data[tourName];
        const items = tourDataObj.items || [];
        const texts = tourDataObj.texts || {};

        if (items.length === 0) {
            document.getElementById('item-title').textContent = 'No Items Found';
            document.getElementById('item-text').textContent = 'The selected tour does not have any items.';
            return;
        }

        let savedIndex = localStorage.getItem('currentIndex');
        let currentIndex = savedIndex !== null ? parseInt(savedIndex, 10) : 0;
        // Object-page.html?no=5 opens inventory number 5 (links from the home page and collection)
        const requestedNo = parseInt(getQueryParams().no, 10);
        if (requestedNo) {
            const found = items.findIndex((id) => objectNo(texts[id]) === requestedNo);
            if (found >= 0) {
                currentIndex = found;
                localStorage.setItem('currentIndex', currentIndex);
            }
        }
        document.getElementById('current-index').textContent = currentIndex;


        function displayItem(index, length, complexity) {
          const tourdataJson = localStorage.getItem('tourData');
          const tourdata = JSON.parse(tourdataJson);

          length = length || tourdata.length || 'short';
          complexity = complexity || tourdata.complexity || 'fun';

          const itemId = items[index];
          const itemData = texts[itemId];
          if (!itemData) {
              document.getElementById('item-title').textContent = 'Item Not Found';
              document.getElementById('item-text').textContent = 'The selected item could not be retrieved.';
              return;
          }

            // Translation from llm-data.json, if the visitor picked another language
            const translated = window.LLMContent?.tourTranslation(tourName, itemId, itemData);

            const [objectName, objectDate] = splitTitle(translated?.title || itemData.title || `Item ${index + 1}`);
            document.getElementById('item-title').textContent = objectName;
            document.getElementById('object-date').textContent = objectDate;
            const itemText = translated?.[complexity]?.[length] || itemData[complexity]?.[length] || 'No text available for this selection.';
            document.getElementById('item-text').textContent = itemText;
            // say when the text is a translation, and when it is a machine translation
            const note = document.getElementById('translation-note');
            if (note) {
              const ui = window.LLMContent?.ui() || {};
              const own = translated?.[complexity]?.[length];
              const machine = own && (translated.machine || []).includes(`${complexity}.${length}`);
              note.textContent = own ? (machine ? ui.machine : ui.translated) : '';
              note.hidden = !own;
            }
            document.title = `${itemData.title} · The Stolen Archive`;

            renderLabel(itemData, index, items.length, tourName, length, complexity);

            const entry = inventoryEntry(objectNo(itemData));
            renderGallery(itemData, entry);

            // The museum map is an inline SVG: only the pin moves between items
            const museumPin = document.getElementById('museum-map-pin');
            const museumMapTitle = document.getElementById('museum-map-title');
            const pin = itemData.maps && itemData.maps['museum-pin'];
            // two floors: show the object's floor; the pin is hidden when the visitor
            // switches to the other one
            const floor = itemData.maps?.['museum-floor'] || entry?.floor || 1;
            showMuseumFloor(floor);
            if (museumPin) {
              museumPin.dataset.floor = floor;
              museumPin.toggleAttribute('hidden', !pin);
              if (pin) museumPin.setAttribute('transform', `translate(${pin.x} ${pin.y})`);
            }
            if (museumMapTitle) {
              museumMapTitle.textContent = `Museum map${itemData.maps && itemData.maps['caption-1'] ? ': ' + itemData.maps['caption-1'] : ''}`;
            }

            const textMuseumMap = document.getElementById('text-museum-map');
            textMuseumMap.textContent = "";
            if (textMuseumMap && itemData.maps && itemData.maps['caption-1']) {
              textMuseumMap.textContent = translated?.['caption-1'] || itemData.maps['caption-1'];
            }

            // The world map is an inline SVG too: pins, arc and zoom come from inventory.js
            renderGeoMap(document.getElementById('geo-map'), entry);
            const geoTitle = document.getElementById('geo-map-title');
            if (geoTitle) geoTitle.textContent = `World map: ${itemData.maps?.['caption-2'] || ''}`;

          const textGeoMap = document.getElementById('text-geo-map');
          textGeoMap.textContent = "";
          if (textGeoMap && itemData.maps && itemData.maps['caption-2']) {
            textGeoMap.textContent = translated?.['caption-2'] || itemData.maps['caption-2'];
          }

          // Alt text, "Go deeper" panel and then/now geodata from llm-data.json
          window.LLMContent?.render(itemData);

          // Two sides + how each tour tells this object (perspectives.js)
          window.Perspectives?.render(objectNo(itemData), data, { tourName, complexity });

            const rdfFileLinkElement = document.getElementById('rdf-text-link');
             if (rdfFileLinkElement && itemData.metadata && itemData.metadata['Rdf-file_link']) {
              rdfFileLinkElement.href = itemData.metadata['Rdf-file_link'];
          }

            // the 3D graph (graph3d.js); the PNG is the fallback without WebGL
            const rdfGraphImageElement = document.getElementById('graph-image_id');
            if (rdfGraphImageElement && itemData.metadata && itemData.metadata['Rdf-Graph_image']) {
              rdfGraphImageElement.src = itemData.metadata['Rdf-Graph_image'];
              rdfGraphImageElement.alt = `Graph for ${itemData.title}`;
            }
            const graphNo = objectNo(itemData);
            if (window.Graph3D) window.Graph3D.show(graphNo);
            else window.addEventListener('graph3d-ready', () => window.Graph3D.show(graphNo), { once: true });

          const TableMetadata = document.getElementById('table-metadata');
            if (TableMetadata && itemData.metadata && itemData.metadata['Table']) {
                const tableURL = itemData.metadata['Table'];

                fetch(tableURL)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.text();
                    })
                    .then(data => {
                        TableMetadata.innerHTML = data;
                    })
                    .catch(error => console.error('Error loading table:', error));
            } else if (TableMetadata) {
                TableMetadata.innerHTML = '<p>No table information available.</p>';
            }
        }

        await Promise.all([window.LLMContent?.load(), window.Perspectives?.load()]);
        displayItem(currentIndex, length, complexity);

        window.addEventListener('langchange', () => displayItem(currentIndex));

        document.getElementById('prev').addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                localStorage.setItem('currentIndex', currentIndex);
                displayItem(currentIndex);
            }
        });

        document.getElementById('next').addEventListener('click', () => {
            if (currentIndex < items.length - 1) {
                currentIndex++;
                localStorage.setItem('currentIndex', currentIndex);
                displayItem(currentIndex);
            }
        });

        document.querySelectorAll('[data-length]').forEach((button) => {
            button.addEventListener('click', () => {
                const { length, complexity } = setReading({ length: button.dataset.length });
                displayItem(currentIndex, length, complexity);
            });
        });

        document.querySelectorAll('[data-complexity]').forEach((button) => {
            button.addEventListener('click', () => {
                const { length, complexity } = setReading({ complexity: button.dataset.complexity });
                displayItem(currentIndex, length, complexity);
            });
        });

        document.querySelectorAll('[data-tour]').forEach((button) => {
            button.addEventListener('click', () => changeTour(button.dataset.tour, 'short', 'fun'));
        });

        // numbered strip: one button per object in the tour
        const strip = document.getElementById('object-strip');
        if (strip) {
            items.forEach((itemId, i) => {
                const li = document.createElement('li');
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = pad(i + 1);
                button.setAttribute('aria-label', `Object ${i + 1}: ${texts[itemId]?.title || ''}`);
                button.addEventListener('click', () => {
                    currentIndex = i;
                    localStorage.setItem('currentIndex', currentIndex);
                    displayItem(currentIndex);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                li.appendChild(button);
                strip.appendChild(li);
            });
            strip.children[currentIndex]?.querySelector('button').setAttribute('aria-current', 'true');
        }

    } catch (error) {
        console.error('Error loading tour data:', error);
        document.getElementById('item-title').textContent = 'Error Loading Data';
        document.getElementById('item-text').textContent = 'There was an error retrieving the tour data. Please try again later.';
    }
}

function changeTour(tourName, length, complexity) {
  localStorage.setItem('tourData', JSON.stringify({
      tourName: tourName,
      length: length,
      complexity: complexity
  }));
  localStorage.removeItem('currentIndex');
  location.reload();
}

// Saves a new length and/or complexity choice and returns the full selection
function setReading(change) {
  const tourdata = JSON.parse(localStorage.getItem('tourData'));
  Object.assign(tourdata, change);
  localStorage.setItem('tourData', JSON.stringify(tourdata));
  return { length: tourdata.length, complexity: tourdata.complexity };
}

const pad = (n, width = 2) => String(n).padStart(width, '0');

// Inventory number = the number the object's RDF file starts with (5_Europe_The_Parthenon...)
function objectNo(itemData) {
  const rdfName = decodeURIComponent((itemData.metadata?.['Rdf-file_link'] || '').split('/').pop());
  return parseInt(rdfName, 10) || null;
}

// Main photo + thumbnails: the tour's image first, then the object's other photos
// 3D scans (models/manifest.json), shown before the photos when an object has one
let models = null;
const modelsReady = fetch('models/manifest.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((m) => { models = m; });
const viewerReady = new Promise((resolve) => {
  if (window.Viewer3D) resolve();
  else window.addEventListener('viewer3d-ready', resolve, { once: true });
});

async function renderGallery(itemData, entry) {
  const main = document.getElementById('tour-image');
  const thumbs = document.getElementById('gallery-thumbs');
  const count = document.getElementById('gallery-count');
  const viewer = document.getElementById('viewer3d');
  const photos = [itemData.image, ...((entry && entry.images) || []).filter((src) => src !== itemData.image)].filter(Boolean);
  const title = splitTitle(itemData.title || '')[0];
  await modelsReady;
  const model = entry && models && models[entry.no];
  const token = (renderGallery.token = (renderGallery.token || 0) + 1);

  function show3d() {
    viewer.hidden = false;
    main.hidden = true;
    count.textContent = '3D';
    thumbs.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', String(j === 0)));
    renderCredit(model, true);
    viewerReady.then(() => { if (token === renderGallery.token) window.Viewer3D.show?.(model); });
  }

  function show(i) {
    if (viewer) viewer.hidden = true;
    main.hidden = false;
    main.classList.remove('is-shown');
    main.src = photos[i];
    const alt = window.LLMContent?.altFor(itemData, photos[i]);
    main.alt = alt ? alt.alt : `${title}, photo ${i + 1} of ${photos.length}`;
    main.title = alt ? alt.long_description : '';
    main.dataset.altSet = alt ? '1' : '';
    main.decode?.().catch(() => {}).finally(() => main.classList.add('is-shown'));
    count.textContent = `${pad(i + 1)} / ${pad(photos.length)}`;
    renderCredit(photos[i]);
    const offset = model ? 1 : 0;
    thumbs.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', String(i + offset === j)));
  }

  thumbs.innerHTML = '';
  if (model) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb-3d';
    button.textContent = '3D';
    button.setAttribute('aria-label', 'Show the 3D model');
    button.addEventListener('click', show3d);
    li.appendChild(button);
    thumbs.appendChild(li);
  }
  photos.forEach((src, i) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Show photo ${i + 1} of ${photos.length}`);
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    button.appendChild(img);
    button.addEventListener('click', () => show(i));
    li.appendChild(button);
    thumbs.appendChild(li);
  });
  thumbs.hidden = photos.length + (model ? 1 : 0) < 2;
  if (model && !window.Viewer3D?.unsupported) show3d();
  else show(0);
}

// Photo credits (author, licence, source) for the Wikimedia Commons photos, loaded once.
// Photos not listed (the project's original images) show no credit line.
let photoCredits = null;
const escHtml = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const creditsReady = fetch('images/credits.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((c) => { photoCredits = c; });

function renderCredit(src, is3d) {
  const el = document.getElementById('photo-credit');
  if (!el) return;
  const write = () => {
    const c = photoCredits && photoCredits[src];
    if (is3d) {
      // the 3D scan: what it shows, who made it, licence and source
      const m = src;
      el.hidden = false;
      const licence = m.license_url ? `<a href="${escHtml(m.license_url)}" target="_blank" rel="noopener">${escHtml(m.license)}</a>` : escHtml(m.license);
      el.innerHTML = `<em>${escHtml(m.shows)}${m.same_object ? '' : ' Not the object itself.'}</em>3D scan: ${escHtml(m.author)} · ${licence} · <a href="${escHtml(m.source)}" target="_blank" rel="noopener">source</a>`;
      const note = document.getElementById('viewer3d-note');
      if (note) note.innerHTML = m.same_object ? '<span>3D scan</span>' : '<span>3D scan</span> · a related piece, see below';
      return;
    }
    el.hidden = !c;
    if (!c) return;
    const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const licence = c.license_url ? `<a href="${esc(c.license_url)}" target="_blank" rel="noopener">${esc(c.license)}</a>` : esc(c.license);
    el.innerHTML = `${c.note ? `<em>${esc(c.note)}</em>` : ''}Photo: ${esc(c.author)} · ${licence} · <a href="${esc(c.source)}" target="_blank" rel="noopener">Wikimedia Commons</a>`;
  };
  if (photoCredits) write(); else creditsReady.then(write);
}

// "Parthenon Marbles – 447-438 BCE" -> ["Parthenon Marbles", "447-438 BCE"]
function splitTitle(title) {
  const m = title.trim().match(/^(.*?)\s+[–—-]\s+(.*\d.*)$/);
  return m ? [m[1], m[2]] : [title.trim(), ''];
}

// Museum label, stamp, big number, progress and control states for one item
function renderLabel(itemData, index, total, tourName, length, complexity) {
  const maps = itemData.maps || {};
  const inventoryNo = pad(objectNo(itemData) || index + 1, 3);
  // "Then: Athens (Greece) - Now: London, UK"
  const thenNow = (maps['caption-2'] || '').match(/Then:\s*(.*?)\s+-\s+Now:\s*(.*)/);
  // "Room 1 - Ancient Civilizations"
  const room = (maps['caption-1'] || '').match(/Room\s*(\d+)\s*-\s*(.*)/);

  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  set('object-no', inventoryNo);
  set('label-no', `No. ${inventoryNo}`);
  const entry = inventoryEntry(objectNo(itemData));
  set('label-from', entry ? entry.from.label : (thenNow ? thenNow[1] : '—'));
  set('label-to', thenNow ? thenNow[2] : '—');
  set('label-how', entry?.how ? entry.how.label : '—');
  set('label-room', room ? `R${room[1]} · ${room[2]}` : (maps['caption-1'] || '—'));
  set('object-stamp', thenNow ? `Removed from ${thenNow[1].split(' (')[0]}` : '');
  set('tour-name', tourName);
  set('tour-position', `${pad(index + 1)} / ${pad(total)}`);

  document.getElementById('prev').disabled = index === 0;
  document.getElementById('next').disabled = index === total - 1;

  const press = (selector, attr, value) => document.querySelectorAll(selector).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset[attr] === value)));
  press('[data-tour]', 'tour', tourName);
  press('[data-length]', 'length', length);
  press('[data-complexity]', 'complexity', complexity);
  document.querySelectorAll('#object-strip button').forEach((b, i) => {
    if (i === index) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
}

window.onload = async () => {
  const tourData = localStorage.getItem('tourData');

  if (!tourData) {
      localStorage.setItem('tourData', JSON.stringify({
          tourName: 'Timeline Tour',
          length: 'short',
          complexity: 'fun'
      }));
  }

  // ?tour=Geo%20Tour (and optional length / complexity) overrides the saved choice
  const params = getQueryParams();
  if (params.tour) {
      const saved = JSON.parse(localStorage.getItem('tourData'));
      localStorage.setItem('tourData', JSON.stringify({
          tourName: params.tour,
          length: params.length || saved.length || 'short',
          complexity: params.complexity || saved.complexity || 'fun'
      }));
  }

  await loadTourContent();
};
