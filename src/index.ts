import Terrene from "./components/Terrene";

const game = new Terrene();
game.initialize().then(() => {
    // Remove loading message
    const loadingEl = document.getElementById("loading");
    if (loadingEl) {
        loadingEl.remove();
    }
});

