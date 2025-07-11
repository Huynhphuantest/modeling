import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { castRayFromScreen, deleteMesh, disableBrowserBehavior } from './util';
import { Modeling } from './modeling';

let container: HTMLElement = document.body;
let selectedObject: THREE.Object3D | null = null;

const scene = new THREE.Scene();
const devScene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(95, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true });

const orbit = new OrbitControls(camera, renderer.domElement);
const transform = new TransformControls(camera, renderer.domElement);
const boundingBoxOutline = new THREE.BoxHelper(new THREE.Object3D());

// ------------------------- Setup -------------------------

function setupRenderer() {
  renderer.setClearColor("#132324");
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);
}

function setupCamera() {
  camera.position.set(0, 0, 10);
  camera.updateProjectionMatrix();
}

function setupControls() {
  orbit.connect(renderer.domElement);
  orbit.update();
  transform.connect(renderer.domElement);
  devScene.add(transform.getHelper());
}

function setupDevScene() {
  const grid = new THREE.GridHelper(10, 10, "white");
  devScene.add(grid);
}

function onResize() {
  const bounds = container.getBoundingClientRect();
  camera.aspect = bounds.width / bounds.height;
  camera.updateProjectionMatrix();
  renderer.setSize(bounds.width, bounds.height);
  renderer.setPixelRatio(window.devicePixelRatio);
}

function startRenderLoop() {
  function render() {
    requestAnimationFrame(render);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.render(devScene, camera);
    Viewport.frame++;
  }
  render();
}

// ------------------------- Picking -------------------------

function setupPicking(callback: (object: THREE.Object3D | null) => void) {
  const dom = renderer.domElement;
  const mouseStart = new THREE.Vector2();
  let mouseTime = 0;
  dom.addEventListener('pointerdown', e => {
    mouseStart.set(e.clientX, e.clientY);
    mouseTime = performance.now();
  });
  dom.addEventListener('pointerup', e => {
    const delta = new THREE.Vector2(e.clientX, e.clientY).sub(mouseStart);
    const tooFar = delta.lengthSq() > 4;
    const tooSlow = performance.now() - mouseTime > 200;
    if (tooFar || tooSlow) return;
    const bounds = dom.getBoundingClientRect();
    const hits = castRayFromScreen(
      camera,
      scene.children,
      new THREE.Vector2(e.clientX, e.clientY),
      bounds
    );
    callback(hits[0]?.object ?? null);
  });
}

// ------------------------- Viewport API -------------------------

export const Viewport = {
  init(containerElement: HTMLDivElement) {
    container = containerElement;

    setupRenderer();
    setupCamera();
    setupControls();
    setupDevScene();
    disableBrowserBehavior(renderer.domElement);

    onResize();
    window.addEventListener("resize", onResize);
    startRenderLoop();
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
    this.drop(); // clear existing selection
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
    setupPicking(callback);
  },

  setTransformMode(mode: 'translate' | 'rotate' | 'scale') {
    transform.setMode(mode);
  },

  focus() {
    if (!selectedObject) return;

    const box = new THREE.Box3().setFromObject(selectedObject);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    orbit.target.copy(center);
    orbit.update();

    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.5;
    const direction = new THREE.Vector3()
      .subVectors(camera.position, center)
      .normalize()
      .multiplyScalar(distance);

    camera.position.copy(center).add(direction);
    camera.lookAt(center);
  },
  frame: 0,
  get camera() { return camera; },
  get scene() { return scene; },
  get devScene() { return devScene; },
  get renderer() { return renderer; },
  get transform() { return transform; },
  get orbit() { return orbit; },
  get boundingBoxOutline() { return boundingBoxOutline; },
  get selected() { return selectedObject; }
};