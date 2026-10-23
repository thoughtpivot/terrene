import corruptChoir from "./music/corruptChoir.mp3";
import drumsHard from "./music/drumsHard.mp3";
import drumsSoft from "./music/drumsSoft.mp3";
import ghostLine from "./music/ghostLine.mp3";
import grit808 from "./music/grit808.mp3";
import hatsRoll from "./music/hatsRoll.mp3";
import heaven808 from "./music/heaven808.mp3";
import heavenBells from "./music/heavenBells.mp3";
import heavenChoir from "./music/heavenChoir.mp3";
import hell808 from "./music/hell808.mp3";
import hellBells from "./music/hellBells.mp3";
import hellBrass from "./music/hellBrass.mp3";
import hellChoir from "./music/hellChoir.mp3";
import hellImpact from "./music/stingers/hellImpact.mp3";
import redeem from "./music/stingers/redeem.mp3";
import riser from "./music/stingers/riser.mp3";
import switchUp from "./music/stingers/switchUp.mp3";
import { StemId, StingerId } from "./musicSpec";

/** Bundled URLs of the rendered stems (regenerate with `npm run music:hoh`). */
export const STEM_URLS: Record<StemId, string> = {
    heavenChoir,
    heavenBells,
    heaven808,
    corruptChoir,
    grit808,
    drumsSoft,
    hatsRoll,
    ghostLine,
    drumsHard,
    hellBells,
    hellChoir,
    hell808,
    hellBrass,
};

export const STINGER_URLS: Record<StingerId, string> = { riser, switchUp, hellImpact, redeem };
