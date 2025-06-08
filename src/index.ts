import Terrene from "./components/Terrene";

const game = new Terrene();
game.start().then(() => {
    game.initialize();
});
