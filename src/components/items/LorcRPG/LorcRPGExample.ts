/**
 * LorcRPG Usage Examples
 *
 * This file demonstrates how to use the generic LorcRPG actor to display
 * any of the 789 Lorc RPG icons from the sprite sheet.
 */

import LorcRPG from "./LorcRPG";
import { vec } from "excalibur";

export class LorcRPGExamples {
    /**
     * Example 1: Create a sword item using item name
     */
    static createSwordByName() {
        const sword = new LorcRPG({
            itemName: "Sword",
            pos: vec(100, 100),
            scale: 3, // Make it 3x larger
        });
        return sword;
    }

    /**
     * Example 2: Create a health potion using item ID
     */
    static createHealthPotionById() {
        const healthPotion = new LorcRPG({
            itemId: 100, // Health potion ID
            pos: vec(200, 100),
            scale: 2,
        });
        return healthPotion;
    }

    /**
     * Example 3: Create an item and change it dynamically
     */
    static createDynamicItem() {
        const dynamicItem = new LorcRPG({
            itemName: "Chest",
            pos: vec(300, 100),
        });

        // Change to a different item after 3 seconds
        setTimeout(() => {
            dynamicItem.changeIcon("Magic_Orb");
        }, 3000);

        // Change to another item after 6 seconds using ID
        setTimeout(() => {
            dynamicItem.changeIcon(undefined, 45); // Coin
        }, 6000);

        return dynamicItem;
    }

    /**
     * Example 4: Create multiple items of different types
     */
    static createItemCollection() {
        const items = [];

        // Weapons
        items.push(
            new LorcRPG({
                itemName: "Sword",
                pos: vec(50, 200),
                scale: 2,
            })
        );

        items.push(
            new LorcRPG({
                itemName: "Bow",
                pos: vec(150, 200),
                scale: 2,
            })
        );

        items.push(
            new LorcRPG({
                itemName: "Staff",
                pos: vec(250, 200),
                scale: 2,
            })
        );

        // Potions
        items.push(
            new LorcRPG({
                itemName: "Health_Potion",
                pos: vec(50, 300),
                scale: 2,
            })
        );

        items.push(
            new LorcRPG({
                itemName: "Mana_Potion",
                pos: vec(150, 300),
                scale: 2,
            })
        );

        // Food
        items.push(
            new LorcRPG({
                itemName: "Apple",
                pos: vec(50, 400),
                scale: 2,
            })
        );

        items.push(
            new LorcRPG({
                itemName: "Bread",
                pos: vec(150, 400),
                scale: 2,
            })
        );

        // Special items
        items.push(
            new LorcRPG({
                itemName: "Phoenix_Feather",
                pos: vec(50, 500),
                scale: 2,
            })
        );

        items.push(
            new LorcRPG({
                itemName: "Dragon_Scale",
                pos: vec(150, 500),
                scale: 2,
            })
        );

        return items;
    }

    /**
     * Example 5: Get information about available icons
     */
    static logAvailableIcons() {
        const availableIcons = LorcRPG.getAvailableIcons();
        console.log("Available Lorc RPG Icons:");

        // Log first 20 icons as examples
        const iconNames = Object.keys(availableIcons).slice(0, 20);
        iconNames.forEach((name) => {
            const icon = availableIcons[name];
            console.log(`${name}: ID ${icon.id} at (${icon.x}, ${icon.y})`);
        });

        console.log(
            `... and ${Object.keys(availableIcons).length - 20} more icons`
        );
    }

    /**
     * Example 6: Create a random item
     */
    static createRandomItem() {
        const availableIcons = LorcRPG.getAvailableIcons();
        const iconNames = Object.keys(availableIcons);
        const randomName =
            iconNames[Math.floor(Math.random() * iconNames.length)];

        const randomItem = new LorcRPG({
            itemName: randomName,
            pos: vec(400, 300),
            scale: 2.5,
        });

        console.log(`Created random item: ${randomName}`);
        return randomItem;
    }

    /**
     * Example 7: Create an inventory display
     */
    static createInventoryGrid() {
        const items = [];
        const itemNames = [
            "Sword",
            "Shield",
            "Health_Potion",
            "Key",
            "Coin",
            "Apple",
            "Book",
            "Gem",
        ];

        for (let i = 0; i < itemNames.length; i++) {
            const col = i % 4;
            const row = Math.floor(i / 4);

            const item = new LorcRPG({
                itemName: itemNames[i],
                pos: vec(50 + col * 80, 600 + row * 80),
                scale: 1.5,
            });

            items.push(item);
        }

        return items;
    }
}

export default LorcRPGExamples;
