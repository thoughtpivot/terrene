import type { Actor } from "excalibur";
import type { Field } from "./field";
import type { Wanderer } from "./Wanderer";

export interface RoomHooks {
    hero: Wanderer;
    field: Field;
    spawn(actor: Actor): void;
}
