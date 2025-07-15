import * as THREE from 'three';
import { Color } from 'three';
import { Hierarchy } from '../panel/hierarchy';
import { Viewport } from '../panel/viewport';

export type Property = {
  type: string;
  advanced?: boolean;
  locked?: boolean;
  display?: string;
};

let currentTarget: any = null;

export function setTarget(obj: any) {
  currentTarget = obj;
}

function filter(val: any) {
  if (val === Infinity) return "Inf";
  if (val === -Infinity) return "-Inf";
  if (typeof val === "number") return Math.round(val * 100) / 100;
  return val;
}

// === HTML INPUT GENERATORS ===

function textInput(value: any, key: string, path: string[] = []) {
  const p = path.join(".");
  const v = filter(value);
  return `<div contenteditable="true" class="display" data-key="${key}" data-path="${p}">${v}</div>`;
}

function checkboxInput(value: boolean, key: string) {
  return `<input type="checkbox" class="display" data-key="${key}" ${value ? "checked" : ""}>`;
}

function colorInput(value: Color, key: string) {
  return `<input type="color" class="display" data-key="${key}" value="#${value.getHexString()}">`;
}

function label(text: string) {
  return `<div class="label">${text}</div>`;
}

// === VALUE → HTML GENERATOR MAP ===

export const valueDisplay = new Map<string, (value: any, key: string) => string>([
  ['string', (v, k) => textInput(v, k)],
  ['number', (v, k) => textInput(v, k)],
  ['boolean', (v, k) => checkboxInput(v, k)],
  ['Color', (v, k) => colorInput(v, k)],
  ['Vector2', (v, k) =>
    label('x') + textInput(v.x, k, ['x']) +
    label('y') + textInput(v.y, k, ['y'])],
  ['Vector3', (v, k) =>
    label('x') + textInput(v.x, k, ['x']) +
    label('y') + textInput(v.y, k, ['y']) +
    label('z') + textInput(v.z, k, ['z'])],
  ['Euler', (v, k) =>
    label('x') + textInput(v.x, k, ['x']) +
    label('y') + textInput(v.y, k, ['y']) +
    label('z') + textInput(v.z, k, ['z'])],
  ['Quaternion', (v, k) =>
    label('x') + textInput(v.x, k, ['x']) +
    label('y') + textInput(v.y, k, ['y']) +
    label('z') + textInput(v.z, k, ['z']) +
    label('w') + textInput(v.w, k, ['w'])],
  ['null', () => textInput("null", '')],
  ['undefined', () => textInput("undefined", '')]
]);

// === VALUE BINDING ===

function parseValue(raw: any, original: any) {
  if (typeof original === 'number') return parseFloat(raw) || 0;
  if (typeof original === 'boolean') return raw === true || raw === 'true' || raw === 'checked';
  if (original instanceof Color) return new THREE.Color(raw);
  return raw;
}

export function bindValue(obj: any, key: string, raw: any, path: string[]) {
  if (!(key in obj)) return;
  if (path.length === 0) {
    obj[key] = parseValue(raw, obj[key]);
  } else {
    const sub = obj[key];
    const prop = path[path.length - 1];
    console.log(sub, path)
    if (sub && prop in sub) {
      sub[prop] = parseValue(raw, sub[prop]);
    }
  }
}

// === ATTACH EVENT LISTENERS TO PANEL ===

export function attachSchemaListeners(container: HTMLElement) {
  container.addEventListener('keyup', e => {
    const el = e.target as HTMLElement;
    if (!el.matches('[contenteditable]')) return;
    const key = el.dataset.key!;
    const path = el.dataset.path?.split('.') ?? [];
    if(path[0] === "") bindValue(currentTarget, key, el.textContent, []);
    else bindValue(currentTarget, key, el.textContent, path);
    if(key === "name") Hierarchy.render(Viewport.scene);
  }, true);

  container.addEventListener('change', e => {
    const el = e.target as HTMLInputElement;
    if (!el.matches('input[type="checkbox"], input[type="color"]')) return;
    const key = el.dataset.key!;
    const path: string[] = [];
    const value = el.type === 'checkbox' ? el.checked : el.value;
    bindValue(currentTarget, key, value, path);
  });
}