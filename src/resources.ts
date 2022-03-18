import { ImageSource } from "excalibur";
import sword from "./assets/sword.png"; // for parcelv2 this is configured in the .parcelrc
import OldManSam from "./modules/characters/npc/OldManSam/OldManSam.png";
import you from "./modules/characters/player/You/You.png";

let Resources = {
    Sword: new ImageSource(sword),
    OldManSam: new ImageSource(OldManSam),
    You: new ImageSource(you),
};

export { Resources };
