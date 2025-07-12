import * as Vertex from './modeling/vertex';
import * as Face from './modeling/face';
import * as Edge from './modeling/edge';
import { fixTransformControls, getButtons } from './util';
import { Viewport } from './viewport';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import * as THREE from 'three';
import { Mode } from './mode';

let transform!: TransformControls;
let currentMode: 'vertex' | 'face' = 'vertex';
let modelModes!:Function[];
let modelTools!:Function[];

export const Modeling = {
  vertexPositions: [] as THREE.Vector3[],
  dummy: new THREE.Object3D(),

  init(container: HTMLElement) {
    transform = new TransformControls(Viewport.camera, Viewport.renderer.domElement);
    fixTransformControls(transform);
    document.addEventListener("modechange", () => {
      if(Mode.current === "modeling") {
        Viewport.devScene.add(transform.getHelper());
        transform.enabled = true;
        this.setMode(currentMode);
        Edge.enable(true);
      }
      else {
        Viewport.devScene.remove(transform.getHelper());
        transform.enabled = false;
        Vertex.enable(false);
        Face.enable(false);
        Edge.enable(false);
      }
    });
    this.transform = transform;

    Vertex.init(this.dummy, transform, container);
    Face.init(); // TODO
    Edge.init(container);

    Viewport.addDev(this.dummy);

    modelModes = getButtons(".model-mode button", [
      () => vertex(),
      () => face(),
    ]);

    modelTools = getButtons(".model-tool button", [
      () => unset(),
      () => extrude(),
      () => inset(),
      () => bevel(),
      () => knife(),
      () => merge(),
    ]);
  },

  transform,

  setMode(mode: 'vertex' | 'face') {
    currentMode = mode;
    transform.detach();
    switch (currentMode) {
      case 'vertex': Vertex.enable(true); Face.enable(false); break;
      case 'face': Vertex.enable(false); Face.enable(true); break;
    }
  },

  select(obj: THREE.Object3D) {
    switch (currentMode) {
      case 'vertex': Vertex.select(obj); break;
      case 'face': Face.select(obj); break;
    }
    Edge.select(obj);
  },

  drop() {
    Vertex.drop();
    Face.drop();
    Edge.drop();
  },

  // === Tool shortcuts (for Keybinds) ===
  vertex() { modelModes[0]() },
  face() { modelModes[1]() },

  unset() { modelTools[0]() },
  extrude() { modelTools[1]() },
  inset() { modelTools[2]() },
  bevel() { modelTools[3]() },
  knife() { modelTools[4]() },
  merge() { modelTools[5]() }
};

function vertex() { Modeling.setMode('vertex'); }
function face() { Modeling.setMode('face'); }

function unset() { console.log('Unset'); }
function extrude() { console.log('Extrude'); }
function inset() { console.log('Inset'); }
function bevel() { console.log('Bevel'); }
function knife() { console.log('Knife'); }
function merge() { console.log('Merge');  }