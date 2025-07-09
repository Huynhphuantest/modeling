import * as THREE from 'three';
export function getVertices(mesh: THREE.Mesh): THREE.Vector3[] {
  const posAttr = mesh.geometry.getAttribute("position");
  const unique = new Map<string, THREE.Vector3>();
  for (let i = 0; i < posAttr.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
    const key = `${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`;
    if (!unique.has(key)) unique.set(key, mesh.localToWorld(v));
  }
  return Array.from(unique.values());
}
export function updateVertices(mesh: THREE.Mesh, edits: THREE.Vector3[]) {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const posAttr = geometry.getAttribute("position");

  edits.forEach((position, index) => {
    // Convert from world to local before writing
    const localPos = mesh.worldToLocal(position.clone());
    posAttr.setXYZ(index, localPos.x, localPos.y, localPos.z);
  });

  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
}
export function getWireframe(geometry:THREE.BufferGeometry) {
    return new THREE.EdgesGeometry(geometry);
}
export function deleteMesh(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
        disposeMesh(child);
    }
  });
  disposeMesh(obj);
  obj.parent?.remove(obj);
}
export function disposeMesh(obj:THREE.Object3D) {
    const m = obj as THREE.Mesh;
    m.geometry?.dispose?.();

    if (Array.isArray(m.material)) {
    m.material.forEach(mat => mat?.dispose?.());
    } else {
    m.material?.dispose?.();
    }
}
