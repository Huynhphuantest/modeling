import { UIComponent } from './component.ts';

export class Dropdown extends UIComponent {
  static attach(el: Element) {
    const selected = el.querySelector(":scope > .dropdown-selected") as HTMLElement | null;
    const options = el.querySelector(":scope > .dropdown-options") as HTMLElement | null;
    const optionItems = Array.from(el.querySelectorAll(":scope > .dropdown-options > .dropdown-option")) as HTMLElement[];

    if (!selected || !options) return;

    options.style.display = "none";

    selected.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = options.style.display !== "none";
      Dropdown.closeAll(options); // close all before opening
      if (!wasOpen) options.style.display = "flex";
      else options.style.display = "none";
    });

    optionItems.forEach(option => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        options.style.display = "none";
        el.dispatchEvent(new CustomEvent("change", {
          detail: { value: option.innerText }
        }));
      });
    });
  }

  static attachAllIn(container: Element) {
    container.querySelectorAll(".dropdown").forEach(el => this.attach(el));
  }

  static observeIn(container: Element) {
    UIComponent.observe(container, ".dropdown", this.attach.bind(this));
  }

  static closeAll(target: Element) {
    target.querySelectorAll(".dropdown-options").forEach(el => {
        (el as HTMLElement).style.display = "none";
    });
  }

  static getValue(el: Element): string | null {
    const selected = el.querySelector(":scope > .dropdown-selected");
    return selected?.textContent?.trim() ?? null;
  }
}