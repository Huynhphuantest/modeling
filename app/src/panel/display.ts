import * as THREE from 'three';
import { Viewport } from './viewport';
import { getWireframe } from './util';

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

export function createLineDisplay(geometry: THREE.BufferGeometry): THREE.LineSegments {
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
  const lines = new THREE.LineSegments(getWireframe(geometry), mat);
  Viewport.devScene.add(lines);
  return lines;
}

export function updateLineDisplay(line: THREE.LineSegments, mesh: THREE.Mesh) {
  line.geometry = getWireframe(mesh.geometry);
  line.position.copy(mesh.position);
  line.quaternion.copy(mesh.quaternion);
  line.scale.copy(mesh.scale);
}

export function createSelectionMarkers(points: THREE.Vector3[]): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(vertexGeometry, selectedMaterial, points.length);
  points.forEach((v, i) => {
    const dist = v.distanceTo(Viewport.camera.position);
    const s = Math.min(0.0125 * 1.25 * dist, 0.05 * 1.25);
    const matrix = new THREE.Matrix4()
      .makeTranslation(v.x, v.y, v.z)
      .multiply(new THREE.Matrix4().makeScale(s, s, s));
    mesh.setMatrixAt(i, matrix);
  });
  return mesh;
}