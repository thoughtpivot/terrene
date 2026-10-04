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
-   Mapped with ID-based coordinates for easy access
-   Integrated with Excalibur.js as a reusable Actor class

### Features

-   **Dynamic Coordinate Calculation**: Automatically calculates sprite coordinates from ID
-   **Complete Coverage**: Access to all 789 icons via ID (0-788)
-   **Dynamic Switching**: Change icons at runtime with `changeIcon(id)`
-   **Efficient Storage**: No manual mapping required, uses mathematical calculation
-   **Full Icon Range**: From weapons and armor to food and special items

### Example Usage

```typescript
// Create by ID (any icon from 0-788)
const sword = new LorcRPG({ itemId: 0, pos: vec(100, 100) });

// Create random icon
const randomId = LorcRPG.getRandomIconId();
const randomItem = new LorcRPG({ itemId: randomId, pos: vec(200, 100) });

// Change icon dynamically
sword.changeIcon(100); // Change to health potion
```

## Icon Reference

### Quick Reference

-   **Total Icons**: 789 (IDs 0-788)
-   **Grid Layout**: 29 columns × 28 rows
-   **Icon Size**: 64x64 pixels each
-   **Groups**: 7 main groups + special Icons8 collection

### Icon ID Mapping Table

#### Group 1: Weapons & Tools (IDs 0-99)

| ID Range | Original Files                 | Description                                                                                                                                                                  |
| -------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-19     | Icon.1_01.png - Icon.1_20.png  | Primary weapons (Sword, Axe, Bow, Shield, Hammer, Dagger, Spear, Staff, Crossbow, Mace, Wand, Club, Flail, Halberd, Scythe, Katana, Rapier, Claymore, Kunai, Throwing Knife) |
| 20-29    | Icon.1_21.png - Icon.1_30.png  | Tools & utility items (Pickaxe, Shovel, Sickle, Fishing Rod, Net, Rope, Torch, Lantern, Key, Lock)                                                                           |
| 30-39    | Icon.1_31.png - Icon.1_40.png  | Containers & projectiles (Chest, Bag, Backpack, Pouch, Quiver, Arrow, Bolt, Bullet, Crystal, Gem)                                                                            |
| 40-49    | Icon.1_41.png - Icon.1_50.png  | Precious materials (Diamond, Ruby, Emerald, Sapphire, Pearl, Coin, Gold, Silver, Bronze, Iron)                                                                               |
| 50-59    | Icon.1_51.png - Icon.1_60.png  | Metals & enchanted items (Steel, Mithril, Adamantine, Enchanted Sword, Cursed Blade, Holy Symbol, Unholy Symbol, Orb, Scepter, Ring)                                         |
| 60-69    | Icon.1_61.png - Icon.1_70.png  | Jewelry & clothing (Amulet, Bracelet, Necklace, Earrings, Brooch, Cloak, Cape, Belt, Gloves, Boots)                                                                          |
| 70-79    | Icon.1_71.png - Icon.1_80.png  | Headgear & armor (Hat, Mask, Circlet, Tiara, Gauntlets, Bracers, Leggings, Cuirass, Pauldrons, Helm)                                                                         |
| 80-89    | Icon.1_81.png - Icon.1_90.png  | Accessories & navigation (Crown, Sash, Bandana, Eyepatch, Monocle, Spectacles, Goggles, Lens, Telescope, Compass)                                                            |
| 90-99    | Icon.1_91.png - Icon.1_100.png | Documents & writing (Map, Scroll, Book, Tome, Grimoire, Manual, Journal, Letter, Parchment, Ink)                                                                             |

#### Group 2: Potions & Consumables (IDs 100-199)

| ID Range | Original Files                 | Description                                                                                              |
| -------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 100-109  | Icon.2_01.png - Icon.2_10.png  | Basic potions (Health Potion, Mana Potion, Poison, Antidote, Elixir, Tonic, Herb, Mushroom, Berry, Root) |
| 110-199  | Icon.2_11.png - Icon.2_100.png | Extended potion varieties, alchemical ingredients, magical consumables                                   |

#### Group 3: Armor & Equipment (IDs 200-299)

| ID Range | Original Files                 | Description                                                            |
| -------- | ------------------------------ | ---------------------------------------------------------------------- |
| 200-299  | Icon.3_01.png - Icon.3_100.png | Advanced armor pieces, shields, protective gear, specialized equipment |

#### Group 4: Magic Items (IDs 300-399)

| ID Range | Original Files                 | Description                                                            |
| -------- | ------------------------------ | ---------------------------------------------------------------------- |
| 300-399  | Icon.4_01.png - Icon.4_100.png | Magical weapons, enchanted artifacts, spell components, mystical items |

#### Group 5: Food & Consumables (IDs 400-499)

| ID Range | Original Files                 | Description                                             |
| -------- | ------------------------------ | ------------------------------------------------------- |
| 400-404  | Icon.5_01.png - Icon.5_05.png  | Basic food (Apple, Bread, Meat, Cheese, Fish)           |
| 405-499  | Icon.5_06.png - Icon.5_100.png | Extended food varieties, beverages, cooking ingredients |

#### Group 6: Miscellaneous Items (IDs 500-599)

| ID Range | Original Files                 | Description                                         |
| -------- | ------------------------------ | --------------------------------------------------- |
| 500-599  | Icon.6_01.png - Icon.6_100.png | Various utility items, quest objects, special tools |

#### Group 7: Quest Items (IDs 600-699)

| ID Range | Original Files                 | Description                                                |
| -------- | ------------------------------ | ---------------------------------------------------------- |
| 600-699  | Icon.7_01.png - Icon.7_100.png | Unique quest items, rare artifacts, story-specific objects |

#### Icons8 Collection: Special Items (IDs 700-788)

| ID Range | Original Files                | Description                                                                           |
| -------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| 700-704  | Icons8_01.png - Icons8_05.png | Premium items (Special Sword, Magic Orb, Phoenix Feather, Dragon Scale, Unicorn Horn) |
| 705-788  | Icons8_06.png - Icons8_89.png | Extended special collection with 84 additional unique fantasy items                   |

### Usage Tips

1. **Common Items**: Use IDs 0-109 for standard RPG items (weapons, armor, potions)
2. **Food & Consumables**: Use IDs 400-499 for food items and consumables
3. **Special/Rare Items**: Use IDs 700-788 for unique or legendary items
4. **Random Selection**: Use `LorcRPG.getRandomIconId()` for variety
5. **ID Validation**: All IDs from 0-788 are valid; the system will throw errors for invalid IDs

## Files

-   `LorcRPG.ts` - Main actor class
-   `LorcRPG.config.ts` - Dynamic coordinate calculation system
-   `LorcRPG.png` - Sprite sheet (1856x1792px)
-   `LorcRPG.json` - Aseprite export data

## Credits

**Original Art**: Lorc  
**License**: CC-BY 3.0  
**Implementation**: Terrene Game Project  
**Game Engine**: Excalibur.js

---

_"I'd get a kick out of someone putting them to good use, so do let me know if you make something cool with them."_ - Lorc
