export function updateAllExpandableIn(el:Element) {
    for(const e of Array.from(el.querySelectorAll(".expandable"))) updateExpandable(e);
}
export function updateExpandable(el:Element) {
    const target = el.querySelector(".target") as HTMLElement;
    if(!target) return;
    target.addEventListener("click", (e) => e.stopPropagation());
    let display = target.style.display;

    const icon = el.querySelector(".expandable-icon") as HTMLElement;
    if(icon) icon.classList.add("icon");
    if(icon) icon.innerText = "keyboard_arrow_down";
    el.addEventListener("click", () => {
        console.log(target.style.display);
        if(target.style.display !== "none") {
            target.style.display = "none";
            if(icon) icon.innerText = "keyboard_arrow_up";
        } else {
            target.style.display = display;
            if(icon) icon.innerText = "keyboard_arrow_down";
        }
    });
}