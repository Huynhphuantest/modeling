import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { castRayFromScreen, deleteMesh, disableBrowserBehavior } from './util';
import { Mode } from './mode';
import { getHelper } from './helper';

let container: HTMLElement = document.body;
let selectedObject: THREE.Object3D | null = null;

const scene = new THREE.Scene();
const devScene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(95, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true });

const orbit = new OrbitControls(camera, renderer.domElement);
const transform = new TransformControls(camera, renderer.domElement);
const boundingBoxOutline = new THREE.BoxHelper(new THREE.Object3D());

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
  devScene.add(new THREE.GridHelper(10, 10, "white"));
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
    if (delta.lengthSq() > 4 || performance.now() - mouseTime > 200) return;
    const hits = castRayFromScreen(camera, scene.children, new THREE.Vector2(e.clientX, e.clientY), dom.getBoundingClientRect());
    callback(hits[0]?.object ?? null);
  });
}

export const Viewport = {
  frame: 0,
  init(containerElement: HTMLElement) {
    container = containerElement;
    setupRenderer();
    setupCamera();
    setupControls();
    setupDevScene();
    disableBrowserBehavior(renderer.domElement);
    onResize();
    window.addEventListener("resize", onResize);
    startRenderLoop();
    document.addEventListener("modechange", () => {
      if(Mode.current === "layout") {
        devScene.add(transform.getHelper());
        transform.enabled = true;
        if(selectedObject) transform.attach(selectedObject);
        boundingBoxOutline.visible = true;
      }
      else {
        devScene.remove(transform.getHelper());
        transform.enabled = false;
        transform.detach();
        boundingBoxOutline.visible = false;
      }
    });
  },
  get camera() { return camera; },
  get scene() { return scene; },
  get devScene() { return devScene; },
  get renderer() { return renderer; },
  get transform() { return transform; },
  get orbit() { return orbit; },
  get boundingBoxOutline() { return boundingBoxOutline; },
  get selected() { return selectedObject; },

  addObject(obj: THREE.Object3D) { 
    scene.add(obj);
    const helper = getHelper(obj);
  },
  removeObject(obj: THREE.Object3D) { deleteMesh(obj); },
  addDev(obj: THREE.Object3D) { devScene.add(obj); },
  removeDev(obj: THREE.Object3D) { devScene.remove(obj); },

  select(obj: THREE.Object3D) {
    this.drop();
    selectedObject = obj;
    transform.attach(obj);
    boundingBoxOutline.setFromObject(obj);
    devScene.add(boundingBoxOutline);
  },
  drop() {
    selectedObject = null;
    transform.detach();
    devScene.remove(boundingBoxOutline);
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

    const distance = Math.max(size.x, size.y, size.z) * 1.5;
    const direction = new THREE.Vector3().subVectors(camera.position, center).normalize().multiplyScalar(distance);
    camera.position.copy(center).add(direction);
    camera.lookAt(center);
  }
};