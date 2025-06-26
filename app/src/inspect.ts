import * as THREE from 'three';
import { updateAllExpandableIn } from './component/expandable.ts';
import { getSchemas, getProperties, renderSchema } from './config/schema.ts';
import DOMPurify from 'dompurify';

const panel = document.querySelector("#inspector-container")!;

export async function inspect(obj:any) {
    const schema = getSchemas(obj);
    const properties = getProperties(schema);
    const html = renderSchema(obj, properties);
    
    panel.innerHTML = DOMPurify.sanitize(/*html*/ `
        ${html}
        `);
    setTimeout(() => updateAllExpandableIn(panel), 0);
}