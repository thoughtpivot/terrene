import Terrene from "./components/Terrene";
const game = new Terrene();
game.start().then(() => {
    // Remove loading message
    const loadingEl = document.getElementById("loading");
    if (loadingEl) {
        loadingEl.remove();
    }
    game.initialize();
});
//# sourceMappingURL=index.js.map