// components/Text.tsx — override default Text globally
// import { Text as RNText, TextProps } from 'react-native';


// Or use maxFontSizeMultiplier for accessibility balance
// export const Text = (props: TextProps) => (
//     <RNText maxFontSizeMultiplier={1.2} {...props} />
// );

// import React from "react";
// import { Text as RNText, type TextProps as RNTextProps } from "react-native";

// type Props = RNTextProps & {
//     fontWeight?: "regular" | "medium" | "semibold" | "bold";
// };

// export const Text = ({ fontWeight, style, ...props }: Props) => (
//     <RNText
//         {...props}
//         style={[
//             style,
//             fontWeight === "regular" && { fontWeight: "400" },
//             fontWeight === "medium" && { fontWeight: "500" },
//             fontWeight === "semibold" && { fontWeight: "600" },
//             fontWeight === "bold" && { fontWeight: "700" },
//         ]}
//     />
// );

// src/components/ui/Text/Text.tsx
// ─────────────────────────────────────────────────────────────────
// Reusable Text — all styles come from tailwind.config.js tokens.
// No sizes, colours, or spacing defined here — CVA maps props to
// class names that resolve through NativeWind → tailwind.config.
// ─────────────────────────────────────────────────────────────────

import React from "react";
import {
    Text as RNText,
    type TextProps as RNTextProps,
    type StyleProp,
    type TextStyle,
} from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CVA — every class name is a token defined in tailwind.config.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const textVariants = cva(
    // ── Base ────────────────────────────────────────────────────
    // font-sans        → typography.fontFamily.sans  (Inter_400Regular)
    // text-text-primary → Colors.text.primary        (#1A1A1A)
    "font-sans text-text-primary",
    {
        variants: {
            variant: {
                "display": "text-display",
                "title": "text-title",
                "heading": "text-heading",
                "subhead": "text-subhead",
                "body-lg": "text-body-lg",
                "body": "text-body",
                "body-sm": "text-body-sm",
                "label": "text-label",
                "caption": "text-caption",
                "caption-sm": "text-caption-sm",
            },

            // ── weight ────────────────────────────────────────────────
            // Overrides the fontWeight baked into the variant above.
            //\
            //   tailwind.config.js fontWeight:
            //   font-regular   → "400"
            //   font-medium    → "500"
            //   font-semibold  → "600"
            //   font-bold      → "700"
            //   font-extrabold → "800"
            weight: {
                regular: "font-regular",
                medium: "font-medium",
                semibold: "font-semibold",
                bold: "font-bold",
                extrabold: "font-extrabold",
            },

            // ── color ─────────────────────────────────────────────────
            // Every entry maps to a color token in tailwind.config.js:
            //
            //   text-text-primary    → Colors.text.primary    #1A1A1A
            //   text-text-secondary  → Colors.text.secondary  #4A4A4A
            //   text-text-muted      → Colors.text.muted      #757575
            //   text-text-disabled   → Colors.text.disabled   #BDBDBD
            //   text-text-inverse    → Colors.text.inverse    #FFFFFF
            //   text-text-link       → Colors.text.link       #D4872A
            //   text-brand-primary   → Colors.brand.primary   #1B5E37
            //   text-brand-secondary → Colors.brand.secondary #2E7D52
            //   text-success         → Colors.success         #1B5E37
            //   text-warning         → Colors.warning         #D4872A
            //   text-error           → Colors.error           #E53E3E
            //   text-info            → Colors.info            #1976D2
            color: {
                primary: "text-text-primary",
                secondary: "text-text-secondary",
                muted: "text-text-muted",
                disabled: "text-text-disabled",
                inverse: "text-text-inverse",
                link: "text-text-link",
                brand: "text-brand-primary",
                "brand-secondary": "text-brand-secondary",
                success: "text-success",
                warning: "text-warning",
                error: "text-error",
                info: "text-info",
                inherit: "",      // no class — colour comes from parent
            },

            // ── align ─────────────────────────────────────────────────
            align: {
                left: "text-left",
                center: "text-center",
                right: "text-right",
            },

            // ── transform ─────────────────────────────────────────────
            transform: {
                none: "normal-case",
                uppercase: "uppercase",
                lowercase: "lowercase",
                capitalize: "capitalize",
            },  

            // ── decoration ────────────────────────────────────────────
            decoration: {
                none: "no-underline",
                underline: "underline",
                "line-through": "line-through",
            },

            // ── dimmed ────────────────────────────────────────────────
            // opacity-secondary → opacity.secondary (0.70) in tailwind.config.js
            dimmed: {
                true: "opacity-secondary",
                false: "",
            },
        },

        // ── Compound variants ──────────────────────────────────────
        // tracking-* maps to letterSpacing tokens in tailwind.config.js:
        //   tracking-tightest → letterSpacing.tightest  (-0.5px)
        //   tracking-tight    → letterSpacing.tight     (-0.3px)
        //   tracking-wider    → letterSpacing.wider     ( 0.5px)
        //   tracking-widest   → letterSpacing.widest    ( 1.2px)
        compoundVariants: [
            // Large display text — tighten letter spacing
            { variant: "display", className: "tracking-tightest" },
            { variant: "title", className: "tracking-tight" },

            // Uppercase labels/captions — widen tracking (iOS/MD convention)
            { variant: "label", transform: "uppercase", className: "tracking-widest" },
            { variant: "caption", transform: "uppercase", className: "tracking-wider" },
        ],

        defaultVariants: {
            variant: "body",
            color: "primary",
            align: "left",
            transform: "none",
            decoration: "none",
            dimmed: false,
        },
    }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type TextVariants = VariantProps<typeof textVariants>;

export interface TextProps extends RNTextProps {
    variant?: TextVariants["variant"];
    weight?: TextVariants["weight"];
    color?: TextVariants["color"];
    align?: TextVariants["align"];
    transform?: TextVariants["transform"];
    decoration?: TextVariants["decoration"];
    dimmed?: boolean;

    // Shorthand for numberOfLines — auto-sets ellipsizeMode="tail"
    lines?: number;

    children?: React.ReactNode;

    // One-off Tailwind overrides — use sparingly
    className?: string;
    style?: StyleProp<TextStyle>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Text = React.forwardRef<RNText, TextProps>(
    (
        {
            variant = "body",
            weight,
            color = "primary",
            align = "left",
            transform = "none",
            decoration = "none",
            dimmed = false,

            lines,
            numberOfLines,
            children,
            className,
            style,
            accessibilityRole,
            ...rest
        },
        ref
    ) => {
        const resolvedLines = lines ?? numberOfLines;

        // display / title / heading → screen reader "header" role
        const resolvedRole =
            accessibilityRole ??
            (variant === "display" || variant === "title" || variant === "heading"
                ? "header"
                : undefined);

        return (
            <RNText
                ref={ref}
                numberOfLines={resolvedLines}
                ellipsizeMode={resolvedLines ? "tail" : undefined}
                maxFontSizeMultiplier={1.2}
                allowFontScaling={true}
                accessibilityRole={resolvedRole}
                style={style}
                className={cn(
                    textVariants({
                        variant,
                        weight,
                        color,
                        align,
                        transform,
                        decoration,
                        dimmed,
                    }),
                    className,
                )}
                {...rest}
            >
                {children}
            </RNText>
        );
    }
);

Text.displayName = "Text";
