/**
 * Plain-data types for the Heaven Or Hell combat rules. Every state here is
 * JSON-like (no classes, no functions) so it can be cloned, saved and
 * compared in tests.
 */

export interface Vec {
    x: number;
    y: number;
}

export interface Shake {
    magnitudePx: number;
    durationMs: number;
}

export type AttackKind = "light" | "flourish" | "critical" | "outcry" | "enemy" | "counter";

/** A resolved move, in milliseconds, that the rules run. */
export interface AttackSpec {
    id: string;
    kind: AttackKind;
    windupMs: number;
    activeMs: number;
    recoveryMs: number;
    damage: number;
    postureDamage: number;
    reach: number;
    arcDeg: number;
    knockback: number;
    hitCount: number;
    lunge: number;
    parryable: boolean;
    blockable: boolean;
    feintable: boolean;
    /** Hits during the wind-up still deal damage but don't interrupt it. */
    armored: boolean;
    hitStopMs: number;
    shake: Shake;
}

export interface WeaponMove {
    windupFrames: number;
    activeFrames: number;
    recoveryFrames: number;
    damage: number;
    postureDamage: number;
    reach: number;
    arcDeg: number;
    knockback?: number;
    hitCount?: number;
    lunge?: number;
    parryable?: boolean;
    blockable?: boolean;
}

export interface CriticalMove extends WeaponMove {
    id: string;
    name: string;
    cooldownMs: number;
}

export interface ParryFeel {
    windowMs: number;
    /** Posture damage dealt to the attacker on a successful parry. */
    postureDamage: number;
    /** Posture the defender gets back on a successful parry. */
    postureRestore: number;
}

export interface WeaponDef {
    id: string;
    name: string;
    tier: "basic" | "special";
    /** Light hits before the flourish. */
    chainLength: number;
    /** Divides every frame duration: above 1 is faster. */
    swingSpeed: number;
    light: WeaponMove;
    flourish: WeaponMove;
    critical: CriticalMove;
    parry: ParryFeel;
}

export interface EnemyAttackDef {
    id: string;
    windupMs: number;
    activeMs: number;
    recoveryMs: number;
    damage: number;
    postureDamage: number;
    reach: number;
    arcDeg: number;
    knockback: number;
    parryable?: boolean;
    blockable?: boolean;
    armored?: boolean;
}

export type ReactionKind = "parry" | "block" | "roll" | "counter";

export interface ReadTraits {
    id: string;
    /** Chance to commit to a reaction when it reads a wind-up. */
    commitChance: number;
    /** How far into your wind-up it reads, from 0 to 1. Late readers are hard to bait. */
    readAtFraction: number;
    reactionWeights: Record<ReactionKind, number>;
    adaptive: boolean;
    /** How much each repeat of the same feint rhythm cuts its commit chance. */
    learnPerRepeat: number;
    /** The lowest its commit chance multiplier can fall to. */
    familiarityFloor: number;
    /** How fast a learned rhythm is forgotten, in repeats per second. */
    forgetPerSec: number;
}

export interface EnemyDef {
    id: string;
    name: string;
    maxHp: number;
    maxPosture: number;
    postureRegenPerSec: number;
    radius: number;
    moveSpeed: number;
    attackRange: number;
    /** Pause after an attack's recovery before the next one may start. */
    attackIntervalMs: number;
    hitstunMs: number;
    parriedStunMs: number;
    guardBreakStunMs: number;
    parry: ParryFeel;
    /** Attack ids cycled in order. */
    pattern: string[];
    attacks: Record<string, EnemyAttackDef>;
    counter: EnemyAttackDef | null;
    defaultTraits: string;
}

export type StunReason =
    | "hit"
    | "flourish"
    | "parried"
    | "guardBreak"
    | "shakyBlock"
    | "parryWhiff"
    | "outcryWhiff"
    | "outcryParried"
    | "outcryStagger";

export type Action =
    | { kind: "idle" }
    | { kind: "block"; t: number; lockMs: number; shaky: boolean }
    | { kind: "parry"; t: number; windowMs: number; baited: boolean }
    | { kind: "roll"; t: number; durationMs: number; iframeMs: number; distance: number; dir: Vec; baited: boolean }
    | {
          kind: "attack";
          t: number;
          spec: AttackSpec;
          serial: number;
          chainStep: number;
          /** `${targetId}#${hitIndex}` for every hit already resolved. */
          resolved: string[];
          landed: boolean;
          activeStarted: boolean;
      }
    | { kind: "stun"; t: number; durationMs: number; reason: StunReason }
    | { kind: "feintRecovery"; t: number; durationMs: number }
    | { kind: "down" }
    | { kind: "dead" };

export interface Body {
    id: string;
    side: "player" | "enemy";
    pos: Vec;
    facing: Vec;
    radius: number;
    hp: number;
    maxHp: number;
    posture: number;
    maxPosture: number;
    postureRegenDelayMs: number;
    action: Action;
    hitStopMs: number;
    parryCooldownMs: number;
    rollCooldownMs: number;
    autoParryMs: number;
    exposedMs: number;
}

export type BufferedAction = "attack" | "critical" | "parry" | "roll" | "outcry";

export interface PlayerState extends Body {
    side: "player";
    weapon: WeaponDef;
    fervour: number;
    fervourDecayDelayMs: number;
    grace: number;
    lives: number;
    haloDimmed: boolean;
    /** Set by the run layer when the Trumpet's Progress is full inside a breach. */
    throneAnswerReady: boolean;
    criticalCooldownMs: number;
    feintCooldownMs: number;
    feintsInRow: number;
    chainStep: number;
    chainWindowMs: number;
    buffer: { action: BufferedAction; atMs: number } | null;
    pendingFeint: boolean;
    pendingCast: boolean;
    blockHeld: boolean;
    sprinting: boolean;
    moveDir: Vec;
    swingSerial: number;
    lastCombatAtMs: number;
}

export interface EnemyRead {
    serial: number;
    readAtMs: number;
    hitAtMs: number;
    attackKind: AttackKind;
    chainStep: number;
    parryable: boolean;
    blockable: boolean;
}

export interface PendingReaction {
    kind: ReactionKind;
    serial: number;
    startAtMs: number;
    baited: boolean;
}

export interface EnemyBrain {
    passive: boolean;
    attackCooldownMs: number;
    patternIndex: number;
    read: EnemyRead | null;
    reaction: PendingReaction | null;
    /** The hero swing it last committed against, so a feint on it counts as a bait. */
    committedSerial: number;
    committedKind: ReactionKind | null;
    /** Adaptive memory: `${attackKind}:${chainStep}:${timingBucket}` to repeat weight. */
    memory: Record<string, number>;
}

export interface EnemyState extends Body {
    side: "enemy";
    def: EnemyDef;
    traits: ReadTraits;
    postureRegenPerSec: number;
    brain: EnemyBrain;
}

export interface CombatState {
    timeMs: number;
    accMs: number;
    rng: number;
    player: PlayerState;
    enemies: EnemyState[];
    nextEnemyId: number;
}

export interface CombatInputs {
    /** Movement direction from WASD; any length, normalised by the rules. */
    move?: Vec;
    /** Aim direction from the hero to the mouse; any length. */
    aim?: Vec;
    sprint?: boolean;
    /** F is held down. */
    blockHeld?: boolean;
    /** Keys and buttons that went down since the last tick. */
    pressed?: {
        attack?: boolean;
        parry?: boolean;
        roll?: boolean;
        critical?: boolean;
        feint?: boolean;
        outcry?: boolean;
        cast?: boolean;
    };
}

interface Contact {
    atMs: number;
    hitStopMs: number;
    shake: Shake;
}

export type CombatEvent =
    | { type: "attackStarted"; atMs: number; bodyId: string; attackId: string; kind: AttackKind; chainStep: number; windupMs: number }
    | { type: "enemyTelegraph"; atMs: number; enemyId: string; attackId: string; color: "orange" | "red"; parryable: boolean; windupMs: number }
    | ({ type: "hit"; attackerId: string; targetId: string; attackId: string; kind: AttackKind; damage: number; postureDamage: number; knockback: Vec; armored: boolean } & Contact)
    | ({ type: "blocked"; attackerId: string; targetId: string; attackId: string; postureDamage: number; shaky: boolean; posture: number } & Contact)
    | ({ type: "guardBroken"; attackerId: string; targetId: string; stunMs: number } & Contact)
    | ({ type: "parried"; attackerId: string; defenderId: string; attackId: string; auto: boolean; stunMs: number } & Contact)
    | { type: "dodged"; atMs: number; attackerId: string; targetId: string; attackId: string }
    | { type: "whiffed"; atMs: number; bodyId: string; attackId: string }
    | { type: "postureFull"; atMs: number; bodyId: string }
    | { type: "parryMissed"; atMs: number; bodyId: string }
    | { type: "rollStarted"; atMs: number; bodyId: string; dir: Vec }
    | { type: "feint"; atMs: number; attackId: string; chainStep: number; windupElapsedMs: number }
    | { type: "feintRejected"; atMs: number; reason: "notInWindup" | "unfeintable" | "cooldown" | "limit" }
    | { type: "rollCancelled"; atMs: number }
    | { type: "inputDropped"; atMs: number; action: BufferedAction }
    | { type: "castRequested"; atMs: number; cancelledFlourish: boolean }
    | { type: "enemyRead"; atMs: number; enemyId: string; committed: boolean; reaction: ReactionKind | null; chance: number }
    | { type: "enemyReaction"; atMs: number; enemyId: string; reaction: ReactionKind }
    | { type: "enemyBaited"; atMs: number; enemyId: string; reaction: ReactionKind }
    | { type: "enemyParryWhiffed"; atMs: number; enemyId: string; baited: boolean; stunMs: number }
    | { type: "enemyRollEndLag"; atMs: number; enemyId: string; baited: boolean; endLagMs: number }
    | ({ type: "outcry"; outcome: "hit" | "whiffed" | "parried"; enemyIds: string[] } & Contact)
    | { type: "struckDown"; atMs: number; livesLeft: number; haloDimmed: true }
    | { type: "castOut"; atMs: number }
    | { type: "throneAnswered"; atMs: number }
    | { type: "enemyDefeated"; atMs: number; enemyId: string };
