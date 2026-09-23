// Object page: the RDF metadata as an interactive 3D graph (three.js, ES module from jsDelivr).
// graphs/NN.json is made from the object's RDF file by tools/rdf_graph_json.py, with the
// node positions already computed; this file only draws and navigates it.
//
// Nodes: the object (vermilion), resources (spheres in the theme colour), literal values
// (small cubes). Drag to rotate, scroll or pinch to zoom, as in the 3D object viewer; with the
// keyboard, arrow keys rotate and + / - zoom. Hover a node to see its name; select it to
// bring it to the centre and list its statements, whose neighbours can be selected in turn.
// Every statement is also listed as text below the graph.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const root = document.getElementById('graph3d');
const box = root?.querySelector('.graph3d__canvas');
const info = document.getElementById('graph3d-info');
const list = document.getElementById('graph3d-list');
const count = document.getElementById('graph3d-count');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const short = (t, n = 34) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

function webgl() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

if (root && box && webgl()) init();
else if (root) {
  root.classList.add('is-unsupported');
  window.Graph3D = { unsupported: true, show: () => {} };
  window.dispatchEvent(new Event('graph3d-ready'));
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  box.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
  const START = new THREE.Vector3(0.4, 0.5, 3.2);
  camera.position.copy(START);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 0.4;
  controls.maxDistance = 8;
  controls.autoRotateSpeed = 0.5;
  controls.autoRotate = !reduceMotion.matches;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(2, 3, 4);
  scene.add(sun);

  const colours = { fg: new THREE.Color(), muted: new THREE.Color(), signal: new THREE.Color(), bg: '#000' };
  const readColours = () => {
    const css = getComputedStyle(document.documentElement);
    colours.fg.set(css.getPropertyValue('--fg').trim() || '#b7b5e4');
    colours.muted.set(css.getPropertyValue('--fg-muted').trim() || '#8e8cb8');
    colours.signal.set(css.getPropertyValue('--signal').trim() || '#ff4a1c');
    colours.bg = css.getPropertyValue('--bg').trim() || '#0c0c0f';
    colours.fgHex = css.getPropertyValue('--fg').trim() || '#b7b5e4';
    colours.signalHex = css.getPropertyValue('--signal').trim() || '#ff4a1c';
  };
  readColours();

  const group = new THREE.Group();
  scene.add(group);
  let graph = null, meshes = [], byId = {}, lines = null, labels = [], edgeLabels = [], selected = null, hovered = null, showLabels = true;
  const geoSphere = new THREE.SphereGeometry(1, 20, 14);
  const geoCube = new THREE.BoxGeometry(1.4, 1.4, 1.4);
  const SCALE = 1.25; // layout units to scene units

  // text sprite on a canvas; world height h
  function sprite(text, colour, h = 0.05, weight = 400) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const font = `${weight} 44px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width) + 24;
    c.width = w; c.height = 60;
    ctx.font = font;
    ctx.fillStyle = colours.bg; ctx.globalAlpha = 0.72; ctx.fillRect(0, 6, w, 48); ctx.globalAlpha = 1;
    ctx.fillStyle = colour; ctx.textBaseline = 'middle'; ctx.fillText(text, 12, 31);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
    s.scale.set(h * (w / 60), h, 1);
    s.renderOrder = 2;
    return s;
  }

  function clear() {
    [...group.children].forEach((o) => { group.remove(o); o.geometry && o.geometry !== geoSphere && o.geometry !== geoCube && o.geometry.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
    meshes = []; byId = {}; labels = []; edgeLabels = []; selected = null; hovered = null;
  }

  function build() {
    clear();
    const pos = (n) => new THREE.Vector3(n.x * SCALE, n.y * SCALE, n.z * SCALE);
    graph.nodes.forEach((n) => {
      const isRoot = n.kind === 'root', isLit = n.kind === 'literal';
      const mat = new THREE.MeshStandardMaterial({ color: isRoot ? colours.signal : isLit ? colours.muted : colours.fg, roughness: 0.55, metalness: 0.05 });
      const m = new THREE.Mesh(isLit ? geoCube : geoSphere, mat);
      const r = isRoot ? 0.075 : isLit ? 0.018 : 0.036;
      m.scale.setScalar(r);
      m.position.copy(pos(n));
      m.userData = { node: n, r };
      group.add(m);
      meshes.push(m);
      byId[n.id] = m;
      if (!isLit) {
        const s = sprite(short(n.label), isRoot ? colours.signalHex : colours.fgHex, isRoot ? 0.075 : 0.05, isRoot ? 600 : 400);
        s.position.copy(m.position).add(new THREE.Vector3(0, r + 0.05, 0));
        s.userData.node = n;
        group.add(s);
        labels.push(s);
      }
    });
    const pts = [];
    graph.links.forEach((l) => { const a = byId[l.source], b = byId[l.target]; if (a && b) pts.push(a.position, b.position); });
    lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: colours.fg, transparent: true, opacity: 0.32 }));
    group.add(lines);
    applyLabels();
  }

  function applyLabels() { labels.forEach((s) => { s.visible = showLabels || (selected && related(selected).has(s.userData.node.id)); }); }
  function related(n) {
    const set = new Set([n.id]);
    graph.links.forEach((l) => { if (l.source === n.id) set.add(l.target); if (l.target === n.id) set.add(l.source); });
    return set;
  }

  function describe(n) {
    const out = graph.links.filter((l) => l.source === n.id), inc = graph.links.filter((l) => l.target === n.id);
    const item = (l, other, dir) => {
      const o = graph.nodes.find((x) => x.id === other);
      const val = o.kind === 'literal' ? `<span class="graph3d__lit">${esc(o.label)}</span>` : `<button type="button" data-node="${esc(o.id)}">${esc(o.label)}</button>`;
      return `<li><span class="mono">${dir === 'out' ? '' : '← '}${esc(l.label)}</span> ${val}</li>`;
    };
    const kind = n.kind === 'literal' ? 'Value' : n.classes.length ? n.classes.join(', ') : 'Resource';
    info.innerHTML = `
      <p class="mono graph3d__kind">${esc(kind)}</p>
      <h4>${esc(n.label)}</h4>
      ${n.uri ? `<p class="mono graph3d__uri"><a href="${esc(n.uri)}" target="_blank" rel="noopener">${esc(n.uri)}</a></p>` : ''}
      <ul>${out.map((l) => item(l, l.target, 'out')).join('')}${inc.map((l) => item(l, l.source, 'in')).join('')}</ul>`;
    info.hidden = false;
    info.querySelectorAll('[data-node]').forEach((b) => b.addEventListener('click', () => select(b.dataset.node, true)));
  }

  let fly = null;
  function select(id, move) {
    const m = byId[id];
    if (!m) return;
    selected = m.userData.node;
    const rel = related(selected);
    meshes.forEach((x) => {
      const on = rel.has(x.userData.node.id);
      x.material.transparent = true;
      x.material.opacity = on ? 1 : 0.25;
      x.material.emissive?.set(x === m ? colours.signal : 0x000000);
      x.material.emissiveIntensity = x === m ? 0.5 : 0;
    });
    // highlighted links and their property names
    edgeLabels.forEach((s) => { group.remove(s); s.material.map.dispose(); s.material.dispose(); });
    edgeLabels = [];
    const hi = [];
    graph.links.forEach((l) => {
      if (l.source !== id && l.target !== id) return;
      const a = byId[l.source].position, b = byId[l.target].position;
      hi.push(a, b);
      const s = sprite(short(l.label, 28), colours.signalHex, 0.038);
      s.position.copy(a).lerp(b, 0.5);
      group.add(s); edgeLabels.push(s);
    });
    group.children.filter((o) => o.userData.hi).forEach((o) => { group.remove(o); o.geometry.dispose(); o.material.dispose(); });
    const hl = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(hi), new THREE.LineBasicMaterial({ color: colours.signal }));
    hl.userData.hi = true;
    group.add(hl);
    lines.material.opacity = 0.12;
    applyLabels();
    describe(selected);
    if (move) {
      controls.autoRotate = false;
      fly = { from: controls.target.clone(), to: m.position.clone(), t: 0 };
    }
  }

  function unselect() {
    selected = null;
    meshes.forEach((x) => { x.material.opacity = 1; x.material.emissiveIntensity = 0; });
    edgeLabels.forEach((s) => { group.remove(s); s.material.map.dispose(); s.material.dispose(); });
    edgeLabels = [];
    group.children.filter((o) => o.userData.hi).forEach((o) => { group.remove(o); o.geometry.dispose(); o.material.dispose(); });
    if (lines) lines.material.opacity = 0.32;
    applyLabels();
    info.hidden = true;
  }

  // hover and click with a raycaster
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const tip = document.createElement('div');
  tip.className = 'graph3d__tip mono';
  tip.hidden = true;
  box.appendChild(tip);
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(meshes, false)[0];
    return hit && hit.object;
  }
  renderer.domElement.addEventListener('pointermove', (e) => {
    const m = pick(e);
    hovered = m ? m.userData.node : null;
    renderer.domElement.style.cursor = m ? 'pointer' : '';
    tip.hidden = !m;
    if (m) {
      const r = box.getBoundingClientRect();
      tip.textContent = short(m.userData.node.label, 70);
      tip.style.left = `${e.clientX - r.left + 12}px`;
      tip.style.top = `${e.clientY - r.top + 12}px`;
    }
  });
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return; // it was a drag
    const m = pick(e);
    if (m) select(m.userData.node.id, true); else unselect();
  });

  function resize() {
    const { width, height } = box.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(box);
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(box);
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    if (fly) {
      fly.t = Math.min(1, fly.t + 0.06);
      controls.target.lerpVectors(fly.from, fly.to, 1 - (1 - fly.t) ** 3);
      if (fly.t >= 1) fly = null;
    }
    controls.update();
    renderer.render(scene, camera);
  });

  function reset() {
    unselect();
    camera.position.copy(START);
    controls.target.set(0, 0, 0);
    controls.autoRotate = !reduceMotion.matches;
  }

  box.addEventListener('keydown', (e) => {
    const off = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    if (e.key === 'ArrowLeft') sph.theta -= 0.15;
    else if (e.key === 'ArrowRight') sph.theta += 0.15;
    else if (e.key === 'ArrowUp') sph.phi = Math.max(0.2, sph.phi - 0.15);
    else if (e.key === 'ArrowDown') sph.phi = Math.min(Math.PI - 0.2, sph.phi + 0.15);
    else if (e.key === '+' || e.key === '=') sph.radius = Math.max(controls.minDistance, sph.radius * 0.85);
    else if (e.key === '-') sph.radius = Math.min(controls.maxDistance, sph.radius / 0.85);
    else if (e.key === 'Escape') { unselect(); return; }
    else return;
    e.preventDefault();
    controls.autoRotate = false;
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
  });
  root.querySelector('[data-graph="reset"]')?.addEventListener('click', reset);
  root.querySelector('[data-graph="labels"]')?.addEventListener('click', (e) => {
    showLabels = !showLabels;
    e.currentTarget.setAttribute('aria-pressed', String(showLabels));
    applyLabels();
  });
  window.addEventListener('themechange', () => { readColours(); if (graph) { const s = selected?.id; build(); if (s) select(s, false); } });

  // the statements as text, for reading and for screen readers
  function renderList() {
    if (!list) return;
    const name = (id) => graph.nodes.find((n) => n.id === id).label;
    list.innerHTML = graph.links.map((l) => `<li><span>${esc(name(l.source))}</span> <span class="mono">${esc(l.label)}</span> <span>${esc(name(l.target))}</span></li>`).join('');
    if (count) count.textContent = graph.links.length;
  }

  let token = 0;
  async function show(no) {
    const t = ++token;
    root.classList.add('is-loading');
    try {
      const r = await fetch(`graphs/${String(no).padStart(2, '0')}.json`);
      if (!r.ok) throw new Error(r.status);
      const g = await r.json();
      if (t !== token) return;
      graph = g;
      // link the RDF file on this site (the tour data may point to another repository)
      const link = document.getElementById('rdf-text-link');
      if (link && g.rdf) link.href = g.rdf.split('/').map(encodeURIComponent).join('/');
      build();
      renderList();
      reset();
      resize();
      root.classList.remove('is-error');
    } catch (err) {
      console.warn('graph could not be loaded', err);
      root.classList.add('is-error');
    } finally {
      if (t === token) root.classList.remove('is-loading');
    }
  }

  window.Graph3D = { show };
  window.dispatchEvent(new Event('graph3d-ready'));
}
