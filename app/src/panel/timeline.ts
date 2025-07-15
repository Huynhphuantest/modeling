import * as THREE from 'three';
import { Editor } from './editor';
import DOMPurify from 'dompurify';
import { Dropdown } from '../component/dropdown';
import { Expandable } from '../component/expandable';

const SVG_NS = "http://www.w3.org/2000/svg";

let panel: HTMLElement;
let graph: HTMLElement;
let stamp: HTMLElement;
let hierarchy: HTMLElement;

type TimeFunction = (t: number) => number;

const Interpolation = {
  Default: (t: number) => t,
  EaseIn: (t: number) => t * t,
  EaseOut: (t: number) => 1 - (1 - t) * (1 - t),
} satisfies Record<string, TimeFunction>;

const sectionColor = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"];
let sectionIndex = 0;

function createSection(background?: string): SVGSVGElement {
  if (!background) {
    background = sectionColor[sectionIndex % sectionColor.length];
    sectionIndex++;
  }
  const svg = document.createElementNS(SVG_NS, "svg");
  const width = 2000;
  const height = 32;
  svg.style.background = background + "44";
  svg.setAttribute("width", `${width}`);
  svg.setAttribute("height", `${height}`);
  return svg;
}
function renderSection(svg:SVGSVGElement) {
  const width = svg.width.baseVal.value;
  const height = svg.height.baseVal.value;
  svg.innerHTML = "";

  const segment = Math.floor(width / TimelineManager.scale);
  for (let i = 1; i <= segment; i++) {
    drawLine(svg, i * TimelineManager.scale, 0, i * TimelineManager.scale, height, "#00000044", 4);
  }
}

class Keyframe {
  constructor(public time: number, public value: number) {}
}

class KeyType {
  dom: HTMLElement;
  timeline?: Timeline;

  constructor(
    public time: number,
    public value: number,
    public func: TimeFunction
  ) {
    this.dom = document.createElement("div");
    this.dom.classList.add("key", "icon");
    this.dom.setHTMLUnsafe("location_on");

    this.attachDrag();
  }

  attachDrag() {
    this.dom.addEventListener("pointerdown", (e) => {
      if(!this.timeline) return;
      e.preventDefault();
      e.stopPropagation();
      const svgLeft = graph.getBoundingClientRect().left;

      const onMove = (ev: PointerEvent) => {
        const x = ev.clientX - svgLeft + graph.scrollLeft;

        console.log(x);
        this.time = x / TimelineManager.scale;
        this.timeline!.sort();
        this.timeline!.render(); // full redraw
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  }
}

function Key(time: number, value: number, func: TimeFunction): KeyType {
  return new KeyType(time, value, func);
}

class Animation {
  duration = -1;
  tracks: THREE.KeyframeTrack[] = [];
  mixer: THREE.AnimationMixer;
  timelines: Timeline[] = [];

  constructor(public target: THREE.Object3D) {
    this.mixer = new THREE.AnimationMixer(target);
  }

  add(...timelines: Timeline[]) {
    this.timelines.push(...timelines);
  }

  play() {
    const tracks = this.timelines.map(t => t.toTrack(this.target));
    const clip = new THREE.AnimationClip("clip", this.duration, tracks);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 0);
    action.play();
  }

  setTime(t: number) {
    this.mixer.setTime(t);
  }
}

class Timeline {
  svg: SVGSVGElement;
  keyframes: Keyframe[];
  keys: KeyType[];
  constructor(keys: KeyType[], public path: string) {
    this.keys = keys;
    this.keys.forEach(key => key.timeline = this);
    this.keyframes = [];
    this.svg = createSection();
    this.sort();
    this.bake();
    renderSection(this.svg);
    graph.appendChild(this.svg);
  }
  sort() {
    this.keys.sort((a,b) => {return a.time - b.time});
  }
  bake() {
    for (let i = 1; i < this.keys.length; i++) {
      this.keyframes.push(...bakeCurve(
        this.keys[i - 1].time, this.keys[i].time,
        this.keys[i - 1].value, this.keys[i].value,
        this.keys[i].func
      ));
    }
  }
  toTrack(target: THREE.Object3D): THREE.KeyframeTrack {
    const times = this.keyframes.map(k => k.time);
    const values = this.keyframes.map(k => k.value);
    return new THREE.NumberKeyframeTrack(`${target.uuid}.${this.path}`, times, values);
  }

  set top(value: number) {
    this.svg.style.top = `${value}px`;
  }

  render() {
    renderSection(this.svg);
    const height = parseInt(this.svg.getAttribute("height")!);
    const scale = TimelineManager.scale;

    // Remove all current DOM
    this.keys.forEach(k => k.dom.remove());

    for (let i = 0; i < this.keys.length; i++) {
      const lastTime = i > 0 ? this.keys[i - 1].time : 0;
      const key = this.keys[i];

      renderSegment(this.svg, key.func, lastTime, key.time, scale, height, "white");
      drawLine(this.svg, key.time * scale, 0, key.time * scale, height, "lightblue", 1);

      // Draw key DOM
      key.dom.style.left = `${key.time * scale}px`;
      key.dom.style.top = `${this.svg.style.top + height / 2}px`;
      graph.appendChild(key.dom);
    }
  }
}

type Edit = {
  target: THREE.Object3D,
  properties: string[],
  timeline: Timeline[],
};

export const TimelineManager = {
  animations: [] as Animation[],
  editing: [] as Edit[],
  snap: 24,
  scale: 500,
  currentTime: 0,

  init() {
    panel = document.getElementById("timeline-container")!;
    graph = panel.querySelector("#timeline-graph")!;
    stamp = panel.querySelector("#timeline-stamp")!;
    hierarchy = document.getElementById("timeline-hierarchy-container")!;

    const obj1 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
    Editor.addObject(obj1);

    const t1 = new Timeline([
      Key(0, 0, Interpolation.Default),
      Key(0.5, 10, Interpolation.EaseOut),
      Key(0.6, 1000, Interpolation.EaseIn),
      Key(1, 10, Interpolation.EaseIn)
    ], "position[x]");

    this.editing.push({
      target: obj1,
      properties: ["position[x]"],
      timeline: [t1]
    });

    const animation = new Animation(obj1);
    animation.add(t1);
    this.animations.push(animation);

    setTimeout(() => animation.play(), 1000);

    this.render();
  },

  render() {
    hierarchy.innerHTML = DOMPurify.sanitize(`
      ${this.editing.map((edit, index) => `
        <div id="index${index}">
          <div class="header">
            ${edit.target.name || "Unnamed"}
            <div class="expandable-icon"></div>
          </div>
          <div class="target">
            ${edit.properties.map(p => `<div class="property">${p}</div>`).join("")}
          </div>
        </div>
      `).join("")}
    `);

    this.editing.forEach((edit, index) => {
      const container = hierarchy.querySelector(`#index${index}`)!;
      Expandable.attach(container);

      const target = container.querySelector(".target")!;
      container.addEventListener("click", () => {
        for (let i = 0; i < target.children.length; i++) {
          const element = target.children[i] as HTMLElement;
          const timeline = edit.timeline[i];
          element.style.background = timeline.svg.style.background;
          timeline.top = element.getBoundingClientRect().top;
          timeline.render();
        }
      });
    });
  },

  update() {
    this.setTime(Editor.clock.elapsedTime);
  },

  setTime(time: number) {
    this.currentTime = time;
    this.animations.forEach(anim => anim.setTime(time));
  }
};

function drawLine(
  svg: SVGSVGElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = "black",
  width = 1
): SVGLineElement {
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("x1", x1.toString());
  line.setAttribute("y1", y1.toString());
  line.setAttribute("x2", x2.toString());
  line.setAttribute("y2", y2.toString());
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", width.toString());
  svg.appendChild(line);
  return line;
}

function renderSegment(
  svg: SVGSVGElement,
  func: TimeFunction,
  startTime: number,
  endTime: number,
  scale: number,
  height: number,
  color = "black"
) {
  const midY = height / 2;
  const sampleCount = 128;
  const path = document.createElementNS(SVG_NS, "path");

  let d = "";
  for (let i = 0; i <= sampleCount; i++) {
    const t = i / sampleCount;
    const time = startTime + (endTime - startTime) * t;
    const value = func(t);
    const diff = value - t;
    const x = time * scale;
    const y = midY - diff * (height / 2);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  path.setAttribute("d", d);
  path.setAttribute("stroke", color);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-width", "1");
  svg.appendChild(path);
}

function bakeCurve(
  startTime: number,
  endTime: number,
  startValue: number,
  endValue: number,
  easingFunc: TimeFunction,
  sampleCount = 30
): Keyframe[] {
  const keys: Keyframe[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const t = i / sampleCount;
    const eased = easingFunc(t);
    const time = startTime + (endTime - startTime) * t;
    const value = startValue + (endValue - startValue) * eased;
    keys.push(new Keyframe(time, value));
  }
  return keys;
}

export function hasPropertyChanged(object: THREE.Object3D, path: string, prevValue: any): boolean {
  const segments = path.split(".");
  let current: any = object;
  for (const segment of segments) {
    const match = segment.match(/(\w+)(\[(\w+)\])?/);
    if (!match) return false;
    const prop = match[1];
    const index = match[3];

    current = current[prop];
    if (index !== undefined) {
      const idx = index === "x" ? 0 : index === "y" ? 1 : index === "z" ? 2 : parseInt(index);
      current = current?.[idx];
    }
    if (current === undefined) return false;
  }
  return current !== prevValue;
}