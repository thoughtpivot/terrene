import { Actor, Color, Engine, ImageFiltering, ImageSource, Physics, Scene, vec } from "excalibur";
import Briar from "../../creatures/Briar/Briar";
import Skipper from "../../creatures/Skipper/Skipper";
import Spout from "../../creatures/Spout/Spout";
import { unlockAudio } from "./audio";
import { cell, makeTerrain, OVERWORLD, VIEW_H, VIEW_W, type Field, type Terrain } from "./field";
import { Hud } from "./Hud";
import type { RoomHooks } from "./room";
import { publishZelda, ZELDA_CAVE_SCENE, ZELDA_LAND_SCENE, zeldaRun } from "./run";
import { Wanderer } from "./Wanderer";
import ZeldaLandImage from "./ZeldaLand.png";

const Resources = {
    Image: new ImageSource(ZeldaLandImage, false, ImageFiltering.Pixel),
};

export { Resources };

/**
 * Zelda Land, the outdoor screen.
 * Forest on the west, desert on the east, one cave mouth on the ridge.
 * Briar keeps the woods, Spout holds the sand, Skipper hops the dunes.
 */
export default class ZeldaLand extends Scene implements RoomHooks {
    hero!: Wanderer;
    field!: Field;
    private terrain!: Terrain;
    private phase = 0;
    private phaseT = 0;
    private enterCool = 0;
    private downT = 0;
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
        console.log("🏰 Zelda Land initializing");
        this.backgroundColor = Color.fromHex("#000000");
        this.terrain = makeTerrain(OVERWORLD, "overworld");
        this.field = this.terrain.field;
        this.add(this.terrain.actor);
        this.hero = new Wanderer(this.field);
        this.add(this.hero);
        this.add(new Hud("ZELDA LAND"));
        const start = cell(6, 9);
        this.spawnX = start.x;
        this.spawnY = start.y;
        this.hero.place(start.x, start.y);
        console.log("🏰 Zelda Land ready");
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
        const spot = zeldaRun.returnOutdoor ? cell(7, 6) : cell(6, 9);
        zeldaRun.returnOutdoor = false;
        this.spawnX = spot.x;
        this.spawnY = spot.y;
        this.hero.place(spot.x, spot.y);
        this.enterCool = 0.35;
        this.downT = 0;
        this.spawnFoes();
    }

    onDeactivate(): void {
        window.removeEventListener("keydown", this.onKey);
    }

    onPreUpdate(engine: Engine, delta: number): void {
        const dt = Math.min(0.05, delta / 1000);
        if (this.enterCool > 0) this.enterCool -= dt;
        this.phaseT += dt;
        if (this.phaseT > 0.38) {
            this.phaseT = 0;
            this.phase = (this.phase + 1) % 4;
            this.terrain.setPhase(this.phase);
        }
        if (this.hero.down) {
            this.downT += dt;
            if (this.downT > 0.9) {
                this.downT = 0;
                zeldaRun.hearts = zeldaRun.maxHearts;
                this.hero.place(this.spawnX, this.spawnY);
                this.spawnFoes();
            }
        } else {
            this.downT = 0;
        }
        if (this.enterCool <= 0 && this.field.charAt(this.hero.pos.x, this.hero.pos.y) === "M") {
            this.enterCool = 0.5;
            zeldaRun.returnOutdoor = true;
            console.log("🏰 Entering the cave");
            engine.goToScene(ZELDA_CAVE_SCENE);
        }
        publishZelda(ZELDA_LAND_SCENE, this.hero, this.field, this.actors);
    }

    private spawnFoes(): void {
        this.clearFoes();
        const briar = cell(3, 7);
        this.spawn(new Briar(briar.x, briar.y, cell(2, 7).x, cell(4, 7).x, this));
        const spout = cell(12, 3);
        this.spawn(new Spout(spout.x, spout.y, this));
        const skipper = cell(12, 8);
        this.spawn(new Skipper(skipper.x, skipper.y, this));
    }

    private clearFoes(): void {
        for (const actor of [...this.actors]) {
            if (actor.hasTag("foe") || actor.hasTag("shot") || actor.hasTag("drop")) actor.kill();
        }
    }
}
