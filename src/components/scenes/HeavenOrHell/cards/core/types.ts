export type Side = "heaven" | "hell";
export type LocationId = "hearth" | "court" | "chapel" | "alcove" | "stall" | "glade" | "gate";
export type Phase = "room" | "court" | "combat" | "result" | "meta";
export type ResultKind = "none" | "heaven" | "hell" | "dead";
export type PassiveId = "clean-wick" | "soot-wick";
export type CardId = "wick" | "gleam" | "aegis" | "steady" | "cinder" | "salve" | "hinge";

export type Effect =
  | { kind: "damage"; amount: number; target: "one" | "all" }
  | { kind: "guard"; amount: number }
  | { kind: "lamp"; amount: number }
  | { kind: "heal"; amount: number }
  | { kind: "buff-hand"; amount: number };

export interface CardDef {
  id: CardId;
  name: string;
  cost: number;
  heaven: Effect[];
  hell: Effect[];
  altarLegal: boolean;
}

export interface CardInstance {
  instanceId: string;
  cardId: CardId;
  heavenBonus: number;
  hellBonus: number;
  combatBonus: number;
  cleanWick: boolean;
}

export interface EnemyState {
  id: "spark" | "shade";
  name: string;
  hp: number;
  maxHp: number;
  intent: number;
  intentName: "Bite" | "Strike";
}

export interface ShopOffer {
  offerId: string;
  cardId: CardId;
  price: number;
}

export interface MetaState {
  codex: LocationId[];
  unlockedPassives: PassiveId[];
  equippedPassive: PassiveId | null;
}

export interface RunState {
  hp: number;
  maxHp: number;
  lamp: number;
  lampMax: number;
  ash: number;
  crack: number;
  obols: number;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  altarUsed: boolean;
  guard: number;
  enemies: EnemyState[];
  location: LocationId;
  visited: LocationId[];
  crackedDoors: LocationId[];
  phase: Phase;
  result: ResultKind;
  turn: number;
  shop: ShopOffer[] | null;
  shopBought: string[];
  alcoveTaken: boolean;
  hearthObolTaken: boolean;
  urnTaken: boolean;
  seed: number;
  rngState: number;
  log: string[];
}

export interface GameState {
  meta: MetaState;
  run: RunState;
}

export type Intent =
  | { type: "leave-room" }
  | { type: "enter"; location: LocationId }
  | { type: "play"; instanceId: string; side: Side; targetId?: string }
  | { type: "end-turn" }
  | { type: "altar"; instanceId: string }
  | { type: "buy"; offerId: string }
  | { type: "take-hearth-obol" }
  | { type: "take-urn" }
  | { type: "take-alcove" }
  | { type: "equip"; passive: PassiveId | null }
  | { type: "new-run" }
  | { type: "acknowledge-gate" };
