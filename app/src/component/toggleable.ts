import { UIComponent } from './component.ts';

export class Toggleable extends UIComponent {
  static attach(el: Element) {
    const element = el as HTMLElement;
    element.addEventListener("click", () => {
      element.classList.toggle("selected");
    });
  }

  static attachAllIn(container: Element) {
    container.querySelectorAll(".toggleable").forEach(el => this.attach(el));
  }

  static observeIn(container: Element) {
    UIComponent.observe(container, ".toggleable", this.attach.bind(this));
  }
}