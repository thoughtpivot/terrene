import type { LocationId } from "../core/types.js";

export interface LocationCopy {
    id: LocationId;
    title: string;
    prose: string;
    wash: string;
}

export const LOCATIONS: Record<LocationId, LocationCopy> = {
    hearth: {
        id: "hearth",
        title: "Hearth",
        prose: "The Angel of Olympus wakes at the stair. One obol lies on the step.",
        wash: "#c4a15a",
    },
    court: {
        id: "court",
        title: "Court",
        prose: "The court connects the doors. The far gate is sealed.",
        wash: "#8d8a7a",
    },
    chapel: {
        id: "chapel",
        title: "Chapel",
        prose: "The altar strengthens one Heaven line by 2.",
        wash: "#efe6cf",
    },
    alcove: {
        id: "alcove",
        title: "Alcove",
        prose: "A card lies in the garden.",
        wash: "#6e8f62",
    },
    stall: {
        id: "stall",
        title: "Stall",
        prose: "Three goods, one obol each. An urn holds one obol.",
        wash: "#c47a3a",
    },
    glade: {
        id: "glade",
        title: "Glade",
        prose: "Spark and a Shade wait here. There is no boss.",
        wash: "#7a3048",
    },
    gate: {
        id: "gate",
        title: "Gate",
        prose: "The next court is still sealed.",
        wash: "#4a5560",
    },
};
