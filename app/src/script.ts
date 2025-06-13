import * as VIEWPORT from './viewport';

const main = document.querySelector("main");
const viewportPanel = document.querySelector("#viewport-panel") as HTMLDivElement;
VIEWPORT.init(viewportPanel);
VIEWPORT.start();
main?.appendChild(viewportPanel);