import * as VIEWPORT from './viewport';

const main = document.querySelector("main");
const viewportPanel = document.getElementById("viewport") as HTMLDivElement;
VIEWPORT.init(viewportPanel);
VIEWPORT.start();