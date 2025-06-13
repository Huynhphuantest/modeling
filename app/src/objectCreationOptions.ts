import * as THREE from "three";
import { addObject } from "./viewport";
let hasRendered = false;
const waits:(() => void)[] = []
const material = new THREE.MeshPhysicalMaterial({
    color:"#049ef4",
    iridescence: 1,
    roughness: 0.2,
    metalness: 0.5,
    thickness:1,
    ior:3,
});
const wireframeMaterial = new THREE.LineBasicMaterial({
    color:'white',
    linewidth:1,
});
document.querySelector("#add-object-button")?.addEventListener("click", async () => {{
    (document.querySelector("#object-creation-modal") as any).showModal();
    const time = performance.now();
    if(!hasRendered) waits.forEach(e => e());
    console.log(performance.now() - time);
    hasRendered = true;
}});
const modal = document.querySelector("#object-creation-modal") as HTMLDialogElement;
modal.onclick = escape;
const panel = document.querySelector("#object-creation-options");

panel?.addEventListener("click", (event) => event.stopPropagation());
window.addEventListener("resize", async () => {
    waits.forEach(e => e());
});
function escape() {
    modal.close()
}

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setClearColor("#24272b");
renderer.setPixelRatio(window.devicePixelRatio);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
camera.position.set(1,1,1.5);
camera.lookAt(new THREE.Vector3(0,0,0));
scene.add(camera);
const ambient = new THREE.AmbientLight("white", 0.3);
scene.add(ambient);
const light = new THREE.DirectionalLight("white", 3);
light.position.set(-0.5,3,2)
scene.add(light);
const wireframe = new THREE.LineSegments(new THREE.BufferGeometry(), wireframeMaterial)
scene.add(wireframe);
const demoObj = new THREE.Mesh(new THREE.BufferGeometry(), material);
scene.add(demoObj);
let dimension = undefined;

function addOption(name:string,geometryFunc:() => THREE.BufferGeometry) {
    const el = document.createElement("div");
    el.classList.add("option");
    
    const demo = document.createElement("div");
    demo.classList.add("demo");
    el.appendChild(demo);

    const title = document.createElement("div");
    title.classList.add("title");
    title.innerText = name;
    title.style.zIndex = "2";
    el.appendChild(title);
    
    const canvas = document.createElement("canvas");
    demo.appendChild(canvas);
    
    const geometry = geometryFunc();
    
    
    waits.push(() => {
        if(!dimension) {
            dimension = demo.getBoundingClientRect();
            wireframeMaterial.resolution = new THREE.Vector2(dimension.width, dimension.height);
            camera.aspect = dimension.width / dimension.height;
            camera.updateProjectionMatrix();
            renderer.setSize(dimension.width, dimension.height);
        }
        demoObj.geometry.dispose();
        demoObj.geometry = geometry;
        wireframe.geometry.dispose();
        wireframe.geometry = new THREE.WireframeGeometry(geometry);
        renderer.render(scene, camera);
        canvas.width = renderer.domElement.width;
        canvas.height = renderer.domElement.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(renderer.domElement, 0, 0);
    });
    
    panel?.appendChild(el);

    el.onclick = () => {
        addObject(new THREE.Mesh(
            geometry,
            material.clone()
        ));
        escape();
    }
}
addOption("Box", () => new THREE.BoxGeometry(1, 1, 1)); // Volume = 1

addOption("Sphere", () => new THREE.SphereGeometry(1 / Math.cbrt((4/3) * Math.PI), 32, 24)); 
// r ≈ 0.62

addOption("Cylinder", () => new THREE.CylinderGeometry(Math.sqrt(1 / (Math.PI * 1)), Math.sqrt(1 / (Math.PI * 1)), 1, 32));
// r ≈ 0.564, h = 1

addOption("Cone", () => new THREE.ConeGeometry(Math.sqrt(3 / (Math.PI * 1)), 1, 32));
// r ≈ 0.84, h = 1

addOption("Torus", () => new THREE.TorusGeometry(0.4, Math.sqrt(1 / (2 * Math.PI * Math.PI * 0.4)), 16 , 32)); 
// R = 0.4, r ≈ 0.28

addOption("Tetrahedron", () => new THREE.TetrahedronGeometry(0.78));
// a ≈ 0.78

addOption("Octahedron", () => new THREE.OctahedronGeometry(0.63));
// a ≈ 0.63

addOption("Dodecahedron", () => new THREE.DodecahedronGeometry(Math.cbrt(4 / (15 + 7 * Math.sqrt(5)))));
// a ≈ 0.73

addOption("Icosahedron", () => new THREE.IcosahedronGeometry(Math.cbrt(12 / (5 * (3 + Math.sqrt(5))))));
// a ≈ 0.76

addOption("Plane", () => new THREE.PlaneGeometry(1.2, 1.2));
// No volume, just visual

addOption("Circle", () => new THREE.CircleGeometry(0.6, 32));
// No volume, area ~1.13

addOption("Ring", () => new THREE.RingGeometry(0.4, 0.6, 32));
// Visual size match
