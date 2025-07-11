fetch('/template/panels.html')
.then(r => r.text())
.then(async html => {
        const panel = document.getElementById('unused-panels')!;
        panel.innerHTML = html;
        panel.hidden = true;
        await import("./script.ts");
        await import("./panel/spawn.ts");
        await import("./panel/mode.ts");
        import("./component/dropdown.ts").then(e => {
            e.Dropdown.attachAllIn(document.body);
            document.body.addEventListener("click", () => e.Dropdown.closeAll(document.body));
        });
        import("./component/radio.ts").then(e => e.Radio.attachAllIn(document.body));
        import("./component/expandable.ts").then(e => e.Expandable.attachAllIn(document.body));
        import("./component/toggleable.ts").then(e => e.Toggleable.attachAllIn(document.body));
    }
);