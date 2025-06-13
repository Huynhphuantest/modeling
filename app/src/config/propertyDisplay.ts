import { Vector3, Quaternion, Euler } from 'three';
const advanced = true;
const locked = true;
function input(vaule:any) {
  const html = /*html*/`
    <div class="value">
      <input value="${value}">
    <div>`;
  return html;
}
function inputProperty(obj:any, property:string) {
  const html = /*html*/`
    <div class="value">
      <div class="label">${property}</div>
      <input value="${obj[property]}">
    <div>`;
  return html;
}
export const valueDisplay = {
  string: (value:string) => { return input(value) },
  number: (value:number) => { return input(value) },
  Vector3: (value:Vector3) => { 
    return 
      inputProperty(value, "x") +
      inputProperty(value, "y") +
      inputProperty(value, "z")
  }
}
export const propertyDisplay = {
  CoreProperties,
  CameraProperties,
  MeshProperties,
  LightProperties,
  MaterialProperties
}
const CoreProperties = {
  root:"Object3D",
  "Object3D": {
    "uuid": { "type": "string", locked },
    "name": { "type": "string" },
    "type": { "type": "string" },
    "up": { "type": "Vector3", advanced },
    "position": { "type": "Vector3" },
    "rotation": { "type": "Euler" },
    "quaternion": { "type": "Quaternion" },
    "scale": { "type": "Vector3" },
    "modelViewMatrix": { "type": "Matrix4", advanced },
    "normalMatrix": { "type": "Matrix3", advanced },
    "matrix": { "type": "Matrix4", advanced },
    "matrixWorld": { "type": "Matrix4", advanced },
    "matrixAutoUpdate": { "type": "boolean", advanced },
    "matrixWorldNeedsUpdate": { "type": "boolean", advanced },
    "castShadow": { "type": "boolean" },
    "receiveShadow": { "type": "boolean" },
    "visible": { "type": "boolean" },
    "frustumCulled": { "type": "boolean" },
    "renderOrder": { "type": "number", advanced },
  },
  "BufferGeometry": {
    "attributes": { "type": "object" },
    "index": { "type": "BufferAttribute | null" },
    "drawRange": { "type": "object" },
    "groups": { "type": "Group[]" },
    "boundingBox": { "type": "Box3 | null" },
    "boundingSphere": { "type": "Sphere | null" },
    "morphAttributes": { "type": "object" },
  }
}
const CameraProperties = {
  root: "Camera",
  "Camera": {
    "matrixWorldInverse": { "type": "Matrix4" },
    "projectionMatrix": { "type": "Matrix4" },
    "projectionMatrixInverse": { "type": "Matrix4" }
  },
  "PerspectiveCamera": {
    "fov": { "type": "number" },
    "aspect": { "type": "number" },
    "near": { "type": "number" },
    "far": { "type": "number" },
    "focus": { "type": "number" },
    "zoom": { "type": "number" },
    "filmGauge": { "type": "number" },
    "filmOffset": { "type": "number" },
    "view": { "type": "object | null" }
  },
  "OrthographicCamera": {
    "left": { "type": "number" },
    "right": { "type": "number" },
    "top": { "type": "number" },
    "bottom": { "type": "number" },
    "near": { "type": "number" },
    "far": { "type": "number" },
    "zoom": { "type": "number" },
    "view": { "type": "object | null" }
  }
}
const LightProperties = {
  root: "Light",
  "Light": {
    "color": { "type": "Color" },
    "intensity": { "type": "number" },
    "castShadow": { "type": "boolean" }
  },
  "AmbientLight": {
    "color": { "type": "Color" },
    "intensity": { "type": "number" }
  },
  "AmbientLightProbe": {
    "color": { "type": "Color" },
    "intensity": { "type": "number" }
  },
  "DirectionalLight": {
    "color": { "type": "Color" },
    "intensity": { "type": "number" },
    "target": { "type": "Object3D" },
    "shadow": { "type": "DirectionalLightShadow" }
  },
  "HemisphereLight": {
    "skyColor": { "type": "Color" },
    "groundColor": { "type": "Color" },
    "intensity": { "type": "number" }
  },
  "HemisphereLightProbe": {
    "color": { "type": "Color" },
    "intensity": { "type": "number" }
  },
  "PointLight": {
    "color": { "type": "Color" },
    "intensity": { "type": "number" },
    "distance": { "type": "number" },
    "decay": { "type": "number" },
    "shadow": { "type": "PointLightShadow" }
  },
  "RectAreaLight": {
    "color": { "type": "Color" },
    "intensity": { "type": "number" },
    "width": { "type": "number" },
    "height": { "type": "number" }
  },
  "SpotLight": {
    "color": { "type": "Color" },
    "intensity": { "type": "number" },
    "distance": { "type": "number" },
    "angle": { "type": "number" },
    "penumbra": { "type": "number" },
    "decay": { "type": "number" },
    "target": { "type": "Object3D" },
    "shadow": { "type": "SpotLightShadow" }
  }
}
const MeshProperties =  {
  root: "Mesh",
  "Mesh": {
    "geometry": { "type": "BufferGeometry" },
    "material": { "type": "Material" },
    "position": { "type": "Vector3" },
    "rotation": { "type": "Euler" },
    "scale": { "type": "Vector3" },
    "matrix": { "type": "Matrix4" },
    "matrixWorld": { "type": "Matrix4" },
    "visible": { "type": "boolean" },
    "castShadow": { "type": "boolean" },
    "receiveShadow": { "type": "boolean" },
    "frustumCulled": { "type": "boolean" },
    "renderOrder": { "type": "number" },
    "userData": { "type": "object" }
  },
  "InstancedMesh": {
    "geometry": { "type": "BufferGeometry" },
    "material": { "type": "Material" },
    "count": { "type": "number" },
    "instanceMatrix": { "type": "InstancedBufferAttribute" },
    "instanceColor": { "type": "InstancedBufferAttribute | null" }
  },
  "SkinnedMesh": {
    "geometry": { "type": "BufferGeometry" },
    "material": { "type": "Material" },
    "skeleton": { "type": "Skeleton" },
    "bindMatrix": { "type": "Matrix4" },
    "bindMode": { "type": "string" },
    "bindMatrixInverse": { "type": "Matrix4" }
  },
  "BatchedMesh": {
    "geometry": { "type": "BufferGeometry" },
    "material": { "type": "Material" },
    "groupMaterialMap": { "type": "Map<number, Material>" }
  }
}
const MaterialProperties = {
  root: "Material",
  "Material": {
    "color": { "type": "color" },
    "opacity": { "type": "number", "min": 0, "max": 1 },
    "transparent": { "type": "boolean" },
    "visible": { "type": "boolean" },
    "depthTest": { "type": "boolean" },
    "depthWrite": { "type": "boolean" },
    "blending": {
      "type": "enum",
      "options": ["NormalBlending", "AdditiveBlending", "SubtractiveBlending", "MultiplyBlending"]
    }
  },
  "MeshBasicMaterial": {
    "map": { "type": "reference", "refType": "Texture" },
    "envMap": { "type": "reference", "refType": "Texture" },
    "reflectivity": { "type": "number", "min": 0, "max": 1 }
  },
  "MeshLambertMaterial": {
    "emissive": { "type": "color" },
    "emissiveIntensity": { "type": "number", "min": 0, "max": 10 }
  },
  "MeshPhongMaterial": {
    "specular": { "type": "color" },
    "shininess": { "type": "number", "min": 0, "max": 100 },
    "emissive": { "type": "color" }
  },
  "MeshStandardMaterial": {
    "metalness": { "type": "number", "min": 0, "max": 1 },
    "roughness": { "type": "number", "min": 0, "max": 1 },
    "emissive": { "type": "color" },
    "emissiveIntensity": { "type": "number", "min": 0, "max": 10 }
  },
  "MeshPhysicalMaterial": {
    "clearcoat": { "type": "number", "min": 0, "max": 1 },
    "clearcoatRoughness": { "type": "number", "min": 0, "max": 1 },
    "ior": { "type": "number", "min": 1, "max": 2.5 },
    "transmission": { "type": "number", "min": 0, "max": 1 },
    "thickness": { "type": "number", "min": 0, "max": 10 },
    "specularIntensity": { "type": "number", "min": 0, "max": 1 }
  },
  "MeshToonMaterial": {
    "gradientMap": { "type": "reference", "refType": "Texture" }
  },
  "PointsMaterial": {
    "size": { "type": "number", "min": 0.001, "max": 100 },
    "sizeAttenuation": { "type": "boolean" }
},
  "LineBasicMaterial": {
    "linewidth": { "type": "number", "min": 1, "max": 10 }
  },
  "LineDashedMaterial": {
    "linewidth": { "type": "number", "min": 1, "max": 10 },
    "scale": { "type": "number", "min": 0.1, "max": 10 },
    "dashSize": { "type": "number", "min": 0.01, "max": 10 },
    "gapSize": { "type": "number", "min": 0.01, "max": 10 }
  }
}