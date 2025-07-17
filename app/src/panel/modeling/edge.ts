import * as THREE from 'three';
import { Viewport } from '../viewport';
import { TransformControls, LineSegments2 } from 'three/examples/jsm/Addons.js';
import { createRaycastFromScreen, findClosestEdge, getVertices, rayToLocalSpace, toIndexed } from '../util';
import { createEdgeDisplay } from '../display';

let selected: THREE.Mesh | null = null;
let selectedEdges: [number, number][] = [];
let vertexPositions: THREE.Vector3[] = [];
let enabled = false;

let transform: TransformControls;
let dummy = new THREE.Object3D();
const dummyOrigin = new THREE.Vector3();

let edgeDisplay: LineSegments2 | null = null;

export function init(sharedDummy: THREE.Object3D, transformControl: TransformControls, container: HTMLElement) {
  dummy = sharedDummy;
  transform = transformControl;

  transform.addEventListener('mouseDown', () => {
    if (!enabled) return;
    Viewport.orbit.enabled = false;
    container.addEventListener('pointermove', onTransformMove);
  });

  transform.addEventListener('mouseUp', () => {
    if (!enabled) return;
    Viewport.orbit.enabled = true;
    container.removeEventListener('pointermove', onTransformMove);
  });

  let mouseStart = new THREE.Vector2();
  let mouseTime = 0;

  container.addEventListener("pointerdown", (e) => {
    if (!enabled) return;
    mouseTime = performance.now();
    mouseStart.set(e.clientX, e.clientY);
  });

  container.addEventListener('pointerup', (e) => {
    if (!enabled || !selected) return;
    const delta = new THREE.Vector2(e.clientX, e.clientY).sub(mouseStart);
    const tooFar = delta.lengthSq() > 4;
    const tooSlow = performance.now() - mouseTime > 200;
    if (tooFar || tooSlow) return;

    const ray = createRaycastFromScreen(
      Viewport.camera,
      new THREE.Vector2(e.clientX, e.clientY),
      Viewport.renderer.domElement.getBoundingClientRect()
    );

    const hits = ray.intersectObject(selected, false);
    if (hits.length === 0) return drop();

    const geometry = selected.geometry as THREE.BufferGeometry;
    const index = geometry.getIndex();
    if (!index) return;

    const faceIndex = hits[0].faceIndex!;
    const i0 = index.getX(faceIndex * 3);
    const i1 = index.getX(faceIndex * 3 + 1);
    const i2 = index.getX(faceIndex * 3 + 2);

    const edgeCandidates: [number, number][] = [
      [i0, i1],
      [i1, i2],
      [i2, i0],
    ];
    const closest = findClosestEdge(edgeCandidates, vertexPositions, rayToLocalSpace(ray.ray,selected), 0.2);
    if(closest === null) {
      selectedEdges = [];
      updateTransformOrigin();
      return;
    }
    if (!hasEdge(closest)) {
      selectedEdges.push(closest);
    } else {
      const index = selectedEdges.indexOf(closest);
      selectedEdges.splice(index, 1);
    }

    updateTransformOrigin();
  });
}

export function enable(flag: boolean) {
  enabled = flag;
  if (!enabled) {
    clearDisplay();
  } else {
    if (selected) {
      vertexPositions = getVertices(selected);
      updateTransformOrigin();
    }
  }
}

export function select(obj: THREE.Object3D) {
  if (!(obj instanceof THREE.Mesh)) return;
  const index = obj.geometry.getIndex();
  if (!index) {
    toIndexed(obj);
    console.warn("Automatically indexing geometry");
  }
  selected = obj;
  vertexPositions = getVertices(selected);
  updateTransformOrigin();
}

export function drop() {
  selected = null;
  selectedEdges = [];
  vertexPositions = [];
  clearDisplay();
}

function clearDisplay() {
  transform.detach();

  if (edgeDisplay) {
    Viewport.removeDev(edgeDisplay);
    edgeDisplay = null;
  }
}

function hasEdge([a, b]: [number, number]): boolean {
  return selectedEdges.some(([x, y]) =>
    (x === a && y === b) || (x === b && y === a)
  );
}

function updateTransformOrigin() {
  if (!selected || selectedEdges.length === 0) {
    clearDisplay();
    return;
  }

  const center = new THREE.Vector3();
  const edgeSegments: [THREE.Vector3, THREE.Vector3][] = [];
  const edgePoints: THREE.Vector3[] = [];

  for (const [i0, i1] of selectedEdges) {
    const a = vertexPositions[i0];
    const b = vertexPositions[i1];
    center.add(a).add(b);
    edgeSegments.push([a.clone(), b.clone()]);
    edgePoints.push(a.clone(), b.clone());
  }

  center.divideScalar(selectedEdges.length * 2);
  dummy.position.copy(center);
  dummyOrigin.copy(center);
  transform.attach(dummy);

  if (edgeDisplay) Viewport.removeDev(edgeDisplay);
  edgeDisplay = createEdgeDisplay(edgeSegments);
  Viewport.addDev(edgeDisplay);
}

function onTransformMove() {
  if (!selected || selectedEdges.length === 0) return;

  const geometry = selected.geometry as THREE.BufferGeometry;
  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

  const worldDelta = dummy.position.clone().sub(dummyOrigin);
  const localDelta = selected.worldToLocal(selected.localToWorld(worldDelta.clone()));
  dummyOrigin.copy(dummy.position);

  const moved = new Set<number>();
  for (const [i0, i1] of selectedEdges) {
    for (const i of [i0, i1]) {
      if (moved.has(i)) continue;
      moved.add(i);

      const local = selected.worldToLocal(vertexPositions[i].clone());
      vertexPositions[i].add(worldDelta);
      const updated = local.add(localDelta);
      posAttr.setXYZ(i, updated.x, updated.y, updated.z);
    }
  }

  posAttr.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  updateTransformOrigin();
}