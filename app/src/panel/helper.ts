import * as THREE from 'three';
import { Viewport } from './viewport';

const helpers: Helper[] = [];

export abstract class Helper {
  object: THREE.Object3D;

  constructor(object: THREE.Object3D, visual: THREE.Object3D) {
    this.object = object;
    helpers.push(this);
    Viewport.devScene.add(visual);
  }

  abstract update(): void;

  static updateAll() {
    for (const h of helpers) h.update();
  }
}

// === LIGHT HELPER ===

export class LightHelper extends Helper {
  visual: THREE.Object3D |
    THREE.SpotLightHelper |
    THREE.PointLightHelper |
    THREE.HemisphereLightHelper |
    THREE.DirectionalLightHelper;
  target: THREE.Object3D;
  constructor(light: THREE.Light) {
    let visual;
    if(light instanceof THREE.PointLight) {
        visual = new THREE.PointLightHelper(light);
    } else if(light instanceof THREE.DirectionalLight) {
        visual = new THREE.DirectionalLightHelper(light);
    } else if(light instanceof THREE.HemisphereLight) {
        visual = new THREE.HemisphereLightHelper(light, light.intensity);
    } else if(light instanceof THREE.SpotLight) {
        visual = new THREE.SpotLightHelper(light);
    } else visual = new THREE.Object3D();
    super(light, visual);
    this.visual = visual;
    this.target = light;
    new THREE.TextureLoader().load(
        'assets/light.svg',
        (data) => {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map:data
            }));
            this.visual.add(sprite);
            sprite.scale.set(2,2,2);
        },
        undefined, 
        (err) => { throw err }
    );
  }
  update() {
    if ('update' in this.visual) {
      (this.visual as any).update(); // may optimize
    }
    this.visual.visible = this.object.visible;
  }
}

// === BONE HELPER ===

export class BoneHelper extends Helper {
  visual: THREE.SkeletonHelper;

  constructor(object: THREE.SkinnedMesh) {
    const skeletonHelper = new THREE.SkeletonHelper(object);
    super(object, skeletonHelper);
    this.visual = skeletonHelper;
  }

  update() {
    this.visual.update();
    this.visual.visible = this.object.visible;
  }
}

function sync(A:THREE.Object3D, B:THREE.Object3D) {
    A.position.copy(B.position);
    A.quaternion.copy(B.quaternion);
    A.scale.copy(B.scale);
}
export function getHelper(object: THREE.Object3D): Helper[] {
  const helpers: Helper[] = [];

  function traverse(obj: THREE.Object3D) {
    if (obj instanceof THREE.Light) {
      helpers.push(new LightHelper(obj));
    } else if ((obj as THREE.SkinnedMesh).skeleton instanceof THREE.Skeleton) {
      helpers.push(new BoneHelper(obj as THREE.SkinnedMesh));
    }

    for (const child of obj.children) {
      traverse(child);
    }
  }

  traverse(object);
  return helpers;
}