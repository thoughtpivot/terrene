import Terrene from "./components/Terrene";

const game = new Terrene();
const hideLoading = () => document.getElementById("loading")?.remove();
game.initialize().then(hideLoading, (error: unknown) => {
    console.error(error);
    hideLoading();
});

