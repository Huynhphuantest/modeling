import { Editor } from "./editor";
import { Viewport } from "./viewport";
const pans:Function[][] = [];
function initPan() {
    document.querySelectorAll(".pan").forEach((e => {
        const arr = e.children;
        (arr[0] as HTMLButtonElement).addEventListener("click", () => Viewport.setTransformMode('translate'));
        (arr[1] as HTMLButtonElement).addEventListener("click", () => Viewport.setTransformMode('rotate'));
        (arr[2] as HTMLButtonElement).addEventListener("click", () => Viewport.setTransformMode('scale'));
        pans.push([
            () => (arr[0] as HTMLButtonElement).click(),
            () => (arr[1] as HTMLButtonElement).click(),
            () => (arr[2] as HTMLButtonElement).click()
        ]);
    }));
}
function initDelete() {
    document.querySelectorAll(".delete").forEach(e => {
        e.addEventListener("click", Tool.delete);
    });
}
export const Tool = {
    init() {
        initPan();
        initDelete();
    },
    translate() { pans.forEach(e => e[0]())},
    rotate() { pans.forEach(e => e[1]()) },
    scale() { pans.forEach(e => e[2]()) },
    delete() { Editor.delete() }
}