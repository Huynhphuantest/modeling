import { Object3D } from 'three';
import DOMPurify from 'dompurify';
import { Editor } from './editor.ts';
import { Dropdown } from '../component/dropdown.ts';
import { Expandable } from '../component/expandable.ts';
import { Radio } from '../component/radio.ts';
import { getObjectIcon, getObjectMask } from '../config/schema.ts';

const panel = document.querySelector("#hierarchy-container")! as HTMLElement;
Dropdown.observeIn(panel);
Expandable.observeIn(panel);
Radio.observeIn(panel);

// Safe check to avoid circular parenting
function isDescendantOf(self:Object3D, target: Object3D): boolean {
  let parent = self.parent;
  while (parent) {
    if (parent === target) return true;
    parent = parent.parent;
  }
  return false;
};

function traverse(obj: Object3D): string {
  const hasChildren = obj.children.length > 0;
  const name = obj.name.trim() || "Unnamed";
  const displayName = obj.name.trim() ? name : `<span class="empty">${name}</span>`;

  let html = /*html*/`
    <div class="${hasChildren ? "expandable" : ""}">
      <div class="header" draggable="true" data-uuid="${obj.uuid}">
        ${getObjectIcon(obj)}
        <div class="name">${displayName}</div>
        <div class="type">:${obj.type}</div>
        ${hasChildren ? `<div class="expandable-icon"></div>` : ""}
      </div>`;

  if (hasChildren) {
    html += `<div class="target">`;
    for (const child of obj.children) {
      html += traverse(child);
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

export const Hierarchy = {
  render(root: Object3D) {
    const html = root.children.map(traverse).join('');
    panel.innerHTML = DOMPurify.sanitize(html);

    let draggedUUID: string | null = null;

    const headers = panel.querySelectorAll('.header');
    headers.forEach(element => {
      const header = element as HTMLElement;
      const uuid = header.getAttribute('data-uuid')!;
      const object = root.getObjectByProperty('uuid', uuid)!;

      // Select on click
      header.addEventListener('click', () => {
        Editor.select(object);
      });

      // Drag start
      header.addEventListener('dragstart', (e: DragEvent) => {
        draggedUUID = uuid;
        e.dataTransfer?.setData('text/plain', uuid);
      });

      // Allow drop
      header.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
        header.classList.add('drag-target');
      });

      header.addEventListener('dragleave', () => {
        header.classList.remove('drag-target');
      });

      // Drop on target header
      header.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        header.classList.remove('drag-target');

        const targetUUID = uuid;
        if (!draggedUUID || draggedUUID === targetUUID) return;

        const dragged = root.getObjectByProperty('uuid', draggedUUID)!;
        const target = root.getObjectByProperty('uuid', targetUUID)!;

        if (!isDescendantOf(target, dragged)) {
          target.add(dragged);
          Hierarchy.render(root);
          Editor.select(dragged);
        }
      });
    });

    // Fallback drop to scene (root) if dropped outside headers
    panel.addEventListener('dragover', e => e.preventDefault());

    panel.addEventListener('drop', (e: DragEvent) => {
      const isHeader = (e.target as HTMLElement).closest('.header');
      if (isHeader) return; // already handled

      e.preventDefault();
      const uuid = draggedUUID;
      draggedUUID = null;

      if (!uuid) return;

      const obj = root.getObjectByProperty('uuid', uuid)!;
      if (obj && obj.parent !== root) {
        root.add(obj); // move to scene
        Hierarchy.render(root);
        Editor.select(obj);
      }
    });
  }
};