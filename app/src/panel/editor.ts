import * as THREE from 'three';
import { Viewport } from './viewport.ts';
import { Keybinds } from './keybinds.ts';
import { Inspector } from './inspect.ts';
import { Hierarchy } from './hierarchy.ts';
import { Modeling } from './modeling.ts';
import { Tool } from './tool.ts';
import { Mode } from './mode.ts';

type PickCallback = (obj: THREE.Object3D | null) => void;

export const Editor = {
  init(container: HTMLDivElement) {
    Viewport.init(container);
    Modeling.init(container);
    Tool.init();
    Keybinds.init();
    this.setupPicking();
    this.setupTransformSync();
  },
  setupPicking() {
    Viewport.enablePicking((obj: THREE.Object3D | null) => {
      if (obj) this.select(obj);
      else this.drop();
    });
  },
  updateBox() {
    if (Viewport.transform.object) {
      Viewport.boundingBoxOutline.setFromObject(Viewport.transform.object);
      Viewport.boundingBoxOutline.update();
    }
  },
  setupTransformSync() {
    const { domElement: dom } = Viewport.renderer;
    const { transform, orbit, boundingBoxOutline, camera } = Viewport;
    transform.addEventListener("mouseDown", () => {
      dom.addEventListener("pointermove", this.updateBox);
      orbit.enabled = false;
    });
    transform.addEventListener("mouseUp", () => {
      dom.removeEventListener("pointermove", this.updateBox);
      orbit.enabled = true;
    });
    transform.addEventListener("change", () => {
      if (!transform.object) return;
      const anyTransform = transform as any;
      transform.object.updateMatrixWorld();
      transform.object.parent?.updateMatrixWorld();
      transform.object.matrixWorld.decompose(
        anyTransform.worldPosition,
        anyTransform.worldQuaternion,
        anyTransform._worldScale
      );

      anyTransform._plane.quaternion.copy(camera.quaternion);
      anyTransform._plane.position.copy(anyTransform.worldPosition);
      anyTransform._plane.updateMatrixWorld(true);
    });
  },
  select(object: THREE.Object3D) {
    Viewport.select(object);
    Inspector.inspect(object);
  },
  drop() {
    if(Mode.current !== "layout") return;
    Viewport.drop();
    Inspector.clear();
  },
  delete() {
    const selected = Viewport.transform.object;
    if (!selected) return;
    Viewport.removeObject(selected);
    this.drop();
    Hierarchy.render(Viewport.scene);
    Inspector.clear();
  },
  addObject(obj: THREE.Object3D) {
    Viewport.addObject(obj);
    Hierarchy.render(Viewport.scene);
  },
  get scene() {
    return Viewport.scene;
  },
  get selected(): THREE.Object3D | null {
    return Viewport.transform.object ?? null;
  }
};