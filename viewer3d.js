// Object page: the 3D view of an object (three.js, loaded as an ES module from jsDelivr).
// Only real 3D scans are shown (models/manifest.json): openly licensed scans from Scan the
// World and other open collections, downloaded from Zenodo. Objects without a scan show
// their photos only. object-page.js calls Viewer3D.show(entry) when a scan exists.
//
// Look: one matte material in the theme's ink colour (lavender on dark, ink on light),
// lit from the upper left with a thin vermilion rim light. "Colour" shows the scan's own
// texture when it has one. Drag to rotate, scroll or pinch to zoom, "Reset view" returns to
// the start. Auto-rotation is off when the visitor prefers reduced motion.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const root = document.getElementById('viewer3d');
const canvasBox = root?.querySelector('.viewer3d__canvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

if (root && canvasBox && supportsWebGL()) init();
else if (root) {
  root.classList.add('is-unsupported');
  window.Viewer3D = { unsupported: true };
  window.dispatchEvent(new Event('viewer3d-ready'));
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvasBox.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50);
  const START = new THREE.Vector3(0.35, 0.12, 2.4);
  camera.position.copy(START);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.6;
  controls.maxDistance = 5;
  controls.enablePan = false;
  controls.autoRotateSpeed = 0.9;
  controls.autoRotate = !reduceMotion.matches;
  // stop turning as soon as the visitor takes over
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 1.1);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-1.5, 2, 2.5);
  const rim = new THREE.DirectionalLight(0xff4a1c, 1.6);
  rim.position.set(2, -0.5, -2);
  scene.add(hemi, key, rim);

  // one matte material in the theme's ink colour for every scan; "Colour" shows the
  // scan's own texture when it has one
  const material = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0.04, side: THREE.DoubleSide });
  const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader().setDRACOLoader(draco);
  let current = null;
  let coloured = false;
  let hasOwn = false;
  let loadToken = 0;

  function themeColours() {
    const css = getComputedStyle(document.documentElement);
    const light = document.documentElement.dataset.theme === 'light';
    material.color.set(css.getPropertyValue('--fg').trim() || '#b7b5e4');
    rim.color.set(css.getPropertyValue('--signal').trim() || '#ff4a1c');
    hemi.intensity = light ? 1.5 : 1.1;
    key.intensity = light ? 1.6 : 2.2;
  }
  themeColours();
  window.addEventListener('themechange', themeColours);

  function applyColour() {
    const own = coloured && hasOwn;
    current?.traverse((o) => { if (o.isMesh) o.material = own ? o.userData.own : material; });
    const button = root.querySelector('[data-3d="colour"]');
    if (button) {
      button.hidden = !hasOwn;
      button.setAttribute('aria-pressed', String(own));
    }
  }

  function fit(object, entry = {}) {
    // flat scans (reliefs, plaques) are often stored lying down: stand them up so their
    // face, the widest side, looks at the camera
    // 1. scans made from one side only are open surfaces: turn their average surface
    //    direction towards the camera
    object.updateMatrixWorld(true);
    const sum = new THREE.Vector3();
    let area = 0;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    object.traverse((o) => {
      if (!o.isMesh) return;
      const pos = o.geometry.attributes.position, idx = o.geometry.index;
      const count = idx ? idx.count : pos.count;
      const step = Math.max(3, Math.floor(count / 60000) * 3); // sample large meshes
      for (let i = 0; i + 2 < count; i += step) {
        const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
        a.fromBufferAttribute(pos, i0).applyMatrix4(o.matrixWorld);
        b.fromBufferAttribute(pos, i1).applyMatrix4(o.matrixWorld);
        c.fromBufferAttribute(pos, i2).applyMatrix4(o.matrixWorld);
        n.subVectors(c, b).cross(a.clone().sub(b));
        area += n.length();
        sum.add(n);
      }
    });
    if (area > 0 && sum.length() > 0.25 * area) {
      object.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(sum.normalize(), new THREE.Vector3(0, 0, 1)));
    } else {
      // 2. closed flat slabs stored lying down: stand them up, face to the camera
      const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
      if (size.y < 0.45 * Math.min(size.x, size.z)) object.rotation.x -= Math.PI / 2;
      else if (size.x < 0.45 * Math.min(size.y, size.z)) object.rotation.y += Math.PI / 2;
    }
    // manual turns from the manifest (degrees: yaw around the vertical axis, roll around
    // the viewing axis) for scans whose face or top is not found automatically
    if (entry.yaw) object.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(entry.yaw)));
    if (entry.roll) object.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(entry.roll)));
    object.userData.orient = { open: area > 0 ? +(sum.length() / area).toFixed(2) : 0 };
    object.updateMatrixWorld(true);
    let size;
    const box = new THREE.Box3().setFromObject(object);
    size = box.getSize(new THREE.Vector3());
    const scale = 1.3 / Math.max(size.x, size.y, size.z * 1.4);
    object.scale.setScalar(scale);
    const centre = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
    object.position.sub(centre);
  }

  function resize() {
    const { width, height } = canvasBox.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvasBox);

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvasBox);
  renderer.setAnimationLoop(() => {
    if (!visible || root.hidden) return;
    controls.update();
    renderer.render(scene, camera);
  });

  function reset() {
    camera.position.copy(START);
    controls.target.set(0, 0, 0);
    controls.autoRotate = !reduceMotion.matches;
    controls.update();
  }

  async function show(entry) {
    const token = ++loadToken;
    root.classList.add('is-loading');
    root.classList.remove('is-error');
    try {
      const gltf = await loader.loadAsync(entry.model);
      if (token !== loadToken) return;
      if (current) {
        scene.remove(current);
        current.traverse((o) => { o.geometry?.dispose(); if (o.userData.own) o.userData.own.dispose?.(); });
      }
      current = gltf.scene;
      hasOwn = false;
      current.traverse((o) => {
        if (!o.isMesh) return;
        o.userData.own = o.material;
        if (o.material && o.material.map) hasOwn = true;
        if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
      });
      fit(current, entry);
      scene.add(current);
      applyColour();
      reset();
      resize();
    } catch (err) {
      console.warn('3D model could not be loaded', err);
      root.classList.add('is-error');
    } finally {
      if (token === loadToken) root.classList.remove('is-loading');
    }
  }

  root.querySelector('[data-3d="reset"]')?.addEventListener('click', reset);
  root.querySelector('[data-3d="colour"]')?.addEventListener('click', () => { coloured = !coloured; applyColour(); });
  reduceMotion.addEventListener?.('change', () => { controls.autoRotate = !reduceMotion.matches && controls.autoRotate; });

  // keyboard: arrows rotate, + / - zoom, when the viewer has focus
  canvasBox.addEventListener('keydown', (e) => {
    const step = 0.15;
    const offset = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(offset);
    if (e.key === 'ArrowLeft') sph.theta -= step;
    else if (e.key === 'ArrowRight') sph.theta += step;
    else if (e.key === 'ArrowUp') sph.phi = Math.max(0.2, sph.phi - step);
    else if (e.key === 'ArrowDown') sph.phi = Math.min(Math.PI - 0.2, sph.phi + step);
    else if (e.key === '+' || e.key === '=') sph.radius = Math.max(controls.minDistance, sph.radius * 0.85);
    else if (e.key === '-') sph.radius = Math.min(controls.maxDistance, sph.radius / 0.85);
    else return;
    e.preventDefault();
    controls.autoRotate = false;
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
  });

  window.Viewer3D = { show, reset, debug: () => current && { ...current.userData.orient, size: new THREE.Box3().setFromObject(current).getSize(new THREE.Vector3()).toArray().map((v) => +v.toFixed(2)) } };
  window.dispatchEvent(new Event('viewer3d-ready'));
}
