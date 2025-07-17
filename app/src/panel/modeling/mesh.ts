import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js';

export type Edge = [number, number];
export type Face = [number, number, number];

export class EditableMesh {
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;

  vertices: THREE.Vector3[] = [];
  faces: Face[] = [];
  edges: Set<string> = new Set(); // key = sorted "a:b", internal only

  selectedVertices = new Set<number>();
  selectedEdges = new Set<string>();

  constructor(mesh: THREE.Mesh) {
    this.mesh = mesh;
    this.geometry = mesh.geometry as THREE.BufferGeometry;
    this.rebuildFromGeometry();
  }

  dispose() {
    this.vertices.length = 0;
    this.faces.length = 0;
    this.edges.clear();
    this.selectedVertices.clear();
    this.selectedEdges.clear();
  }

  rebuildFromGeometry() {
    this.dispose();

    const posAttr = this.geometry.getAttribute('position');
    let indexAttr = this.geometry.getIndex();
    if (!indexAttr) {
      BufferGeometryUtils.mergeVertices(this.geometry, 5-2);
      indexAttr = this.geometry.getIndex()!;
    }

    const vertMap = new Map<number, number>(); // input index → deduped vertex index
    const uniqueVerts: THREE.Vector3[] = [];

    const toleranceSq = 1e-10;

    for (let i = 0; i < posAttr.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
      let found = -1;
      for (let j = 0; j < uniqueVerts.length; j++) {
        if (uniqueVerts[j].distanceToSquared(v) < toleranceSq) {
          found = j;
          break;
        }
      }
      if (found === -1) {
        found = uniqueVerts.length;
        uniqueVerts.push(v);
      }
      vertMap.set(i, found);
    }

    this.vertices = uniqueVerts;

    for (let i = 0; i < indexAttr.count; i += 3) {
      const ia = indexAttr.getX(i);
      const ib = indexAttr.getX(i + 1);
      const ic = indexAttr.getX(i + 2);

      const a = vertMap.get(ia)!;
      const b = vertMap.get(ib)!;
      const c = vertMap.get(ic)!;

      this.faces.push([a, b, c]);
      this.addEdge(a, b);
      this.addEdge(b, c);
      this.addEdge(c, a);
    }
  }

  // --- Vertex Accessors ---

  setVertex(index: number, position: THREE.Vector3) {
    this.vertices[index].copy(position);
    this.commitToMesh();
  }

  getVertex(index: number): THREE.Vector3 {
    return this.vertices[index];
  }

  getVertexPositions(): THREE.Vector3[] {
    return this.vertices;
  }

  getSelectedVertexIndices(): number[] {
    return Array.from(this.selectedVertices);
  }

  getSelectedVertexPositions(): THREE.Vector3[] {
    return Array.from(this.selectedVertices).map(i => this.vertices[i]);
  }

  moveVertices(indices: number[], delta: THREE.Vector3): void {
    for (const i of indices) {
      this.vertices[i].add(delta);
    }
    this.commitToMesh();
  }
  clearVertexSelection(): void {
    this.selectedVertices.clear();
  }
  // ======== Egde ========


  clearEdgeSelection(): void {
    this.selectedEdges.clear();
  }

  addEdge(a: number, b: number) {
    const [min, max] = a < b ? [a, b] : [b, a];
    this.edges.add(`${min}:${max}`);
  }

  getEdgeVertices(key: string): [THREE.Vector3, THREE.Vector3] {
    const [a, b] = key.split(':').map(Number);
    return [this.vertices[a], this.vertices[b]];
  }

  selectVertex(index: number) {
    this.selectedVertices.add(index);
  }

  selectEdge(a: number, b: number) {
    const [min, max] = a < b ? [a, b] : [b, a];
    this.selectedEdges.add(`${min}:${max}`);
  }

  extrudeSelected(amount = 1) {
    const offset = new THREE.Vector3(0, 0, amount);
    const duplicationMap = new Map<number, number>();

    for (const i of this.selectedVertices) {
      const newIndex = this.vertices.length;
      this.vertices.push(this.vertices[i].clone().add(offset));
      duplicationMap.set(i, newIndex);
    }

    for (const key of this.selectedEdges) {
      const [a, b] = key.split(':').map(Number);
      const a2 = duplicationMap.get(a);
      const b2 = duplicationMap.get(b);
      if (a2 == null || b2 == null) continue;

      this.faces.push([a, b, b2]);
      this.faces.push([b2, a2, a]);

      this.addEdge(a, b);
      this.addEdge(b, b2);
      this.addEdge(b2, a2);
      this.addEdge(a2, a);
    }

    this.commitToMesh();
  }

  mergeVertices(tolerance = 1e-6) {
    const toleranceSq = tolerance * tolerance;
    const newVerts: THREE.Vector3[] = [];
    const remap = new Map<number, number>();

    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      let found = -1;
      for (let j = 0; j < newVerts.length; j++) {
        if (newVerts[j].distanceToSquared(v) < toleranceSq) {
          found = j;
          break;
        }
      }
      if (found === -1) {
        found = newVerts.length;
        newVerts.push(v.clone());
      }
      remap.set(i, found);
    }

    const newFaces: Face[] = [];
    const edgeSet = new Set<string>();

    for (const [a, b, c] of this.faces) {
      const ia = remap.get(a)!;
      const ib = remap.get(b)!;
      const ic = remap.get(c)!;
      if (ia !== ib && ib !== ic && ic !== ia) {
        newFaces.push([ia, ib, ic]);
        edgeSet.add(this.edgeKey(ia, ib));
        edgeSet.add(this.edgeKey(ib, ic));
        edgeSet.add(this.edgeKey(ic, ia));
      }
    }

    this.vertices = newVerts;
    this.faces = newFaces;
    this.edges = edgeSet;

    this.commitToMesh();
  }

  edgeKey(a: number, b: number): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  commitToMesh() {
    const pos = new Float32Array(this.faces.length * 9);
    let i = 0;
    for (const [a, b, c] of this.faces) {
      pos.set(this.vertices[a].toArray(), i);
      pos.set(this.vertices[b].toArray(), i + 3);
      pos.set(this.vertices[c].toArray(), i + 6);
      i += 9;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.computeVertexNormals();

    this.mesh.geometry.dispose();
    this.mesh.geometry = geo;
    this.geometry = geo;
  }

  getSelectedEdges(): [THREE.Vector3, THREE.Vector3][] {
    return Array.from(this.selectedEdges).map(k => this.getEdgeVertices(k));
  }

  clearSelection() {
    this.selectedVertices.clear();
    this.selectedEdges.clear();
  }
}