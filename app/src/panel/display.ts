import * as THREE from 'three';
import { Viewport } from './viewport';
import { getWireframe } from './util';
import { LineSegments2 } from 'three/examples/jsm/Addons.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/Addons.js';
import { LineMaterial } from 'three/examples/jsm/Addons.js';

const vertexGeometry = new THREE.SphereGeometry(1, 8, 8);
const vertexMaterial = new THREE.MeshBasicMaterial({ color: 'orange' });
const selectedMaterial = new THREE.MeshBasicMaterial({ color: 'skyblue' });

export function createVertexDisplay(verts: THREE.Vector3[]): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(vertexGeometry, vertexMaterial, verts.length);
  Viewport.devScene.add(mesh);
  return mesh;
}

export function updateVertexDisplay(mesh: THREE.InstancedMesh, verts: THREE.Vector3[]) {
  verts.forEach((v, i) => {
    const dist = v.distanceTo(Viewport.camera.position);
    const s = Math.min(0.0125 * dist, 0.05);
    const matrix = new THREE.Matrix4()
      .makeTranslation(v.x, v.y, v.z)
      .multiply(new THREE.Matrix4().makeScale(s, s, s));
    mesh.setMatrixAt(i, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

export function createLineDisplay(geometry: THREE.BufferGeometry): LineSegments2 {
  geometry.computeBoundingSphere();
  const mat = new LineMaterial({ color: 0xffffdf, linewidth: 0.5 });
  mat.resolution.set(window.innerWidth, window.innerHeight);
  const geom = new LineSegmentsGeometry().fromEdgesGeometry(getWireframe(geometry));
  const lines = new LineSegments2(geom, mat);
  Viewport.devScene.add(lines);
  return lines;
}

export function updateLineDisplay(line: LineSegments2, mesh: THREE.Mesh) {
  const geom = new LineSegmentsGeometry().fromEdgesGeometry(getWireframe(mesh.geometry));
  line.geometry.dispose();
  line.geometry = geom;
  line.position.copy(mesh.position);
  line.quaternion.copy(mesh.quaternion);
  line.scale.copy(mesh.scale);
}

export function createSelectionMarkers(points: THREE.Vector3[]): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(vertexGeometry, selectedMaterial, points.length);
  points.forEach((v, i) => {
    const dist = v.distanceTo(Viewport.camera.position);
    const s = Math.min(0.0125 * 1.5 * dist, 0.05 * 1.5);
    const matrix = new THREE.Matrix4()
      .makeTranslation(v.x, v.y, v.z)
      .multiply(new THREE.Matrix4().makeScale(s, s, s));
    mesh.setMatrixAt(i, matrix);
  });
  return mesh;
}
export function createFaceOutlineDisplay(faces: [THREE.Vector3, THREE.Vector3, THREE.Vector3][]): LineSegments2 {
  const positions: number[] = [];
  for (const [a, b, c] of faces) {
    positions.push(
      a.x, a.y, a.z, b.x, b.y, b.z,
      b.x, b.y, b.z, c.x, c.y, c.z,
      c.x, c.y, c.z, a.x, a.y, a.z
    );
  }

  const geom = new LineSegmentsGeometry();
  geom.setPositions(positions);

  const mat = new LineMaterial({ color: 0xffaa00, linewidth: 2 });
  mat.resolution.set(window.innerWidth, window.innerHeight);

  const lines = new LineSegments2(geom, mat);
  Viewport.devScene.add(lines);
  return lines;
}