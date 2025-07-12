import * as THREE from 'three';

// === UI HELPERS ===

function createObject(icon: string, name: string) {
  return `<div class='icon'>${icon}</div>${name}`;
}
function createIcon(icon: string) {
  return `<div class='icon'>${icon}</div>`;
}

// === OBJECT ICONS ===

export const objectIcon = new Map<Function, string>([
  [THREE.Light, createIcon("emoji_objects")],
  [THREE.Mesh, createIcon("shapes")],
  [THREE.Object3D, createIcon("ad_group")]
]);

export function getObjectIcon(obj: any): string {
  for (const [ctor, icon] of objectIcon) {
    if (obj instanceof ctor) return icon;
  }
  return createIcon("data_object");
}

// === MASKS ===

export const objectMask = new Map<string, string>([
  ['geometry', createObject("shapes", "Geometry")],
  ['material', createObject("deblur", "Material")],
  ['target', createObject("crisis_alert", "Target")],
  ['shadow', createObject("ev_shadow", "Shadow")],
  ['matrix', createObject("dataset", "Matrix")],
  ['modelViewMatrix', createObject("dataset", "View")],
  ['modelMatrix', createObject("dataset", "Model")],
  ['normalMatrix', createObject("dataset", "Normal")],
  ['matrixWorld', createObject("dataset", "World")]
]);

export function getObjectMask(name: string): string {
  return objectMask.get(name) ?? name;
}

// === SHARED UTILS ===

const advanced = true, locked = true;

export const utils = {
  groupOpen: (name: string, icon: string) => ({
    display: `
      <div class="group expandable">
        <div class="group-header"><div class="icon">${icon}</div>${name}
        <div class="expandable-icon"></div></div>
        <div class="group-container target">`
  }),
  groupClose: () => ({ display: `</div></div>` })
};

// === ALL SCHEMAS ===

const MiscSchema = {
  BufferAttribute: {
    id: { type: "string", locked },
    count: { type: "number" },
    gpuType: { type: "number", advanced },
    itemSize: { type: "number" },
    usage: { type: "Usage" }
  },
  Group: {},
  Box3: {
    min: { type: "Vector3" },
    max: { type: "Vector3" }
  },
  Sphere: {
    center: { type: "Vector3" },
    radius: { type: "number" }
  }
};

const CoreSchema = {
  Object3D: {
    "Transform:open": utils.groupOpen("Transform", "deployed_code"),
    position: { type: "Vector3" },
    rotation: { type: "Euler" },
    quaternion: { type: "Quaternion" },
    scale: { type: "Vector3" },
    "Transform:close": utils.groupClose(),
    "Matrices:open": utils.groupOpen("Matrices", "grid_on"),
    matrix: { type: "Matrix4" },
    modelViewMatrix: { type: "Matrix4", advanced },
    normalMatrix: { type: "Matrix3", advanced },
    matrixWorld: { type: "Matrix4", advanced },
    matrixAutoUpdate: { type: "boolean", advanced },
    matrixWorldNeedsUpdate: { type: "boolean", advanced },
    "Matrices:close": utils.groupClose(),
    uuid: { type: "string", locked },
    name: { type: "string" },
    castShadow: { type: "boolean" },
    receiveShadow: { type: "boolean" },
    visible: { type: "boolean" },
    frustumCulled: { type: "boolean" },
    renderOrder: { type: "number", advanced }
  },
  BufferGeometry: {
    attributes: { type: "Object" },
    index: { type: "BufferAttribute" },
    drawRange: { type: "Object" },
    groups: { type: "Group[]" },
    boundingBox: { type: "Box3" },
    boundingSphere: { type: "Sphere" },
    morphAttributes: { type: "Object" }
  }
};

const CameraSchema = {
  Camera: {
    matrixWorldInverse: { type: "Matrix4" },
    projectionMatrix: { type: "Matrix4" },
    projectionMatrixInverse: { type: "Matrix4" }
  },
  PerspectiveCamera: {
    fov: { type: "number" },
    aspect: { type: "number" },
    near: { type: "number" },
    far: { type: "number" },
    focus: { type: "number" },
    zoom: { type: "number" },
    filmGauge: { type: "number" },
    filmOffset: { type: "number" },
    view: { type: "Object" }
  },
  OrthographicCamera: {
    left: { type: "number" },
    right: { type: "number" },
    top: { type: "number" },
    bottom: { type: "number" },
    near: { type: "number" },
    far: { type: "number" },
    zoom: { type: "number" },
    view: { type: "Object" }
  }
};

const LightSchema = {
  Light: {
    color: { type: "Color" },
    intensity: { type: "number" },
    castShadow: { type: "boolean" }
  },
  AmbientLight: {},
  AmbientLightProbe: {},
  DirectionalLight: {
    target: { type: "Object3D" },
    shadow: { type: "DirectionalLightShadow" }
  },
  HemisphereLight: {
    skyColor: { type: "Color" },
    groundColor: { type: "Color" }
  },
  HemisphereLightProbe: {},
  PointLight: {
    distance: { type: "number" },
    decay: { type: "number" },
    shadow: { type: "PointLightShadow" }
  },
  RectAreaLight: {
    width: { type: "number" },
    height: { type: "number" }
  },
  SpotLight: {
    distance: { type: "number" },
    angle: { type: "number" },
    penumbra: { type: "number" },
    decay: { type: "number" },
    target: { type: "Object3D" },
    shadow: { type: "SpotLightShadow" }
  }
};

const MeshSchema = {
  Mesh: {
    geometry: { type: "BufferGeometry" },
    material: { type: "Material" }
  },
  InstancedMesh: {
    count: { type: "number" },
    instanceMatrix: { type: "InstancedBufferAttribute" },
    instanceColor: { type: "InstancedBufferAttribute | null" }
  },
  SkinnedMesh: {
    skeleton: { type: "Skeleton" },
    bindMatrix: { type: "Matrix4" },
    bindMode: { type: "string" },
    bindMatrixInverse: { type: "Matrix4" }
  },
  BatchedMesh: {
    groupMaterialMap: { type: "Map<number, Material>" }
  }
};

const MaterialSchema = {
  root: "Material",
  Material: {
    color: { type: "Color" },
    opacity: { type: "number", min: 0, max: 1 },
    transparent: { type: "boolean" },
    visible: { type: "boolean" },
    depthTest: { type: "boolean" },
    depthWrite: { type: "boolean" },
    blending: {
      type: "enum",
      options: [
        "NormalBlending", "AdditiveBlending",
        "SubtractiveBlending", "MultiplyBlending"
      ]
    }
  },
  MeshBasicMaterial: {
    map: { type: "Texture" },
    envMap: { type: "Texture" },
    reflectivity: { type: "number" }
  },
  MeshLambertMaterial: {
    emissive: { type: "Color" },
    emissiveIntensity: { type: "number" }
  },
  MeshPhongMaterial: {
    specular: { type: "Color" },
    shininess: { type: "number" },
    emissive: { type: "Color" }
  },
  MeshStandardMaterial: {
    metalness: { type: "number" },
    roughness: { type: "number" },
    emissive: { type: "Color" },
    emissiveIntensity: { type: "number" }
  },
  MeshPhysicalMaterial: {
    clearcoat: { type: "number" },
    clearcoatRoughness: { type: "number" },
    ior: { type: "number" },
    transmission: { type: "number" },
    thickness: { type: "number" },
    specularIntensity: { type: "number" }
  },
  MeshToonMaterial: {
    gradientMap: { type: "Texture" }
  },
  PointsMaterial: {
    size: { type: "number" },
    sizeAttenuation: { type: "boolean" }
  },
  LineBasicMaterial: {
    linewidth: { type: "number" }
  },
  LineDashedMaterial: {
    linewidth: { type: "number" },
    scale: { type: "number" },
    dashSize: { type: "number" },
    gapSize: { type: "number" }
  }
};

// === EXPORT ===

export const allSchemas = new Map(Object.entries({
  ...MiscSchema,
  ...CoreSchema,
  ...CameraSchema,
  ...MeshSchema,
  ...LightSchema,
  ...MaterialSchema
}));