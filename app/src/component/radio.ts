import { UIComponent } from './component.ts';

export class Radio extends UIComponent {
  static attach(el: Element) {
    let selected = el.querySelector<HTMLElement>(".selected") ?? el.firstElementChild as HTMLElement;
    selected?.classList.add("selected");
    Array.from(el.children).forEach(child => {
      child.addEventListener("click", () => {
        if (selected !== child) {
          selected?.classList.remove("selected");
          selected = child as HTMLElement;
          selected.classList.add("selected");
        }
      });
    });
  }
  static attachAllIn(container: Element) {
    container.querySelectorAll(".radio").forEach(el => this.attach(el));
  }
  static observeIn(container: Element) {
    UIComponent.observe(container, ".radio", this.attach.bind(this));
  }
}