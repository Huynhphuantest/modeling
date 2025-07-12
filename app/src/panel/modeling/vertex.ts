import * as THREE from 'three';
import { Viewport } from '../viewport';
import { Selection } from '../selection';
import { createRayFromScreen, distanceFromPointsToRay, getVertices } from '../util';
import { createSelectionMarkers, createVertexDisplay, updateVertexDisplay } from '../display';
import { TransformControls } from 'three/examples/jsm/Addons.js';
import { Editor } from '../editor';

let selected: THREE.Mesh | null = null;
let vertexDisplay: THREE.InstancedMesh | null = null;
let vertexPositions: THREE.Vector3[] = [];
let selectedDisplay: THREE.InstancedMesh | null = null;
let selectedIndices: number[] = [];
let enabled = false;

let dummy = new THREE.Object3D();
let transform:TransformControls;
const dummyOrigin = new THREE.Vector3();

export function init(sharedDummy: THREE.Object3D, transformControl: any, container: HTMLElement) {
    dummy = sharedDummy;
    transform = transformControl;
    transformControl.addEventListener("mouseDown", () => {
        if(!enabled) return;

        container.addEventListener("pointermove", onTransformMove);
        Viewport.orbit.enabled = false;
    });

    transformControl.addEventListener("mouseUp", () => {
        if(!enabled) return;

        container.removeEventListener("pointermove", onTransformMove);
        Viewport.orbit.enabled = true;
    });
    container.addEventListener("pointermove", () => {
        if(!enabled) return;

        if(vertexDisplay) updateVertexDisplay(vertexDisplay, vertexPositions);
        if(selectedDisplay) updateVertexDisplay(selectedDisplay, selectedIndices.map(i => vertexPositions[i]))
    });

    let mouseStart = new THREE.Vector2();
    let mouseTime = 0;

    container.addEventListener("pointerdown", (e) => {
        if(!enabled) return;
        onPointerDown(e)
        mouseTime = performance.now();
        mouseStart.set(e.clientX, e.clientY);
    });
    container.addEventListener("pointermove", () => {
        if(!enabled) return;
        clearSelectionTimer()
    });
    container.addEventListener("pointerup", (e) => {
        if(!enabled) return;
        clearSelectionTimer()
        selectIndivual(e);
    });
    function selectIndivual(e:PointerEvent) {
      const delta = new THREE.Vector2(e.clientX, e.clientY).sub(mouseStart);
      const tooFar = delta.lengthSq() > 4;
      const tooSlow = performance.now() - mouseTime > 200;
      if (tooFar || tooSlow) return;
    
      const distances = distanceFromPointsToRay(
        createRayFromScreen(
          Viewport.camera,
          new THREE.Vector2(e.clientX, e.clientY),
          Viewport.renderer.domElement.getBoundingClientRect()
        ),
        vertexPositions
      );
    
      let min = Infinity;
      let pointIndices: number[] = [];
    
      for (let i = 0; i < distances.length; i++) {
        const dist = distances[i];
        const point = vertexPositions[i];
        if(checkIfPointHidden(point)) continue; //lag?
        if (dist > 0.2) continue;
        if (min > dist) {
          min = dist;
          pointIndices = [i];
        } else if (min === dist) {
          pointIndices.push(i);
        }
      }
    
      if (pointIndices.length === 0) return drop();
    
      pointIndices.forEach(index => {
        const i = selectedIndices.indexOf(index);
        if (i !== -1) {
          selectedIndices = selectedIndices.slice(i, 1); // Toggle off?
        }
        selectedIndices.push(index);
      });
    
      updateTransformOrigin();
    }
}
export function enable(flag: boolean) {
  enabled = flag;
  if (!enabled) {
    if (vertexDisplay) Viewport.removeDev(vertexDisplay);
    vertexDisplay = null;
    if (selectedDisplay) Viewport.removeDev(selectedDisplay)
    selectedDisplay = null;
  } else {
    if(selected) vertexPositions = getVertices(selected);
    updateVertexDisplayFromMesh();
  }
}

export function select(obj: THREE.Object3D) {
  if (!(obj instanceof THREE.Mesh)) return;
  selected = obj;
  vertexPositions = getVertices(selected);
  updateVertexDisplayFromMesh();
}

export function drop() {
  transform.detach();
  selected = null;
  selectedIndices = [];
  vertexPositions = [];
  if (vertexDisplay) Viewport.removeDev(vertexDisplay);
  vertexDisplay = null;
  if (selectedDisplay) Viewport.removeDev(selectedDisplay)
  selectedDisplay = null;
}

function checkIfPointHidden(point: THREE.Vector3): boolean {
  if (!selected) return false;

  const raycaster = new THREE.Raycaster();
  const cameraToPoint = new THREE.Vector3().subVectors(point, Viewport.camera.position).normalize();

  raycaster.set(Viewport.camera.position, cameraToPoint);
  raycaster.far = Viewport.camera.position.distanceTo(point);

  const intersects = raycaster.intersectObject(selected, true);
  const hit = intersects[0];

  if (!hit) return false;

  const distance = Viewport.camera.position.distanceTo(point);
  const delta = Math.abs(hit.distance - distance);
  return delta > 1e-1;
}
function updateVertexDisplayFromMesh() {
    if (!selected || !enabled) return;
    if (!vertexDisplay) {
        vertexDisplay = createVertexDisplay(vertexPositions);
        Viewport.addDev(vertexDisplay);
        updateVertexDisplay(vertexDisplay, vertexPositions);
    }
}

function updateTransformOrigin() {
    if(selectedIndices.length === 0) {
        transform.detach();
        if(selectedDisplay) Viewport.removeDev(selectedDisplay);
        selectedDisplay = null;
        return;
    }
    transform.attach(dummy);
    const center = new THREE.Vector3();
    selectedIndices.forEach(i => center.add(vertexPositions[i]));
    center.divideScalar(selectedIndices.length);
    dummy.position.copy(center);
    dummyOrigin.copy(center);
    
    if(selectedDisplay) Viewport.removeDev(selectedDisplay);
    selectedDisplay = createSelectionMarkers(selectedIndices.map(i => vertexPositions[i]));
    Viewport.addDev(selectedDisplay);
}

function onTransformMove() {
  if (!selected || selectedIndices.length === 0) return;

  const geometry = selected.geometry as THREE.BufferGeometry;
  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

  const worldDelta = dummy.position.clone().sub(dummyOrigin);
  const localDelta = selected.worldToLocal(selected.localToWorld(worldDelta.clone()));
  dummyOrigin.copy(dummy.position);

  for (const i of selectedIndices) {
    const local = selected.worldToLocal(vertexPositions[i].clone());
    vertexPositions[i].add(worldDelta);
    const moved = local.add(localDelta);
    posAttr.setXYZ(i, moved.x, moved.y, moved.z);
  }

  posAttr.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  if(vertexDisplay) updateVertexDisplay(vertexDisplay, vertexPositions);
  if(selectedDisplay) updateVertexDisplay(selectedDisplay, selectedIndices.map(i => vertexPositions[i]));
}

let selectTimer: NodeJS.Timeout | null = null;
function onPointerDown(e: PointerEvent) {
  if (!selected || !enabled) return;
  if (selectTimer) clearTimeout(selectTimer);

  const vertices = [...vertexPositions];
  selectTimer = setTimeout(() => {
    new Selection(new THREE.Vector2(e.clientX, e.clientY), vertices, 'points').result(hits => {
      const indices = hits.map(h => vertices.findIndex(v => v === h)).filter(i => 
        i !== -1 && !checkIfPointHidden(vertices[i])
      );
      if (indices.length === 0) return;
      selectedIndices.push(...indices);
      selectedIndices = [...new Set<number>(selectedIndices)]
      updateTransformOrigin();
    });
  }, 750);
}

function clearSelectionTimer() {
  if (selectTimer) {
    clearTimeout(selectTimer);
    selectTimer = null;
  }
}
export function update() {
    if(vertexDisplay) updateVertexDisplay(vertexDisplay, vertexPositions);
    if(selectedDisplay) updateVertexDisplay(selectedDisplay, selectedIndices.map(i => vertexPositions[i]))
}