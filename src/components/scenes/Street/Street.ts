// 1. ExcaliburJS core
import {
    Actor,
    Circle,
    CollisionType,
    Color,
    Rectangle,
    Engine,
    Font,
    ImageFiltering,
    ImageSource,
    Keys,
    Scene,
    ScreenElement,
    Text,
    vec,
    type Vector,
} from "excalibur";

// 3. Common
import type { ChatMessage } from "../../../common/ChatSystem";
import type { DialogueNPC } from "../../../common/DialogueNPC";

// 4. Scene modules
import { carGraphic, dumpsterGraphic, groundGraphic, personGraphic, stopSignGraphic, type FigureKind } from "./art";
import { VIEW_H, VIEW_W, WORLD, buildSceneOne, type City, type StreetLevel, type StreetPack } from "./level";
import {
    FOLLOW_GAP,
    NO_LINES,
    PLAYER_RADIUS,
    PLAYER_SPRINT,
    PLAYER_WALK,
    TALK_RANGE,
    YES_LINES,
    abortHandoff,
    approach,
    ask,
    beginHandoff,
    carHitsPlayer,
    circleHitsRect,
    clamp,
    clearHeat,
    dismiss,
    facingOf,
    freshSale,
    gateClosed,
    lightPhase,
    pointInRect,
    sees,
    slide,
    tickSale,
    type Dir,
    type Rect,
    type Sale,
    type Vec,
} from "./rules";

// 5. Assets
import StreetImage from "./Street.png";

export const STREET_SCENE = "street";

const Resources = {
    Image: new ImageSource(StreetImage, false, ImageFiltering.Pixel),
};

export { Resources };

const CAR_COLORS = ["#c23b3b", "#3c6eae", "#e6d36a", "#f7f4ee", "#2c2c30"];
const PED_SPEED = 62;

interface SavedScreen {
    width: number;
    height: number;
    pixelRatio: number | undefined;
    antialiasing: boolean;
    snap: boolean;
    background: Color;
}

interface Body {
    actor: Actor;
    x: number;
    y: number;
    dir: Dir;
    look: string;
}

interface Npc extends Body {
    id: number;
    name: string;
    coat: string;
    homeX: number;
    homeY: number;
    homeDir: Dir;
    state: "sit" | "follow" | "hold" | "home" | "chew";
}

interface Ped extends Body {
    pts: Vec[];
    lengths: number[];
    total: number;
    cursor: number;
    coat: string;
}

interface Cop extends Body {
    sprintLeft: number;
    recoverLeft: number;
    mode: "chase" | "search" | "leave";
    searchLeft: number;
    lastX: number;
    lastY: number;
    leaveX: number;
    leaveY: number;
}

interface Ride {
    actor: Actor;
    lane: number;
    pos: number;
    speed: number;
    dir: 1 | -1;
    axis: "x" | "y";
    fixed: number;
    min: number;
    max: number;
    color: string;
    look: string;
    cleared: Set<number>;
    wait: number;
}

interface Lamp {
    actor: Actor;
    flow: "ns" | "ew";
    shown: string;
}

class SeatActor extends Actor implements DialogueNPC {
    constructor(private npcName: string) {
        super({
            name: npcName,
            width: 28,
            height: 28,
            anchor: vec(0.5, 0.5),
            collisionType: CollisionType.PreventCollision,
        });
        this.body.useGravity = false;
    }

    public getDialogue(): ChatMessage[] {
        return [{ speaker: this.npcName, text: "..." }];
    }

    public isInRange(playerPos: Vector): boolean {
        return Math.hypot(this.pos.x - playerPos.x, this.pos.y - playerPos.y) <= TALK_RANGE;
    }

    public getNPCName(): string {
        return this.npcName;
    }
}

/**
 * Top-down block. Scene one is the default pack; pass another pack for a later level.
 * Open this one at #street.
 */
export default class Street extends Scene {
    private readonly pack: StreetPack;
    private saved: SavedScreen | null = null;
    private player!: Body;
    private npcs: Npc[] = [];
    private peds: Ped[] = [];
    private cops: Cop[] = [];
    private cars: Ride[] = [];
    private lamps: Lamp[] = [];
    private sale: Sale = freshSale();
    private hidden = false;
    private hideIndex = -1;
    private mode: "play" | "dead" | "won" = "play";
    private death: "car" | "arrest" | "" = "";
    private deadFor = 0;
    private lightTime = 0;
    private banner = "";
    private bannerLeft = 0;
    private callSpot: Vec | null = null;
    private hadHeat = false;
    private cashText!: Text;
    private hintText!: Text;
    private bannerText!: Text;
    private cardText!: Text;
    private cardPanel!: ScreenElement;
    private booted = false;

    constructor(pack: StreetPack = buildSceneOne()) {
        super();
        this.pack = pack;
    }

    private get level(): StreetLevel {
        return this.pack.level;
    }

    private get city(): City {
        return this.pack.city;
    }

    onInitialize(engine: Engine): void {
        this.backgroundColor = Color.fromHex("#cbb89a");
        void engine;
        console.log("🏰 Street scene ready to boot");
    }

    onActivate(context: { engine: Engine }): void {
        this.enterHd(context.engine);
        this.boot();
        window.removeEventListener("keydown", this.onKey);
        window.addEventListener("keydown", this.onKey);
    }

    onDeactivate(context: { engine: Engine }): void {
        window.removeEventListener("keydown", this.onKey);
        this.leaveHd(context.engine);
        console.log("🏰 Street scene deactivated");
    }

    onPreUpdate(engine: Engine, delta: number): void {
        const dt = Math.min(0.05, delta / 1000);
        if (!this.booted) return;
        if (this.mode === "dead") {
            this.deadFor += dt;
            this.refreshHud();
            if (this.deadFor >= 1.3) this.boot();
            return;
        }
        if (this.mode === "won") {
            this.refreshHud();
            this.maybeContinue(engine);
            return;
        }
        this.updatePlay(engine, dt);
        this.placeCamera();
        this.refreshHud();
    }

    private readonly onKey = (event: KeyboardEvent): void => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
            event.preventDefault();
        }
    };

    private boot(): void {
        for (const actor of [...this.actors]) actor.kill();
        this.npcs = [];
        this.peds = [];
        this.cops = [];
        this.cars = [];
        this.lamps = [];
        this.sale = freshSale();
        this.hidden = false;
        this.hideIndex = -1;
        this.mode = "play";
        this.death = "";
        this.deadFor = 0;
        this.lightTime = 0;
        this.banner = `${this.level.title}. Cheesy Squares, $${this.level.price}. $${this.level.goal} clears it.`;
        this.bannerLeft = 4.2;
        this.callSpot = null;
        this.hadHeat = false;

        const ground = new Actor({
            name: "Ground",
            pos: vec(WORLD / 2, WORLD / 2),
            anchor: vec(0.5, 0.5),
            width: 1,
            height: 1,
            z: 0,
            collisionType: CollisionType.PreventCollision,
        });
        ground.body.useGravity = false;
        ground.graphics.use(groundGraphic(this.city, this.level.time).clone());
        this.add(ground);

        for (const dump of this.city.dumpsters) {
            const actor = this.prop(dump.x + dump.w / 2, dump.y + dump.h / 2, dumpsterGraphic(), "Dumpster");
            this.add(actor);
        }

        for (const sign of this.city.signs) {
            if (sign.kind === "stop") {
                this.add(this.prop(sign.x, sign.y, stopSignGraphic(), "Stop"));
            } else {
                const actor = new Actor({
                    name: sign.kind === "ns" ? "North light" : "East light",
                    pos: vec(sign.x, sign.y),
                    anchor: vec(0.5, 0.5),
                    z: 2,
                    collisionType: CollisionType.PreventCollision,
                });
                actor.body.useGravity = false;
                actor.graphics.use(lampCircle("#c92a2a"));
                this.add(actor);
                this.lamps.push({ actor, flow: sign.kind, shown: "red" });
            }
        }

        const start = this.city.start;
        const playerActor = new Actor({
            name: "Seller",
            pos: vec(start.x, start.y),
            width: 28,
            height: 28,
            anchor: vec(0.5, 0.5),
            collisionType: CollisionType.PreventCollision,
            z: start.y,
        });
        playerActor.body.useGravity = false;
        this.player = { actor: playerActor, x: start.x, y: start.y, dir: "n", look: "" };
        this.paint(this.player, "seller", "#3f8f5b");
        this.add(playerActor);

        for (const seat of this.city.seats) {
            const actor = new SeatActor(seat.name);
            actor.pos = vec(seat.x, seat.y);
            actor.z = seat.y;
            const npc: Npc = {
                actor,
                x: seat.x,
                y: seat.y,
                dir: seat.facing,
                look: "",
                id: seat.id,
                name: seat.name,
                coat: seat.coat,
                homeX: seat.x,
                homeY: seat.y,
                homeDir: seat.facing,
                state: "sit",
            };
            this.paint(npc, "sit", npc.coat);
            this.npcs.push(npc);
            this.add(actor);
        }

        for (const route of this.city.peds) {
            const { lengths, total } = measure(route.pts);
            const cursor = route.offset * total;
            const at = pointOn(route.pts, lengths, cursor);
            const actor = new Actor({
                name: "Pedestrian",
                pos: vec(at.x, at.y),
                width: 26,
                height: 26,
                anchor: vec(0.5, 0.5),
                collisionType: CollisionType.PreventCollision,
                z: at.y,
            });
            actor.body.useGravity = false;
            const ped: Ped = {
                actor,
                x: at.x,
                y: at.y,
                dir: at.dir,
                look: "",
                pts: route.pts,
                lengths,
                total,
                cursor,
                coat: route.coat,
            };
            this.paint(ped, "walk", ped.coat);
            this.peds.push(ped);
            this.add(actor);
        }

        this.city.lanes.forEach((lane, laneIndex) => {
            for (let i = 0; i < this.level.carsPerLane; i++) {
                const span = lane.max - lane.min;
                const pos = lane.min + ((i + 0.35) / this.level.carsPerLane) * span;
                const color = CAR_COLORS[(laneIndex + i) % CAR_COLORS.length];
                const at = ridePos(lane.axis, lane.fixed, pos);
                const actor = new Actor({
                    name: "Car",
                    pos: vec(at.x, at.y),
                    width: 32,
                    height: 32,
                    anchor: vec(0.5, 0.5),
                    collisionType: CollisionType.PreventCollision,
                    z: 4,
                });
                actor.body.useGravity = false;
                const ride: Ride = {
                    actor,
                    lane: laneIndex,
                    pos,
                    speed: this.level.carSpeed,
                    dir: lane.dir,
                    axis: lane.axis,
                    fixed: lane.fixed,
                    min: lane.min,
                    max: lane.max,
                    color,
                    look: "",
                    cleared: new Set<number>(),
                    wait: 0,
                };
                this.paintCar(ride);
                this.cars.push(ride);
                this.add(actor);
            }
        });

        this.makeHud();
        this.camera.zoom = 1;
        this.camera.clearAllStrategies();
        this.placeCamera();
        this.booted = true;
        console.log(`🏰 ${this.level.title} booted. ${this.city.seats.length} seats, goal $${this.level.goal}`);
    }

    private updatePlay(engine: Engine, dt: number): void {
        const kb = engine.input.keyboard;
        const locked = this.sale.phase === "exchange" || this.sale.phase === "toss";
        if (!locked && !this.hidden) {
            let x = 0;
            let y = 0;
            if (kb.isHeld(Keys.Left) || kb.isHeld(Keys.A)) x -= 1;
            if (kb.isHeld(Keys.Right) || kb.isHeld(Keys.D)) x += 1;
            if (kb.isHeld(Keys.Up) || kb.isHeld(Keys.W)) y -= 1;
            if (kb.isHeld(Keys.Down) || kb.isHeld(Keys.S)) y += 1;
            const len = Math.hypot(x, y);
            if (len > 0) {
                const sprint = kb.isHeld(Keys.ShiftLeft) || kb.isHeld(Keys.ShiftRight);
                const speed = sprint ? PLAYER_SPRINT : PLAYER_WALK;
                const step = slide(
                    { x: this.player.x, y: this.player.y },
                    (x / len) * speed * dt,
                    (y / len) * speed * dt,
                    PLAYER_RADIUS,
                    this.solids(true)
                );
                this.player.x = clamp(step.x, 20, WORLD - 20);
                this.player.y = clamp(step.y, 20, WORLD - 20);
                this.player.dir = facingOf(x, y, this.player.dir);
            }
        }
        if (kb.wasPressed(Keys.E)) this.onUse();
        if (kb.wasPressed(Keys.Q)) this.onCancel();

        this.updateFollower(dt);
        this.updatePeds(dt);
        this.updateCars(dt);
        if (this.mode !== "play") return;
        this.updateSale(dt);
        if (this.mode !== "play") return;
        this.updateCops(dt);

        this.paint(this.player, "seller", "#3f8f5b");
        this.player.actor.pos = vec(this.player.x, this.player.y);
        this.player.actor.z = Math.floor(this.player.y);
        this.player.actor.graphics.opacity = this.hidden ? 0 : 1;
        this.bannerLeft = Math.max(0, this.bannerLeft - dt);
        this.refreshLamps();
    }

    private onUse(): void {
        if (this.hidden) {
            const dump = this.city.dumpsters[this.hideIndex];
            const spot = dump ? exitSpot(dump, this.city.buildings) : { x: this.player.x, y: this.player.y + 28 };
            this.hidden = false;
            this.hideIndex = -1;
            this.player.x = spot.x;
            this.player.y = spot.y;
            this.say("You climb out.");
            return;
        }
        if (this.sale.phase === "exchange") {
            const id = this.sale.npc;
            this.sale = abortHandoff(this.sale, this.level.policeDelay);
            this.sendHome(id);
            if (this.sale.note === "call") this.say("Somebody saw that.");
            else this.say("You close the box.");
            return;
        }
        if (this.sale.phase === "toss") return;

        const dump = this.nearestDump(54);
        if ((this.sale.heat || this.sale.policeIn !== null) && dump >= 0) {
            this.hideIn(dump);
            return;
        }
        if (this.sale.phase === "follow") {
            const follower = this.npcById(this.sale.npc);
            if (!follower || Math.hypot(follower.x - this.player.x, follower.y - this.player.y) > 120) {
                this.say("They're still catching up.");
                return;
            }
            const spot = { x: (this.player.x + follower.x) / 2, y: (this.player.y + follower.y) / 2 };
            this.sale = beginHandoff(this.sale, this.witnessedAt(spot));
            follower.state = "hold";
            this.callSpot = spot;
            return;
        }
        const seat = this.nearestSeat();
        if (seat) {
            const roll = Math.random();
            this.sale = ask(this.sale, seat.id, roll);
            if (this.sale.note === "no") this.say(`${seat.name}: ${pick(NO_LINES)}`);
            if (this.sale.note === "yes") {
                seat.state = "follow";
                this.say(`${seat.name}: ${pick(YES_LINES)}`);
            }
            return;
        }
        if (dump >= 0) this.hideIn(dump);
    }

    private onCancel(): void {
        if (this.sale.phase !== "follow") return;
        const id = this.sale.npc;
        this.sale = dismiss(this.sale);
        this.sendHome(id);
        this.say("They head back to the wall.");
    }

    private updateFollower(dt: number): void {
        for (const npc of this.npcs) {
            if (npc.state === "sit" || npc.state === "chew" || npc.state === "hold") {
                if (npc.state === "sit") {
                    npc.x = npc.homeX;
                    npc.y = npc.homeY;
                    npc.dir = npc.homeDir;
                }
                this.sync(npc, npc.state === "chew" ? "chew" : npc.state === "sit" ? "sit" : "walk", npc.coat);
                continue;
            }
            const target = npc.state === "home"
                ? { x: npc.homeX, y: npc.homeY }
                : behind(this.player, FOLLOW_GAP);
            const dx = target.x - npc.x;
            const dy = target.y - npc.y;
            const dist = Math.hypot(dx, dy);
            if (npc.state === "home" && dist < 8) {
                npc.state = "sit";
                npc.x = npc.homeX;
                npc.y = npc.homeY;
                npc.dir = npc.homeDir;
                this.sync(npc, "sit", npc.coat);
                continue;
            }
            const speed = npc.state === "follow" ? Math.max(PLAYER_SPRINT, 200) : PLAYER_WALK;
            const step = dist < 1 ? 0 : Math.min(dist, speed * dt);
            const moved = slide(npc, dist < 1 ? 0 : (dx / dist) * step, dist < 1 ? 0 : (dy / dist) * step, 12, this.solids(true));
            npc.x = moved.x;
            npc.y = moved.y;
            if (step > 0) npc.dir = facingOf(dx, dy, npc.dir);
            this.sync(npc, "walk", npc.coat);
        }
    }

    private updatePeds(dt: number): void {
        for (const ped of this.peds) {
            ped.cursor = (ped.cursor + PED_SPEED * dt) % ped.total;
            const at = pointOn(ped.pts, ped.lengths, ped.cursor);
            ped.x = at.x;
            ped.y = at.y;
            ped.dir = at.dir;
            this.sync(ped, "walk", ped.coat);
        }
    }

    private updateCars(dt: number): void {
        const phase = lightPhase(this.lightTime, this.level.greenSeconds);
        this.lightTime += dt;
        for (const car of this.cars) {
            const lane = this.city.lanes[car.lane];
            let blocking: { line: number; dist: number; kind: "light" | "stop" | "yield"; flow: "ns" | "ew"; crossId: number } | null = null;
            for (const gate of lane.gates) {
                const dist = approach(car.pos, car.dir, gate.line);
                if (dist >= -2 && dist < 240 && (!blocking || dist < blocking.dist)) {
                    blocking = { line: gate.line, dist, kind: gate.kind, flow: gate.flow, crossId: gate.crossId };
                }
            }
            const gap = this.gapToNext(car);
            let closed = false;
            if (blocking) {
                const busy = this.crossBusy(blocking.crossId);
                closed = gateClosed(blocking.kind, blocking.flow, phase, busy, car.cleared.has(blocking.line));
            }
            if (blocking && closed) {
                car.speed = Math.min(car.speed, Math.max(0, blocking.dist * 2.4));
                if (blocking.dist < 12) {
                    car.speed = 0;
                    if (blocking.kind === "stop") {
                        car.wait += dt;
                        if (car.wait > 0.7 && !this.crossBusy(blocking.crossId)) car.cleared.add(blocking.line);
                    }
                }
            } else {
                car.wait = 0;
                car.speed = Math.min(this.level.carSpeed, car.speed + 320 * dt);
            }
            if (gap < 76) car.speed = Math.min(car.speed, Math.max(0, (gap - 58) * 3));
            car.pos += car.speed * car.dir * dt;
            if (car.dir > 0 && car.pos > car.max) car.pos = car.min + (car.pos - car.max);
            if (car.dir < 0 && car.pos < car.min) car.pos = car.max - (car.min - car.pos);
            for (const line of [...car.cleared]) {
                if (approach(car.pos, car.dir, line) < -48) car.cleared.delete(line);
            }
            const at = ridePos(car.axis, car.fixed, car.pos);
            car.actor.pos = vec(at.x, at.y);
            car.actor.z = 3;
            this.paintCar(car);
            const box = carBox(car);
            if (carHitsPlayer(this.player.x, this.player.y, PLAYER_RADIUS, box, this.city.crosswalks) && !this.hidden) {
                this.fail("car");
                return;
            }
        }
    }

    private updateSale(dt: number): void {
        const prevTimer = this.sale.policeIn;
        const prevHeat = this.sale.heat;
        this.sale = tickSale(this.sale, dt, this.level.price, this.level.policeDelay);
        if (this.sale.note === "paid") {
            const npc = this.npcById(this.sale.npc);
            if (npc) npc.state = "chew";
            this.say(`$${this.level.price}. They tear the box open.`);
            if (prevTimer === null && this.sale.policeIn !== null) this.markCall();
        }
        if (this.sale.note === "free") this.say("They're chewing. You can go.");
        if (!prevHeat && this.sale.heat) this.spawnPolice();
        if (this.sale.money >= this.level.goal && this.sale.phase === "idle") {
            this.mode = "won";
            this.say("");
            console.log(`🏰 ${this.level.title} clear at $${this.sale.money}`);
        }
    }

    private updateCops(dt: number): void {
        for (const cop of [...this.cops]) {
            const seen = !this.hidden && sees(cop.x, cop.y, this.player.x, this.player.y, this.level.copSight, this.city.buildings);
            if (seen) {
                cop.lastX = this.player.x;
                cop.lastY = this.player.y;
                cop.mode = "chase";
            }
            if (cop.mode === "chase" && !seen && Math.hypot(cop.x - cop.lastX, cop.y - cop.lastY) < 18) {
                cop.mode = "search";
                cop.searchLeft = 4.2;
            }
            if (cop.mode === "search") {
                cop.searchLeft -= dt;
                if (seen) cop.mode = "chase";
                else if (cop.searchLeft <= 0) cop.mode = "leave";
            }
            const target = cop.mode === "leave"
                ? { x: cop.leaveX, y: cop.leaveY }
                : cop.mode === "search"
                    ? { x: cop.lastX + Math.sin(cop.searchLeft * 3) * 18, y: cop.lastY }
                    : { x: cop.lastX, y: cop.lastY };
            let speed = this.level.policeWalk;
            if (cop.mode !== "leave" && cop.sprintLeft > 0) {
                speed = this.level.policeSprint;
                cop.sprintLeft -= dt;
                if (cop.sprintLeft <= 0) cop.recoverLeft = this.level.policeRecover;
            } else {
                cop.recoverLeft -= dt;
                if (cop.recoverLeft <= 0) cop.sprintLeft = this.level.policeSprintTime;
            }
            const dx = target.x - cop.x;
            const dy = target.y - cop.y;
            const dist = Math.hypot(dx, dy);
            const step = dist < 1 ? 0 : Math.min(dist, speed * dt);
            const moved = slide(
                cop,
                dist < 1 ? 0 : (dx / dist) * step,
                dist < 1 ? 0 : (dy / dist) * step,
                12,
                this.solids(true)
            );
            cop.x = clamp(moved.x, 16, WORLD - 16);
            cop.y = clamp(moved.y, 16, WORLD - 16);
            if (step > 0) cop.dir = facingOf(dx, dy, cop.dir);
            this.sync(cop, "cop", "#243456");
            if (this.hidden && this.hideIndex >= 0) {
                const dump = this.city.dumpsters[this.hideIndex];
                const cx = dump.x + dump.w / 2;
                const cy = dump.y + dump.h / 2;
                if (Math.hypot(cop.x - cx, cop.y - cy) < this.level.pullRadius) {
                    this.fail("arrest");
                    return;
                }
            } else if (Math.hypot(cop.x - this.player.x, cop.y - this.player.y) < 22) {
                this.fail("arrest");
                return;
            }
            if (cop.mode === "leave" && Math.hypot(cop.x - cop.leaveX, cop.y - cop.leaveY) < 24) {
                cop.actor.kill();
                this.cops = this.cops.filter((other) => other !== cop);
            }
        }
        if (this.hadHeat && this.cops.length === 0) {
            this.sale = clearHeat(this.sale);
            this.hadHeat = false;
            this.say("They gave up.");
        }
    }

    private spawnPolice(): void {
        const spot = this.callSpot ?? { x: this.player.x, y: this.player.y };
        const edges = [
            { x: clamp(spot.x, 40, WORLD - 40), y: 36 },
            { x: clamp(spot.x, 40, WORLD - 40), y: WORLD - 36 },
            { x: 36, y: clamp(spot.y, 40, WORLD - 40) },
            { x: WORLD - 36, y: clamp(spot.y, 40, WORLD - 40) },
        ].sort((a, b) => (a.x - spot.x) ** 2 + (a.y - spot.y) ** 2 - ((b.x - spot.x) ** 2 + (b.y - spot.y) ** 2));
        edges.slice(0, 2).forEach((edge, index) => {
            const actor = new Actor({
                name: "Police",
                pos: vec(edge.x, edge.y),
                width: 28,
                height: 28,
                anchor: vec(0.5, 0.5),
                collisionType: CollisionType.PreventCollision,
                z: edge.y,
            });
            actor.body.useGravity = false;
            const cop: Cop = {
                actor,
                x: edge.x,
                y: edge.y,
                dir: "s",
                look: "",
                sprintLeft: this.level.policeSprintTime,
                recoverLeft: 0,
                mode: "chase",
                searchLeft: 0,
                lastX: spot.x + index * 12,
                lastY: spot.y,
                leaveX: edge.x,
                leaveY: edge.y,
            };
            this.paint(cop, "cop", "#243456");
            this.cops.push(cop);
            this.add(actor);
        });
        this.hadHeat = true;
        this.say("Police on the block.");
        console.log("🏰 Police called");
    }

    private fail(kind: "car" | "arrest"): void {
        this.mode = "dead";
        this.death = kind;
        this.deadFor = 0;
        this.hidden = false;
        this.banner = "";
        this.bannerLeft = 0;
        this.sale = { ...this.sale, money: 0 };
        console.log(kind === "car" ? "🏰 Hit by a car" : "🏰 Arrested");
    }

    private maybeContinue(engine: Engine): void {
        if (!this.level.next) return;
        if (!engine.input.keyboard.wasPressed(Keys.Enter)) return;
        const next = this.level.next;
        history.replaceState(null, "", `#${next}`);
        engine.goToScene(next);
    }

    private updateLampsNow(): void {
        const phase = lightPhase(this.lightTime, this.level.greenSeconds);
        for (const lamp of this.lamps) {
            const green = lamp.flow === "ns" ? phase.nsGreen : phase.ewGreen;
            const color = green ? "green" : "red";
            if (lamp.shown === color) continue;
            lamp.shown = color;
            lamp.actor.graphics.use(lampCircle(green ? "#2f9e44" : "#e03131"));
        }
    }

    private refreshLamps(): void {
        this.updateLampsNow();
    }

    private witnessedAt(spot: Vec): boolean {
        return this.peds.some((ped) =>
            sees(ped.x, ped.y, spot.x, spot.y, this.level.witnessRadius, this.city.buildings)
        );
    }

    private markCall(): void {
        this.say("Somebody saw that.");
    }

    private sendHome(id: number | null): void {
        const npc = this.npcById(id);
        if (!npc || npc.state === "chew") return;
        npc.state = "home";
    }

    private npcById(id: number | null): Npc | undefined {
        if (id === null) return undefined;
        return this.npcs.find((npc) => npc.id === id);
    }

    private nearestSeat(): Npc | null {
        if (this.sale.phase !== "idle") return null;
        let best: Npc | null = null;
        let bestDist = TALK_RANGE;
        for (const npc of this.npcs) {
            if (npc.state !== "sit" || this.sale.sold.includes(npc.id)) continue;
            const dist = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
            if (dist <= bestDist) {
                best = npc;
                bestDist = dist;
            }
        }
        return best;
    }

    private nearestDump(range: number): number {
        let best = -1;
        let bestDist = range;
        this.city.dumpsters.forEach((dump, index) => {
            const dist = Math.hypot(dump.x + dump.w / 2 - this.player.x, dump.y + dump.h / 2 - this.player.y);
            if (dist <= bestDist) {
                best = index;
                bestDist = dist;
            }
        });
        return best;
    }

    private hideIn(index: number): void {
        const dump = this.city.dumpsters[index];
        this.hidden = true;
        this.hideIndex = index;
        this.player.x = dump.x + dump.w / 2;
        this.player.y = dump.y + dump.h / 2;
        this.say("You drop into the dumpster.");
    }

    private solids(includeDumpsters: boolean): Rect[] {
        if (!includeDumpsters) return this.city.buildings;
        return this.city.buildings.concat(this.city.dumpsters);
    }

    private feet(): Vec[] {
        const points = [
            ...this.peds.map((ped) => ({ x: ped.x, y: ped.y })),
            ...this.npcs.filter((npc) => npc.state !== "sit").map((npc) => ({ x: npc.x, y: npc.y })),
            ...this.cops.map((cop) => ({ x: cop.x, y: cop.y })),
        ];
        if (!this.hidden) points.push({ x: this.player.x, y: this.player.y });
        return points;
    }

    private crossBusy(crossId: number): boolean {
        const walk = this.city.crosswalks[crossId];
        if (!walk) return false;
        return this.feet().some((foot) => pointInRect(foot.x, foot.y, walk));
    }

    private gapToNext(car: Ride): number {
        let gap = 10000;
        for (const other of this.cars) {
            if (other === car || other.lane !== car.lane) continue;
            let ahead = (other.pos - car.pos) * car.dir;
            const span = car.max - car.min;
            if (ahead < 0) ahead += span;
            if (ahead < gap) gap = ahead;
        }
        return gap;
    }

    private paint(body: Body, kind: FigureKind, coat: string): void {
        const key = `${kind}:${body.dir}:${coat}`;
        if (body.look === key) return;
        body.look = key;
        body.actor.graphics.use(personGraphic(kind, body.dir, coat).clone());
    }

    private paintCar(car: Ride): void {
        const dir: Dir = car.axis === "y" ? (car.dir > 0 ? "s" : "n") : car.dir > 0 ? "e" : "w";
        const key = `${dir}:${car.color}`;
        if (car.look === key) return;
        car.look = key;
        car.actor.graphics.use(carGraphic(dir, car.color).clone());
    }

    private sync(body: Body, kind: FigureKind, coat: string): void {
        this.paint(body, kind, coat);
        body.actor.pos = vec(body.x, body.y);
        body.actor.z = Math.floor(body.y);
    }

    private say(text: string): void {
        this.banner = text;
        this.bannerLeft = text ? 2.8 : 0;
    }

    private hint(): string {
        if (this.mode === "dead") return this.death === "car" ? "A car got you." : "They pulled you out.";
        if (this.mode === "won") {
            return this.level.next ? "Scene clear. Enter for the next block." : "Five hundred. Scene one is clear.";
        }
        if (this.hidden) return "E  climb out";
        if (this.sale.phase === "exchange") return "E  back out of the sale";
        if (this.sale.phase === "toss") return "They're opening the box.";
        if (this.sale.phase === "follow") return "E  sell    Q  send them back";
        if (this.nearestSeat()) return "E  ask";
        if (this.nearestDump(54) >= 0) return "E  hide in the dumpster";
        if (this.sale.policeIn !== null) return "Someone is calling.";
        if (this.sale.heat) return "Police are looking.";
        return "Shift  sprint";
    }

    private makeHud(): void {
        const font = hudFont(20);
        const small = hudFont(16);
        this.cashText = new Text({ text: "", font });
        this.hintText = new Text({ text: "", font: small });
        this.bannerText = new Text({ text: "", font: small });
        this.cardText = new Text({ text: "", font });
        this.add(this.panel(12, 10, 520, 34));
        this.add(this.panel(12, VIEW_H - 78, 720, 64));
        this.cardPanel = this.panel(VIEW_W / 2 - 260, VIEW_H / 2 - 28, 520, 48);
        this.add(this.cardPanel);
        this.add(this.label(this.cashText, 24, 16));
        this.add(this.label(this.hintText, 24, VIEW_H - 36));
        this.add(this.label(this.bannerText, 24, VIEW_H - 62));
        this.add(this.label(this.cardText, VIEW_W / 2 - 240, VIEW_H / 2 - 14));
    }

    private panel(x: number, y: number, w: number, h: number): ScreenElement {
        const actor = new ScreenElement({
            pos: vec(x, y),
            anchor: vec(0, 0),
            z: 10000,
            width: w,
            height: h,
            collisionType: CollisionType.PreventCollision,
        });
        actor.graphics.use(new Rectangle({ width: w, height: h, color: Color.fromRGB(27, 23, 20, 0.92) }));
        return actor;
    }

    private label(text: Text, x: number, y: number): ScreenElement {
        const actor = new ScreenElement({
            pos: vec(x, y),
            anchor: vec(0, 0),
            z: 10001,
            collisionType: CollisionType.PreventCollision,
        });
        actor.graphics.use(text);
        return actor;
    }

    private refreshHud(): void {
        const goal = this.level.goal;
        this.cashText.text = `$${this.sale.money} / $${goal}   Cheesy Squares`;
        this.hintText.text = this.hint();
        this.bannerText.text = this.bannerLeft > 0 ? this.banner : "";
        if (this.mode === "dead") {
            this.cardText.text = this.death === "car" ? "The car got you. Back to $0." : "Arrested. Back to $0.";
        } else if (this.mode === "won") {
            this.cardText.text = "Block clear.";
        } else {
            this.cardText.text = "";
        }
        this.cardPanel.graphics.opacity = this.cardText.text ? 1 : 0;
    }

    private placeCamera(): void {
        this.camera.pos.x = clamp(this.player.x, VIEW_W / 2, WORLD - VIEW_W / 2);
        this.camera.pos.y = clamp(this.player.y, VIEW_H / 2, WORLD - VIEW_H / 2);
    }

    private prop(x: number, y: number, graphic: ReturnType<typeof dumpsterGraphic>, name: string): Actor {
        const actor = new Actor({
            name,
            pos: vec(x, y),
            anchor: vec(0.5, 0.5),
            z: y,
            collisionType: CollisionType.PreventCollision,
        });
        actor.body.useGravity = false;
        actor.graphics.use(graphic.clone());
        return actor;
    }

    private enterHd(engine: Engine): void {
        if (this.saved) return;
        const screen = engine.screen;
        this.saved = {
            width: screen.resolution.width,
            height: screen.resolution.height,
            pixelRatio: screen.pixelRatioOverride ?? undefined,
            antialiasing: screen.antialiasing,
            snap: engine.snapToPixel,
            background: engine.backgroundColor,
        };
        screen.resolution = { width: VIEW_W, height: VIEW_H };
        screen.antialiasing = false;
        engine.snapToPixel = true;
        engine.backgroundColor = Color.fromHex("#1b1714");
        this.physics.config.gravity = vec(0, 0);
    }

    private leaveHd(engine: Engine): void {
        if (!this.saved) return;
        const screen = engine.screen;
        screen.resolution = { width: this.saved.width, height: this.saved.height };
        screen.pixelRatioOverride = this.saved.pixelRatio;
        screen.antialiasing = this.saved.antialiasing;
        engine.snapToPixel = this.saved.snap;
        engine.backgroundColor = this.saved.background;
        this.saved = null;
    }
}

function hudFont(size: number): Font {
    return new Font({
        family: "Verdana, sans-serif",
        size,
        bold: true,
        color: Color.fromHex("#f6f1e7"),
        quality: 2,
    });
}

function lampCircle(hex: string): Circle {
    return new Circle({
        radius: 7,
        color: Color.fromHex(hex),
        lineWidth: 3,
        strokeColor: Color.fromHex("#1b1714"),
    });
}

function measure(pts: Vec[]): { lengths: number[]; total: number } {
    const lengths: number[] = [];
    let total = 0;
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        lengths.push(len);
        total += len;
    }
    return { lengths, total };
}

function pointOn(pts: Vec[], lengths: number[], cursor: number): { x: number; y: number; dir: Dir } {
    let left = cursor;
    for (let i = 0; i < pts.length; i++) {
        if (left <= lengths[i] || i === pts.length - 1) {
            const a = pts[i];
            const b = pts[(i + 1) % pts.length];
            const t = lengths[i] === 0 ? 0 : Math.min(1, left / lengths[i]);
            return {
                x: a.x + (b.x - a.x) * t,
                y: a.y + (b.y - a.y) * t,
                dir: facingOf(b.x - a.x, b.y - a.y, "s"),
            };
        }
        left -= lengths[i];
    }
    return { x: pts[0].x, y: pts[0].y, dir: "s" };
}

function behind(body: Body, gap: number): Vec {
    const step = dirStep(body.dir);
    return { x: body.x - step.x * gap, y: body.y - step.y * gap };
}

function dirStep(dir: Dir): Vec {
    if (dir === "n") return { x: 0, y: -1 };
    if (dir === "s") return { x: 0, y: 1 };
    if (dir === "w") return { x: -1, y: 0 };
    return { x: 1, y: 0 };
}

function ridePos(axis: "x" | "y", fixed: number, pos: number): Vec {
    return axis === "y" ? { x: fixed, y: pos } : { x: pos, y: fixed };
}

function carBox(car: Ride): Rect {
    const at = ridePos(car.axis, car.fixed, car.pos);
    if (car.axis === "y") return { x: at.x - 16, y: at.y - 28, w: 32, h: 56 };
    return { x: at.x - 28, y: at.y - 16, w: 56, h: 32 };
}

function exitSpot(dump: Rect, buildings: Rect[]): Vec {
    const cx = dump.x + dump.w / 2;
    const cy = dump.y + dump.h / 2;
    const spots = [
        { x: cx, y: dump.y + dump.h + 24 },
        { x: cx, y: dump.y - 24 },
        { x: dump.x + dump.w + 24, y: cy },
        { x: dump.x - 24, y: cy },
    ];
    return spots.find((spot) => !buildings.some((building) => circleHitsRect(spot.x, spot.y, PLAYER_RADIUS, building))) ?? spots[0];
}

function pick(lines: string[]): string {
    return lines[Math.floor(Math.random() * lines.length)];
}
