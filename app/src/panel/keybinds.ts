import { Editor } from "./editor";
import { Mode } from "./mode";
import { Modeling } from "./modeling";
import { Tool } from "./tool";
import { Viewport } from "./viewport";

export const Keybinds = {
  init() {
    document.addEventListener("keydown", (e) => {
      const modifier = e.ctrlKey || e.metaKey; // support Mac too

      if (modifier) {
        switch (e.key) {
          case '1': Mode.set(0); break;
          case '2': Mode.set(1); break;
          case '3': Mode.set(2); break;
          case '4': Mode.set(3); break;
          case '5': Mode.set(4); break;
          case '6': Mode.set(5); break;
          case '7': Mode.set(6); break;
          case '8': Mode.set(7); break;
          case '9': Mode.set(8); break;
        }
      } else {
        switch (e.key) {
          case 'Backspace': Editor.delete(); break;
          case 'f': Viewport.focus(); break;
          case 't': Tool.translate(); break;
          case 'r': Tool.rotate(); break;
          case 's': Tool.scale(); break;

          case 'u': Modeling.unset(); break;
          case 'e': Modeling.extrude(); break;
          case 'i': Modeling.inset(); break;
          case 'b': Modeling.bevel(); break;
          case 'k': Modeling.knife(); break;
          case 'm': Modeling.merge(); break;
        }
      }
    });
  }
}