import  tokens from '@/shared/theme/tokens';

const { touchMin, touchComfy } = tokens.sizes;

/**
 * Calculates hitSlop to reach the platform touch minimum.
 * Pass the element's actual rendered size.
 *
 * @param elementSize  — visible width/height of the element (assumed square)
 * @param target       — desired touch target size (default: touchMin 44)
 */
export const getHitSlop = (
    elementSize: number,
    target = touchMin,
) => {
    const gap = Math.max(0, (target - elementSize) / 2);
    return { top: gap, bottom: gap, left: gap, right: gap };
};

// ── Ready-made presets from tokens ──────────────────────────────
export const hitSlop = {
    none: tokens.hitSlop.none,
    sm: tokens.hitSlop.sm,
    md: tokens.hitSlop.md,
    lg: tokens.hitSlop.lg,

    // Dynamic — pass your icon size, get exact hitSlop back
    icon: (iconSize: number) => getHitSlop(iconSize, touchMin),
    comfy: (iconSize: number) => getHitSlop(iconSize, touchComfy),
};