import * as THREE from 'three';
import { createLineDisplay, updateLineDisplay } from '../display';
import { Viewport } from '../viewport';
import { LineSegments2 } from 'three/examples/jsm/Addons.js';

let selected: THREE.Mesh | null = null;
let lineDisplay: LineSegments2 | null = null;
let enabled = false;

export function init(container:HTMLElement) {
    container.addEventListener("pointermove", () => {
        if(!enabled) return;

        updateLine();
    })
}
export function enable(flag: boolean) {
  enabled = flag;
  if (!enabled && lineDisplay) {
    Viewport.removeDev(lineDisplay);
    lineDisplay = null;
  } else {
    updateLine();
  }
}

export function select(obj: THREE.Object3D) {
  if (!(obj instanceof THREE.Mesh)) return;
  selected = obj;
  updateLine();
}

export function drop() {
  selected = null;
  if (lineDisplay) Viewport.removeDev(lineDisplay);
  lineDisplay = null;
}

export function updateLine() {
  if (!enabled || !selected) return;
  if (!lineDisplay) {
    lineDisplay = createLineDisplay(selected.geometry);
    Viewport.addDev(lineDisplay);
  }
  updateLineDisplay(lineDisplay, selected);
}