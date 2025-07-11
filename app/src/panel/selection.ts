import * as THREE from 'three';
import { createFrustumFromScreen, getObjectsInFrustum, getPointsInFrustum } from './util';
import { createSelectionMarkers } from './display';
import { Viewport } from './viewport';
import { Modeling } from './modeling';

const selectBox = document.createElement('div');
selectBox.id = 'select-area';

function updateSelectBox(start:THREE.Vector2, end:THREE.Vector2) {
  const x1 = Math.min(start.x, end.x);
  const y1 = Math.min(start.y, end.y);
  const x2 = Math.max(start.x, end.x);
  const y2 = Math.max(start.y, end.y);
  Object.assign(selectBox.style, {
    left: `${x1}px`,
    top: `${y1}px`,
    width: `${x2 - x1}px`,
    height: `${y2 - y1}px`
  });
}
export class Selection {
    startPointer = new THREE.Vector2();
    endPointer = new THREE.Vector2();
    lastMesh: THREE.InstancedMesh | null = null;
    callback: ((target: any) => void)[] = [];
    private results:THREE.Vector3[] | THREE.Object3D[] = []
    private moveHandler: (e: PointerEvent) => void;
    private endHandler: () => void;
    private targets: THREE.Vector3[] | THREE.Object3D[];
    private type: 'points' | 'objects';
    constructor(at: THREE.Vector2, targets: THREE.Vector3[], type: 'points');
    constructor(at: THREE.Vector2, targets: THREE.Object3D[], type: 'objects');
    constructor(at: THREE.Vector2, targets: THREE.Vector3[] | THREE.Object3D[], type: 'points' | 'objects') {
        this.startPointer.copy(at);
        this.endPointer.copy(at);
        this.targets = targets;
        this.type = type;
        this.results = []

        // Bind the handlers
        this.moveHandler = this.move.bind(this);
        this.endHandler = this.end.bind(this);

        document.body.appendChild(selectBox);
        document.body.addEventListener('pointermove', this.moveHandler);
        document.body.addEventListener('pointerup', this.endHandler);
        Viewport.orbit.enabled = false;

        updateSelectBox(this.startPointer, this.endPointer);
    }
    private move(e: PointerEvent) {
        this.endPointer.set(e.clientX, e.clientY);
        updateSelectBox(this.startPointer, this.endPointer);

        if (!Modeling.vertexPositions || Viewport.frame % 5 !== 0) return;

        const rect = Viewport.renderer.domElement.getBoundingClientRect();
        const frustum = createFrustumFromScreen(
            this.startPointer.x,
            this.startPointer.y,
            this.endPointer.x,
            this.endPointer.y,
            Viewport.camera,
            rect
        );

        let hits: THREE.Vector3[] | THREE.Object3D[] = [];
        if (this.type === 'points') {
            hits = getPointsInFrustum(frustum, this.targets as THREE.Vector3[]);
            if (this.lastMesh) Viewport.devScene.remove(this.lastMesh);
            this.lastMesh = createSelectionMarkers(hits);
            Viewport.devScene.add(this.lastMesh);
            this.results = hits;
        } else if (this.type === 'objects') {
            hits = getObjectsInFrustum(frustum, this.targets as THREE.Object3D[]);
        }
    }
    private end() {
        if (this.lastMesh) Viewport.devScene.remove(this.lastMesh);
        document.body.removeEventListener('pointermove', this.moveHandler);
        document.body.removeEventListener('pointerup', this.endHandler);
        document.body.removeChild(selectBox);
        Viewport.orbit.enabled = true;
        this.callback.forEach(e => e(this.results));
    }
    result(e: (hits:THREE.Object3D[] | THREE.Vector3[]) => void) {
        this.callback.push(e);
    }
}