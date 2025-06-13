import * as THREE from 'three';
import { propertyDisplay } from './config/propertyDisplay.ts';
import DOMPurify from 'dompurify';

const panel = document.querySelector("#inspector-panel");

export function inspect(obj:any) {
    for(const [value] of Object.entries(propertyDisplay)) {
    }
}
function property(name:string, HTMLvalue:string) {
    return /*html*/ `
        <div class="property">
            <div class="property-name"></div>
            <div class="property-value"></div>
        </div>
    `
}
function has(obj:any, property:any) {
    return obj.hasOwnProperty(property);
}