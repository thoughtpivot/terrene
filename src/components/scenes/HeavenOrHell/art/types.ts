/** A rectangle on an atlas page, in stored pixels. */
export interface AtlasRect {
    page: number;
    x: number;
    y: number;
    w: number;
    h: number;
}

/** The emissive pass of a frame, placed relative to the frame's top-left. */
export interface GlowRect extends AtlasRect {
    ox: number;
    oy: number;
}

export interface AtlasFrame extends AtlasRect {
    /** anchor in stored pixels: the footprint centre, or the centre for decals and parts */
    ax: number;
    ay: number;
    /** on-screen pixels per stored pixel */
    scale: number;
    /** footprint width on screen, for colliders */
    foot: number;
    glow?: GlowRect;
}

/** A puppet part cut from a painted view, placed relative to the view's anchor. */
export interface PartFrame extends AtlasRect {
    ox: number;
    oy: number;
    glow?: GlowRect;
}
