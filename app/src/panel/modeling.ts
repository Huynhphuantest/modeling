import * as THREE from 'three';
import { Viewport } from './viewport';
import { getVertices, getWireframe } from './util';

let selected: THREE.Object3D | null = null;

let vertexDisplay: THREE.InstancedMesh | null = null;
let lineDisplay: THREE.LineSegments | null = null;

const state = {
  vertexEnabled: false,
  lineEnabled: false,
  faceEnabled: false,
};

const modelTools: (() => void)[] = [];

function createVertexDisplay(verts: THREE.Vector3[]): THREE.InstancedMesh {
  const geo = new THREE.SphereGeometry(1, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 'orange' });
  const mesh = new THREE.InstancedMesh(geo, mat, verts.length);
  Viewport.devScene.add(mesh);
  return mesh;
}

function updateVertexDisplay(verts: THREE.Vector3[]) {
  if (!vertexDisplay) {
    vertexDisplay = createVertexDisplay(verts);
  }
  verts.forEach((v, i) => {
    const dist = v.distanceTo(Viewport.camera.position);
    const s = Math.min(0.0125 * dist, 0.05);
    const matrix = new THREE.Matrix4()
      .makeTranslation(v.x, v.y, v.z)
      .multiply(new THREE.Matrix4().makeScale(s, s, s));
    vertexDisplay!.setMatrixAt(i, matrix);
  });
  vertexDisplay!.instanceMatrix.needsUpdate = true;
}

function createLineDisplay(geometry: THREE.BufferGeometry): THREE.LineSegments {
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
  const lines = new THREE.LineSegments(getWireframe(geometry), mat);
  Viewport.devScene.add(lines);
  return lines;
}

function updateLineDisplay() {
  if (!lineDisplay || !(selected instanceof THREE.Mesh)) return;
  lineDisplay.position.copy(selected.position);
  lineDisplay.quaternion.copy(selected.quaternion);
  lineDisplay.scale.copy(selected.scale);
}

function initModelingTool() {
  const buttons = document.querySelectorAll(".model-tool button");
  buttons.forEach((btn, i) => {
    modelTools[i] = () => (btn as HTMLButtonElement).click();
  });
}

export const Modeling = {
  init(container: HTMLElement) {
    initModelingTool();
    container.addEventListener("pointermove", () => {
      this.updateVertex();
      this.updateLine();
    });
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

  select(obj: THREE.Object3D) {
    selected = obj;
    this.updateVertex();
    this.updateLine();
  },

  drop() {
    selected = null;
    if (vertexDisplay) {
      Viewport.devScene.remove(vertexDisplay);
      vertexDisplay = null;
    }
    if (lineDisplay) {
      Viewport.devScene.remove(lineDisplay);
      lineDisplay = null;
    }
  },

  updateVertex() {
    if (!state.vertexEnabled || !(selected instanceof THREE.Mesh)) return;
    const verts = getVertices(selected);
    updateVertexDisplay(verts);
  },

  updateLine() {
    if (!state.lineEnabled || !(selected instanceof THREE.Mesh)) return;
    if (!lineDisplay) {
      lineDisplay = createLineDisplay(selected.geometry);
    }
    updateLineDisplay();
  },

  updateFace() {
    // TODO: Face display logic
  },
  vertex() { this.showVertex(!state.vertexEnabled) },
  line() { this.showLine(!state.lineEnabled) },
  face() {},
  unset() { modelTools[0]?.(); },
  extrude() { modelTools[1]?.(); },
  inset()   { modelTools[2]?.(); },
  bevel()   { modelTools[3]?.(); },
  knife()   { modelTools[4]?.(); },
  merge()   { modelTools[5]?.(); },
};