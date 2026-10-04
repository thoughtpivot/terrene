// Grid configuration for the 789 icon sprite sheet
export const SPRITE_CONFIG = {
    COLS: 29,
    ROWS: 28,
    ICON_SIZE: 64,
    TOTAL_ICONS: 789,
};
// Function to calculate icon coordinates from ID
export function calculateIconCoordinates(id) {
    if (id < 0 || id >= SPRITE_CONFIG.TOTAL_ICONS) {
        throw new Error(`Icon ID ${id} is out of range. Must be between 0 and ${SPRITE_CONFIG.TOTAL_ICONS - 1}`);
    }
    const col = id % SPRITE_CONFIG.COLS;
    const row = Math.floor(id / SPRITE_CONFIG.COLS);
    const x = col * SPRITE_CONFIG.ICON_SIZE;
    const y = row * SPRITE_CONFIG.ICON_SIZE;
    return { x, y, col, row };
}
// Function to generate icon mapping from ID
export function createIconMappingFromId(id, name) {
    const coords = calculateIconCoordinates(id);
    return Object.assign({ id, name: name || `Icon_${id}` }, coords);
}
// Function to get icon mapping by ID
export function getIconMappingById(id) {
    return createIconMappingFromId(id);
}
// Function to get all available icons (all 789 icons by ID)
export function getAllAvailableIcons() {
    const allIcons = {};
    for (let id = 0; id < SPRITE_CONFIG.TOTAL_ICONS; id++) {
        const key = `Icon_${id}`;
        allIcons[key] = createIconMappingFromId(id);
    }
    return allIcons;
}
//# sourceMappingURL=LorcRPG.config.js.map