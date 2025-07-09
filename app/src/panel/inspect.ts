import { Dropdown } from '../component/dropdown.ts';
import { Expandable } from '../component/expandable.ts';
import { Radio } from '../component/radio.ts';
import { allSchemas, Property, valueDisplay, input } from '../config/schema.ts';
import DOMPurify from 'dompurify';

const panel = document.querySelector("#inspector-container")!;
Dropdown.observeIn(panel);
Expandable.observeIn(panel);
Radio.observeIn(panel);

function toConst(property: Property): Property {
  return {
    type: property.type,
    advanced: property.advanced ?? false,
    locked: property.locked ?? false,
    display: property.display
  } as const;
}

function getCleanKeyName(key: string): string {
  return key.startsWith('_') ? key.slice(1) : key;
}

function getPrototypeChainUntil(obj: Object, stops = ['EventDispatcher', 'Object']): string[] {
  const chain: string[] = [];
  let ctor = obj?.constructor;
  const stopSet = new Set(stops);

  while (ctor && ctor.name && !stopSet.has(ctor.name)) {
    chain.push(getCleanKeyName(ctor.name));
    ctor = Object.getPrototypeOf(ctor);
  }

  return chain;
}

function isLikelyObject(value: any, type: string): boolean {
  if (value == null) return false;
  if (valueDisplay.has(type)) return false;
  if (Array.isArray(value)) return false;
  return typeof value === "object";
}

function renderValue(value: any, type: string): string {
  const display = valueDisplay.get(type);
  if (display) return display(value);
  if (value === null) return input("null");
  if (value === undefined) return input("undefined");
  if (Array.isArray(value)) return "Array Unsupported";

  const schemas = Inspector.getSchemas(value);
  const properties = schemas.length ? Inspector.getProperties(schemas) : Inspector.getPropertiesOfObject(value);
  return Inspector.renderSchema(value, properties);
}

function renderProperty(key: string, valueHtml: string, isObject: boolean): string {
  return !isObject ? /*html*/`
    <div class="property">
      <div class="key">${key}</div>
      <div class="value">${valueHtml}</div>
    </div>
  ` : /*html*/`
    <div class="property expandable">
      <div class="key">
        ${key}
        <div class="expandable-icon"></div>
      </div>
      <div class="value object target">${valueHtml}</div>
    </div>
  `;
}

export const Inspector = {
  inspect(obj: any) {
    const schemaNames = Inspector.getSchemas(obj);
    const properties = Inspector.getProperties(schemaNames);
    const html = Inspector.renderSchema(obj, properties);

    panel.innerHTML = DOMPurify.sanitize(html);
  },
  clear() {
    panel.innerHTML = "";
  },
  getSchemas(obj: any): string[] {
    return getPrototypeChainUntil(obj);
  },
  getProperties(schemas: string[]): Map<string, Property> {
    const combined: Record<string, Property> = {};
    for (const name of schemas) {
      const schema = allSchemas.get(name);
      if (schema) Object.assign(combined, schema);
    }
    return new Map(Object.entries(combined));
  },

  getPropertiesOfObject(obj: Object): Map<string, Property> {
    const map: Record<string, Property> = {};
    for (const key of Object.keys(obj)) {
      map[key] = { type: 'string' };
    }
    return new Map(Object.entries(map));
  },

  renderSchema(obj: object, schema: Map<string, Property>): string {
    let html = '';
    for (const [key, prop] of schema) {
      const property = toConst(prop);
      const value = obj[key as keyof typeof obj];
      const isObject = isLikelyObject(value, property.type);

      if (property.display) {
        html += property.display;
        continue;
      }

      const rendered = renderValue(value, property.type);
      html += renderProperty(key, rendered, isObject);
    }
    return html;
  }
};