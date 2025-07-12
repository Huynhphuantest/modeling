import { Dropdown } from '../component/dropdown.ts';
import { Expandable } from '../component/expandable.ts';
import { Radio } from '../component/radio.ts';
import {
  Property,
  valueDisplay,
  setTarget,
  attachSchemaListeners
} from '../config/schema.ts';

import {
  allSchemas,
  getObjectMask,
  getObjectIcon,
} from '../config/schema-data.ts';

const panel = document.querySelector("#inspector-container")! as HTMLElement;
Dropdown.observeIn(panel);
Expandable.observeIn(panel);
Radio.observeIn(panel);

let currentTarget: any = null;

export const Inspector = {
  inspect(obj: any) {
    currentTarget = obj;
    setTarget(obj);
    const schemaNames = Inspector.getSchemas(obj);
    const schema = Inspector.getProperties(schemaNames);
    const html = Inspector.renderSchema(obj, schema);
    panel.innerHTML = html;
    attachSchemaListeners(panel);
  },

  clear() {
    panel.innerHTML = "";
    currentTarget = null;
  },

  getSchemas(obj: any): string[] {
    const chain: string[] = [];
    let ctor = obj?.constructor;
    const stopSet = new Set(['EventDispatcher', 'Object']);
    while (ctor && ctor.name && !stopSet.has(ctor.name)) {
      chain.push(ctor.name.replace(/^_/, ""));
      ctor = Object.getPrototypeOf(ctor);
    }
    return chain;
  },

  getProperties(schemas: string[]): Map<string, Property> {
    const combined: Record<string, Property> = {};
    for (const name of schemas) {
      const schema = allSchemas.get(name);
      if (schema) Object.assign(combined, schema);
    }
    return new Map(Object.entries(combined));
  },

  renderSchema(obj: any, schema: Map<string, Property>): string {
    let html = '';

    for (const [key, prop] of schema) {
      if (key.endsWith(':open') || key.endsWith(':close')) {
        const fragment = prop as unknown as { display: string };
        html += fragment.display;
        continue;
      }

      const value = obj[key];
      const type = prop.type;

      if (valueDisplay.has(type)) {
        html += renderProperty(key, valueDisplay.get(type)!(value, key), false);
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested schema objects
        if (allSchemas.has(type)) {
          const nestedSchema = Inspector.getProperties([type]);
          const nestedHTML = Inspector.renderSchema(value, nestedSchema);
          html += renderObjectFallback(key, nestedHTML);
        } else {
          html += renderObjectFallback(key, renderFallbackObject(value));
        }
      } else {
        html += renderProperty(key, `<div class="display">${filter(value)}</div>`, false);
      }
    }

    return html;
  },
  refresh() {
    refreshInspectorValues();
  }
};

// === Helper: Renders single property ===
function renderProperty(key: string, valueHtml: string, isObject: boolean): string {
  return /*html*/`
    <div class="property ${isObject ? 'expandable' : ''}">
      <div class="key">${getObjectMask(key)}</div>
      <div class="value">${valueHtml}</div>
    </div>
  `;
}

// === Helper: Renders fallback object as expandable group ===
function renderObjectFallback(key: string, innerHTML: string): string {
  const icon = getObjectMask(key).includes("icon")
    ? "" // already masked
    : getObjectIcon(key);

  return /*html*/`
    <div class="group expandable">
      <div class="group-header">
        ${icon}<div>${getObjectMask(key)}</div>
        <div class="expandable-icon"></div>
      </div>
      <div class="group-container target">
        ${innerHTML}
      </div>
    </div>
  `;
}

export function refreshInspectorValues() {
  if (!currentTarget) return;

  const container = document.querySelector('#inspector-container')!;
  const elements = Array.from(container.querySelectorAll<HTMLElement>('[data-key]'));

  for (const el of elements) {
    const key = el.dataset.key!;
    const path = (el.dataset.path || '').split('.').filter(Boolean);
    let val = currentTarget[key];

    // Traverse path if nested (like Vector3.x)
    for (const segment of path) {
      if (val && typeof val === 'object') val = val[segment];
    }

    if (el.isContentEditable) {
      const newValue = (typeof val === 'number') ? Math.round(val * 100) / 100 : val;
      if (el.textContent !== String(newValue)) el.textContent = String(newValue);
    } else if (el instanceof HTMLInputElement) {
      if (el.type === 'checkbox') {
        el.checked = !!val;
      } else if (el.type === 'color') {
        el.value = `#${val?.getHexString?.() ?? '000000'}`;
      } else {
        el.value = String(val);
      }
    }
  }
}

// === Helper: Recursive fallback object rendering ===
function renderFallbackObject(obj: any): string {
  if (Array.isArray(obj)) {
    return obj.map((v, i) =>
      typeof v === 'object' && v !== null
        ? renderObjectFallback(`[${i}]`, renderFallbackObject(v))
        : renderProperty(`[${i}]`, `<div class="display">${filter(v)}</div>`, false)
    ).join('');
  }

  if (typeof obj !== 'object' || obj === null) {
    return `<div class="display">${filter(obj)}</div>`;
  }

  return Object.entries(obj).map(([k, v]) => {
    if (typeof v === 'object' && v !== null) {
      return renderObjectFallback(k, renderFallbackObject(v));
    } else {
      return renderProperty(k, `<div class="display">${filter(v)}</div>`, false);
    }
  }).join('');
}

// === Helper: Filtering numbers and primitives ===
function filter(val: any): string {
  if (val === Infinity) return "Inf";
  if (val === -Infinity) return "-Inf";
  if (typeof val === "number") return Math.round(val * 100) / 100 + "";
  if (typeof val === "string") return val;
  return typeof val === "object" ? '[Object]' : String(val);
}