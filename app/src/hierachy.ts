import { Object3D } from 'three';
import { updateAllExpandableIn } from './component/expandable.ts'
import DOMPurify from 'dompurify';
import { select } from './viewport.ts';

const panel = document.querySelector("#hierachy-container")!;

export function hierachy(obj:Object3D) {
    const html = function ():string {
        let res = '';
        obj.children.forEach((e) => {res += traverse(e)});
        return res;
    }();
    panel.innerHTML = DOMPurify.sanitize(html);
    document.querySelectorAll('.header').forEach(header => {
        const uuid = header.getAttribute('data-uuid')!;

        header.addEventListener('click', () => {
            const child = obj.getObjectByProperty('uuid', uuid)!; // your UUID
            select(child);
        });
    });

    updateAllExpandableIn(panel);
}
function traverse(obj:Object3D) {
    let html = /*html*/`
        <div class="${obj.children.length > 0 ? "expandable" : ""}">
            <div class="header" data-uuid="${obj.uuid}">
                <div class="name" onclick="(e) => e.stopPropagation()">${obj.name}</div>
                :
                <div class="type">${obj.type}</div>`
    if(obj.children.length > 0) {
        html += /*html*/`
                <div class="expandable-icon"></div>
            </div>`
        html += /*html*/`
        <div class="target">`;
        for(const child of obj.children) {
            html += traverse(child);
        }
        html += /*html*/`</div>`
    } else html += /*html*/`</div>`;
    return html+/*html*/`</div>`;
}