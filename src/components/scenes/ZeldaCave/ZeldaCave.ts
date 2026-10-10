import { Actor, Color, Engine, ImageFiltering, ImageSource, Physics, Scene, vec } from "excalibur";
import Clack from "../../creatures/Clack/Clack";
import Drip from "../../creatures/Drip/Drip";
import Sootwing from "../../creatures/Sootwing/Sootwing";
import { chime, unlockAudio } from "../ZeldaLand/audio";
import { CAVE, cell, HUD, makeTerrain, TILE, VIEW_H, VIEW_W, type Field, type Terrain } from "../ZeldaLand/field";
import { Hud } from "../ZeldaLand/Hud";
import { Quill, Torch } from "../ZeldaLand/props";
import type { RoomHooks } from "../ZeldaLand/room";
import { publishZelda, say, ZELDA_CAVE_SCENE, ZELDA_LAND_SCENE, zeldaRun } from "../ZeldaLand/run";
import { Wanderer } from "../ZeldaLand/Wanderer";
import ZeldaCaveImage from "./ZeldaCave.png";

const Resources = {
    Image: new ImageSource(ZeldaCaveImage, false, ImageFiltering.Pixel),
};

export { Resources };

/**
 * The cave under Zelda Land.
 * Black floor, brown rock, torches on the door. Quill waits in the lit foyer.
 * Sootwing, Drip, and Clack keep to the hall until the blade is taken.
 */
export default class ZeldaCave extends Scene implements RoomHooks {
    hero!: Wanderer;
    field!: Field;
    private terrain!: Terrain;
    private quill!: Quill;
    private phase = 0;
    private phaseT = 0;
    private exitCool = 0;
    private downT = 0;
    private woke = false;
    private spawnX = 0;
    private spawnY = 0;
    private readonly onKey = (event: KeyboardEvent): void => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
            event.preventDefault();
        }
        unlockAudio();
    };

    spawn(actor: Actor): void {
        this.add(actor);
    }

    onInitialize(engine: Engine): void {
        console.log("🏰 Zelda Cave initializing");
        this.backgroundColor = Color.fromHex("#000000");
        this.terrain = makeTerrain(CAVE, "cave");
        this.field = this.terrain.field;
        this.add(this.terrain.actor);
        this.hero = new Wanderer(this.field);
        this.hero.talk = (): boolean => this.offerBlade();
        this.add(this.hero);
        this.add(new Hud("CAVE"));
        const quillAt = cell(4, 7);
        this.quill = new Quill(quillAt.x, quillAt.y);
        this.add(this.quill);
        this.add(new Torch(cell(6, 6).x, cell(6, 6).y));
        this.add(new Torch(cell(10, 6).x, cell(10, 6).y));
        this.add(new Torch(cell(6, 3).x, cell(6, 3).y));
        const start = cell(8, 8);
        this.spawnX = start.x;
        this.spawnY = start.y;
        this.hero.place(start.x, start.y);
        console.log("🏰 Zelda Cave ready");
        void engine;
    }

    onActivate(): void {
        Physics.acc = vec(0, 0);
        this.engine.backgroundColor = Color.fromHex("#000000");
        this.camera.clearAllStrategies();
        this.camera.pos = vec(VIEW_W / 2, VIEW_H / 2);
        this.camera.zoom = 1;
        window.removeEventListener("keydown", this.onKey);
        window.addEventListener("keydown", this.onKey);
        const start = cell(8, 8);
        this.spawnX = start.x;
        this.spawnY = start.y;
        this.hero.place(start.x, start.y);
        this.exitCool = 0.4;
        this.downT = 0;
        this.woke = false;
        this.spawnFoes();
        if (!zeldaRun.blade) say("QUILL KEEPS A BLADE.");
    }

    onDeactivate(): void {
        window.removeEventListener("keydown", this.onKey);
    }

    onPreUpdate(engine: Engine, delta: number): void {
        const dt = Math.min(0.05, delta / 1000);
        if (this.exitCool > 0) this.exitCool -= dt;
        this.phaseT += dt;
        if (this.phaseT > 0.28) {
            this.phaseT = 0;
            this.phase = (this.phase + 1) % 4;
            this.terrain.setPhase(this.phase);
        }
        if (zeldaRun.blade && !this.woke && this.hero.pos.y < HUD + 6 * TILE) {
            this.woke = true;
            say("SOMETHING STIRS IN THE DARK.");
        }
        if (this.hero.down) {
            this.downT += dt;
            if (this.downT > 0.9) {
                this.downT = 0;
                zeldaRun.hearts = zeldaRun.maxHearts;
                this.hero.place(this.spawnX, this.spawnY);
                this.spawnFoes();
                this.woke = zeldaRun.blade && this.hero.pos.y < HUD + 6 * TILE;
            }
        } else {
            this.downT = 0;
        }
        if (this.exitCool <= 0 && this.field.rowAt(this.hero.pos.y) >= 10) {
            this.exitCool = 0.5;
            zeldaRun.returnOutdoor = true;
            console.log("🏰 Leaving the cave");
            engine.goToScene(ZELDA_LAND_SCENE);
        }
        publishZelda(ZELDA_CAVE_SCENE, this.hero, this.field, this.actors);
    }

    private offerBlade(): boolean {
        const dist = Math.hypot(this.quill.pos.x - this.hero.pos.x, this.quill.pos.y - this.hero.pos.y);
        if (dist > 24) {
            if (!zeldaRun.blade) say("SPEAK TO QUILL.");
            return !zeldaRun.blade;
        }
        if (!zeldaRun.blade) {
            zeldaRun.blade = true;
            say("THE WILDS BITE. TAKE THIS BLADE.");
            chime();
            console.log("⚔️ Quill gave the blade");
        } else {
            say("THE HALL AHEAD IS AWAKE.");
        }
        return true;
    }

    private spawnFoes(): void {
        this.clearFoes();
        const soot = cell(5, 2);
        const drip = cell(10, 5);
        const clack = cell(8, 3);
        this.spawn(new Sootwing(soot.x, soot.y, this));
        this.spawn(new Drip(drip.x, drip.y, this));
        this.spawn(new Clack(clack.x, clack.y, this));
    }

    private clearFoes(): void {
        for (const actor of [...this.actors]) {
            if (actor.hasTag("foe") || actor.hasTag("shot") || actor.hasTag("drop")) actor.kill();
        }
    }
}
