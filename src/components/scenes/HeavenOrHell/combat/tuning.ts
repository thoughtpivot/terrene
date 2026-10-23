/**
 * Every combat number in one place. All of them are starting values to tune
 * in play. Times are milliseconds unless a name says frames; distances are
 * pixels at 1080p.
 */

import type { EnemyDef, ReadTraits, WeaponDef } from "./types";

/** Terrene runs fixed updates at 60 per second. */
export const STEP_MS = 1000 / 60;
/** Weapon frame data is authored in 60 fps frames so it matches the step. */
export const FRAME_MS = 1000 / 60;
/** Steps one tick() may run before dropping time, so a stall can't spiral. */
export const MAX_STEPS_PER_TICK = 6;

// Input
export const INPUT_BUFFER_MS = 150;

// Movement
export const PLAYER_RADIUS = 24;
export const PLAYER_WALK_SPEED = 220;
export const PLAYER_SPRINT_SPEED = 330;
export const BLOCK_MOVE_MULT = 0.5;
export const ATTACK_MOVE_MULT = 0.3;

// Health and lives
export const PLAYER_MAX_HP = 100;
export const PLAYER_LIVES = 2;
/** Share of max HP that a dimmed halo locks away until an altar clears it. */
export const HALO_DIM_FRACTION = 0.3;

// Posture
export const PLAYER_MAX_POSTURE = 100;
export const POSTURE_REGEN_PER_SEC = 20;
export const POSTURE_REGEN_DELAY_MS = 600;
export const GUARD_BREAK_STUN_MS = 1050;
/** Defenders block from the front only; parries use the same arc. */
export const GUARD_ARC_DEG = 180;

// Parry and block
export const PARRY_COOLDOWN_MS = 1200;
export const AUTO_PARRY_MS = 300;
export const PARRIED_STUN_MS = 600;
/** After a missed parry you are held in a block this long; hits on it are shaky. */
export const MISSED_PARRY_BLOCK_MS = 250;
export const SHAKY_BLOCK_POSTURE_MULT = 1.5;
export const SHAKY_BLOCK_STUN_MS = 300;
/** F may cancel a light swing's wind-up only this early into it. */
export const PARRY_CANCEL_STARTUP_MS = 100;

// Roll
export const ROLL_MS = 400;
/** I-frames run from the roll's first frame; the rest of ROLL_MS is end lag. */
export const ROLL_IFRAME_MS = 250;
export const ROLL_COOLDOWN_MS = 1500;
export const ROLL_DISTANCE = 150;
/** Right-click roll-cancel is a later hook; it stays off until it's designed. */
export const ROLL_CANCEL_ENABLED = false;
export const ROLL_CANCEL_EXTRA_COOLDOWN_MS = 800;

// M1 chain and feint
/** The chain drops back to its first hit if no M1 starts within this window. */
export const CHAIN_RESET_MS = 600;
export const HITSTUN_MS = 350;
export const FLOURISH_STUN_MS = 550;
export const FEINT_COOLDOWN_MS = 500;
/** Feints allowed in a row before a swing has to reach its active frames. */
export const FEINT_LIMIT = 2;
export const FEINT_RECOVERY_MS = 100;

// Fervour (Tempo) and Grace (Ether)
export const FERVOUR_MAX = 100;
export const FERVOUR_ON_HIT_DEALT = 7;
export const FERVOUR_ON_HIT_TAKEN = 5;
export const FERVOUR_ON_BLOCKED_DEALT = 3;
export const FERVOUR_ON_PARRY = 10;
export const FERVOUR_DECAY_DELAY_MS = 2500;
export const FERVOUR_DECAY_PER_SEC = 6;
export const GRACE_MAX = 100;
/** In combat, Grace only regenerates while Fervour is above zero. */
export const GRACE_REGEN_IN_COMBAT_PER_SEC = 4;
export const GRACE_REGEN_OUT_OF_COMBAT_PER_SEC = 12;
export const COMBAT_TIMEOUT_MS = 5000;

// Outcry (Vent)
export const OUTCRY_MIN_FERVOUR = 40;
export const OUTCRY_COST = 40;
export const OUTCRY_WINDUP_MS = 250;
export const OUTCRY_ACTIVE_MS = 50;
export const OUTCRY_RECOVERY_MS = 300;
export const OUTCRY_RADIUS = 140;
export const OUTCRY_PUSH = 160;
export const OUTCRY_ENEMY_STAGGER_MS = 700;
export const OUTCRY_WHIFF_STUN_MS = 1000;
export const OUTCRY_PARRIED_STUN_MS = 1200;

// Hit-stop and screen shake (renderer consumes these from events)
export const HITSTOP_LIGHT_MS = 50;
export const HITSTOP_FLOURISH_MS = 70;
export const HITSTOP_CRITICAL_MS = 100;
export const HITSTOP_PARRY_MS = 120;
export const HITSTOP_BLOCK_MS = 40;
export const HITSTOP_GUARD_BREAK_MS = 150;
export const HITSTOP_OUTCRY_MS = 90;
export const SHAKE_LIGHT = { magnitudePx: 2, durationMs: 80 };
export const SHAKE_FLOURISH = { magnitudePx: 3, durationMs: 100 };
export const SHAKE_CRITICAL = { magnitudePx: 4, durationMs: 150 };
export const SHAKE_PARRY = { magnitudePx: 4, durationMs: 120 };
export const SHAKE_BLOCK = { magnitudePx: 1, durationMs: 60 };
export const SHAKE_GUARD_BREAK = { magnitudePx: 6, durationMs: 200 };
export const SHAKE_OUTCRY = { magnitudePx: 5, durationMs: 180 };

// Enemy reader
export const READ_RANGE_MARGIN = 40;
/** How far away an adaptive enemy still notices and learns from your feints. */
export const ADAPT_SIGHT_RANGE = 400;
/** Feint timings that land in the same bucket count as the same rhythm. */
export const ADAPT_BUCKET_MS = 50;
export const ENEMY_PARRY_WINDOW_MS = 160;
/** An enemy opens its parry this long before the hit it predicts. */
export const ENEMY_PARRY_LEAD_MS = 80;
export const ENEMY_PARRY_COOLDOWN_MS = 1500;
export const ENEMY_WHIFF_PARRY_STUN_MS = 600;
/** While exposed, clean hits also deal posture damage at this multiplier. */
export const EXPOSED_POSTURE_MULT = 1.5;
export const ENEMY_BLOCK_HOLD_MS = 700;
export const ENEMY_ROLL_LEAD_MS = 60;
export const ENEMY_ROLL_MS = 450;
export const ENEMY_ROLL_IFRAME_MS = 250;
export const ENEMY_ROLL_COOLDOWN_MS = 2000;
export const ENEMY_ROLL_DISTANCE = 70;

const frames = (windup: number, active: number, recovery: number) => ({
    windupFrames: windup,
    activeFrames: active,
    recoveryFrames: recovery,
});

/**
 * The basic starting weapons. The sword is the baseline the others are tuned
 * against. Special weapons (the Flaming Sword and later ones) are added as
 * more WeaponDef entries with tier "special".
 */
export const WEAPON_TUNING: Record<"sword" | "spear" | "knife", WeaponDef> = {
    sword: {
        id: "sword",
        name: "Sword",
        tier: "basic",
        chainLength: 3,
        swingSpeed: 1,
        light: { ...frames(18, 6, 12), damage: 9, postureDamage: 10, reach: 110, arcDeg: 100 },
        flourish: { ...frames(24, 6, 30), damage: 12, postureDamage: 18, reach: 115, arcDeg: 110, knockback: 90 },
        critical: {
            ...frames(33, 9, 27),
            id: "sword_sweep",
            name: "Wide Sweep",
            cooldownMs: 7000,
            damage: 16,
            postureDamage: 35,
            reach: 130,
            arcDeg: 240,
            knockback: 40,
        },
        parry: { windowMs: 160, postureDamage: 25, postureRestore: 20 },
    },
    spear: {
        id: "spear",
        name: "Spear",
        tier: "basic",
        chainLength: 3,
        swingSpeed: 0.9,
        light: { ...frames(18, 6, 12), damage: 10, postureDamage: 9, reach: 165, arcDeg: 50 },
        flourish: { ...frames(24, 6, 32), damage: 13, postureDamage: 16, reach: 170, arcDeg: 60, knockback: 110 },
        critical: {
            ...frames(30, 8, 30),
            id: "spear_lunge",
            name: "Planted Lunge",
            cooldownMs: 8000,
            damage: 18,
            postureDamage: 25,
            reach: 180,
            arcDeg: 30,
            lunge: 120,
            parryable: false,
        },
        parry: { windowMs: 150, postureDamage: 22, postureRestore: 20 },
    },
    knife: {
        id: "knife",
        name: "Knife",
        tier: "basic",
        chainLength: 4,
        swingSpeed: 1.25,
        light: { ...frames(16, 5, 10), damage: 6, postureDamage: 6, reach: 75, arcDeg: 90 },
        flourish: { ...frames(20, 5, 24), damage: 9, postureDamage: 12, reach: 80, arcDeg: 90, knockback: 70 },
        critical: {
            ...frames(24, 18, 20),
            id: "knife_flurry",
            name: "Flurry",
            cooldownMs: 6000,
            damage: 6,
            postureDamage: 8,
            reach: 85,
            arcDeg: 90,
            hitCount: 3,
        },
        parry: { windowMs: 120, postureDamage: 18, postureRestore: 15 },
    },
};

export const READ_TRAIT_TUNING: Record<"gullible" | "wary" | "adaptive", ReadTraits> = {
    gullible: {
        id: "gullible",
        commitChance: 0.9,
        readAtFraction: 0.2,
        reactionWeights: { parry: 0.5, block: 0.2, roll: 0.2, counter: 0.1 },
        adaptive: false,
        learnPerRepeat: 0,
        familiarityFloor: 1,
        forgetPerSec: 0,
    },
    wary: {
        id: "wary",
        commitChance: 0.15,
        readAtFraction: 0.85,
        reactionWeights: { parry: 0.15, block: 0.5, roll: 0.3, counter: 0.05 },
        adaptive: false,
        learnPerRepeat: 0,
        familiarityFloor: 1,
        forgetPerSec: 0,
    },
    adaptive: {
        id: "adaptive",
        commitChance: 0.85,
        readAtFraction: 0.35,
        reactionWeights: { parry: 0.4, block: 0.2, roll: 0.2, counter: 0.2 },
        adaptive: true,
        learnPerRepeat: 0.22,
        familiarityFloor: 0.08,
        forgetPerSec: 0.2,
    },
};

export const ENEMY_TUNING: Record<"lesser_demon", EnemyDef> = {
    lesser_demon: {
        id: "lesser_demon",
        name: "Lesser Demon",
        maxHp: 80,
        maxPosture: 80,
        postureRegenPerSec: 15,
        radius: 26,
        moveSpeed: 140,
        attackRange: 95,
        attackIntervalMs: 900,
        hitstunMs: HITSTUN_MS,
        parriedStunMs: 700,
        guardBreakStunMs: 1500,
        parry: { windowMs: ENEMY_PARRY_WINDOW_MS, postureDamage: 20, postureRestore: 15 },
        pattern: ["claw", "claw", "slam"],
        attacks: {
            claw: {
                id: "claw",
                windupMs: 450,
                activeMs: 120,
                recoveryMs: 400,
                damage: 12,
                postureDamage: 18,
                reach: 100,
                arcDeg: 90,
                knockback: 0,
            },
            slam: {
                id: "slam",
                windupMs: 700,
                activeMs: 150,
                recoveryMs: 600,
                damage: 22,
                postureDamage: 30,
                reach: 115,
                arcDeg: 120,
                knockback: 60,
                parryable: false,
            },
        },
        counter: {
            id: "counter_jab",
            windupMs: 300,
            activeMs: 100,
            recoveryMs: 450,
            damage: 10,
            postureDamage: 15,
            reach: 105,
            arcDeg: 90,
            knockback: 0,
            armored: true,
        },
        defaultTraits: "gullible",
    },
};
