# Lorc RPG Icons

## Attribution

This component uses the **700+ RPG Icons** collection created by **Lorc**.

### Original Author

-   **Creator**: Lorc (Reddit user)
-   **Submitted to OpenGameArt by**: Slipyx
-   **Original Submission Date**: Sunday, July 17, 2011

### Description

789 black and white RPG-themed icons designed to be easily modifiable through stencils, gradients, paint-overs, and other techniques. The collection features mostly traditional fantasy themes with some unique additions.

### License

**CC-BY 3.0** (Creative Commons Attribution 3.0)

### Source

-   **OpenGameArt Page**: [700+ RPG Icons](https://opengameart.org/content/700-rpg-icons)
-   **Original Reddit Thread**: Referenced in the OpenGameArt submission
-   **Enhanced Collection**: [game-icons.net](http://game-icons.net/) (continuing and improving the collection with SVG versions)

### Usage Requirements

An attribution to **"Lorc"** is required when using these icons.

## Implementation

This LorcRPG component provides a unified actor system for displaying any of the 789 RPG icons from Lorc's collection. The icons have been:

-   Resized from original 400x400 to 64x64 pixels for game optimization
-   Arranged in a 29x28 grid sprite sheet (1856x1792 pixels total)
-   Mapped with semantic names for easy reference
-   Integrated with Excalibur.js as a reusable Actor class

### Features

-   **Generic Actor**: Single class can display any of the 789 icons
-   **Dual Lookup**: Access icons by name (`"Sword"`) or ID (`0`)
-   **Dynamic Switching**: Change icons at runtime with `changeIcon()`
-   **Semantic Naming**: Intelligent names like `Health_Potion`, `Dragon_Scale`, `Phoenix_Feather`
-   **Complete Mapping**: Full coordinate system with x, y, col, row data

### Example Usage

```typescript
// Create by name
const sword = new LorcRPG({ itemName: "Sword", pos: vec(100, 100) });

// Create by ID
const potion = new LorcRPG({ itemId: 100, pos: vec(200, 100) });

// Change icon dynamically
sword.changeIcon("Magic_Orb");
```

## Files

-   `LorcRPG.ts` - Main actor class
-   `IconMappings.ts` - Complete mapping of all 789 icons
-   `LorcRPGExample.ts` - Usage examples and demos
-   `LorcRPG.png` - Sprite sheet (1856x1792px)
-   `LorcRPG.json` - Aseprite export data

## Credits

**Original Art**: Lorc  
**License**: CC-BY 3.0  
**Implementation**: Terrene Game Project  
**Game Engine**: Excalibur.js

---

_"I'd get a kick out of someone putting them to good use, so do let me know if you make something cool with them."_ - Lorc
