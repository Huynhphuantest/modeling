import * as THREE from 'three';
import { Viewport } from './viewport';
import { createRayFromScreen, distanceFromPointsToRay, getButtons, getSelectedVertexIndices, getVertices } from './util';
import { createVertexDisplay, updateVertexDisplay, createLineDisplay, updateLineDisplay } from './display';
import { Mode } from './mode';
import { Selection } from './selection';
import { TransformControls } from 'three/examples/jsm/Addons.js';
import { Editor } from './editor';

let selected: THREE.Mesh | null = null;
let vertexDisplay: THREE.InstancedMesh | null = null;
let lineDisplay: THREE.LineSegments | null = null;

const state = {
  vertexEnabled: false,
  lineEnabled: false,
  faceEnabled: false
};

const modelTools: Function[] = [];
const modelModes: Function[] = [];
let selectedIndices: number[] = [];
let transform!: TransformControls;
const dummyOrigin = new THREE.Vector3();

function checkIfPointHidden(point: THREE.Vector3): boolean {
  if (!selected) return false;
  const raycaster = new THREE.Raycaster();
  const cameraToPoint = new THREE.Vector3().subVectors(point, Viewport.camera.position).normalize();
  raycaster.set(Viewport.camera.position, cameraToPoint);
  raycaster.far = Viewport.camera.position.distanceTo(point);
  const intersects = raycaster.intersectObject(selected, true);
  const hit = intersects[0];
  if(!hit) return false;
  const distance = Viewport.camera.position.distanceTo(point);
  console.log(distance);
  const delta = Math.abs(hit.distance - distance);
  return delta > 1e-1;
}
function updateSelection() {
  const position = new THREE.Vector3();
  selectedIndices.forEach(e => {
    const point = Modeling.vertexPositions[e];
    position.add(point);
  });
  position.divideScalar(selectedIndices.length);
  Modeling.transform.detach();
  Modeling.dummy.position.copy(position);
  dummyOrigin.copy(position);
  Modeling.transform.attach(Modeling.dummy);
  Viewport.devScene.add(Modeling.transform.getHelper());
}
function updateVertex() {
  if (Viewport.frame % 2 !== 0) return;
  if (!selected || selectedIndices.length === 0) return;

  const geometry = selected.geometry as THREE.BufferGeometry;
  const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

  // Compute world-space delta
  const worldDelta = Modeling.dummy.position.clone().sub(dummyOrigin);

  // Transform the delta into the selected mesh’s local space
  const localDelta = selected.worldToLocal(selected.localToWorld(new THREE.Vector3().copy(worldDelta)));

  dummyOrigin.copy(Modeling.dummy.position); // update for next frame

  for (let i = 0; i < selectedIndices.length; i++) {
    const index = selectedIndices[i];
    const base = selected.worldToLocal(Modeling.vertexPositions[index].clone()); // don't modify in-place
    Modeling.vertexPositions[index].add(worldDelta);

    base.add(localDelta);

    positionAttr.setXYZ(index, base.x, base.y, base.z);
  }

  positionAttr.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  Modeling.updateLine();
  Editor.updateBox();
}

function setupTransform() {
  const dom = Viewport.renderer.domElement;
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
    const distances = distanceFromPointsToRay(createRayFromScreen(
      Viewport.camera,
      new THREE.Vector2(e.clientX, e.clientY),
      Viewport.renderer.domElement.getBoundingClientRect()
    ),Modeling.vertexPositions);
    let min = Infinity;
    let pointIndices:number[] = [];
    for(let i = 0; i < distances.length; i++) {
      const dist = distances[i];
      const point = Modeling.vertexPositions[i];
      if(dist > 0.2) continue;
      const distToCamera = point.distanceToSquared(Viewport.camera.position);
      if(min > distToCamera) {
        min = distToCamera;
        pointIndices = []
        pointIndices.push(i);
      } else if (min === distToCamera) {
        pointIndices.push(i);
      }
    }
    if(pointIndices.length === 0) {
      Modeling.transform.detach();
      selectedIndices = [];
      return;
    }
    pointIndices.forEach(index => {
      const i = selectedIndices.indexOf(index);
      if(i !== -1) {
        selectedIndices = selectedIndices.slice(i, 1);
      };
      selectedIndices.push(index);
    });
    updateSelection();
  });
  Modeling.transform.addEventListener("change", () => {
      if (!Modeling.transform.object) return;
      const anyTransform = Modeling.transform as any;
      Modeling.transform.object.updateMatrixWorld();
      Modeling.transform.object.parent?.updateMatrixWorld();
      Modeling.transform.object.matrixWorld.decompose(
        anyTransform.worldPosition,
        anyTransform.worldQuaternion,
        anyTransform._worldScale
      );

      anyTransform._plane.quaternion.copy(Viewport.camera.quaternion);
      anyTransform._plane.position.copy(anyTransform.worldPosition);
      anyTransform._plane.updateMatrixWorld(true);
    });
  Modeling.transform.addEventListener("mouseDown", () => {
    if (!Modeling.transform.object) return;
    Viewport.renderer.domElement.addEventListener("pointermove", updateVertex);
    Viewport.orbit.enabled = false;
  });
  Modeling.transform.addEventListener("mouseUp", () => {
    if (!Modeling.transform.object) return;
    Viewport.renderer.domElement.removeEventListener("pointermove", updateVertex);
    Viewport.orbit.enabled = true;
  });
}

export const Modeling = {
  vertexPositions: [] as THREE.Vector3[],
  transform,
  dummy: new THREE.Object3D(),
  init(container: HTMLElement) {
    this.transform = new TransformControls(Viewport.camera, Viewport.renderer.domElement);
    Viewport.devScene.add(this.dummy);
    this.transform.attach(this.dummy);
    setupTransform();
    modelTools.push(...getButtons(".model-tool button", [
      () => { },
      () => { },
      () => { },
      () => { },
      () => { },
      () => { }
    ]));
    modelModes.push(...getButtons(".model-mode button", [
      () => this.showVertex(!state.vertexEnabled),
      () => this.showLine(!state.lineEnabled),
      () => { }
    ]));
    let pointerAmount = 0;
    let timer: NodeJS.Timeout | null = null;
    document.addEventListener("visibilitychange", () => pointerAmount = 0);
    container.addEventListener("pointerdown", (e) => {
      pointerAmount++;
      if (timer) return clearTimeout(timer);
      if (!selected) return;
      const vertices = [...Modeling.vertexPositions]
      timer = setTimeout(() => {
        new Selection(new THREE.Vector2(
          e.clientX,
          e.clientY
        ), vertices, 'points').result((res) => {
          const hits = res as THREE.Vector3[];
          if (hits.length === 0) return;
          selectedIndices = hits.reduce((arr, vec) => {
            const index = vertices.findIndex((a) => a === vec);
            if(checkIfPointHidden(vec)) return arr;
            if(index !== -1) arr.push(index);
            return arr;
          }, [] as number[]);
          updateSelection();
        });
      }, 750);
    });
    container.addEventListener("pointermove", () => {
      if (timer) { clearTimeout(timer); timer = null; }
      this.updateVertex();
      this.updateLine();
    });
    container.addEventListener("pointerup", () => {
      pointerAmount--;
      if (timer) { clearTimeout(timer); timer = null; }
    });
    document.addEventListener("modechange", () => {
      const tf = Viewport.transform;
      if (Mode.current === "modeling") {
        Viewport.focus();
        tf.enabled = false;
        tf.showX = tf.showY = tf.showZ = false;
        if(!state.lineEnabled) this.line();
      } else {
        tf.enabled = true;
        tf.showX = tf.showY = tf.showZ = true;
        if(state.lineEnabled) this.line();
        if(state.vertexEnabled) this.vertex();
        if(state.faceEnabled) this.face();
        selectedIndices = [];
        updateSelection();
      }
    });
  },
  select(obj: THREE.Object3D) {
    if (!(obj instanceof THREE.Mesh)) return;
    selected = obj;
    this.updateVertex();
    this.updateLine();
  },
  drop() {
    selected = null;
    if (vertexDisplay) Viewport.devScene.remove(vertexDisplay);
    if (lineDisplay) Viewport.devScene.remove(lineDisplay);
    vertexDisplay = null;
    lineDisplay = null;
  },
  showVertex(enable: boolean) {
    state.vertexEnabled = enable;
    if (!enable && vertexDisplay) {
      Viewport.devScene.remove(vertexDisplay);
      vertexDisplay = null;
    } else {
      this.updateVertex();
    }
  },
  showLine(enable: boolean) {
    state.lineEnabled = enable;
    if (!enable && lineDisplay) {
      Viewport.devScene.remove(lineDisplay);
      lineDisplay = null;
    } else {
      this.updateLine();
    }
  },
  showFace(enable: boolean) {
    state.faceEnabled = enable;
  },
  updateVertex() {
    if (!state.vertexEnabled || !(selected instanceof THREE.Mesh)) return;
    const verts = getVertices(selected);
    this.vertexPositions = verts;
    if (!vertexDisplay) vertexDisplay = createVertexDisplay(verts);
    updateVertexDisplay(vertexDisplay, verts);
  },
  updateLine() {
    if (!state.lineEnabled || !(selected instanceof THREE.Mesh)) return;
    if (!lineDisplay) lineDisplay = createLineDisplay(selected.geometry);
    updateLineDisplay(lineDisplay, selected);
  },
  // === Tool activation shorthands ===
  vertex() { modelModes[0]?.(); },
  line() { modelModes[1]?.(); },
  face() { modelModes[2]?.(); }, // if you enable face tool later

  unset() { modelTools[0]?.(); },
  extrude() { modelTools[1]?.(); },
  inset() { modelTools[2]?.(); },
  bevel() { modelTools[3]?.(); },
  knife() { modelTools[4]?.(); },
  merge() { modelTools[5]?.(); },
};