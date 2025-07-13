import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Mode } from './mode';
import { Viewport } from './viewport';
import { OBJLoader } from 'three/examples/jsm/Addons.js';

let container: HTMLElement = document.body;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(95, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true });

const orbit = new OrbitControls(camera, renderer.domElement);

function setupRenderer() {
  renderer.setClearColor("#132324");
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);
}

function setupCamera() {
  camera.position.set(0, 3, 10);
  camera.updateProjectionMatrix();
}

function setupControls() {
  orbit.connect(renderer.domElement);
  orbit.update();
  orbit.panSpeed = 0;
}

function setupScene() {
  const light1 = new THREE.DirectionalLight();
  light1.position.set(2, 1, 0.5);
  light1.intensity = 3.2;
  scene.add(light1);
  const light2 = new THREE.DirectionalLight();
  light2.position.set(-1, -0.5, 1);
  light2.intensity = 2.2;
  scene.add(light2);
  const ambient = new THREE.AmbientLight();
  ambient.intensity = 0.2;
  scene.add(ambient);
  new OBJLoader().load(
    "assets/shader-ball.obj",
    (obj) => {
      scene.add(obj);
      obj.position.y = 2;
      const s = 0.05;
      obj.scale.set(s, s, s);
    },
    () => {},
    (err) => console.error(err)
  )
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
    if(!enabled) return;
    console.log('e');
    requestAnimationFrame(render);
    renderer.clear();
    renderer.render(scene, camera);
  }
  render();
}

let enabled = false;
export const Material = {
  frame: 0,
  set enabled(value:boolean) {
    if(enabled === value) return;
    enabled = value;
    if(enabled) {
      startRenderLoop();
      renderer.domElement.style.display = "";
    } else {
      renderer.domElement.style.display = "none";
    }
  },
  init(containerElement: HTMLElement) {
    container = containerElement;
    setupRenderer();
    setupCamera();
    setupControls();
    setupScene();
    onResize();
    window.addEventListener("resize", onResize);
    document.addEventListener("modechange", () => {
      if(Mode.current === "material") {
        Viewport.enabled = false;
        this.enabled = true;
      }
      else {
        this.enabled = false;
        Viewport.enabled = true;
      }
    });
  },
};