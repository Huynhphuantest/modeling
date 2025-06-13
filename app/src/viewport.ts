import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from "three/examples/jsm/Addons.js";
import { isSafari } from './utils';

const objects:THREE.Object3D[] = [];
let scene:THREE.Scene = new THREE.Scene();
let camera:THREE.PerspectiveCamera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
let renderer:THREE.WebGLRenderer = new THREE.WebGLRenderer();
let orbit:OrbitControls = new OrbitControls(camera, null);
let transform:TransformControls = new TransformControls(camera);
let panel = document.body;
export function init(panelI:HTMLDivElement) {
  panel = panelI;
  function resize() {
    const dimension = panel.getBoundingClientRect();
    camera.aspect = dimension.width / dimension.height;
    camera.updateProjectionMatrix();
    renderer.setSize( dimension.width, dimension.height );
    renderer.setPixelRatio(window.devicePixelRatio);
  }
  resize();
  renderer.setClearColor("#1a1c1f");
  renderer.domElement.addEventListener('pointerdown', (e) => e.preventDefault());
  renderer.domElement.addEventListener('dragstart', (e) => e.preventDefault());

  window.addEventListener("resize", resize);
  panel.appendChild( renderer.domElement );

  scene.add(new THREE.GridHelper(10,10,"white"))

  orbit.connect(renderer.domElement);
  camera.position.set(0,0,10);
  orbit.update();

  transform.domElement = renderer.domElement;
  transform.connect(renderer.domElement)
  scene.add(transform.getHelper());

  disableBrowserBehavior();
  control();
}
export function control() {
  const dom = renderer.domElement;
  const boundingBoxOutline = new THREE.BoxHelper();
  const dimension = dom.getBoundingClientRect();
  const mouseStart = new THREE.Vector2();
  dom.addEventListener('pointerdown', (event:PointerEvent) => {
    mouseStart.set(event.clientX, event.clientY);
  });
  dom.addEventListener('click', (event:MouseEvent) => {
    const distX = event.clientX - mouseStart.x;
    const distY = event.clientY - mouseStart.y;
    const distSq = distX * distX + distY * distY;
    if(distSq > 2) return;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera( new THREE.Vector2(
      ( (event.clientX - dimension.left) / dimension.width ) * 2 - 1,
      - ( (event.clientY - dimension.top) / dimension.height ) * 2 + 1
    ), camera );

    const intersects = raycaster.intersectObjects( objects );
    if (intersects.length < 1) {
      transform.detach();
      return;
    }
    const object = intersects[0].object;
    transform.attach(object);
    boundingBoxOutline.setFromObject(object);
    boundingBoxOutline.update();
    scene.add(boundingBoxOutline);
  });
  function updateBoxOutline() {
    boundingBoxOutline.position.copy(transform.object.position);
    boundingBoxOutline.setFromObject(transform.object);
    boundingBoxOutline.update();
  }
  transform.addEventListener("mouseDown", () => {
    dom.addEventListener("pointermove", updateBoxOutline);
    orbit.enabled = false;
  });
  transform.addEventListener("mouseUp", () => {
    dom.removeEventListener("pointermove", updateBoxOutline);
    orbit.enabled = true;
  });
  transform.addEventListener("change", () => {
    if (!transform.object) return;

    // There is a bug where the transform control
    // _plane doesn't update when switching axis causing
    // "jump" and weird problem with freehand

    // Match transform's internal world position
    transform.object.updateMatrixWorld();
    transform.object.parent?.updateMatrixWorld();
    transform.object.matrixWorld.decompose(
      transform.worldPosition,
      transform.worldQuaternion,
      transform._worldScale
    );

    // Orient the plane to camera direction
    transform._plane.quaternion.copy(camera.quaternion);
    transform._plane.position.copy(transform.worldPosition);
    transform._plane.updateMatrixWorld(true);
  });
}
export function start() {
  render();
}
function render() {
  renderer.render( scene, camera );
  requestAnimationFrame(render);
}
export function addObject(obj:THREE.Object3D) {
  objects.push(obj);
  scene.add(obj);
}

function disableBrowserBehavior() {
  const dom = renderer.domElement;
    Object.assign(dom.style, {
    userSelect: 'none',
    WebkitUserSelect: 'none',      // Safari
    touchAction: 'none',
    WebkitTouchCallout: 'none',    // Safari long-press menu
  }); 

  dom.setAttribute('unselectable', 'on');
  dom.setAttribute('onselectstart', 'return false;');

  dom.addEventListener('contextmenu', e => e.preventDefault());     // ⛔ Block long-press menu
  dom.addEventListener('selectstart', e => e.preventDefault());     // ⛔ Block text select
  dom.addEventListener('pointerdown', e => e.preventDefault());
  dom.addEventListener('mousedown', e => e.preventDefault());
  dom.addEventListener('dragstart', e => e.preventDefault());

  function disableSelection() {
    document.body.style.userSelect = 'none';
  }

  function enableSelection() {
    document.body.style.userSelect = '';
  }

  renderer.domElement.addEventListener('pointerdown', disableSelection);
  renderer.domElement.addEventListener('pointerup', enableSelection);
  renderer.domElement.addEventListener('pointercancel', enableSelection);
}