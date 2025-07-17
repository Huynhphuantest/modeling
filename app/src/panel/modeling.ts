import * as Vertex from './modeling/vertex';
import * as Face from './modeling/face';
import * as Edge from './modeling/edge';
import { fixTransformControls, getButtons } from './util';
import { Viewport } from './viewport';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import * as THREE from 'three';
import { Mode } from './mode';

let transform!: TransformControls;
let currentMode: 'vertex' | 'edge' | 'face' = 'vertex';
let modelModes!:Function[];
let modelTools!:Function[];
let selected:THREE.Mesh|null;

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
    Face.init(this.dummy, transform, container); // TODO
    Edge.init(this.dummy, transform, container);

    Viewport.addDev(this.dummy);

    modelModes = getButtons(".model-mode button", [
      () => vertex(),
      () => edge(),
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

  setMode(mode: 'vertex' | 'edge' | 'face') {
    currentMode = mode;
    transform.detach();
    switch (currentMode) {
      case 'vertex': Vertex.enable(true); Edge.enable(false); Face.enable(false); break;
      case 'edge': Vertex.enable(false); Edge.enable(true); Face.enable(false); break;
      case 'face': Vertex.enable(false); Edge.enable(false); Face.enable(true); break;
    }
    if(selected) this.select(selected);
  },

  select(obj: THREE.Object3D) {
    if(!(obj instanceof THREE.Mesh)) return;
    selected = obj;
    switch (currentMode) {
      case 'vertex': Vertex.select(obj); break;
      case 'edge': Edge.select(obj); break;
      case 'face': Face.select(obj); break;
    }
  },

  drop() {
    selected = null;
    Vertex.drop();
    Face.drop();
    Edge.drop();
  },

  // === Tool shortcuts (for Keybinds) ===
  vertex() { modelModes[0]() },
  edge() { modelModes[1]() },
  face() { modelModes[2]() },

  unset() { modelTools[0]() },
  extrude() { modelTools[1]() },
  inset() { modelTools[2]() },
  bevel() { modelTools[3]() },
  knife() { modelTools[4]() },
  merge() { modelTools[5]() }
};

function vertex() { Modeling.setMode('vertex'); }
function edge() { Modeling.setMode('edge'); }
function face() { Modeling.setMode('face'); }

function unset() { document.dispatchEvent(new CustomEvent("unset")) }
function extrude() {  document.dispatchEvent(new CustomEvent("extrude")) }
function inset() {  document.dispatchEvent(new CustomEvent("inset")) }
function bevel() {  document.dispatchEvent(new CustomEvent("bevel")) }
function knife() {  document.dispatchEvent(new CustomEvent("knife")) }
function merge() {  document.dispatchEvent(new CustomEvent("merge")) }