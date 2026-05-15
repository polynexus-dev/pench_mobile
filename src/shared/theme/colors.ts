// // src/shared/theme/colors.ts
// export const Colors = {
//   brand: {
//     primary: "#1B5E37",
//     secondary: "#2E7D52",
//     light: "#E8F5EE",
//   },
//   bg: {
//     screen: "#F0EBE1",
//     card: "#FFFFFF",
//     input: "#F5F5F5",
//   },
//   text: {
//     primary: "#1A1A1A",
//     secondary: "#4A4A4A",
//     muted: "#9E9E9E",
//     link: "#D4872A",
//     white: "#FFFFFF",
//   },
//   border: {
//     default: "#E0E0E0",
//     focus: "#1B5E37",
//   },
//   success: "#1B5E37",
//   warning: "#D4872A",
//   error: "#E53E3E",
// } as const;
// src/shared/theme/colors.ts
const { Colors: _Colors } = require("./tokens");

export const Colors = _Colors as {
  brand: { primary: string; secondary: string; light: string };
  bg: { screen: string; card: string; input: string };
  text: { primary: string; secondary: string; muted: string; link: string; white: string };
  border: { default: string; focus: string };
  success: string;
  warning: string;
  error: string;
};