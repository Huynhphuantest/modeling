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

export function createEdgeDisplay(segments: [THREE.Vector3, THREE.Vector3][]): LineSegments2 {
  const positions: number[] = [];

  for (const [a, b] of segments) {
    positions.push(a.x, a.y, a.z);
    positions.push(b.x, b.y, b.z);
  }

  const geom = new LineSegmentsGeometry();
  geom.setPositions(positions);

  const mat = new LineMaterial({ color: 0xffaa00, linewidth: 2 });
  mat.resolution.set(window.innerWidth, window.innerHeight);

  const lines = new LineSegments2(geom, mat);
  Viewport.devScene.add(lines);
  return lines;
}

export function updateEdgeDisplay(lines: LineSegments2, mesh: THREE.Mesh) {
  const edgeGeom = new THREE.EdgesGeometry(mesh.geometry);
  const lineGeom = new LineSegmentsGeometry().fromEdgesGeometry(edgeGeom);

  // Replace geometry
  lines.geometry.dispose();
  lines.geometry = lineGeom;

  // Update transform
  mesh.updateMatrixWorld();
  lines.position.copy(mesh.position);
  lines.quaternion.copy(mesh.quaternion);
  lines.scale.copy(mesh.scale);
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