import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { deleteMesh, getVertices, getWireframe, updateVertices } from './util';
import { Modeling } from './modeling';

let panel: HTMLElement = document.body;

const scene = new THREE.Scene();
const devScene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(95, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const orbit = new OrbitControls(camera, renderer.domElement);
const transform = new TransformControls(camera, renderer.domElement);
const boundingBoxOutline = new THREE.BoxHelper(new THREE.Object3D());

let selectedObject: THREE.Object3D | null = null;

function setupRenderer() {
  renderer.setClearColor("#132324");
  renderer.autoClear = false;
  panel.appendChild(renderer.domElement);
}

function setupCamera() {
  camera.position.set(0, 0, 10);
  orbit.update();
}

function setupControls() {
  orbit.connect(renderer.domElement);
  transform.connect(renderer.domElement);
  devScene.add(transform.getHelper());
}

function setupDevScene() {
  const grid = new THREE.GridHelper(10, 10, "white");
  devScene.add(grid);
}

function resize() {
  const bounds = panel.getBoundingClientRect();
  camera.aspect = bounds.width / bounds.height;
  camera.updateProjectionMatrix();
  renderer.setSize(bounds.width, bounds.height);
  renderer.setPixelRatio(window.devicePixelRatio);
}

function disableBrowserBehavior() {
  const dom = renderer.domElement;
  Object.assign(dom.style, {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
  });
  ["contextmenu", "selectstart", "pointerdown", "mousedown", "dragstart"].forEach(evt =>
    dom.addEventListener(evt, e => e.preventDefault())
  );
  document.body.style.userSelect = 'none';
  dom.addEventListener('pointerup', () => document.body.style.userSelect = '');
  dom.addEventListener('pointercancel', () => document.body.style.userSelect = '');

  let lastTap = 0;
  document.addEventListener("touchend", e => {
    const now = Date.now();
    if (now - lastTap < 300) e.preventDefault();
    lastTap = now;
  });
  document.addEventListener("gesturestart", e => e.preventDefault());
  document.addEventListener("gesturechange", e => e.preventDefault());
  document.addEventListener("gestureend", e => e.preventDefault());
}

function render() {
  requestAnimationFrame(render);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.render(devScene, camera);
}

function pick(callback: (object: THREE.Object3D | null) => void) {
  const dom = renderer.domElement;
  const mouseStart = new THREE.Vector2();

  dom.addEventListener('pointerdown', e => {
    mouseStart.set(e.clientX, e.clientY);
  });

  dom.addEventListener('click', e => {
    const delta = new THREE.Vector2(e.clientX, e.clientY).sub(mouseStart);
    if (delta.lengthSq() > 2) return;

    const bounds = dom.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((e.clientY - bounds.top) / bounds.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(scene.children);
    callback(hits[0]?.object ?? null);
  });
}

export const Viewport = {
  init(container: HTMLDivElement) {
    panel = container;
    setupRenderer();
    setupCamera();
    setupControls();
    setupDevScene();
    disableBrowserBehavior();
    resize();
    window.addEventListener("resize", resize);
    render();
  },
  addObject(obj: THREE.Object3D) {
    scene.add(obj);
  },
  removeObject(obj: THREE.Object3D) {
    deleteMesh(obj);
  },
  addDev(obj: THREE.Object3D) {
    devScene.add(obj);
  },
  removeDev(obj: THREE.Object3D) {
    devScene.remove(obj);
  },
  select(obj: THREE.Object3D) {
    this.drop();
    selectedObject = obj;
    transform.attach(obj);
    boundingBoxOutline.setFromObject(obj);
    devScene.add(boundingBoxOutline);
    Modeling.select(obj);
  },

  drop() {
    selectedObject = null;
    transform.detach();
    devScene.remove(boundingBoxOutline);
    Modeling.drop();
  },

  enablePicking(callback: (obj: THREE.Object3D | null) => void) {
    pick(callback);
  },

  setTransformMode(tool:'translate'|'rotate'|'scale') {
    transform.setMode(tool);
  },

  focus() {
    if(!selectedObject) return;
    const box = new THREE.Box3().setFromObject(selectedObject);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Set controls to look at center
    orbit.target.copy(center);
    orbit.update();

    // Move camera back based on bounding size
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.5;

    const direction = new THREE.Vector3()
      .subVectors(camera.position, center)
      .normalize()
      .multiplyScalar(distance);

    camera.position.copy(center).add(direction);
    camera.lookAt(center);
  },

  camera,
  devScene,
  scene,
  renderer,
  transform,
  orbit,
  boundingBoxOutline,
};