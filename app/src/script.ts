import { Editor } from './panel/editor.ts';

const viewportPanel = document.getElementById("viewport") as HTMLDivElement;

Editor.init(viewportPanel);