// export const typography = {
//   fontFamily: {
//     sans: "Inter_400Regular",
//     medium: "Inter_500Medium",
//     bold: "Inter_700Bold",
//   },
//   fontSize: {
//     xs: 12,
//     sm: 14,
//     base: 16,
//     lg: 18,
//     xl: 20,
//     "2xl": 24,
//     "3xl": 30,
//   },
//   lineHeight: {
//     tight: 1.25,
//     normal: 1.5,
//     relaxed: 1.75,
//   },
// } as const;

const { typography: _typography } = require("./tokens");

export const typography = _typography as {
  fontFamily: {
    sans: string;
    medium: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    "2xl": number;
    "3xl": number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
};

export type FontSizeKey = keyof typeof typography.fontSize;
export type FontFamilyKey = keyof typeof typography.fontFamily;