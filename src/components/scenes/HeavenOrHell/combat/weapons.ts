import {
    FRAME_MS,
    HITSTOP_CRITICAL_MS,
    HITSTOP_FLOURISH_MS,
    HITSTOP_LIGHT_MS,
    HITSTOP_OUTCRY_MS,
    OUTCRY_ACTIVE_MS,
    OUTCRY_RADIUS,
    OUTCRY_RECOVERY_MS,
    OUTCRY_WINDUP_MS,
    SHAKE_CRITICAL,
    SHAKE_FLOURISH,
    SHAKE_LIGHT,
    SHAKE_OUTCRY,
    WEAPON_TUNING,
} from "./tuning";
import type { AttackKind, AttackSpec, EnemyAttackDef, WeaponDef, WeaponMove } from "./types";

export const SWORD = WEAPON_TUNING.sword;
export const SPEAR = WEAPON_TUNING.spear;
export const KNIFE = WEAPON_TUNING.knife;

/** The basic weapons a run can start with. Special weapons are plain WeaponDefs too. */
export const STARTING_WEAPONS: WeaponDef[] = [SWORD, SPEAR, KNIFE];

function moveSpec(weapon: WeaponDef, move: WeaponMove, id: string, kind: AttackKind): AttackSpec {
    const ms = (frames: number) => (frames * FRAME_MS) / weapon.swingSpeed;
    const feel = {
        light: { hitStopMs: HITSTOP_LIGHT_MS, shake: SHAKE_LIGHT },
        flourish: { hitStopMs: HITSTOP_FLOURISH_MS, shake: SHAKE_FLOURISH },
        critical: { hitStopMs: HITSTOP_CRITICAL_MS, shake: SHAKE_CRITICAL },
    }[kind as "light" | "flourish" | "critical"];
    return {
        id,
        kind,
        windupMs: ms(move.windupFrames),
        activeMs: ms(move.activeFrames),
        recoveryMs: ms(move.recoveryFrames),
        damage: move.damage,
        postureDamage: move.postureDamage,
        reach: move.reach,
        arcDeg: move.arcDeg,
        knockback: move.knockback ?? 0,
        hitCount: move.hitCount ?? 1,
        lunge: move.lunge ?? 0,
        parryable: move.parryable ?? true,
        blockable: move.blockable ?? true,
        feintable: kind !== "critical",
        armored: false,
        hitStopMs: feel.hitStopMs,
        shake: { ...feel.shake },
    };
}

export function lightSpec(weapon: WeaponDef, chainStep: number): AttackSpec {
    return moveSpec(weapon, weapon.light, `${weapon.id}_m1_${chainStep + 1}`, "light");
}

export function flourishSpec(weapon: WeaponDef): AttackSpec {
    return moveSpec(weapon, weapon.flourish, `${weapon.id}_flourish`, "flourish");
}

export function criticalSpec(weapon: WeaponDef): AttackSpec {
    return moveSpec(weapon, weapon.critical, weapon.critical.id, "critical");
}

export function outcrySpec(): AttackSpec {
    return {
        id: "outcry",
        kind: "outcry",
        windupMs: OUTCRY_WINDUP_MS,
        activeMs: OUTCRY_ACTIVE_MS,
        recoveryMs: OUTCRY_RECOVERY_MS,
        damage: 0,
        postureDamage: 0,
        reach: OUTCRY_RADIUS,
        arcDeg: 360,
        knockback: 0,
        hitCount: 1,
        lunge: 0,
        parryable: true,
        blockable: false,
        feintable: false,
        armored: true,
        hitStopMs: HITSTOP_OUTCRY_MS,
        shake: { ...SHAKE_OUTCRY },
    };
}

export function enemyAttackSpec(def: EnemyAttackDef, kind: "enemy" | "counter"): AttackSpec {
    return {
        id: def.id,
        kind,
        windupMs: def.windupMs,
        activeMs: def.activeMs,
        recoveryMs: def.recoveryMs,
        damage: def.damage,
        postureDamage: def.postureDamage,
        reach: def.reach,
        arcDeg: def.arcDeg,
        knockback: def.knockback,
        hitCount: 1,
        lunge: 0,
        parryable: def.parryable ?? true,
        blockable: def.blockable ?? true,
        feintable: false,
        armored: def.armored ?? false,
        hitStopMs: HITSTOP_LIGHT_MS,
        shake: { ...SHAKE_LIGHT },
    };
}

/** Total length of a swing, wind-up through recovery. */
export function swingMs(spec: AttackSpec): number {
    return spec.windupMs + spec.activeMs + spec.recoveryMs;
}
