// The 30 objects as a numbered inventory, for the home page marquee and atlas.
// no = the number the RDF/metadata files already use (1_Africa_Benin_Bronzes...).
// "from"/"to" follow the Then/Now captions in tour-data.json; origin coordinates
// come from the original home page map, destinations are city centres.
// Nok terracottas are held by various museums, so they have no single destination.
// images: the object's photos in images/, used for the object page gallery.
// region: the continent of the place it was taken from, as in the Geo Tour titles.
// from.label: "place (historical polity), present-day country"; the present-day country locates
// the place and is not a statement about who the heritage belongs to.
// how: how the object left (kind: war, treaty, permit, excavation, colonial, contact, conquest,
// sale, gift, trade) and a one-line factual label shown on the object page and the collection.
// returned: set when the object has since gone back (see perspectives.json); "to" is then
// where it was held before its return, as in the tour captions.
// floor/pin: floor (1 or 2) and position on that floor's plan (maps["museum-floor"] and
// maps["museum-pin"] in tour-data.json).

const PLACES = {
  london: { label: "London, UK", coords: [51.5074, -0.1278] },
  birmingham: { label: "Birmingham, UK", coords: [52.4862, -1.8904] },
  paris: { label: "Paris, France", coords: [48.8566, 2.3522] },
  newHaven: { label: "New Haven, USA", coords: [41.3083, -72.9279] },
  berlin: { label: "Berlin, Germany", coords: [52.52, 13.405] },
  potsdam: { label: "Potsdam, Germany", coords: [52.3906, 13.0645] },
  gothenburg: { label: "Gothenburg, Sweden", coords: [57.7089, 11.9746] },
  wellington: { label: "Wellington, New Zealand", coords: [-41.2865, 174.7762] },
  vienna: { label: "Vienna, Austria", coords: [48.2082, 16.3738] },
  madrid: { label: "Madrid, Spain", coords: [40.4168, -3.7038] },
  venice: { label: "Venice, Italy", coords: [45.4343, 12.3388] },
  altaussee: { label: "Altaussee, Austria", coords: [47.638, 13.766] },
  moscow: { label: "Moscow, Russia", coords: [55.7558, 37.6173] },
  stockholm: { label: "Stockholm, Sweden", coords: [59.3293, 18.0686] },
};

const INVENTORY = [
  { no: 1, region: 'Africa', title: "Benin Bronzes", room: 5, floor: 1, pin: [722, 312], from: { label: "Benin City (Kingdom of Benin), Nigeria", coords: [6.3392, 5.6173] }, to: PLACES.london, how: { kind: 'war', label: "Seized in the British attack on Benin City, 1897" }, images: ['images/cropped-benin1.jpg', 'images/cropped-benin2.jpg', 'images/cropped-benin3.jpeg', 'images/cropped-benin4.jpg'] },
  { no: 2, region: 'Asia', title: "Koh-i-Noor Diamond", room: 2, floor: 1, pin: [298, 141], from: { label: "Lahore (Sikh Empire), Pakistan", coords: [31.5885, 74.3106] }, to: PLACES.london, how: { kind: 'treaty', label: "Surrendered under the Treaty of Lahore after the Anglo-Sikh war, 1849" }, images: ['images/cropped-koh-diamond2.jpg', 'images/cropped-koh-diamond3.jpg', 'images/cropped-koh-diamond.jpg'] },
  { no: 3, region: 'Asia', title: "Old Summer Palace Artefacts", room: 4, floor: 1, pin: [440, 385], from: { label: "Yuanmingyuan, Beijing (Qing China), China", coords: [40.0079, 116.2984] }, to: PLACES.london, how: { kind: 'war', label: "Looted by British and French troops, 1860" }, images: ['images/cropped-summerpalace1.jpg', 'images/cropped-summerpalace2.jpg', 'images/cropped-summerpalace3.jpg', 'images/cropped-summerpalace4.jpg'] },
  { no: 4, region: 'Asia', title: "Sultanganj Buddha", room: 3, floor: 1, pin: [390, 171], from: { label: "Sultanganj, Bihar, India", coords: [25.2468, 86.7365] }, to: PLACES.birmingham, how: { kind: 'colonial', label: "Removed by a British railway engineer, 1861–1862" }, images: ['images/cropped-buddha1.jpg', 'images/cropped-buddha2.jpg', 'images/cropped-buddha3.jpg'] },
  { no: 5, region: 'Europe', title: "Parthenon Marbles", room: 1, floor: 1, pin: [110, 506], from: { label: "Acropolis, Athens (Ottoman Greece), Greece", coords: [37.9715, 23.7267] }, to: PLACES.london, how: { kind: 'permit', label: "Removed by Lord Elgin's agents under a disputed Ottoman permit, 1801–1812" }, images: ['images/cropped-parthenon1.jpg', 'images/cropped-parthenon2.jpeg', 'images/cropped-parthenon3.jpg'] },
  { no: 6, region: 'Asia', title: "Beijing Observatory Instruments", room: 7, floor: 1, pin: [520, 495], from: { label: "Beijing Ancient Observatory (Qing China), China", coords: [39.9057, 116.428] }, to: PLACES.potsdam, returned: 'Returned 1902 (France) and 1921 (Germany)', how: { kind: 'war', label: "Seized by French and German troops, 1900" }, images: ['images/obj06-observatory-1.jpg', 'images/obj06-observatory-2.jpg', 'images/obj06-observatory-3.jpg'] },
  { no: 7, region: 'Oceania', title: "Hoa Hakananai’a (Moai)", room: 6, floor: 1, pin: [620, 150], from: { label: "Orongo, Rapa Nui (Chile)", coords: [-27.1127, -109.3497] }, to: PLACES.london, how: { kind: 'colonial', label: "Taken by the crew of HMS Topaze, 1868" }, images: ['images/cropped-moaistatues1.jpg', 'images/cropped-moaistatues2.jpg'] },
  { no: 8, region: 'Africa', title: "Throne of King Glele", room: 2, floor: 1, pin: [231, 218], from: { label: "Abomey (Kingdom of Dahomey), Benin", coords: [7.1826, 1.9912] }, to: PLACES.paris, returned: 'Returned to Benin in 2021', how: { kind: 'war', label: "Seized by French troops in the conquest of Dahomey, 1892" }, images: ['images/cropped-throne1.jpg', 'images/cropped-throne2.jpg', 'images/cropped-throne3.jpg'] },
  { no: 9, region: 'Americas', title: "Machu Picchu Artefacts", room: 4, floor: 1, pin: [610, 385], from: { label: "Machu Picchu, Cusco region, Peru", coords: [-13.1631, -72.545] }, to: PLACES.newHaven, returned: 'Returned to Peru in 2011–2012', how: { kind: 'excavation', label: "Excavated by Yale expeditions and exported as a loan, 1912–1916" }, images: ['images/cropped-machu_picchu1.jpg', 'images/cropped-machu_picchu3.jpg'] },
  { no: 10, region: 'Africa', title: "Nok Terracottas", room: 1, floor: 1, pin: [140, 420], from: { label: "Nok culture sites, Kaduna State, Nigeria", coords: [10.5105, 7.4165] }, to: null, how: { kind: 'trade', label: "Dug up illegally and sold abroad, above all from the 1990s" }, images: ['images/cropped-nok1.jpg', 'images/cropped-nok2.jpg', 'images/cropped-nok3.jpg'] },
  { no: 11, region: 'Asia', title: "Achaemenid Reliefs", room: 6, floor: 1, pin: [720, 150], from: { label: "Persepolis, Fars, Iran", coords: [29.9359, 52.8916] }, to: PLACES.london, how: { kind: 'trade', label: "Taken by European diplomats and travellers in the 19th century; others later looted and sold" }, images: ['images/achaemenid.jpg', 'images/achaemenid2.jpg', 'images/achaemenid3.jpg'] },
  { no: 12, region: 'Africa', title: "Bust of Nefertiti", room: 1, floor: 1, pin: [156, 171], from: { label: "Amarna, Egypt", coords: [27.6474, 30.9021] }, to: PLACES.berlin, how: { kind: 'excavation', label: "Excavated by a German team and exported in the division of finds, 1913" }, images: ['images/cropped-nefertiti1.jpg', 'images/cropped-nefertiti2.jpg', 'images/cropped-nefertiti3.jpg'] },
  { no: 13, region: 'Asia', title: "Altar of Pergamon", room: 1, floor: 1, pin: [106, 289], from: { label: "Pergamon (Bergama), Türkiye", coords: [39.1202, 27.1833] }, to: PLACES.berlin, how: { kind: 'excavation', label: "Excavated and shipped to Berlin under agreements with the Ottoman government, 1878–1886" }, images: ['images/cropped-pergamon1.jpg', 'images/cropped-pergamon2.jpg', 'images/cropped-pergamon3.jpg'] },
  { no: 14, region: 'Asia', title: "Tipu's Tiger", room: 2, floor: 1, pin: [300, 259], from: { label: "Srirangapatna (Kingdom of Mysore), India", coords: [12.4181, 76.6947] }, to: PLACES.london, how: { kind: 'war', label: "Looted by British troops after the fall of Srirangapatna, 1799" }, images: ['images/cropped-tiputiger1.jpg', 'images/cropped-tiputiger2.jpg', 'images/cropped-tiputiger3.jpg'] },
  { no: 15, region: 'Africa', title: "Mask of Queen Idia", room: 3, floor: 1, pin: [482, 244], from: { label: "Benin City (Kingdom of Benin), Nigeria", coords: [6.3392, 5.6173] }, to: PLACES.london, how: { kind: 'war', label: "Seized in the British attack on Benin City, 1897" }, images: ['images/cropped-maskqueen1.jpg', 'images/cropped-maskqueen2.jpg', 'images/cropped-maskqueen3.jpg'] },
  { no: 16, region: 'Africa', title: "Rosetta Stone", room: 9, floor: 2, pin: [120, 160], from: { label: "Rashid (Rosetta), Egypt", coords: [31.4044, 30.4164] }, to: PLACES.london, how: { kind: 'treaty', label: "Handed from the French to the British army under the Capitulation of Alexandria, 1801" }, images: ['images/obj16-rosetta-1.jpg', 'images/obj16-rosetta-2.jpg', 'images/obj16-rosetta-3.jpg'] },
  { no: 17, region: 'Africa', title: "Dendera Zodiac", room: 10, floor: 2, pin: [350, 150], from: { label: "Temple of Hathor, Dendera, Egypt", coords: [26.1417, 32.67] }, to: PLACES.paris, how: { kind: 'permit', label: "Cut out for a Paris collector under a permit from Muhammad Ali's government, 1820" }, images: ['images/obj17-dendera-1.jpg', 'images/obj17-dendera-2.jpg', 'images/obj17-dendera-3.jpg'] },
  { no: 18, region: 'Americas', title: "Paracas Textiles", room: 13, floor: 2, pin: [620, 420], from: { label: "Paracas peninsula, Ica, Peru", coords: [-13.83, -76.25] }, to: PLACES.gothenburg, returned: 'Returned to Peru 2014–2021', how: { kind: 'trade', label: "Exported illegally by the Swedish consul in Lima, 1930s" }, images: ['images/obj18-paracas-1.jpg', 'images/obj18-paracas-2.jpg', 'images/obj18-paracas-3.jpg'] },
  { no: 19, region: 'Africa', title: "Ngonnso'", room: 10, floor: 2, pin: [470, 250], from: { label: "Kumbo (Nso' kingdom), Cameroon", coords: [6.2167, 10.6833] }, to: PLACES.berlin, how: { kind: 'war', label: "Seized in a German colonial campaign, 1902" }, images: ['images/obj19-ngonnso-1.jpg'] },
  { no: 20, region: 'Asia', title: "Diamond Sutra", room: 9, floor: 2, pin: [220, 160], from: { label: "Mogao Caves, Dunhuang (Qing China), China", coords: [40.0425, 94.8042] }, to: PLACES.london, how: { kind: 'sale', label: "Sold by the caves' guardian to Aurel Stein for a small donation, 1907" }, images: ['images/obj20-diamond-sutra-1.jpg', 'images/obj20-diamond-sutra-2.jpg'] },
  { no: 21, region: 'Asia', title: "Oegyujanggak Uigwe", room: 9, floor: 2, pin: [120, 290], from: { label: "Ganghwa Island (Joseon Korea), South Korea", coords: [37.747, 126.487] }, to: PLACES.paris, returned: 'Returned to Korea in 2011 (renewable loan)', how: { kind: 'war', label: "Seized by French troops, 1866" }, images: ['images/obj21-uigwe-1.jpg', 'images/obj21-uigwe-2.jpg', 'images/obj21-uigwe-3.jpg'] },
  { no: 22, region: 'Asia', title: "Ishtar Gate", room: 10, floor: 2, pin: [450, 150], from: { label: "Babylon, Iraq", coords: [32.5364, 44.421] }, to: PLACES.berlin, how: { kind: 'excavation', label: "Excavated by a German team and shipped in a division of finds under the British mandate, 1926–1927" }, images: ['images/obj22-ishtar-1.jpg', 'images/obj22-ishtar-2.jpg', 'images/obj22-ishtar-3.jpg'] },
  { no: 23, region: 'Oceania', title: "Gweagal Shield", room: 12, floor: 2, pin: [120, 470], from: { label: "Kamay (Botany Bay), Gweagal country, Australia", coords: [-34.0045, 151.221] }, to: PLACES.london, how: { kind: 'contact', label: "Taken by James Cook's crew at first contact, 1770 (identification debated)" }, images: ['images/obj23-gweagal-2.jpg', 'images/obj23-gweagal-1.jpg', 'images/obj23-gweagal-3.jpg'] },
  { no: 24, region: 'Oceania', title: "Kalaniʻōpuʻu's Cloak and Helmet", room: 12, floor: 2, pin: [220, 470], from: { label: "Kealakekua Bay, Hawaiʻi (USA)", coords: [19.475, -155.9214] }, to: PLACES.wellington, returned: 'Returned to Hawaiʻi in 2016, permanently in 2020', how: { kind: 'gift', label: "Given to James Cook, 1779, then sold between collectors" }, images: ['images/obj24-kalaniopuu-1.jpg', 'images/obj24-kalaniopuu-2.jpg'] },
  { no: 25, region: 'Americas', title: "Moctezuma's Headdress", room: 13, floor: 2, pin: [380, 420], from: { label: "Tenochtitlan (Aztec Empire), Mexico", coords: [19.4326, -99.1332] }, to: PLACES.vienna, how: { kind: 'conquest', label: "Sent to Europe after the Spanish conquest; route unknown" }, images: ['images/obj25-penacho-1.jpg', 'images/obj25-penacho-2.jpg'] },
  { no: 26, region: 'Americas', title: "Quimbaya Treasure", room: 13, floor: 2, pin: [500, 420], from: { label: "Filandia, Quindío, Colombia", coords: [4.675, -75.6583] }, to: PLACES.madrid, how: { kind: 'gift', label: "Given by Colombia's president to the Spanish queen regent, 1893" }, images: ['images/obj26-quimbaya-1.jpg', 'images/obj26-quimbaya-2.jpg', 'images/obj26-quimbaya-3.jpg'] },
  { no: 27, region: 'Europe', title: "Horses of Saint Mark", room: 11, floor: 2, pin: [620, 190], from: { label: "Constantinople (Byzantine Empire), Türkiye", coords: [41.0082, 28.9784] }, to: PLACES.venice, how: { kind: 'war', label: "Seized by Venice in 1204 and by Napoleon in 1797" }, images: ['images/obj27-saint-mark-horses-1.jpg', 'images/obj27-saint-mark-horses-2.jpg', 'images/obj27-saint-mark-horses-3.jpg'] },
  { no: 28, region: 'Europe', title: "Ghent Altarpiece", room: 10, floor: 2, pin: [350, 250], from: { label: "Ghent, Belgium", coords: [51.053, 3.7275] }, to: PLACES.altaussee, returned: 'Returned to Ghent in 1945', how: { kind: 'war', label: "Seized by revolutionary France, sold, stolen and seized by Nazi Germany, 1794–1942" }, images: ['images/obj28-ghent-1.jpg', 'images/obj28-ghent-2.jpg', 'images/obj28-ghent-3.jpg'] },
  { no: 29, region: 'Asia', title: "Priam's Treasure", room: 11, floor: 2, pin: [720, 190], from: { label: "Troy (Hisarlık, Ottoman Empire), Türkiye", coords: [39.9575, 26.2389] }, to: PLACES.moscow, how: { kind: 'war', label: "Smuggled out of the Ottoman Empire, 1873; seized by the Red Army, 1945" }, images: ['images/obj29-priam-1.jpg', 'images/obj29-priam-2.jpg', 'images/obj29-priam-3.jpg'] },
  { no: 30, region: 'Europe', title: "Codex Gigas", room: 9, floor: 2, pin: [220, 290], from: { label: "Prague Castle (Kingdom of Bohemia), Czechia", coords: [50.0755, 14.4378] }, to: PLACES.stockholm, how: { kind: 'war', label: "Seized by the Swedish army at the end of the Thirty Years' War, 1648" }, images: ['images/obj30-codex-gigas-1.jpg', 'images/obj30-codex-gigas-2.jpg', 'images/obj30-codex-gigas-3.jpg'] },
];

// Museum rooms, as named in the documentation (room 8 has no objects).
// Rooms 1-8 are on the first floor, 9-13 on the second.
const ROOMS = {
  1: "Ancient Civilizations",
  2: "Royal Treasures",
  3: "Religious and Spiritual Objects",
  4: "Cities and Palaces",
  5: "Royal Workshops",
  6: "Monumental Sculptures",
  7: "Scientific and Technological Achievements",
  8: "—",
  9: "Writing and Knowledge",
  10: "Sacred Places and Images",
  11: "Trophies of War",
  12: "Gifts and Seizures",
  13: "Feather, Gold and Cloth",
};

const pad3 = (n) => String(n).padStart(3, '0');

// ---------- museum floors ----------
// The floor plans (object page, atlas) hold one <g class="museum-floor" data-floor="n">
// per floor and a .floor-switch whose data-for is the SVG's id. setupFloors() wires the
// switch and returns show(floor); onChange(floor) runs when the visitor switches.
function setupFloors(svg, onChange) {
  if (!svg) return () => {};
  const tabs = [...document.querySelectorAll(`.floor-switch[data-for="${svg.id}"] [data-floor]`)];
  function show(floor) {
    floor = String(floor || 1);
    // SVG elements have no .hidden property, so the attribute is set directly
    svg.querySelectorAll('.museum-floor').forEach((g) => g.toggleAttribute('hidden', g.dataset.floor !== floor));
    tabs.forEach((t) => {
      const on = t.dataset.floor === floor;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    svg.dataset.floor = floor;
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { show(t.dataset.floor); onChange?.(Number(t.dataset.floor)); });
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); next.click();
    });
  });
  return show;
}

const inventoryEntry = (no) => INVENTORY.find((o) => o.no === no);

// ---------- world map (inline SVG on the object and atlas pages) ----------
// Same equirectangular projection used to draw the land path: viewBox 0 0 1000 394,
// longitude -180..180, latitude 84..-58.
const WORLD = { width: 1000, height: 394, top: 84, bottom: -58 };

function projectWorld([lat, lng]) {
  return [
    ((lng + 180) / 360) * WORLD.width,
    ((WORLD.top - Math.max(Math.min(lat, WORLD.top), WORLD.bottom)) / (WORLD.top - WORLD.bottom)) * WORLD.height,
  ];
}

// Moves the pins, draws the arc and zooms the map to one object's journey.
// svg: the <svg class="geo-map"> element; entry: an INVENTORY item.
function renderGeoMap(svg, entry) {
  if (!svg) return;
  svg.geoEntry = entry; // remembered so the zoom can be redone on resize
  const from = svg.querySelector('.geo-map-from');
  const to = svg.querySelector('.geo-map-to');
  const arcPath = svg.querySelector('.geo-map-arc');
  const [fromLabel, toLabel] = svg.querySelectorAll('.geo-map-label');
  if (!entry) {
    svg.setAttribute('viewBox', `0 0 ${WORLD.width} ${WORLD.height}`);
    [from, to, arcPath, fromLabel, toLabel].forEach((el) => el && el.setAttribute('visibility', 'hidden'));
    return;
  }

  const a = projectWorld(entry.from.coords);
  const stayed = entry.to && entry.to.coords.join() === entry.from.coords.join();
  const b = entry.to && !stayed ? projectWorld(entry.to.coords) : null;

  // zoom: fit both points with padding, keeping the map's proportions
  const xs = [a[0], ...(b ? [b[0]] : [])];
  const ys = [a[1], ...(b ? [b[1]] : [])];
  const box = svg.getBoundingClientRect();
  const ratio = box.width && box.height ? box.width / box.height : WORLD.width / WORLD.height;
  let w = Math.max(260, (Math.max(...xs) - Math.min(...xs)) * 1.5 + 120);
  let h = w / ratio;
  const spanY = (Math.max(...ys) - Math.min(...ys)) * 1.5 + 80;
  if (spanY > h) { h = spanY; w = h * ratio; }
  // never zoom out past the whole world (keeping the element's proportions)
  if (h > WORLD.height) { h = WORLD.height; w = h * ratio; }
  if (w > WORLD.width) { w = WORLD.width; h = w / ratio; }
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const x = Math.max(0, Math.min(cx - w / 2, WORLD.width - w));
  const y = Math.max(0, Math.min(cy - h / 2, WORLD.height - h));
  svg.setAttribute('viewBox', `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);

  // markers keep the same on-screen size whatever the zoom (1 unit = 1 screen pixel)
  const k = w / (box.width || WORLD.width);
  const place = (el, [px, py]) => { el.setAttribute('transform', `translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${k.toFixed(3)})`); el.setAttribute('visibility', 'visible'); };
  place(from, a);
  fromLabel.textContent = entry.from.label;
  place(fromLabel, a);
  if (b) {
    place(to, b);
    toLabel.textContent = entry.to.label;
    place(toLabel, b);
    // quadratic arc bent to one side, like the home page atlas
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const c = [mx - (b[1] - a[1]) * 0.25, my + (b[0] - a[0]) * 0.25];
    arcPath.setAttribute('d', `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
    arcPath.setAttribute('visibility', 'visible');
  } else {
    [to, toLabel, arcPath].forEach((el) => el.setAttribute('visibility', 'hidden'));
  }
}

// the zoom depends on the map's on-screen proportions: redo it when they change
let geoResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(geoResizeTimer);
  geoResizeTimer = setTimeout(() => {
    document.querySelectorAll('.geo-map').forEach((svg) => { if ('geoEntry' in svg) renderGeoMap(svg, svg.geoEntry); });
  }, 150);
});
