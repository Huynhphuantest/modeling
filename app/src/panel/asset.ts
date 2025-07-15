import DOMPurify from "dompurify";
import * as THREE from 'three';

//
// ─── CREATE NODE ─────────────────────────────────────────────────────────────
//
function createNode(
    name: string,
    display: string,
): HTMLElement {
    const html = `
        <div class="asset">
            <div class="display">${display}</div>
            <div class="head" title="Double-click to rename">${name}</div>
        </div>
    `;
    const el = document.createElement("div");
    el.innerHTML = DOMPurify.sanitize(html);
    const node = el.firstElementChild as HTMLElement;

    const headEl = node.querySelector(".head") as HTMLElement;
    const onRename = (newName:string) => {
        AssetManager.render();
    }
    headEl.addEventListener("dblclick", () => {
        const input = document.createElement("input");
        input.value = name;
        input.className = "rename-input";
        headEl.replaceWith(input);
        input.focus();

        const finish = () => {
            const newName = input.value.trim() || name;
            onRename(newName);
        };

        input.addEventListener("blur", finish);
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") input.blur();
        });
    });

    return node;
}
function defaultIcon():string {
    return /*html*/`<div class='icon'>files</div>`;
}

//
// ─── BASE ASSET ──────────────────────────────────────────────────────────────
//
abstract class Asset {
    constructor(
        public name: string,
    ) {}

    abstract onDrag(): void;

    render(): HTMLElement {
        const el = createNode(this.name, defaultIcon());

        el.setAttribute("draggable", "true");

        el.addEventListener("dragstart", () => {
            if (this.onDrag) {
                this.onDrag();
            } else {
                AssetManager.dragged = this;
            }
        });

        return el;
    }
}

//
// ─── ASSET TYPES ─────────────────────────────────────────────────────────────
//
class Material extends Asset {
    constructor(name:string) {
        super(name);
    }
    onDrag() {}
    getType() { return "Material"; }
}
class Object3D extends Asset {
    constructor(name:string) {
        super(name);
    }
    onDrag() {}
    getType() { return "Material"; }
}
class Map extends Asset {
    constructor(name:string) {
        super(name);
    }
    onDrag() {}
    getType() { return "Material"; }
}

export const Assets = {
    Material,
    Object3D,
    Map
};

//
// ─── ASSET MANAGER ───────────────────────────────────────────────────────────
//

let panel = document.body;
export const AssetManager = {
    assets: [] as Asset[],
    dragged: null as Asset | null,
    init() {
        panel = document.getElementById("assets-container")!;
        const material = new THREE.MeshStandardMaterial({ color: 'red' });
        AssetManager.add(new Assets.Material("Red"));

        const cube = new THREE.Mesh(new THREE.BoxGeometry(), material);
        AssetManager.add(new Assets.Object3D("Cube"));
    },
    add(asset: Asset) {
        this.assets.push(asset);
        this.render();
    },

    remove(asset: Asset) {
        const index = this.assets.indexOf(asset);
        if (index === -1) return;
        this.assets.splice(index, 1);
        this.render();
    },

    render() {
        panel.innerHTML = "";

        this.assets.forEach((asset, index) => {
            const el = asset.render();

            el.addEventListener("dragover", (e) => {
                e.preventDefault();
                el.classList.add("drag-over");
            });

            el.addEventListener("dragleave", () => {
                el.classList.remove("drag-over");
            });

            el.addEventListener("drop", () => {
                el.classList.remove("drag-over");

                if (!this.dragged || this.dragged === asset) return;

                const fromIndex = this.assets.indexOf(this.dragged);
                const toIndex = index;

                if (fromIndex !== -1 && toIndex !== -1) {
                    const draggedItem = this.assets.splice(fromIndex, 1)[0];
                    this.assets.splice(toIndex, 0, draggedItem);
                    this.dragged = null;
                    this.render();
                }
            });

            panel.appendChild(el);
        });
    }
};