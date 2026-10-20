import type { SapLevelData } from "./solver";

export const VIEW_W = 960;
export const VIEW_H = 540;

export interface ForestZone {
    index: number;
    name: string;
    subtitle: string;
    x0: number;
    x1: number;
    cameraX: number;
    accentHex: string;
}

export const FOREST_ZONES: readonly ForestZone[] = [
    {
        index: 1,
        name: "I · The Sapling Cradle",
        subtitle: "Weave triangles from the ancient root anchors across the first mossy ravine",
        x0: 0,
        x1: 720,
        cameraX: 480,
        accentHex: "#f5a623",
    },
    {
        index: 2,
        name: "II · The Amber Arch",
        subtitle: "Suspend your bridge from high canopy bark anchors above the bramble wheel",
        x0: 720,
        x1: 1440,
        cameraX: 1080,
        accentHex: "#4be39b",
    },
    {
        index: 3,
        name: "III · Spore Updraft Chasm",
        subtitle: "Ride the bioluminescent updraft and tether violet Spore Floaters to lift the span",
        x0: 1440,
        x1: 2160,
        cameraX: 1800,
        accentHex: "#b678ff",
    },
    {
        index: 4,
        name: "IV · The Great Hollow Span",
        subtitle: "Cross the twin root pillars with 4-strand Heartwood White sap and reusable Ivy",
        x0: 2160,
        x1: 2880,
        cameraX: 2520,
        accentHex: "#99f2ff",
    },
    {
        index: 5,
        name: "V · Heartwood Cistern Sanctum",
        subtitle: "Raise the final spire to the Heartwood Cistern Pipe so the surviving sap can ascend",
        x0: 2880,
        x1: 3600,
        cameraX: 3120,
        accentHex: "#ffd479",
    },
];

export const SAP_WORLD_LEVEL: SapLevelData = {
    title: "FOREST LAST SAP WORLD",
    subtitle: "Key of C Minor · 106 BPM Detroit Dub & Minimal Tech · Five Zones to the Heartwood Cistern",
    worldWidth: 3600,
    worldHeight: 540,
    pitY: 532,
    goalSaved: 12,
    ocdSaved: 24,

    terrains: [
        // Zone I: Western Root Ledge
        {
            id: "zone1-cradle-ledge",
            label: "Sapling Cradle Ledge",
            style: "moss",
            bottomY: 540,
            pts: [
                { x: 0, y: 345 },
                { x: 110, y: 352 },
                { x: 240, y: 356 },
                { x: 355, y: 350 },
                { x: 395, y: 375 },
                { x: 410, y: 540 },
            ],
        },
        // Zone I -> II: Moss Bough Terrace
        {
            id: "zone1-moss-bough",
            label: "Moss Bough Terrace",
            style: "moss",
            bottomY: 540,
            pts: [
                { x: 515, y: 540 },
                { x: 530, y: 365 },
                { x: 575, y: 346 },
                { x: 690, y: 344 },
                { x: 785, y: 350 },
                { x: 805, y: 540 },
            ],
        },
        // Zone II: Sunken Buttress
        {
            id: "zone2-sunken-buttress",
            label: "Sunken Buttress",
            style: "root",
            bottomY: 540,
            pts: [
                { x: 1110, y: 540 },
                { x: 1130, y: 372 },
                { x: 1185, y: 356 },
                { x: 1320, y: 354 },
                { x: 1425, y: 348 },
                { x: 1450, y: 540 },
            ],
        },
        // Zone III: Spore Lantern Mid-Chasm Island
        {
            id: "zone3-spore-island",
            label: "Spore Lantern Isle",
            style: "amber-arch",
            bottomY: 540,
            pts: [
                { x: 1625, y: 540 },
                { x: 1640, y: 352 },
                { x: 1690, y: 336 },
                { x: 1765, y: 336 },
                { x: 1805, y: 355 },
                { x: 1820, y: 540 },
            ],
        },
        // Zone III -> IV: Whispering Bark Ledge
        {
            id: "zone3-whispering-ledge",
            label: "Whispering Bark Ledge",
            style: "moss",
            bottomY: 540,
            pts: [
                { x: 1935, y: 540 },
                { x: 1955, y: 356 },
                { x: 2015, y: 340 },
                { x: 2150, y: 338 },
                { x: 2255, y: 344 },
                { x: 2275, y: 540 },
            ],
        },
        // Zone IV: West Root Pillar
        {
            id: "zone4-pillar-west",
            label: "West Hollow Pillar",
            style: "stone",
            bottomY: 540,
            pts: [
                { x: 2385, y: 540 },
                { x: 2398, y: 368 },
                { x: 2465, y: 364 },
                { x: 2480, y: 540 },
            ],
        },
        // Zone IV: East Root Pillar
        {
            id: "zone4-pillar-east",
            label: "East Hollow Pillar",
            style: "stone",
            bottomY: 540,
            pts: [
                { x: 2565, y: 540 },
                { x: 2580, y: 342 },
                { x: 2648, y: 338 },
                { x: 2662, y: 540 },
            ],
        },
        // Zone IV -> V: Heartwood Approach Terrace
        {
            id: "zone5-heartwood-approach",
            label: "Heartwood Approach",
            style: "root",
            bottomY: 540,
            pts: [
                { x: 2745, y: 540 },
                { x: 2765, y: 344 },
                { x: 2830, y: 326 },
                { x: 2980, y: 324 },
                { x: 3095, y: 318 },
                { x: 3155, y: 336 },
                { x: 3235, y: 312 },
                { x: 3395, y: 306 },
                { x: 3600, y: 306 },
            ],
        },
    ],

    winds: [
        {
            id: "wind-canopy-draft",
            label: "Amber Arch Thermal",
            x: 830,
            y: 160,
            w: 250,
            h: 260,
            ax: 18,
            ay: -290,
        },
        {
            id: "wind-spore-chasm",
            label: "Spore Updraft Vent",
            x: 1465,
            y: 110,
            w: 455,
            h: 370,
            ax: 35,
            ay: -540,
        },
        {
            id: "wind-hollow-lift",
            label: "Hollow Mist Draft",
            x: 2290,
            y: 130,
            w: 440,
            h: 340,
            ax: 24,
            ay: -360,
        },
    ],

    thorns: [
        { id: "thorn-1", x: 960, y: 452, radius: 34, spinSpeed: 1.6 },
        { id: "thorn-2", x: 1540, y: 468, radius: 32, spinSpeed: -1.9 },
        { id: "thorn-3", x: 1880, y: 468, radius: 32, spinSpeed: 1.9 },
        { id: "thorn-4", x: 2520, y: 462, radius: 36, spinSpeed: -1.5 },
    ],

    signposts: [
        {
            id: "sign-1",
            x: 155,
            y: 352,
            zoneTitle: "ZONE I · THE SAPLING CRADLE",
            heading: "The Last Sap of the Heartwood",
            body: [
                "Drag living Amber Sap globs onto the structure. Two strands form a triangle; one strand dangles.",
                "Every sound you make — every strand woven, every grove awakened — resonates in the key of C minor.",
                "Build eastward across the five forest zones or use each awakened grove's root anchors to reach the Heartwood Cistern.",
            ],
        },
        {
            id: "sign-2",
            x: 655,
            y: 344,
            zoneTitle: "ZONE II · THE AMBER ARCH",
            heading: "Canopy Ivy & High Bark Anchors",
            body: [
                "Emerald Canopy Ivy globs form 3 strands and can be detached and re-placed whenever you need to reshape a span.",
                "Pearl-white Heartwood globs weave up to 4 long strands — anchor them to the overhead bark nodes to clear the bramble wheel.",
            ],
        },
        {
            id: "sign-3",
            x: 1295,
            y: 354,
            zoneTitle: "ZONE III · SPORE UPDRAFT CHASM",
            heading: "Lighter Than Air",
            body: [
                "Violet Spore Floaters pull upward against gravity! Attach one to the nose of a long cantilever bridge so it never sags into the thorns.",
                "Hold W or Right-Click to sound the C-Minor Arbiter Whistle and guide free globs toward your cursor.",
            ],
        },
        {
            id: "sign-4",
            x: 2095,
            y: 338,
            zoneTitle: "ZONE IV · THE GREAT HOLLOW SPAN",
            heading: "The Long Rhythm (106 BPM)",
            body: [
                "Press Z or click the Undo button in the top bar if a span buckles — the Time Moth remembers your last 24 moves.",
                "Use keys 1–5 or the top Zone Bar to pan the camera across all 3,600 units of the forest.",
            ],
        },
        {
            id: "sign-5",
            x: 2935,
            y: 324,
            zoneTitle: "ZONE V · HEARTWOOD CISTERN SANCTUM",
            heading: "The Cistern Valve",
            body: [
                "Weave your structure up to the brass Heartwood Cistern mouth at the east sanctum.",
                "Once a structural node enters the Cistern's wake ring, the valve opens and every unspent sap glob crawls the strands home!",
            ],
        },
    ],

    groves: [
        {
            id: "grove-1",
            name: "Moss Bough Grove",
            x: 615,
            y: 344,
            wakeRadius: 130,
            woken: false,
        },
        {
            id: "grove-2",
            name: "Sunken Buttress Grove",
            x: 1230,
            y: 355,
            wakeRadius: 135,
            woken: false,
        },
        {
            id: "grove-3",
            name: "Spore Lantern Isle",
            x: 1715,
            y: 336,
            wakeRadius: 135,
            woken: false,
        },
        {
            id: "grove-4",
            name: "Whispering Bark Grove",
            x: 2045,
            y: 338,
            wakeRadius: 135,
            woken: false,
        },
        {
            id: "grove-5",
            name: "Heartwood Sanctum Grove",
            x: 2865,
            y: 324,
            wakeRadius: 145,
            woken: false,
        },
    ],

    cistern: {
        x: 3360,
        y: 196,
        mouthDirX: -0.707,
        mouthDirY: 0.707,
        wakeRadius: 145,
        suckRadius: 165,
        collectRadius: 28,
        open: false,
    },

    anchors: [
        // Zone I starter triangle (indices 0, 1, 2) + mid-ravine root node (index 3)
        { x: 235, y: 348, species: "amber" },
        { x: 335, y: 346, species: "amber" },
        { x: 285, y: 274, species: "amber" },
        { x: 455, y: 296, species: "amber" },

        // Zone I/II Moss Bough Terrace anchors (indices 4, 5) + Amber Arch canopy anchors (indices 6, 7)
        { x: 585, y: 340, species: "amber" },
        { x: 755, y: 342, species: "albino" },
        { x: 895, y: 245, species: "albino" },
        { x: 1035, y: 245, species: "albino" },

        // Zone II/III Sunken Buttress anchors (indices 8, 9) + Spore Chasm anchors (indices 10, 11)
        { x: 1175, y: 350, species: "amber" },
        { x: 1395, y: 342, species: "ivy" },
        { x: 1545, y: 265, species: "albino" },
        { x: 1715, y: 330, species: "amber" },
        { x: 1865, y: 265, species: "albino" },

        // Zone III/IV Whispering Bark anchors (indices 13, 14) + Hollow Pillars & Canopy (indices 15, 16, 17)
        { x: 2005, y: 334, species: "amber" },
        { x: 2225, y: 338, species: "albino" },
        { x: 2432, y: 358, species: "amber" },
        { x: 2520, y: 228, species: "albino" },
        { x: 2614, y: 332, species: "amber" },

        // Zone V Heartwood Approach & Sanctum starter triangle (indices 18, 19, 20, 21, 22)
        { x: 2805, y: 320, species: "amber" },
        { x: 3045, y: 314, species: "amber" },
        { x: 3145, y: 326, species: "albino" },
        { x: 3235, y: 304, species: "albino" },
        { x: 3190, y: 242, species: "ivy" },
    ],

    initialLinks: [
        // Starter triangle in Zone I
        [0, 1],
        [0, 2],
        [1, 2],
        // Starter triangle on Moss Bough
        [4, 5],
        // Starter base at Heartwood Sanctum so building at the sanctum has a sturdy footing
        [20, 21],
        [20, 22],
        [21, 22],
    ],

    initialBlobs: [
        // Zone I: 14 awake starter blobs (Amber, Canopy Ivy, Heartwood White)
        { x: 95, y: 324, species: "amber", state: "free" },
        { x: 120, y: 324, species: "amber", state: "free" },
        { x: 145, y: 324, species: "amber", state: "free" },
        { x: 170, y: 324, species: "amber", state: "free" },
        { x: 195, y: 324, species: "amber", state: "free" },
        { x: 220, y: 324, species: "amber", state: "free" },
        { x: 250, y: 324, species: "ivy", state: "free" },
        { x: 275, y: 324, species: "ivy", state: "free" },
        { x: 300, y: 324, species: "ivy", state: "free" },
        { x: 325, y: 324, species: "albino", state: "free" },
        { x: 345, y: 324, species: "albino", state: "free" },
        { x: 135, y: 298, species: "amber", state: "free" },
        { x: 165, y: 298, species: "ivy", state: "free" },
        { x: 195, y: 298, species: "balloon", state: "free" },

        // Grove 1 (Moss Bough Terrace): 8 blobs
        { x: 600, y: 322, species: "amber", state: "dormant", groveId: "grove-1" },
        { x: 625, y: 322, species: "amber", state: "dormant", groveId: "grove-1" },
        { x: 650, y: 322, species: "amber", state: "dormant", groveId: "grove-1" },
        { x: 675, y: 322, species: "ivy", state: "dormant", groveId: "grove-1" },
        { x: 700, y: 322, species: "ivy", state: "dormant", groveId: "grove-1" },
        { x: 725, y: 322, species: "albino", state: "dormant", groveId: "grove-1" },
        { x: 745, y: 322, species: "albino", state: "dormant", groveId: "grove-1" },
        { x: 660, y: 296, species: "balloon", state: "dormant", groveId: "grove-1" },

        // Grove 2 (Sunken Buttress): 8 blobs
        { x: 1200, y: 332, species: "amber", state: "dormant", groveId: "grove-2" },
        { x: 1225, y: 332, species: "amber", state: "dormant", groveId: "grove-2" },
        { x: 1250, y: 332, species: "ivy", state: "dormant", groveId: "grove-2" },
        { x: 1275, y: 332, species: "ivy", state: "dormant", groveId: "grove-2" },
        { x: 1300, y: 332, species: "albino", state: "dormant", groveId: "grove-2" },
        { x: 1325, y: 332, species: "albino", state: "dormant", groveId: "grove-2" },
        { x: 1350, y: 306, species: "balloon", state: "dormant", groveId: "grove-2" },
        { x: 1375, y: 306, species: "balloon", state: "dormant", groveId: "grove-2" },

        // Grove 3 (Spore Lantern Isle): 6 blobs
        { x: 1675, y: 316, species: "amber", state: "dormant", groveId: "grove-3" },
        { x: 1700, y: 316, species: "ivy", state: "dormant", groveId: "grove-3" },
        { x: 1725, y: 316, species: "albino", state: "dormant", groveId: "grove-3" },
        { x: 1750, y: 316, species: "albino", state: "dormant", groveId: "grove-3" },
        { x: 1695, y: 290, species: "balloon", state: "dormant", groveId: "grove-3" },
        { x: 1735, y: 290, species: "balloon", state: "dormant", groveId: "grove-3" },

        // Grove 4 (Whispering Bark Ledge): 8 blobs
        { x: 2020, y: 316, species: "amber", state: "dormant", groveId: "grove-4" },
        { x: 2045, y: 316, species: "amber", state: "dormant", groveId: "grove-4" },
        { x: 2070, y: 316, species: "amber", state: "dormant", groveId: "grove-4" },
        { x: 2095, y: 316, species: "ivy", state: "dormant", groveId: "grove-4" },
        { x: 2120, y: 316, species: "ivy", state: "dormant", groveId: "grove-4" },
        { x: 2145, y: 316, species: "albino", state: "dormant", groveId: "grove-4" },
        { x: 2170, y: 316, species: "albino", state: "dormant", groveId: "grove-4" },
        { x: 2195, y: 292, species: "balloon", state: "dormant", groveId: "grove-4" },

        // Grove 5 (Heartwood Sanctum Approach - awake & ready for the final spire + dormant bonus): 12 blobs
        { x: 2835, y: 300, species: "amber", state: "free" },
        { x: 2860, y: 300, species: "amber", state: "free" },
        { x: 2885, y: 300, species: "amber", state: "free" },
        { x: 2910, y: 300, species: "amber", state: "free" },
        { x: 2935, y: 300, species: "ivy", state: "free" },
        { x: 2960, y: 300, species: "ivy", state: "free" },
        { x: 2985, y: 300, species: "albino", state: "free" },
        { x: 3010, y: 300, species: "albino", state: "free" },
        { x: 3070, y: 296, species: "amber", state: "dormant", groveId: "grove-5" },
        { x: 3095, y: 296, species: "amber", state: "dormant", groveId: "grove-5" },
        { x: 3115, y: 296, species: "ivy", state: "dormant", groveId: "grove-5" },
        { x: 3135, y: 280, species: "balloon", state: "dormant", groveId: "grove-5" },
    ],
};
