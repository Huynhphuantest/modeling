export class UIComponent {
  static observe(
    container: Element,
    selector: string,
    onMount: (el: Element) => void,
  ) {
    const seen = new WeakSet<Element>(); // track which elements we've already mounted
    const observer = new MutationObserver(() => {
      const elements = Array.from(container.querySelectorAll(selector));
      for (const el of elements) {
        if (!seen.has(el)) {
          seen.add(el);
          onMount(el);
        }
      }
    });
    observer.observe(container, { childList: true, subtree: true, attributes:false, characterData:false });
  }
}