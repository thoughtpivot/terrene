import Terrene from "./modules/Terrene";

const game = new Terrene();
game.start().then(() => {
    game.initialize();
});
