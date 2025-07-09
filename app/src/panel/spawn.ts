import * as THREE from "three";
import { Editor } from "./editor.ts";

const material = new THREE.MeshStandardMaterial({ color: "#cccccc" });
type Option = { name: string; factory: () => THREE.Object3D, icon:string };
const dom = document.getElementById("edit")!;
const categories = new Map<string, HTMLElement>;
const map = new Map<string, Option[]>();

function addOption(category: string, name: string, icon:string, factory: () => THREE.Object3D) {
  if (!categories.has(category)) throw new Error("No such category: "+category);
  map.get(category)!.push({ name, icon, factory });
}
const panel = dom.querySelector(".dropdown-options")!;
function addCategory(name:string, icon:string) {
  const container = document.createElement("div");
  container.classList.add("dropdown");
  const selected = document.createElement("div");
  selected.classList.add("dropdown-selected");
  container.appendChild(selected);
  selected.innerHTML = /*html*/`
    <div class="icon">${icon}</div>${name}
  `;
  const options = document.createElement('div');
  options.classList.add("dropdown-options");
  container.appendChild(options);
  categories.set(name, options);
  map.set(name, []);
  panel.appendChild(container);
}

function populateDropdowns() {
  map.forEach((options, category) => {
    const container = categories.get(category)!;
    options.forEach(option => {
      const item = document.createElement("div");
      item.classList.add("dropdown-option");
      item.innerHTML = /*html*/`<div class="icon">${option.icon}</div>${option.name}`;
      item.addEventListener("click", () => {
        const obj = option.factory();
        obj.name = option.name;
        Editor.addObject(obj);
      });
      container.appendChild(item);
    });
  });
}

// Geometry
addCategory("Geometry", "shapes");
addOption("Geometry", "Box", "deployed_code", () => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material.clone()));
addOption("Geometry", "Sphere", "ev_shadow", () => new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 24), material.clone()));
addOption("Geometry", "Cylinder", "database", () => new THREE.Mesh(new THREE.CylinderGeometry(0.564, 0.564, 1, 32), material.clone()));
addOption("Geometry", "Cone", "tornado", () => new THREE.Mesh(new THREE.ConeGeometry(0.84, 1, 32), material.clone()));
addOption("Geometry", "Torus", "donut_small", () => new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.28, 16, 32), material.clone()));
addOption("Geometry", "Tetrahedron", "change_history", () => new THREE.Mesh(new THREE.TetrahedronGeometry(0.78), material.clone()));
addOption("Geometry", "Octahedron", "pentagon", () => new THREE.Mesh(new THREE.OctahedronGeometry(0.63), material.clone()));
addOption("Geometry", "Dodecahedron", "hexagon", () => new THREE.Mesh(new THREE.DodecahedronGeometry(0.73), material.clone()));
addOption("Geometry", "Icosahedron", "brightness_empty", () => new THREE.Mesh(new THREE.IcosahedronGeometry(0.76), material.clone()));
addOption("Geometry", "Plane", "airlines", () => new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), material.clone()));
addOption("Geometry", "Circle", "circle", () => new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), material.clone()));
addOption("Geometry", "Ring", "donut_large", () => new THREE.Mesh(new THREE.RingGeometry(0.4, 0.6, 32), material.clone()));

// Lights
addCategory("Light", "sunny");
addOption("Light", "Ambient", "all_out", () => new THREE.AmbientLight("white", 1));
addOption("Light", "Directional", "flashlight_on", () => {
  const l = new THREE.DirectionalLight("white", 3);
  l.position.set(3, 3, 3);
  return l;
});
addOption("Light", "Point", "flare", () => new THREE.PointLight("white", 5));
addOption("Light", "Spot", "nest_cam_floodlight", () => {
  const l = new THREE.SpotLight("white", 3);
  l.position.set(2, 2, 2);
  return l;
});

// Group
addCategory("Group", "more_horiz");
addOption("Group", "Group", "", () => new THREE.Group());

populateDropdowns();