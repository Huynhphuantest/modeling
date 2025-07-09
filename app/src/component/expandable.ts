import { UIComponent } from './component.ts';

export class Expandable extends UIComponent {
  static attach(el: Element) {
    const target = el.querySelector(".target") as HTMLElement | null;
    if (!target) return;
    const icon = el.querySelector(".expandable-icon") as HTMLElement | null;
    icon?.classList.add("icon");
    icon && (icon.innerText = "keyboard_arrow_down");

    target.addEventListener("click", e => e.stopPropagation());

    el.addEventListener("click", () => {
      const hidden = target.style.display === "none";
      target.style.display = hidden ? "" : "none";
      icon && (icon.innerText = hidden ? "keyboard_arrow_down" : "keyboard_arrow_up");
    });
    (el as HTMLElement).click?.(); //close by default, kinda wonky but it works
  }
  static attachAllIn(container: Element) {
    container.querySelectorAll(".expandable").forEach(el => this.attach(el));
  }
  static observeIn(container: Element) {
    UIComponent.observe(container, ".expandable", this.attach.bind(this));
  }
}