const radios = Array.from(document.getElementsByClassName("radio"));
radios.forEach(e => {
    let selected = e.querySelector(".selected");
    if(selected === null) {
        selected = e.children[0];
        selected.classList.add("selected");
    }
    Array.from(e.childNodes).forEach(a => {
        a.addEventListener("click", () => {
            selected?.classList.remove("selected");
            selected = a as Element;
            selected?.classList.add("selected");
        });
    });
});