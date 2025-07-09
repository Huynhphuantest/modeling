import { Vector2, Vector3, Quaternion, Euler, Color } from 'three';
export type Property = {
  type: string,
  advanced?: boolean,
  locked?: boolean,
  display?: string,
}

const advanced = true;
const locked = true;
function filter(val:any) {
  if(val ===  Infinity) val =  "Inf";
  if(val === -Infinity) val = "-Inf";
  if(typeof val === "number") val = Math.round(val*100)/100;
  return val;
}
export function input(value:any) {
  return /*html*/`
    <div contenteditable="true" class="display">${filter(value)}</div>`;
}
function inputProperty(obj:any, property:string) {
  let val = filter(obj[property]);
  return /*html*/`
    <div class="label">${property}</div>
    <div contenteditable="true" class="display">${val}</div>`;
}
export const valueDisplay:Map<string,(...args: any[]) => string> = new Map(Object.entries({
  string: (value:string) => { return input(value) },
  number: (value:number) => { return input(value) },
  boolean: (value:boolean) => { 
    return /*html*/`
      <div class="checkbox">${value}</div>
    `
  },
  Vector2: (value:Vector2) => { 
    return (
      inputProperty(value, "x") +
      inputProperty(value, "y")
    )
  },
  Vector3: (value:Vector3) => { 
    return (
      inputProperty(value, "x") +
      inputProperty(value, "y") +
      inputProperty(value, "z")
    )
  },
  Euler: (value:Euler) => { 
    return (
      inputProperty(value, "x") +
      inputProperty(value, "y") +
      inputProperty(value, "z")
    )
  }, 
  Quaternion: (value:Quaternion) => { 
    return (
      inputProperty(value, "x") +
      inputProperty(value, "y") +
      inputProperty(value, "z") +
      inputProperty(value, "w")
    )
  },
  Color: (value:Color) => {
    return /*html*/`
      <input type="color" value="#${value.getHex()}">
    `
  },
  null: () => input("null"),
  undefined: () => input("undefined")
}));
const utils = {
  groupOpen: (name:string, icon:string) => {
    return { display:/*html*/`
      <div class="group expandable">
        <div class="group-header">
          <div class="icon">${icon}</div>
          <div>${name}</div>
          <div class="expandable-icon"></div>
        </div>
        <div class="group-container target">` 
    }
  },
  groupClose: () => { return { display:/*html*/`</div></div>` } }
}
const MiscSchema = {
  "BufferAttribute": {
    "id": { "type":"string", locked },
    "count": { "type":"number" },
    "gpuType": { "type":"number", advanced },
    "itemSize": { "type":"number" },
    "usage": { "type":"Usage" }
  },
  "Group": {},
  "Box3": {
    "min": { "type":"Vector3" },
    "max": { "type":"Vector3" }
  },
  "Sphere": {
    "center": { "type":"Vector3" },
    "radius": { "type":"number" },
  }
}
const CoreSchema = {
  "Object3D": {
    "uuid": { "type": "string", locked },
    "name": { "type": "string" },
    "Transform:open": utils.groupOpen("Transform", "deployed_code"),
    "position": { "type": "Vector3" },
    "rotation": { "type": "Euler" },
    "quaternion": { "type": "Quaternion" },
    "scale": { "type": "Vector3" },
    "Transform:close": utils.groupClose(),
    "Matrices:open": utils.groupOpen("Matrices", "grid_on"),
      "matrix": { "type": "Matrix4" },
      "modelViewMatrix": { "type": "Matrix4", advanced },
      "normalMatrix": { "type": "Matrix3", advanced },
      "matrixWorld": { "type": "Matrix4", advanced },
      "matrixAutoUpdate": { "type": "boolean", advanced },
      "matrixWorldNeedsUpdate": { "type": "boolean", advanced },
    "Matrices:close": utils.groupClose(),
    "castShadow": { "type": "boolean" },
    "receiveShadow": { "type": "boolean" },
    "visible": { "type": "boolean" },
    "frustumCulled": { "type": "boolean" },
    "renderOrder": { "type": "number", advanced },
  },
  "BufferGeometry": {
    "attributes": { "type": "Object" },
    "index": { "type": "BufferAttribute" },
    "drawRange": { "type": "Object" },
    "groups": { "type": "Group[]" },
    "boundingBox": { "type": "Box3" },
    "boundingSphere": { "type": "Sphere" },
    "morphAttributes": { "type": "Object" },
  }
}
const CameraSchema = {
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
    "view": { "type": "Object" }
  },
  "OrthographicCamera": {
    "left": { "type": "number" },
    "right": { "type": "number" },
    "top": { "type": "number" },
    "bottom": { "type": "number" },
    "near": { "type": "number" },
    "far": { "type": "number" },
    "zoom": { "type": "number" },
    "view": { "type": "Object" }
  }
}
const LightSchema = {
  "Light": {
    "color": { "type": "Color" },
    "intensity": { "type": "number" },
    "castShadow": { "type": "boolean" }
  },
  "AmbientLight": {},
  "AmbientLightProbe": {},
  "DirectionalLight": {
    "target": { "type": "Object3D" },
    "shadow": { "type": "DirectionalLightShadow" }
  },
  "HemisphereLight": {
    "skyColor": { "type": "Color" },
    "groundColor": { "type": "Color" },
  },
  "HemisphereLightProbe": {
  },
  "PointLight": {
    "distance": { "type": "number" },
    "decay": { "type": "number" },
    "shadow": { "type": "PointLightShadow" }
  },
  "RectAreaLight": {
    "width": { "type": "number" },
    "height": { "type": "number" }
  },
  "SpotLight": {
    "distance": { "type": "number" },
    "angle": { "type": "number" },
    "penumbra": { "type": "number" },
    "decay": { "type": "number" },
    "target": { "type": "Object3D" },
    "shadow": { "type": "SpotLightShadow" }
  }
}
const MeshSchema =  {
  "Mesh": {
    "geometry": { "type": "BufferGeometry" },
    "material": { "type": "Material" },
  },
  "InstancedMesh": {
    "count": { "type": "number" },
    "instanceMatrix": { "type": "InstancedBufferAttribute" },
    "instanceColor": { "type": "InstancedBufferAttribute | null" }
  },
  "SkinnedMesh": {
    "skeleton": { "type": "Skeleton" },
    "bindMatrix": { "type": "Matrix4" },
    "bindMode": { "type": "string" },
    "bindMatrixInverse": { "type": "Matrix4" }
  },
  "BatchedMesh": {
    "groupMaterialMap": { "type": "Map<number, Material>" }
  }
}
const MaterialSchema = {
  root: "Material",
  "Material": {
    "color": { "type": "Color" },
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
    "map": { "type": "Texture" },
    "envMap": { "type": "Texture" },
    "reflectivity": { "type": "number" }
  },
  "MeshLambertMaterial": {
    "emissive": { "type": "color" },
    "emissiveIntensity": { "type": "number" }
  },
  "MeshPhongMaterial": {
    "specular": { "type": "color" },
    "shininess": { "type": "number" },
    "emissive": { "type": "color" }
  },
  "MeshStandardMaterial": {
    "metalness": { "type": "number"  },
    "roughness": { "type": "number" },
    "emissive": { "type": "color" },
    "emissiveIntensity": { "type": "number" }
  },
  "MeshPhysicalMaterial": {
    "clearcoat": { "type": "number", "min": 0, "max": 1 },
    "clearcoatRoughness": { "type": "number", "min": 0, "max": 1 },
    "ior": { "type": "number" },
    "transmission": { "type": "number", "min": 0, "max": 1 },
    "thickness": { "type": "number" },
    "specularIntensity": { "type": "number" }
  },
  "MeshToonMaterial": {
    "gradientMap": { "type": "Texture" }
  },
  "PointsMaterial": {
    "size": { "type": "number" },
    "sizeAttenuation": { "type": "boolean" }
},
  "LineBasicMaterial": {
    "linewidth": { "type": "number" }
  },
  "LineDashedMaterial": {
    "linewidth": { "type": "number" },
    "scale": { "type": "number" },
    "dashSize": { "type": "number" },
    "gapSize": { "type": "number" }
  }
}
export const allSchemas:Map<string, Object> = new Map(Object.entries({
  ...MiscSchema,
  ...CoreSchema,
  ...CameraSchema,
  ...MeshSchema,
  ...LightSchema,
  ...MaterialSchema
}));
